#!/usr/bin/env python3
"""Regenerate the one-page Imladris résumé and embed its theme fonts."""

from __future__ import annotations

import datetime
import io
import zipfile
from copy import deepcopy
from pathlib import Path
import importlib.util
import json

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.opc.constants import RELATIONSHIP_TYPE
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "assets" / "documents" / "henry-perkins-wordpress-support-engineer-resume.docx"
TITLE = "Henry Perkins — WordPress Support Engineer"
AUTHOR = "Henry Perkins"
# Document metadata only; the revision date never appears in the visible text.
REVISED = datetime.datetime(2026, 10, 6, tzinfo=datetime.timezone.utc)
REVISED_LABEL = "October 6, 2026"
# Post-event copy, mirroring the published About page. The pre-event
# "Selected to staff" line is retired and forbidden by the artifact contracts,
# so a binary that was not rebuilt cannot pass them.
EVENT = (
    "WORDCAMP US 2026 — Phoenix · Staffed the Core AI booth, walking maintainers "
    "and agency developers through AI provider tooling"
)
HEADLINE = "WordPress · Gutenberg · REST/HTTP/DNS · Defect reproduction · Fix validation · Customer communication"
SUMMARY = (
    "WordPress support professional with prior WordPress.com support experience, current independent "
    "client delivery, and upstream WordPress contributions. Reproduces defects, tests fixes, and reports "
    "findings to customers and engineering."
)

# Print scale: readable body, with explicitly scoped supporting metadata.
# The event keeps its own exact-copy and minimum-size contract.
BODY_SIZE = 11.0
TITLE_SIZE = 30.0
SECTION_SIZE = 9.5
EVENT_SIZE = 9.5
METADATA_SIZE = 9.5
METADATA_STYLES = {"Resume Metadata", "Resume Contact", "Resume Role", "Resume Event", "Heading 2"}

