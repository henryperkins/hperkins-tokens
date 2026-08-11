#!/usr/bin/env python3
"""Verify recruiter-visible DOCX/PDF text, links, pages, and tag structure."""

from __future__ import annotations

import argparse
import re
import tempfile
import unicodedata
from pathlib import Path

import pdfplumber
from docx import Document
from docx.oxml.ns import qn
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "assets" / "documents" / "henry-perkins-wordpress-support-engineer-resume.docx"
PDF_PATH = ROOT / "assets" / "documents" / "henry-perkins-wordpress-support-engineer-resume.pdf"
EVENT = "WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth"
FORBIDDEN = (
    (re.compile(r"as of Jul 30, 2026"), "as of Jul 30, 2026"),
    (re.compile(r"54 commits ahead"), "54 commits ahead"),
    (re.compile(r"\b30 contracts\b"), "30 contracts"),
    (re.compile(r"\b35 contracts\b"), "35 contracts"),
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
    value = re.sub(r"(?<=\w)-[ \t]*\n[ \t]*(?=\w)", "-", value)
    return normalize(value)


def docx_text_and_urls(path):
    document = Document(path)
    paragraph_text = []
    for paragraph in document.paragraphs:
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
        text = normalize_pdf_text("\n".join(page.extract_text() or "" for page in pdf.pages))
        urls = [
            annotation["uri"]
            for page in pdf.pages
            for annotation in page.annots
            if annotation.get("uri")
        ]
        return text, urls, len(pdf.pages)


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


def verify():
    docx_text, docx_urls = docx_text_and_urls(DOCX_PATH)
    pdf_text, pdf_urls, pdf_pages = pdf_text_and_urls(PDF_PATH)
    pdf_bytes = PDF_PATH.read_bytes()

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

    print(f"normalized_text_characters={len(docx_text)}")
    print(f"external_link_annotations={len(pdf_urls)}")
    print(f"pdf_pages={pdf_pages}")
    print(f"heading_tags=H1:{pdf_bytes.count(b'/H1')} H2:{pdf_bytes.count(b'/H2')}")
    print("placement_text_link_tag_parity=pass")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--normalize-word-pdf", action="store_true")
    args = parser.parse_args()
    if args.normalize_word_pdf:
        normalize_word_pdf(PDF_PATH)
    else:
        verify()


if __name__ == "__main__":
    main()
