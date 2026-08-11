#!/usr/bin/env python3
"""Surgically refresh the existing one-page support résumé DOCX."""

from __future__ import annotations

import io
import zipfile
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "assets" / "documents" / "henry-perkins-wordpress-support-engineer-resume.docx"
TITLE = "Henry Perkins — WordPress Support Engineer"
AUTHOR = "Henry Perkins"
EVENT = "WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth"

RESUME = [
    ("Heading 1", [("Henry Perkins — WordPress Support Engineer", None)]),
    ("Normal", [("PHP · JavaScript · Gutenberg · REST/HTTP/DNS · Root-cause debugging · Customer communication", None)]),
    ("Normal", [
        ("Chicago, IL  ·  ", None),
        ("htperkins@gmail.com", "mailto:htperkins@gmail.com"),
        ("  ·  ", None),
        ("hperkins.blog", "https://hperkins.blog/"),
        ("  ·  ", None),
        ("GitHub", "https://github.com/henryperkins"),
    ]),
    ("Resume Event", [(EVENT, None)]),
    ("Normal", [("TARGET: SUPPORT ENGINEER — WordPress support, site delivery, root-cause debugging, and clear handoff between customers and engineering.", None)]),
    ("Heading 2", [("WORDPRESS.COM SUPPORT", None)]),
    ("Resume Entry", [("Automattic — Happiness Engineer  |  Remote · Oct–Nov 2012", None)]),
    ("Resume Body", [("Resolved WordPress.com issues across publishing, configuration, billing, domains, and DNS; wrote root-cause troubleshooting and reproducible details for customers, product, and engineering.", None)]),
    ("Heading 2", [("NAMED CLIENT DELIVERY", None)]),
    ("Resume Entry", [("Independent Technology Consultant  |  Oct 2022–Present · selected delivery in 2026", None)]),
    ("Resume Body", [
        ("LIVE — Delivered ", None),
        ("DJ Lee & Voices of Judah", "https://thevoicesofjudah.com/"),
        (" from discovery through launch: a booking-first static JavaScript experience on one Cloudflare Worker with a validated server-side booking route; ", None),
        ("public source", "https://github.com/henryperkins/dj-judas-v2"),
        (" keeps the handoff inspectable.", None),
    ]),
    ("Heading 2", [("UPSTREAM WORDPRESS CONTRIBUTION RECORD", None)]),
    ("Resume Body", [
        ("MERGED — ", None),
        ("WordPress/ai PR #501", "https://github.com/WordPress/ai/pull/501"),
        (": authored Content Resizing and Title Generation experiment documentation; merged May 18, 2026.", None),
    ]),
    ("Resume Body", [
        ("OPEN UPSTREAM CODE — ", None),
        ("WordPress/php-ai-client PR #263", "https://github.com/WordPress/php-ai-client/pull/263"),
        (": authored regression coverage and finite-vector validation rejecting NAN, INF, and -INF embedding values.", None),
    ]),
    ("Resume Body", [
        ("OPEN UPSTREAM CODE — ", None),
        ("WordPress/ai-provider-for-openai PR #40", "https://github.com/WordPress/ai-provider-for-openai/pull/40"),
        (": authored model-aware sampling compatibility metadata and tests for OpenAI reasoning models.", None),
    ]),
    ("Resume Body", [
        ("REPORTED · FIX SHIPPED — ", None),
        ("Issue #529", "https://github.com/WordPress/ai/issues/529"),
        (": reported and reproduced a Guidelines content-type defect; a maintainer authored ", None),
        ("PR #593", "https://github.com/WordPress/ai/pull/593"),
        (" and ", None),
        ("WordPress AI 1.0.1", "https://github.com/WordPress/ai/releases/tag/1.0.1"),
        (" shipped it.", None),
    ]),
    ("Resume Body", [
        ("REPORTED · INTEGRATION TESTED — ", None),
        ("Issue #732", "https://github.com/WordPress/ai/issues/732"),
        (": authored the report and reproduction. Anubhav Anand authored ", None),
        ("PR #757", "https://github.com/WordPress/ai/pull/757"),
        ("; Henry tested lifecycle capture, found duplicate successes and missing failures, and proposed the ownership split.", None),
    ]),
    ("Heading 2", [("TECHNICAL PROOF", None)]),
    ("Resume Entry", [("Flavor Agent — Author  |  WordPress agent-governance plugin", None)]),
    ("Resume Body", [
        ("PRERELEASE + ACTIVE — ", None),
        ("v0.1.0-rc.3", "https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3"),
        (" is the latest public prerelease; post-RC3 main adds governed content/template apply and undo, schema hardening, and canonical target authorization; unreleased.", None),
    ]),
    ("Resume Entry", [("AI Provider for Codex — Author  |  independent WordPress plugin", None)]),
    ("Resume Body", [
        ("RELEASED OWNED WORK — ", None),
        ("v2.1", "https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1"),
        (": WordPress AI Client provider for Codex text and capability-gated image generation with isolated per-user runtime state.", None),
    ]),
    ("Resume Entry", [("HPerkins Tokens — Author  |  WordPress theme", None)]),
    ("Resume Body", [
        ("RELEASED OWNED WORK — ", None),
        ("v0.3.53", "https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53"),
        (" · ", None),
        ("hperkins.blog", "https://hperkins.blog/"),
        (": token-governed block theme and accessible evidence system. Later commerce work is merged to main and unreleased.", None),
    ]),
    ("Heading 2", [("SKILLS & CAREER CONTEXT", None)]),
    ("Resume Body", [("WordPress: PHP, JavaScript, Gutenberg, REST API, WP-CLI  ·  Support: HTTP, DNS, CSS cascade, browser debugging, escalation triage, customer communication  ·  Tooling: Git/GitHub, GitHub Actions, Plugin Check, PHPStan, Cloudflare Workers.", None)]),
    ("Resume Body", [("Earlier customer and operations roles: Starbucks Shift Supervisor (2019–2022); Sodexo Starbucks Manager (2018–2019); Clinique Consultant (2015–2017); PageLines Developer Community Manager (2012); Micro Center Customer Service/Sales (2009–2012).", None)]),
]


