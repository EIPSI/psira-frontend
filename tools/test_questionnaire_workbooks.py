"""Check the files users download, including localized text and stable import codes."""
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import unittest

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets/templates'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
TEXT_COLUMNS = {'label', 'hint', 'required_message', 'range_min_label', 'range_max_label', 'image'}


def load(filename):
    with ZipFile(ASSETS / filename) as archive:
        assert archive.testzip() is None
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        sheets = {}
        for i, sheet in enumerate(workbook.findall('s:sheets/s:sheet', NS), 1):
            rows = []
            xml = ET.fromstring(archive.read(f'xl/worksheets/sheet{i}.xml'))
            for row in xml.findall('s:sheetData/s:row', NS):
                values = {}
                for cell in row.findall('s:c', NS):
                    reference = cell.attrib['r']
                    position = 0
                    for char in reference:
                        if char.isalpha():
                            position = position * 26 + ord(char) - ord('A') + 1
                    if cell.attrib.get('t') == 'inlineStr':
                        value = ''.join(cell.itertext())
                    else:
                        value = cell.findtext('s:v', '', NS)
                    values[position - 1] = value
                rows.append([values.get(i, '') for i in range(max(values, default=-1) + 1)])
            sheets[sheet.attrib['name']] = rows
        return sheets


class WorkbookTests(unittest.TestCase):
    def test_every_language_preserves_import_columns_codes_and_conditions(self):
        for kind in ('guia', 'ejemplo-completo'):
            stem = 'PSIRA-cuestionarios-' if kind == 'guia' else 'PSIRA-cuestionario-'
            stem += kind
            spanish = load(f'{stem}-es.xlsx')
            for language in ('en', 'de', 'nl'):
                with self.subTest(kind=kind, language=language):
                    other = load(f'{stem}-{language}.xlsx')
                    self.assertEqual(spanish['survey'][0], other['survey'][0])
                    columns = spanish['survey'][0]
                    self.assertEqual(len(spanish['survey']), len(other['survey']))
                    for original, translated in zip(spanish['survey'][1:], other['survey'][1:]):
                        for index, column in enumerate(columns):
                            first = original[index] if index < len(original) else ''
                            second = translated[index] if index < len(translated) else ''
                            if column not in TEXT_COLUMNS:
                                self.assertEqual(first, second, column)
                            elif first and column != 'image':
                                self.assertTrue(second, column)
                                self.assertNotEqual(first, second, first)
                    self.assertEqual(spanish['choices'][0], other['choices'][0])
                    for original, translated in zip(spanish['choices'][1:], other['choices'][1:]):
                        self.assertEqual(original[:2], translated[:2])
                        self.assertEqual(original[4:], translated[4:])
                    settings = dict(zip(other['settings'][0], other['settings'][1]))
                    self.assertEqual(settings['language'], language)
                    self.assertIn(language, settings['form_id'])

    def test_documentation_and_test_checklists_are_localized(self):
        docs = {'es': ('LEEME', 'Tema', 'EJEMPLO_PASO_A_PASO', 'PRUEBAS'),
                'en': ('README', 'Topic', 'STEP_BY_STEP', 'TESTS'),
                'de': ('BITTE_LESEN', 'Thema', 'SCHRITT_FUER_SCHRITT', 'TESTS'),
                'nl': ('LEESMIJ', 'Onderwerp', 'STAP_VOOR_STAP', 'TESTS')}
        for lang, (readme, title, steps, tests) in docs.items():
            with self.subTest(language=lang):
                guide = load(f'PSIRA-cuestionarios-guia-{lang}.xlsx')
                example = load(f'PSIRA-cuestionario-ejemplo-completo-{lang}.xlsx')
                self.assertEqual(len(guide), 10)
                self.assertEqual(guide[readme][0][0], title)
                self.assertEqual(len(guide[steps]), 13)
                self.assertEqual(len(example[tests]), 31)
                self.assertIn(f'language={lang}', guide[steps][1][2])
                self.assertEqual(guide['survey'], example['survey'])
                self.assertEqual(guide['choices'], example['choices'])
                if lang != 'es':
                    for rows in list(guide.values()) + list(example.values()):
                        for row in rows:
                            for cell in row:
                                self.assertNotIn('Escribí', cell)
                                self.assertNotIn('Seleccioná', cell)
                                self.assertNotIn('Sin interacción', cell)
                                self.assertNotIn('Esta guía está escrita en español', cell)

    def test_image_references_exist(self):
        for lang in ('es', 'en', 'de', 'nl'):
            workbook = load(f'PSIRA-cuestionarios-guia-{lang}.xlsx')
            survey = workbook['survey']
            image = survey[0].index('image')
            references = [row[image] for row in survey[1:] if len(row) > image and row[image]]
            references += [row[3] for row in workbook['choices'][1:] if len(row) > 3 and row[3]]
            self.assertTrue(references)
            for reference in references:
                self.assertTrue((ROOT / 'src' / reference).exists())


if __name__ == '__main__':
    unittest.main()