# Every entry is (paragraph style, [(visible text, hyperlink URL or None), ...]).
# A Resume Body whose first plain segment ends in " — " renders that segment as a
# bold lead-in label; keep labels in their own segment so the body stays regular.
RESUME = [
    ("Heading 1", [("Henry Perkins", None)]),
    ("Resume Role", [("WORDPRESS SUPPORT ENGINEER", None)]),
    ("Resume Contact", [
        ("Chicago, IL\n", None),
        ("htperkins@gmail.com", "mailto:htperkins@gmail.com"),
        ("\n", None),
        ("hperkins.blog", "https://hperkins.blog/"),
        ("\n", None),
        ("github.com/henryperkins", "https://github.com/henryperkins"),
    ]),
    ("Normal", [(HEADLINE, None)]),
    ("Normal", [(SUMMARY, None)]),
    ("Resume Event", [(EVENT, None)]),
    ("Heading 2", [("EXPERIENCE", None)]),
    ("Resume Entry", [("Lakefront Digital — Independent Technology Consultant  |  Chicago, remote\nOct 2022–Present", None)]),
    ("Resume Body", [
        ("Delivery scope — ", None),
        ("WordPress builds, API integrations, and documentation from discovery through post-launch support.", None),
    ]),
    ("Resume Body", [
        ("Client launch — ", None),
        ("Delivered ", None),
        ("DJ Lee & Voices of Judah", "https://hperkins.blog/work/dj-lee-voices-of-judah/"),
        ("’s booking-focused website from discovery through launch, including server-side booking validation and ", None),
        ("publicly available source code", "https://github.com/henryperkins/dj-judas-v2"),
        (".", None),
    ]),
    ("Resume Entry", [("Automattic — Happiness Engineer  |  WordPress.com · Remote\nOct–Nov 2012", None)]),
    ("Resume Body", [(
        "Resolved WordPress.com issues across publishing, configuration, billing, domains, and DNS, turning recurring "
        "problems into documentation and reproducible bug reports for customers, product, and engineering.",
        None,
    )]),
    ("Heading 2", [("SELECTED WORDPRESS INVESTIGATIONS & CONTRIBUTIONS", None)]),
    ("Resume Body", [
        ("Defect reproduction — ", None),
        ("Reported and reproduced a WordPress AI Guidelines defect (", None),
        ("Issue #529", "https://github.com/WordPress/ai/issues/529"),
        ("): an artifact guideline could shadow the content guideline. A maintainer’s fix, ", None),
        ("PR #593", "https://github.com/WordPress/ai/pull/593"),
        (", shipped in ", None),
        ("WordPress AI 1.0.1", "https://github.com/WordPress/ai/releases/tag/1.0.1"),
        (".", None),
    ]),
    ("Resume Body", [
        ("Fix validation — ", None),
        ("Reported a WordPress AI request-logging gap (", None),
        ("Issue #732", "https://github.com/WordPress/ai/issues/732"),
        ("); integration-tested Anubhav Anand’s proposed fix (", None),
        ("PR #757", "https://github.com/WordPress/ai/pull/757"),
        (", open), found duplicate successes and missing failures, and proposed the ownership split.", None),
    ]),
    ("Resume Body", [
        ("Documentation — ", None),
        ("Wrote and refined the Content Resizing and Title Generation experiment documentation in ", None),
        ("WordPress/ai PR #501", "https://github.com/WordPress/ai/pull/501"),
        ("; merged May 18, 2026 and credited in the 1.0.0 release notes.", None),
    ]),
    ("Resume Body", [
        ("Compatibility fix — ", None),
        ("Directed and reviewed an AI-assisted fix so the OpenAI provider advertises sampling options only for models that accept them, with tests: ", None),
        ("WordPress/ai-provider-for-openai PR #40", "https://github.com/WordPress/ai-provider-for-openai/pull/40"),
        (", merged Aug 16, 2026.", None),
    ]),
    ("Resume Body", [
        ("Input validation — ", None),
        ("Directed and reviewed an AI-assisted contribution that rejects NAN and infinite embedding values, with a regression test for each: ", None),
        ("WordPress/php-ai-client PR #263", "https://github.com/WordPress/php-ai-client/pull/263"),
        (", open contribution.", None),
    ]),
    ("Heading 2", [("SELECTED PROJECTS", None)]),
    ("Resume Body", [("Independent projects developed with AI assistance under my direction and review; public tagged releases.", None)]),
    ("Resume Entry", [("Flavor Agent — Creator · WordPress agent-governance plugin", None)]),
    ("Resume Metadata", [
        ("Released ", None),
        ("v0.1.0", "https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0"),
        ("\nAug 26, 2026", None),
    ]),
    ("Resume Body", [
        (
            "Provides validation, admin approval, audit records, "
            "and undo workflows for supported AI-proposed WordPress changes.",
            None,
        ),
    ]),
    ("Resume Entry", [("AI Provider for Codex — Creator · independent WordPress plugin", None)]),
    ("Resume Metadata", [
        ("Released ", None),
        ("v2.1", "https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1"),
    ]),
    ("Resume Body", [
        ("Connects Codex text and image generation to the WordPress AI Client through a local sidecar.", None),
    ]),
    ("Resume Entry", [("HPerkins Tokens — Creator · WordPress block theme behind hperkins.blog", None)]),
    ("Resume Metadata", [
        ("Released ", None),
        ("v0.3.53", "https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53"),
    ]),
    ("Resume Body", [
        ("hperkins.blog", "https://hperkins.blog/"),
        (
            ". WordPress block theme with token-based editor controls and verifier scripts "
            "for content, typography, and accessibility checks.",
            None,
        ),
    ]),
    ("Heading 2", [("TECHNICAL SKILLS & ADDITIONAL EXPERIENCE", None)]),
    ("Resume Body", [("Code investigation and review: ", None),
        ("PHP, JavaScript, Gutenberg, REST API, WP-CLI · ", None),
        ("Support: ", None),
        ("HTTP, DNS, CSS, browser debugging, escalation triage · ", None),
        ("Tooling: ", None),
        ("Git/GitHub, GitHub Actions, Plugin Check, PHPStan, Cloudflare Workers.", None),
    ]),
    ("Resume Body", [
        ("Developer community — ", None),
        (
            "PageLines Developer Community Manager (May–Oct 2012): onboarding content, tutorials, and day-to-day "
            "developer relations, turning community feedback into clearer product guidance.",
            None,
        ),
    ]),
    ("Resume Body", [
        ("Customer and operations roles — ", None),
        (
            "Starbucks Shift Supervisor (2019–2022); Sodexo Starbucks Manager (2018–2019); "
            "Clinique Consultant (2015–2017); Micro Center Customer Service/Sales (2009–2012).",
            None,
        ),
    ]),
]




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




