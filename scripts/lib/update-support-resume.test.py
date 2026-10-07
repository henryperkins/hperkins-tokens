import contextlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE
from docx.shared import Pt


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "update-support-resume.py"
SPEC = importlib.util.spec_from_file_location("update_support_resume", SCRIPT_PATH)
UPDATER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(UPDATER)


def add_sized_hyperlink(paragraph, text, url, size, size_tag="w:sz"):
    relationship_id = paragraph.part.relate_to(url, RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), relationship_id)
    run = OxmlElement("w:r")
    run_properties = OxmlElement("w:rPr")
    size_element = OxmlElement(size_tag)
    size_element.set(qn("w:val"), str(int(size * 2)))
    run_properties.append(size_element)
    run.append(run_properties)
    text_element = OxmlElement("w:t")
    text_element.text = text
    run.append(text_element)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


class MinimumEffectiveBodySizeTests(unittest.TestCase):
    def make_document(self):
        document = Document()
        document.styles["Normal"].font.size = Pt(11.5)
        return document

    def test_detects_undersized_direct_run(self):
        document = self.make_document()
        paragraph = document.add_paragraph()
        paragraph.add_run("too small").font.size = Pt(8)
        self.assertEqual(UPDATER.minimum_effective_body_size(document), 8.0)
        with self.assertRaisesRegex(ValueError, r"8\.0pt$"):
            UPDATER.assert_minimum_body_size(document)

    def test_detects_undersized_hyperlink_run(self):
        document = self.make_document()
        paragraph = document.add_paragraph()
        add_sized_hyperlink(paragraph, "small link", "https://example.test/", 8.5, "w:szCs")
        self.assertEqual(UPDATER.minimum_effective_body_size(document), 8.5)
        with self.assertRaisesRegex(ValueError, r"8\.5pt$"):
            UPDATER.assert_minimum_body_size(document)

    def test_requires_exactly_one_scoped_resume_event(self):
        document = self.make_document()
        event_style = document.styles.add_style("Resume Event", 1)
        event_style.font.size = Pt(9.5)
        document.add_paragraph(UPDATER.EVENT, style=event_style)
        self.assertEqual(UPDATER.assert_resume_event_contract(document), 9.5)

        document.add_paragraph("unexpected second event", style=event_style)
        with self.assertRaisesRegex(ValueError, r"exactly one Resume Event"):
            UPDATER.assert_resume_event_contract(document)

    def test_requires_exact_event_copy_and_minimum_size(self):
        wrong_copy = self.make_document()
        wrong_style = wrong_copy.styles.add_style("Resume Event", 1)
        wrong_style.font.size = Pt(9.5)
        wrong_copy.add_paragraph("unexpected event", style=wrong_style)
        with self.assertRaisesRegex(ValueError, r"approved WCUS event copy$"):
            UPDATER.assert_resume_event_contract(wrong_copy)

        undersized = self.make_document()
        undersized_style = undersized.styles.add_style("Resume Event", 1)
        undersized_style.font.size = Pt(9)
        undersized.add_paragraph(UPDATER.EVENT, style=undersized_style)
        with self.assertRaisesRegex(ValueError, r"below 9\.5pt: 9\.0pt$"):
            UPDATER.assert_resume_event_contract(undersized)

    def test_scoped_metadata_can_be_smaller_than_body_without_lowering_body_floor(self):
        document = self.make_document()
        document.add_paragraph("Readable body")
        metadata_style = document.styles.add_style("Resume Metadata", 1)
        metadata_style.font.size = Pt(9.5)
        table = document.add_table(rows=1, cols=2)
        table.cell(0, 0).paragraphs[0].text = "Claim"
        paragraph = table.cell(0, 1).paragraphs[0]
        paragraph.style = metadata_style
        paragraph.text = "MERGED"
        self.assertEqual(UPDATER.minimum_effective_body_size(document), 11.5)
        self.assertEqual(UPDATER.assert_resume_metadata_size(document), 9.5)

    def test_document_walker_preserves_nested_and_merged_cell_order(self):
        document = self.make_document()
        document.add_paragraph("Before")
        table = document.add_table(rows=1, cols=2)
        left, right = table.rows[0].cells
        left.paragraphs[0].text = "Left"
        nested = left.add_table(rows=1, cols=2)
        nested.cell(0, 0).merge(nested.cell(0, 1)).text = "One merged cell"
        right.paragraphs[0].text = "Right"
        document.add_paragraph("After")
        self.assertEqual(
            [paragraph.text for paragraph in UPDATER.iter_document_paragraphs(document) if paragraph.text],
            ["Before", "Left", "One merged cell", "Right", "After"],
        )

    def test_cell_body_hyperlinks_and_metadata_hyperlinks_are_audited(self):
        document = self.make_document()
        table = document.add_table(rows=1, cols=2)
        body = table.cell(0, 0).paragraphs[0]
        add_sized_hyperlink(body, "small evidence", "https://example.test/evidence", 10.5)
        metadata_style = document.styles.add_style("Resume Contact", 1)
        metadata_style.font.size = Pt(9.5)
        metadata = table.cell(0, 1).paragraphs[0]
        metadata.style = metadata_style
        add_sized_hyperlink(metadata, "small contact", "mailto:person@example.test", 9)
        with self.assertRaisesRegex(ValueError, r"10\.5pt$"):
            UPDATER.assert_minimum_body_size(document)
        with self.assertRaisesRegex(ValueError, r"below 9\.5pt: 9\.0pt$"):
            UPDATER.assert_resume_metadata_size(document)

    def test_event_contract_finds_event_in_a_table_cell(self):
        document = self.make_document()
        event_style = document.styles.add_style("Resume Event", 1)
        event_style.font.size = Pt(9.5)
        table = document.add_table(rows=1, cols=1)
        paragraph = table.cell(0, 0).paragraphs[0]
        paragraph.style = event_style
        paragraph.text = UPDATER.EVENT
        self.assertEqual(UPDATER.assert_resume_event_contract(document), 9.5)

    def test_unrecognized_small_style_is_not_a_metadata_exemption(self):
        document = self.make_document()
        style = document.styles.add_style("Resume Other", 1)
        style.font.size = Pt(9.5)
        document.add_paragraph("Actual body", style=style)
        with self.assertRaisesRegex(ValueError, r"9\.5pt$"):
            UPDATER.assert_minimum_body_size(document)


