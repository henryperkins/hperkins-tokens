"""Embed static instances of the theme's existing fonts in the editable résumé.

No system font installation is needed. The WOFF2 sources remain authoritative;
OpenType instances are cached locally and obfuscated inside the DOCX package.
Requires fonttools[woff] for conversion, alongside python-docx.
"""
from pathlib import Path
import uuid

from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.opc.packuri import PackURI
from docx.opc.part import Part
from lxml import etree


FONT_FACES = (
    ("HPerkins Cormorant Garamond", "Regular", "cormorant-garamond.woff2", 500),
    ("HPerkins Marcellus", "Regular", "marcellus.woff2", None),
    ("HPerkins EB Garamond", "Regular", "eb-garamond.woff2", 400),
    ("HPerkins EB Garamond", "Bold", "eb-garamond.woff2", 600),
    ("HPerkins EB Garamond", "Italic", "eb-garamond-italic.woff2", 400),
    ("HPerkins JetBrains Mono", "Regular", "jetbrains-mono.woff2", 400),
)


def static_font(root, family, face, filename, weight):
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    font = TTFont(root / "assets" / "fonts" / filename)
    if font["OS/2"].fsType & 2:
        raise ValueError(f"Font embedding is restricted: {filename}")
    if "fvar" in font:
        axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
        if weight is not None:
            axes["wght"] = weight
        font = instantiateVariableFont(font, axes, inplace=True)
    # Private document family names avoid colliding with installed editions.
    names = {1: family, 2: face, 3: family + " " + face,
             4: family + " " + face, 6: family.replace(" ", "") + "-" + face,
             16: family, 17: face}
    font["name"].names = [n for n in font["name"].names if n.nameID not in names]
    for name_id, value in names.items():
        font["name"].setName(value, name_id, 3, 1, 0x409)
        font["name"].setName(value, name_id, 1, 0, 0)
    font["OS/2"].usWeightClass = weight or 400
    font["OS/2"].fsSelection &= ~0x61
    font["head"].macStyle &= ~3
    if face == "Bold":
        font["OS/2"].fsSelection |= 0x20
        font["head"].macStyle |= 1
    elif face == "Italic":
        font["OS/2"].fsSelection |= 1
        font["head"].macStyle |= 2
    else:
        font["OS/2"].fsSelection |= 0x40
    font.flavor = None
    font.recalcTimestamp = False
    target = root / ".design-pull" / "resume-layout" / "fonts" / (family.replace(" ", "-") + "-" + face + ".ttf")
    target.parent.mkdir(parents=True, exist_ok=True)
    font.save(target)
    return target.read_bytes()


def embed_theme_fonts(document, root):
    font_table = document.part.part_related_by(RT.FONT_TABLE)
    font_root = parse_xml(font_table.blob)
    for font in list(font_root):
        if font.get(qn("w:name"), "").startswith("HPerkins "):
            font_root.remove(font)
    for rel_id, rel in list(font_table.rels.items()):
        if rel.reltype == RT.FONT:
            del font_table.rels[rel_id]
    families = {}
    for index, (family, face, filename, weight) in enumerate(FONT_FACES):
        data = bytearray(static_font(root, family, face, filename, weight))
        key = uuid.uuid5(uuid.NAMESPACE_URL, family + "/" + face)
        # ECMA-376 font obfuscation reverses the GUID's 16 byte hex sequence.
        mask = bytes.fromhex(key.hex)[::-1]
        for position in range(32):
            data[position] ^= mask[position % 16]
        font_part = Part(PackURI(f"/word/fonts/resume-{index}.odttf"),
                         "application/vnd.openxmlformats-officedocument.obfuscatedFont",
                         bytes(data), document.part.package)
        rel_id = font_table.relate_to(font_part, RT.FONT)
        if family not in families:
            node = OxmlElement("w:font")
            node.set(qn("w:name"), family)
            font_root.append(node)
            families[family] = node
        node = OxmlElement("w:embed" + face)
        node.set(qn("r:id"), rel_id)
        node.set(qn("w:fontKey"), "{" + str(key).upper() + "}")
        node.set(qn("w:subsetted"), "0")
        families[family].append(node)
    font_table._blob = etree.tostring(font_root, encoding="UTF-8", xml_declaration=True, standalone=True)
    for name in ("embedTrueTypeFonts", "saveSubsetFonts"):
        existing = document.settings.element.find(qn("w:" + name))
        if existing is None:
            existing = OxmlElement("w:" + name)
            document.settings.element.append(existing)
        existing.set(qn("w:val"), "1" if name == "embedTrueTypeFonts" else "0")