def effective_style_size(style):
    while style is not None:
        if style.font.size is not None:
            return style.font.size.pt
        style = style.base_style
    return None


def effective_run_size(document, paragraph, run_element):
    run_properties = run_element.find(qn("w:rPr"))
    if run_properties is not None:
        direct_sizes = []
        for size_name in ("w:sz", "w:szCs"):
            size_element = run_properties.find(qn(size_name))
            if size_element is not None:
                direct_sizes.append(int(size_element.get(qn("w:val"))) / 2)
        if direct_sizes:
            return min(direct_sizes)

        run_style = run_properties.find(qn("w:rStyle"))
        if run_style is not None:
            style_id = run_style.get(qn("w:val"))
            for style in document.styles:
                if style.type == WD_STYLE_TYPE.CHARACTER and style.style_id == style_id:
                    style_size = effective_style_size(style)
                    if style_size is not None:
                        return style_size

    paragraph_size = effective_style_size(paragraph.style)
    if paragraph_size is not None:
        return paragraph_size
    return effective_style_size(document.styles["Normal"])


def iter_document_paragraphs(document):
    """Read physical cells once, including nested tables, in document order."""
    def walk(container):
        for child in container:
            if child.tag == qn("w:p"):
                yield Paragraph(child, document)
            elif child.tag in {qn("w:tbl"), qn("w:tr"), qn("w:tc")}:
                yield from walk(child)
    yield from walk(document.element.body)


def minimum_effective_body_size(document):
    sizes = []
    for paragraph in iter_document_paragraphs(document):
        if paragraph.style.name in METADATA_STYLES:
            continue
        for run_element in paragraph._p.xpath(".//w:r"):
            if not any(node.text for node in run_element.xpath(".//w:t")):
                continue
            size = effective_run_size(document, paragraph, run_element)
            if size is None:
                raise ValueError(f"Cannot resolve effective font size in paragraph: {paragraph.text}")
            sizes.append(size)
    if not sizes:
        raise ValueError("Résumé contains no non-event text runs to audit")
    return min(sizes)


def assert_minimum_body_size(document, floor=BODY_SIZE):
    minimum = minimum_effective_body_size(document)
    if minimum < floor:
        raise ValueError(f"Résumé effective non-event text falls below {floor:.1f}pt: {minimum:.1f}pt")
    return minimum


def assert_resume_metadata_size(document, floor=METADATA_SIZE):
    sizes = [
        effective_run_size(document, paragraph, run)
        for paragraph in iter_document_paragraphs(document)
        if paragraph.style.name in METADATA_STYLES
        for run in paragraph._p.xpath(".//w:r")
        if any(node.text for node in run.xpath(".//w:t"))
    ]
    if not sizes or any(size is None for size in sizes):
        raise ValueError("Cannot resolve résumé metadata size")
    minimum = min(sizes)
    if minimum < floor:
        raise ValueError(f"Résumé metadata falls below {floor:.1f}pt: {minimum:.1f}pt")
    return minimum


