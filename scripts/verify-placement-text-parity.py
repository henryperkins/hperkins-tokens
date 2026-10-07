#!/usr/bin/env python3
"""Verify recruiter-visible DOCX/PDF text, links, pages, and tag structure."""

from __future__ import annotations

import argparse
import re
import struct
import tempfile
import unicodedata
from pathlib import Path

import pdfplumber
from docx import Document
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "assets" / "documents" / "henry-perkins-wordpress-support-engineer-resume.docx"
PDF_PATH = ROOT / "assets" / "documents" / "henry-perkins-wordpress-support-engineer-resume.pdf"
EXPECTED_FONT_FACES = frozenset({
    "HPerkinsCormorantGaramond-Regular",
    "HPerkinsMarcellus-Regular",
    "HPerkinsEBGaramond-Regular",
    "HPerkinsEBGaramond-Bold",
    "HPerkinsEBGaramond-Italic",
    "HPerkinsJetBrainsMono-Regular",
})
EVENT = (
    "WORDCAMP US 2026 — Phoenix · Staffed the Core AI booth, walking maintainers "
    "and agency developers through AI provider tooling"
)
FORBIDDEN = (
    (re.compile(r"as of Jul 30, 2026"), "as of Jul 30, 2026"),
    (re.compile(r"54 commits ahead"), "54 commits ahead"),
    (re.compile(r"\b30 contracts\b"), "30 contracts"),
    (re.compile(r"\b35 contracts\b"), "35 contracts"),
    # Retired 2026-09-04 with the support-role résumé review.
    (re.compile(r"Selected to staff the Core AI booth"), "pre-event WCUS copy"),
    (re.compile(r"v0\.1\.0-rc\.3"), "superseded Flavor Agent prerelease v0.1.0-rc.3"),
    (re.compile(r"TARGET: SUPPORT ENGINEER"), "retired target line"),
    (re.compile(r" — Author\b"), "implementation-implying Author role label"),
)


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def find_forbidden_copy(value):
    for pattern, label in FORBIDDEN:
        if pattern.search(value):
            return label
    return None


def normalize(value):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", value)).strip()


def normalize_pdf_text(value):
    # Word may visually wrap a hyphenated compound after the hyphen. Both
    # pdfplumber and pypdf correctly expose that line break, but recruiter-
    # visible text parity compares the logical compound, not its page wrap.
    value = re.sub(r"(?<=\w)([-–])[ \t]*\n[ \t]*(?=\w)", r"\1", value)
    return normalize(value)


def iter_document_paragraphs(document):
    """Read paragraphs and physical table cells once in document order.

    python-docx's ``document.paragraphs`` excludes cell content, while its
    ``row.cells`` repeats horizontally merged cells. Traversing the physical
    WordprocessingML keeps a metadata rail in the same order as Word's PDF.
    """
    def walk(container):
        for child in container:
            if child.tag == qn("w:p"):
                yield Paragraph(child, document)
            elif child.tag == qn("w:tbl"):
                for row in child:
                    if row.tag == qn("w:tr"):
                        for cell in row:
                            if cell.tag == qn("w:tc"):
                                yield from walk(cell)

    yield from walk(document.element.body)


def docx_text_and_urls(path):
    document = Document(path)
    paragraph_text = []
    for paragraph in iter_document_paragraphs(document):
        fragments = []
        for node in paragraph._p.iter():
            if node.tag == qn("w:t") and node.text:
                fragments.append(node.text)
            elif node.tag == qn("w:tab"):
                fragments.append("\t")
            elif node.tag in {qn("w:br"), qn("w:cr")}:
                fragments.append("\n")
        paragraph_text.append("".join(fragments))

    urls = []
    for hyperlink in document.element.body.xpath(".//w:hyperlink"):
        relationship_id = hyperlink.get(qn("r:id"))
        if relationship_id:
            urls.append(document.part.rels[relationship_id].target_ref)
    return normalize("\n".join(paragraph_text)), urls