class ResumeRegenerationTests(unittest.TestCase):
    def test_spacing_upgrade_is_idempotent_after_one_run(self):
        document = Document()
        document.styles["Normal"].font.size = Pt(9.5)
        title = document.add_paragraph("Old title", style="Heading 1")
        title.runs[0].font.bold = True
        section = document.add_paragraph("Old section", style="Heading 2")
        section.runs[0].font.bold = True
        section.paragraph_format.space_before = Pt(4.3)
        section.paragraph_format.space_after = Pt(2.2)
        for style_name in ("Resume Entry", "Resume Body"):
            style = document.styles.add_style(style_name, 1)
            style.base_style = document.styles["Normal"]
            paragraph = document.add_paragraph("Old content", style=style)
            if style_name == "Resume Entry":
                paragraph.runs[0].font.bold = True

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "resume.docx"
            document.save(target)
            with mock.patch.object(UPDATER, "DOCX_PATH", target):
                with contextlib.redirect_stdout(io.StringIO()):
                    UPDATER.main()
                first_result = target.read_bytes()
                with contextlib.redirect_stdout(io.StringIO()):
                    UPDATER.main()
                self.assertEqual(
                    target.read_bytes(), first_result,
                    "A second generation must not change the upgraded DOCX",
                )


if __name__ == "__main__":
    unittest.main()