def assert_resume_event_contract(document, floor=EVENT_SIZE):
    event_paragraphs = [
        paragraph for paragraph in iter_document_paragraphs(document)
        if paragraph.style.name == "Resume Event"
    ]
    if len(event_paragraphs) != 1:
        raise ValueError(f"Résumé must contain exactly one Resume Event paragraph; found {len(event_paragraphs)}")

    paragraph = event_paragraphs[0]
    visible_text = "".join(
        node.text or "" for node in paragraph._p.xpath(".//w:t")
    )
    if visible_text != EVENT:
        raise ValueError("Resume Event paragraph does not match the approved WCUS event copy")

    sizes = [
        effective_run_size(document, paragraph, run_element)
        for run_element in paragraph._p.xpath(".//w:r")
        if any(node.text for node in run_element.xpath(".//w:t"))
    ]
    if not sizes or any(size is None for size in sizes):
        raise ValueError("Cannot resolve the Resume Event effective font size")
    minimum = min(sizes)
    if minimum < floor:
        raise ValueError(f"Resume Event text falls below {floor:.1f}pt: {minimum:.1f}pt")
    return minimum


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


def define_styles(document, colors):
    fonts = {"body": "HPerkins EB Garamond", "display": "HPerkins Cormorant Garamond",
             "label": "HPerkins Marcellus", "mono": "HPerkins JetBrains Mono"}
    specs = [
        ("Normal", fonts["body"], BODY_SIZE, colors["body"]),
        ("Heading 1", fonts["display"], TITLE_SIZE, colors["strong"]),
        ("Heading 2", fonts["label"], SECTION_SIZE, colors["accent"]),
        ("Resume Body", fonts["body"], BODY_SIZE, colors["body"]),
        ("Resume Entry", fonts["body"], BODY_SIZE, colors["strong"]),
        ("Resume Role", fonts["label"], METADATA_SIZE, colors["accent"]),
        ("Resume Contact", fonts["mono"], METADATA_SIZE, colors["body"]),
        ("Resume Metadata", fonts["mono"], METADATA_SIZE, colors["body"]),
        ("Resume Event", fonts["body"], EVENT_SIZE, colors["body"]),
    ]
    for name, family, size, color in specs:
        style = document.styles[name] if name in document.styles else document.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        if name != "Normal":
            style.base_style = document.styles["Normal"]
        style.font.name = family
        style.font.size = Pt(size)
        style.font.bold = False
        style.font.italic = name == "Resume Event"
        style.font.color.rgb = RGBColor.from_string(color.lstrip("#"))
        rfonts = style.element.get_or_add_rPr().get_or_add_rFonts()
        for attribute in ("ascii", "hAnsi", "eastAsia", "cs"):
            rfonts.set(qn("w:" + attribute), family)
        for attribute in ("asciiTheme", "hAnsiTheme", "eastAsiaTheme", "cstheme"):
            rfonts.attrib.pop(qn("w:" + attribute), None)
        fmt = style.paragraph_format
        fmt.space_before = Pt(0)
        fmt.space_after = Pt(2.5)
        fmt.line_spacing = Pt(12.8 if name not in METADATA_STYLES else 11.5)
        fmt.keep_together = True
        fmt.widow_control = True
    document.styles["Heading 1"].paragraph_format.line_spacing = Pt(34)
    document.styles["Heading 1"].paragraph_format.space_after = Pt(3)
    document.styles["Heading 1"].paragraph_format.keep_with_next = True
    document.styles["Heading 2"].paragraph_format.space_before = Pt(7)
    document.styles["Heading 2"].paragraph_format.space_after = Pt(3)
    document.styles["Heading 2"].paragraph_format.keep_with_next = True
    document.styles["Resume Entry"].paragraph_format.keep_with_next = True
    document.styles["Resume Event"].paragraph_format.space_after = Pt(3)