def pdf_text_and_urls(path):
    with pdfplumber.open(path) as pdf:
        # Word emits the complete left cell before its metadata rail. Respect
        # that content-stream order instead of sorting a right-hand contact or
        # status onto the first visual line of a multi-line left-hand record.
        text = normalize_pdf_text("\n".join(
            page.extract_text(use_text_flow=True) or "" for page in pdf.pages
        ))
        urls = pdf_external_link_sequence(PdfReader(path))
        return text, urls, len(pdf.pages)


def pdf_external_link_sequence(reader):
    """Keep duplicate logical links; combine hit rectangles of one tagged link."""
    def resolve(value):
        return value.get_object() if hasattr(value, "get_object") else value

    parents = {}
    visited_trees = set()
    structure = resolve(resolve(reader.trailer["/Root"]).get("/StructTreeRoot", {}))
    def visit_number_tree(value):
        tree = resolve(value)
        require(id(tree) not in visited_trees, "PDF structure parent tree contains a cycle")
        visited_trees.add(id(tree))
        numbers = resolve(tree.get("/Nums", []))
        require(len(numbers) % 2 == 0, "PDF structure parent tree has malformed number pairs")
        for key, owner in zip(numbers[::2], numbers[1::2]):
            require(key not in parents, "PDF structure parent tree repeats a key")
            parents[key] = owner
        for child in resolve(tree.get("/Kids", [])):
            visit_number_tree(child)
    visit_number_tree(structure.get("/ParentTree", {}))

    urls = []
    seen_links = {}
    for page in reader.pages:
        for reference in page.get("/Annots", []):
            annotation = resolve(reference)
            action = resolve(annotation.get("/A", {}))
            uri = action.get("/URI")
            if uri is None:
                continue
            parent = annotation.get("/StructParent")
            if parent is not None:
                require(parent in parents, "PDF hyperlink has an unresolved structure parent")
                owner_reference = parents[parent]
                owner = resolve(owner_reference)
                require(owner.get("/S") == "/Link", "PDF hyperlink structure parent is not a Link")
                identity = (owner_reference.idnum, owner_reference.generation) if hasattr(owner_reference, "idnum") else id(owner)
                if identity in seen_links:
                    require(seen_links[identity] == uri, "PDF logical hyperlink contains inconsistent destinations")
                    continue
                seen_links[identity] = uri
            urls.append(uri)
    return urls


def font_postscript_names(data):
    """Read name-ID 6 from an embedded TrueType stream without extra packages."""
    require(len(data) >= 12 and data[:4] == b"\x00\x01\x00\x00", "Embedded PDF font is not a readable TrueType font")
    table_count = struct.unpack_from(">H", data, 4)[0]
    require(12 + table_count * 16 <= len(data), "Embedded TrueType table directory is truncated")
    name_table = None
    for index in range(table_count):
        tag, _checksum, offset, length = struct.unpack_from(">4sIII", data, 12 + index * 16)
        if tag == b"name":
            require(offset + length <= len(data), "Embedded TrueType name table is truncated")
            name_table = data[offset:offset + length]
            break
    require(name_table is not None and len(name_table) >= 6, "Embedded TrueType font has no readable name table")
    _format, count, string_offset = struct.unpack_from(">HHH", name_table, 0)
    require(6 + count * 12 <= len(name_table), "Embedded TrueType name records are truncated")
    names = set()
    for index in range(count):
        platform, _encoding, _language, name_id, length, offset = struct.unpack_from(">HHHHHH", name_table, 6 + index * 12)
        if name_id != 6:
            continue
        start = string_offset + offset
        require(start + length <= len(name_table), "Embedded TrueType PostScript name is truncated")
        try:
            names.add(name_table[start:start + length].decode("utf-16-be" if platform in (0, 3) else "mac-roman"))
        except UnicodeError as error:
            raise SystemExit("Embedded TrueType PostScript name is unreadable") from error
    require(len(names) == 1, "Embedded TrueType font must have one consistent PostScript name")
    return names