def first_run_properties(paragraph):
    for run in paragraph._p.xpath(".//w:r"):
        run_properties = run.find(qn("w:rPr"))
        if run_properties is not None:
            return deepcopy(run_properties)
    return None


def paragraph_by_style(document, names):
    for paragraph in document.paragraphs:
        if paragraph.style.name in names:
            return paragraph
    raise ValueError(f"Résumé has no paragraph using {', '.join(names)}")


def copy_paragraph_format(source, destination):
    source_properties = source._p.pPr
    if source_properties is None:
        return
    destination_properties = destination._p.get_or_add_pPr()
    for child in list(destination_properties):
        if child.tag != qn("w:pStyle"):
            destination_properties.remove(child)
    for child in source_properties:
        if child.tag != qn("w:pStyle"):
            destination_properties.append(deepcopy(child))


def apply_run_properties(run, properties):
    if properties is None:
        return
    existing = run._r.rPr
    if existing is not None:
        run._r.remove(existing)
    run._r.insert(0, deepcopy(properties))


def add_hyperlink(paragraph, text, url, run_properties):
    relationship_id = paragraph.part.relate_to(url, RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), relationship_id)
    hyperlink.set(qn("w:history"), "1")
    run = OxmlElement("w:r")
    if run_properties is not None:
        run.append(deepcopy(run_properties))
    text_node = OxmlElement("w:t")
    if text[:1].isspace() or text[-1:].isspace():
        text_node.set(qn("xml:space"), "preserve")
    text_node.text = text
    run.append(text_node)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def set_style_visuals(style, normal_style, *, size, bold, color, paragraph_source=None):
    style.base_style = normal_style
    style.font.name = "Calibri"
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor.from_string(color)
    style._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:ascii"), "Calibri")
    style._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:hAnsi"), "Calibri")
    if paragraph_source is not None:
        source_format = paragraph_source.paragraph_format
        target_format = style.paragraph_format
        for attribute in (
            "space_before", "space_after", "line_spacing", "keep_with_next",
            "keep_together", "page_break_before", "widow_control",
        ):
            setattr(target_format, attribute, getattr(source_format, attribute))


def remove_external_hyperlink_relationships(document):
    relationships = document.part.rels
    for relationship_id, relationship in list(relationships.items()):
        if relationship.reltype == RELATIONSHIP_TYPE.HYPERLINK and relationship.is_external:
            del relationships[relationship_id]


def canonical_docx_bytes(document):
    source = io.BytesIO()
    document.save(source)
    source.seek(0)
    output = io.BytesIO()
    with zipfile.ZipFile(source, "r") as archive, zipfile.ZipFile(
        output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
    ) as canonical:
        for name in sorted(archive.namelist()):
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 0
            info.external_attr = 0
            canonical.writestr(info, archive.read(name))
    return output.getvalue()


