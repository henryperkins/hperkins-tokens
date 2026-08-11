import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "verify-placement-text-parity.py"
SPEC = importlib.util.spec_from_file_location("verify_placement_text_parity", SCRIPT_PATH)
PARITY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PARITY)


class PlacementTextParityTests(unittest.TestCase):
    def test_require_is_active_under_optimized_python(self):
        with self.assertRaisesRegex(SystemExit, "required failure"):
            PARITY.require(False, "required failure")

    def test_forbidden_numeric_copy_uses_whole_number_boundaries(self):
        self.assertEqual(PARITY.find_forbidden_copy("30 contracts"), "30 contracts")
        self.assertEqual(PARITY.find_forbidden_copy("35 contracts"), "35 contracts")
        self.assertIsNone(PARITY.find_forbidden_copy("130 contracts and 235 contracts"))

    def test_normalization_removes_temporary_pdf_after_write_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "resume.pdf"
            target.write_bytes(b"original")
            writer = mock.Mock()
            writer.write.side_effect = RuntimeError("write failed")
            with mock.patch.object(PARITY, "PdfReader"), mock.patch.object(PARITY, "PdfWriter", return_value=writer):
                with self.assertRaisesRegex(RuntimeError, "write failed"):
                    PARITY.normalize_word_pdf(target)
            self.assertEqual(list(Path(directory).glob("*.pdf")), [target])


if __name__ == "__main__":
    unittest.main()