def pdf_embedded_font_faces(reader):
    """Audit font bytes used by actual text operators, including Word aliases."""
    def resolve(value):
        return value.get_object() if hasattr(value, "get_object") else value

    faces = set()
    for page in reader.pages:
        resources = resolve(page["/Resources"])
        fonts = resolve(resources.get("/Font", {}))
        contents = page.get_contents()
        used_fonts = {str(operands[0]) for operands, operator in contents.operations if operator == b"Tf"}
        for resource in used_fonts:
            require(resource in fonts, f"PDF text font resource is unresolved: {resource}")
            font = resolve(fonts[resource])
            require(
                font.get("/ToUnicode") is not None or
                (font.get("/Subtype") == "/TrueType" and font.get("/Encoding") == "/WinAnsiEncoding"),
                f"PDF text font has no readable text encoding: {resource}",
            )
            descendants = resolve(font.get("/DescendantFonts", [font]))
            require(len(descendants) == 1, f"PDF text font has unexpected descendants: {resource}")
            descriptor = resolve(resolve(descendants[0]).get("/FontDescriptor", {}))
            stream = descriptor.get("/FontFile2")
            require(stream is not None, f"PDF text font is not embedded as TrueType: {resource}")
            names = font_postscript_names(resolve(stream).get_data())
            require(names <= EXPECTED_FONT_FACES, f"PDF uses an unapproved embedded font: {', '.join(sorted(names))}")
            faces.update(names)
    require(faces == EXPECTED_FONT_FACES, "PDF must use all six embedded theme font faces")
    return faces


def normalize_word_pdf(path):
    """Losslessly rewrite Word's object streams so semantic tags stay auditable."""
    reader = PdfReader(path)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".pdf", delete=False) as stream:
            temporary = Path(stream.name)
            writer.write(stream)
        temporary.replace(path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    print("normalized_word_pdf_tags=true")


def verify(pdf_path=PDF_PATH):
    docx_text, docx_urls = docx_text_and_urls(DOCX_PATH)
    pdf_text, pdf_urls, pdf_pages = pdf_text_and_urls(pdf_path)
    pdf_bytes = pdf_path.read_bytes()

    require(docx_text == pdf_text, "DOCX and PDF normalized visible text differ")
    require(pdf_pages == 1, f"PDF has {pdf_pages} pages")
    require(docx_urls == pdf_urls, "DOCX and PDF external-link order differs")
    require(EVENT in docx_text, "WCUS event line is absent")
    forbidden = find_forbidden_copy(docx_text)
    require(forbidden is None, f"stale résumé copy remains: {forbidden}")
    require(
        b"/MarkInfo" in pdf_bytes and b"/Marked true" in pdf_bytes,
        "PDF is missing marked-content metadata",
    )
    require(
        b"/StructTreeRoot" in pdf_bytes and b"/H1" in pdf_bytes and pdf_bytes.count(b"/H2") >= 4,
        "PDF is missing the required semantic heading structure",
    )
    font_faces = pdf_embedded_font_faces(PdfReader(pdf_path))

    print(f"normalized_text_characters={len(docx_text)}")
    print(f"external_logical_links={len(pdf_urls)}")
    print(f"pdf_pages={pdf_pages}")
    print(f"heading_tags=H1:{pdf_bytes.count(b'/H1')} H2:{pdf_bytes.count(b'/H2')}")
    print(f"embedded_theme_font_faces={len(font_faces)}")
    print("placement_text_link_tag_parity=pass")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--normalize-word-pdf", action="store_true")
    parser.add_argument("--pdf", type=Path, default=PDF_PATH)
    args = parser.parse_args()
    if args.normalize_word_pdf:
        normalize_word_pdf(args.pdf)
    else:
        verify(args.pdf)


if __name__ == "__main__":
    main()