def append_segments(paragraph, segments, colors, entry=False):
    for index, (text, url) in enumerate(segments):
        if url:
            properties = OxmlElement("w:rPr")
            color = OxmlElement("w:color")
            color.set(qn("w:val"), colors["link"].lstrip("#"))
            properties.append(color)
            underline = OxmlElement("w:u")
            underline.set(qn("w:val"), "single")
            properties.append(underline)
            add_hyperlink(paragraph, text, url, properties)
        elif entry and " — " in text:
            primary, rest = text.split(" — ", 1)
            paragraph.add_run(primary).bold = True
            paragraph.add_run(" — ")
            paragraph.add_run(rest).italic = True
        else:
            run = paragraph.add_run(text)
            if (index == 0 and text.endswith(" — ")) or (text.endswith(": ") and len(text) < 40):
                run.bold = True


def record_table(document, left_width, right_width):
    section = document.sections[0]
    available = (section.page_width - section.left_margin - section.right_margin) / Inches(1)
    scale = available / (left_width + right_width)
    left_width, right_width = left_width * scale, right_width * scale
    table = document.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(left_width)
    table.columns[1].width = Inches(right_width)
    table.cell(0, 0).width = Inches(left_width)
    table.cell(0, 1).width = Inches(right_width)
    properties = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = OxmlElement("w:" + edge)
        node.set(qn("w:val"), "nil")
        borders.append(node)
    properties.append(borders)
    margins = OxmlElement("w:tblCellMar")
    for edge in ("top", "left", "bottom", "right"):
        node = OxmlElement("w:" + edge)
        node.set(qn("w:w"), "0")
        node.set(qn("w:type"), "dxa")
        margins.append(node)
    properties.append(margins)
    row_properties = table.rows[0]._tr.get_or_add_trPr()
    row_properties.append(OxmlElement("w:cantSplit"))
    for cell in table.rows[0].cells:
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
        cell.paragraphs[0].paragraph_format.space_after = Pt(0)
    return table


def add_rule(paragraph, color):
    borders = OxmlElement("w:pBdr")
    node = OxmlElement("w:bottom")
    node.set(qn("w:val"), "single")
    node.set(qn("w:sz"), "4")
    node.set(qn("w:space"), "4")
    node.set(qn("w:color"), color.lstrip("#"))
    borders.append(node)
    paragraph._p.get_or_add_pPr().append(borders)