def main():
    if not DOCX_PATH.is_file():
        raise SystemExit(f"Existing résumé DOCX not found: {DOCX_PATH}")

    document = Document(DOCX_PATH)
    if len(document.sections) != 1:
        raise SystemExit(f"Expected one section, found {len(document.sections)}")

    first_paragraph = document.paragraphs[0]
    section_paragraph = paragraph_by_style(document, {"Resume Section", "Heading 2"})
    entry_paragraph = paragraph_by_style(document, {"Resume Entry"})
    body_paragraph = paragraph_by_style(document, {"Resume Body"})

    title_run_properties = first_run_properties(first_paragraph)
    section_run_properties = first_run_properties(section_paragraph)
    entry_run_properties = first_run_properties(entry_paragraph)
    body_run_properties = first_run_properties(body_paragraph)
    label_run_properties = None
    for paragraph in document.paragraphs:
        if paragraph.style.name == "Resume Body" and " — " in paragraph.text:
            label_run_properties = first_run_properties(paragraph)
            break
    if label_run_properties is None:
        label_run_properties = section_run_properties

    link_run_properties = None
    for hyperlink_run in document.element.body.xpath(".//w:hyperlink/w:r"):
        candidate = hyperlink_run.find(qn("w:rPr"))
        if candidate is not None:
            link_run_properties = deepcopy(candidate)
            break

    styles = document.styles
    heading_one = styles["Heading 1"]
    heading_two = styles["Heading 2"]
    normal_style = styles["Normal"]
    set_style_visuals(heading_one, normal_style, size=17.5, bold=True, color="183F5C", paragraph_source=first_paragraph)
    set_style_visuals(heading_two, normal_style, size=9.5, bold=True, color="183F5C", paragraph_source=section_paragraph)
    if "Resume Event" in styles:
        event_style = styles["Resume Event"]
    else:
        event_style = styles.add_style("Resume Event", WD_STYLE_TYPE.PARAGRAPH)
    set_style_visuals(event_style, normal_style, size=8.5, bold=True, color="9A7530")
    event_style.paragraph_format.space_before = Pt(0)
    event_style.paragraph_format.space_after = Pt(1.2)
    event_style.paragraph_format.line_spacing = 1.0
    event_style.paragraph_format.keep_together = True

    remove_external_hyperlink_relationships(document)
    for paragraph in list(document.paragraphs):
        paragraph._element.getparent().remove(paragraph._element)

    for index, (style_name, segments) in enumerate(RESUME):
        paragraph = document.add_paragraph(style=style_name)
        if style_name == "Heading 1":
            copy_paragraph_format(first_paragraph, paragraph)
        elif style_name == "Heading 2":
            copy_paragraph_format(section_paragraph, paragraph)
        elif style_name == "Resume Entry":
            copy_paragraph_format(entry_paragraph, paragraph)
        elif style_name == "Resume Body":
            copy_paragraph_format(body_paragraph, paragraph)
            paragraph.paragraph_format.space_after = Pt(0.6)

        for segment_index, (visible_text, url) in enumerate(segments):
            if url is not None:
                add_hyperlink(paragraph, visible_text, url, link_run_properties)
                continue

            if style_name == "Resume Entry" and "  |  " in visible_text:
                primary, metadata = visible_text.split("  |  ", 1)
                primary_run = paragraph.add_run(primary)
                apply_run_properties(primary_run, entry_run_properties)
                metadata_run = paragraph.add_run(f"  |  {metadata}")
                metadata_run.font.color.rgb = RGBColor.from_string("525D6B")
                continue

            run = paragraph.add_run(visible_text)
            if style_name == "Heading 1":
                apply_run_properties(run, title_run_properties)
            elif style_name == "Heading 2":
                apply_run_properties(run, section_run_properties)
            elif style_name == "Resume Event":
                run.font.name = "Calibri"
                run.font.size = Pt(8.5)
                run.font.bold = True
                run.font.color.rgb = RGBColor.from_string("9A7530")
            elif style_name == "Resume Body":
                apply_run_properties(run, label_run_properties if segment_index == 0 and " — " in visible_text else body_run_properties)
            elif index == 1:
                run.font.bold = True
            elif index == 2:
                run.font.color.rgb = RGBColor.from_string("525D6B")
            elif index == 4 and visible_text.startswith("TARGET: SUPPORT ENGINEER"):
                prefix, remainder = visible_text.split(" — ", 1)
                run.text = prefix
                run.font.bold = True
                run.font.color.rgb = RGBColor.from_string("183F5C")
                paragraph.add_run(f" — {remainder}")

    section = document.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.52)
    section.bottom_margin = Inches(0.52)
    section.left_margin = Inches(0.60)
    section.right_margin = Inches(0.60)
    document.core_properties.title = TITLE
    document.core_properties.author = AUTHOR

    output = canonical_docx_bytes(document)
    changed = DOCX_PATH.read_bytes() != output
    if changed:
        temporary = DOCX_PATH.with_suffix(".docx.tmp")
        temporary.write_bytes(output)
        temporary.replace(DOCX_PATH)

    reopened = Document(DOCX_PATH)
    visible_text = " ".join(paragraph.text for paragraph in reopened.paragraphs)
    minimum_body_size = reopened.styles["Normal"].font.size.pt
    print(f"updated={str(changed).lower()}")
    print(f"sections={len(reopened.sections)}")
    print("page=US Letter 8.50x11.00in")
    margins = reopened.sections[0]
    print(
        "margins="
        f"top:{margins.top_margin.inches:.2f}in bottom:{margins.bottom_margin.inches:.2f}in "
        f"left:{margins.left_margin.inches:.2f}in right:{margins.right_margin.inches:.2f}in"
    )
    print(f"minimum_body_size={minimum_body_size:.1f}pt")
    print(f"event_count={visible_text.count(EVENT)}")


if __name__ == "__main__":
    main()