def build_resume(paper="letter"):
    document = Document()
    theme = json.loads((ROOT / "theme.json").read_text(encoding="utf-8"))["settings"]
    palette = {entry["slug"]: entry["color"] for entry in theme["color"]["palette"]}
    colors = dict(theme["custom"]["text"])
    colors["accent"] = palette["gold-800"]
    colors["link"] = palette["river-700"]
    define_styles(document, colors)
    section = document.sections[0]
    if paper not in {"letter", "a4"}:
        raise ValueError("Paper must be letter or a4")
    width, height = (8.5, 11) if paper == "letter" else (210 / 25.4, 297 / 25.4)
    section.page_width, section.page_height = Inches(width), Inches(height)
    section.top_margin = section.bottom_margin = Inches(0.48)
    section.left_margin = section.right_margin = Inches(0.55)
    section.header_distance = section.footer_distance = Inches(0.2)
    # Native editable letterhead: left identity, right contact addresses.
    header = record_table(document, 4.7, 2.7)
    left, right = header.rows[0].cells
    left.paragraphs[0].style = "Heading 1"
    append_segments(left.paragraphs[0], RESUME[0][1], colors)
    role = left.add_paragraph(style="Resume Role")
    append_segments(role, RESUME[1][1], colors)
    contact = right.paragraphs[0]
    contact.style = "Resume Contact"
    contact.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    append_segments(contact, RESUME[2][1], colors)
    rule = document.add_paragraph()
    rule.paragraph_format.line_spacing = Pt(1)
    rule.paragraph_format.space_after = Pt(6)
    add_rule(rule, colors["accent"])
    statuses = {"Defect reproduction — ": "FIX SHIPPED", "Fix validation — ": "OPEN",
                "Documentation — ": "MERGED", "Compatibility fix — ": "MERGED",
                "Input validation — ": "OPEN"}
    index = 3
    section_title = ""
    while index < len(RESUME):
        style, segments = RESUME[index]
        text = "".join(segment[0] for segment in segments)
        if style == "Heading 2":
            section_title = text
            paragraph = document.add_paragraph(style=style)
            append_segments(paragraph, segments, colors)
            add_rule(paragraph, colors["accent"])
        elif style == "Resume Entry":
            primary, separator, metadata = text.partition("  |  ")
            metadata_segments = [(metadata, None)] if separator else []
            if index + 1 < len(RESUME) and RESUME[index + 1][0] == "Resume Metadata":
                metadata_segments = RESUME[index + 1][1]
                index += 1
            table = record_table(document, 5.1, 2.3)
            left, right = table.rows[0].cells
            left.paragraphs[0].style = "Resume Entry"
            append_segments(left.paragraphs[0], [(primary, None)], colors, entry=True)
            right.paragraphs[0].style = "Resume Metadata"
            right.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
            append_segments(right.paragraphs[0], metadata_segments, colors)
        elif section_title == "SELECTED WORDPRESS INVESTIGATIONS & CONTRIBUTIONS" and segments[0][0] in statuses:
            table = record_table(document, 6.4, 1.0)
            left, right = table.rows[0].cells
            left.paragraphs[0].style = "Resume Body"
            left.paragraphs[0].paragraph_format.space_after = Pt(3.5)
            padding = OxmlElement("w:tcMar")
            edge = OxmlElement("w:right")
            edge.set(qn("w:w"), "160")
            edge.set(qn("w:type"), "dxa")
            padding.append(edge)
            left._tc.get_or_add_tcPr().append(padding)
            append_segments(left.paragraphs[0], segments, colors)
            right.paragraphs[0].style = "Resume Metadata"
            right.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
            append_segments(right.paragraphs[0], [(statuses[segments[0][0]], None)], colors)
        else:
            paragraph = document.add_paragraph(style=style)
            append_segments(paragraph, segments, colors)
            if text == HEADLINE:
                paragraph.paragraph_format.space_after = Pt(4)
            elif text == SUMMARY:
                paragraph.paragraph_format.space_after = Pt(4)
        index += 1
    document.core_properties.title = TITLE
    document.core_properties.author = AUTHOR
    document.core_properties.comments = f"Evidence-bounded résumé revised {REVISED_LABEL}."
    document.core_properties.keywords = "WordPress, support engineer, Gutenberg, REST, HTTP, DNS, defect reproduction, fix validation"
    document.core_properties.created = REVISED
    document.core_properties.modified = REVISED
    fonts_path = ROOT / "scripts" / "lib" / "resume-fonts.py"
    spec = importlib.util.spec_from_file_location("resume_fonts", fonts_path)
    fonts = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fonts)
    fonts.embed_theme_fonts(document, ROOT)
    return document


def main():
    if not DOCX_PATH.is_file():
        raise SystemExit(f"Existing résumé DOCX not found: {DOCX_PATH}")
    document = build_resume()
    assert_resume_event_contract(document)
    minimum_body_size = assert_minimum_body_size(document)
    minimum_metadata_size = assert_resume_metadata_size(document)
    output = canonical_docx_bytes(document)
    changed = DOCX_PATH.read_bytes() != output
    if changed:
        temporary = DOCX_PATH.with_suffix(".docx.tmp")
        temporary.write_bytes(output)
        temporary.replace(DOCX_PATH)
    print(f"updated={str(changed).lower()}")
    print("sections=1")
    print("page=US Letter 8.50x11.00in")
    print(f"minimum_body_size={minimum_body_size:.1f}pt")
    print(f"minimum_metadata_size={minimum_metadata_size:.1f}pt")
    print("embedded_font_faces=6")
    print("event_count=1")


if __name__ == "__main__":
    main()
