import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ElementTree
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
INK = colors.HexColor("#24382E")
MUTED = colors.HexColor("#59655E")
RULE = colors.HexColor("#C9D3CC")
HEADINGS = (
    "Education Background", "Publications and Preprints", "Research Experience",
    "Project Experience", "Summer Camp (Excellent Camper/Early Admission)",
    "Selected Honors & Awards", "Leadership/Work Experience", "Other Qualifications",
)


def normalize(text):
    replacements = {
        "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-",
        "\u2014": "-", "\u2212": "-", "（": " (", "）": ")",
        "：": ": ", "，": ", ", "Lun Chen": "Yilun Chen",
    }
    for original, replacement in replacements.items():
        text = text.replace(original, replacement)
    text = re.sub(r"\s*\|\s*Tel:\s*\+?[\d ()-]+\s*(?=\|)", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,;:.])", r"\1", text)
    text = re.sub(r":(?=[A-Za-z0-9])", ": ", text)
    text = re.sub(r",(?=[A-Za-z])", ", ", text)
    text = re.sub(r"(?<=[A-Za-z])\(", " (", text)
    return re.sub(r"(\d{4})\s*-\s*(?=[A-Z][a-z]+ \d{4})", r"\1 - ", text)


def read_sections(source):
    with ZipFile(source) as archive:
        root = ElementTree.fromstring(archive.read("word/document.xml"))
    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = [
        normalize("".join(node.text or "" for node in paragraph.findall(".//w:t", namespace)))
        for paragraph in root.findall(".//w:p", namespace)
    ]
    sections = {"Introduction": []}
    current = "Introduction"
    for paragraph in filter(None, paragraphs):
        if paragraph in HEADINGS:
            current = paragraph
            sections[current] = []
        else:
            sections[current].append(paragraph)
    missing = set(HEADINGS) - sections.keys()
    if missing:
        raise ValueError(f"CV headings changed: {sorted(missing)}")
    if re.search(r"\bTel\s*:|\b\d{11}\b", "\n".join(paragraphs)):
        raise ValueError("A telephone field remains in the public CV content.")
    return sections


def read_publications():
    node_source = """
import { readFileSync } from 'node:fs';
import typescript from 'typescript';

const source = readFileSync(process.argv[1], 'utf8');
const { outputText } = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.ESNext },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const { publications } = await import(moduleUrl);
process.stdout.write(JSON.stringify(publications));
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", node_source, str(ROOT / "src/data/profile.ts")],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True,
    )
    publications = json.loads(result.stdout)
    if [publication["id"] for publication in publications] != ["diwa", "vlcot", "tame3d", "omniintents"]:
        raise ValueError("Expected DIWA, VLCoT, Tame3D, and OmniIntents in the public profile data.")
    return publications


def register_fonts(font_directory):
    names = ("arial.ttf", "arialbd.ttf", "ariali.ttf", "georgia.ttf", "georgiab.ttf")
    if not all((font_directory / name).exists() for name in names):
        return "Helvetica", "Helvetica-Bold", "Times-Roman", "Times-Bold"
    for family, filename in (
        ("CVSans", "arial.ttf"), ("CVSansBold", "arialbd.ttf"),
        ("CVSansItalic", "ariali.ttf"), ("CVSerif", "georgia.ttf"),
        ("CVSerifBold", "georgiab.ttf"),
    ):
        pdfmetrics.registerFont(TTFont(family, str(font_directory / filename)))
    pdfmetrics.registerFontFamily("CVSans", normal="CVSans", bold="CVSansBold", italic="CVSansItalic")
    pdfmetrics.registerFontFamily("CVSerif", normal="CVSerif", bold="CVSerifBold")
    return "CVSans", "CVSansBold", "CVSerif", "CVSerifBold"


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.page_states = []

    def showPage(self):
        self.page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self.page_states)
        for state in self.page_states:
            self.__dict__.update(state)
            self.setStrokeColor(RULE)
            self.setLineWidth(0.5)
            self.line(48, 41, A4[0] - 48, 41)
            self.setFont("Helvetica", 7.5)
            self.setFillColor(MUTED)
            self.drawString(48, 27, "YIRONG QIANG  /  CURRICULUM VITAE")
            self.drawRightString(A4[0] - 48, 27, f"{self._pageNumber} / {total}")
            super().showPage()
        super().save()


def build(source, output, font_directory):
    sections = read_sections(source)
    publications = read_publications()
    sans, sans_bold, serif, serif_bold = register_fonts(font_directory)
    styles = {
        "name": ParagraphStyle("Name", fontName=serif, fontSize=31, leading=38, textColor=INK, spaceAfter=7),
        "contact": ParagraphStyle("Contact", fontName=sans, fontSize=9.1, leading=14, textColor=MUTED, spaceAfter=15),
        "section": ParagraphStyle("Section", fontName=sans_bold, fontSize=10.5, leading=14, textColor=INK, spaceBefore=17, spaceAfter=10, keepWithNext=True),
        "title": ParagraphStyle("Title", fontName=serif_bold, fontSize=12, leading=17, textColor=INK, spaceAfter=7, keepWithNext=True),
        "meta": ParagraphStyle("Meta", fontName=sans, fontSize=9, leading=13.5, textColor=MUTED, spaceAfter=9, keepWithNext=True),
        "body": ParagraphStyle("Body", fontName=sans, fontSize=9.3, leading=14.1, textColor=INK, spaceAfter=7),
        "publication": ParagraphStyle("Publication", fontName=sans, fontSize=9.6, leading=14.7, textColor=INK, spaceAfter=6),
        "publication_note": ParagraphStyle("PublicationNote", fontName=sans, fontSize=8.3, leading=12, textColor=MUTED, spaceAfter=12),
    }
    story = []

    def paragraph(text, style="body", emphasize=False):
        formatted = escape(text)
        if emphasize:
            formatted = formatted.replace("Yirong Qiang", "<b>Yirong Qiang</b>")
        if style == "body" and ":" in text:
            label, content = text.split(":", 1)
            if label in {"Overview", "Results", "Achievements", "Personal Contribution", "AI", "Personality Traits"}:
                formatted = f"<b>{escape(label)}:</b>{escape(content)}"
        return Paragraph(formatted, styles[style])

    def section(title):
        story.append(paragraph(title.upper(), "section"))

    def research_block(block):
        header = block[0].removeprefix("Research: ")
        header = re.sub(r'"\s*-+\s*', '" | ', header)
        header = header.replace("-UESTC", "| UESTC").replace("@", " | ")
        title, affiliation = header.rsplit(" | ", 1)
        title = title.strip(' "')
        if '" | ' in title:
            title, role = title.rsplit('" | ', 1)
            affiliation = f"{role} | {affiliation}"
        metadata = block[1].removeprefix("Research areas: ")
        date_match = re.search(r"((?:June|October|December) \d{4}\s*-\s*(?:September|January|March|November) \d{4})$", metadata)
        date = date_match.group(1) if date_match else ""
        areas = metadata[:date_match.start()].strip() if date_match else metadata
        story.append(paragraph(title.strip(' "'), "title"))
        story.append(Paragraph(f"{escape(affiliation)} | {escape(date)}<br/>{escape(areas)}", styles["meta"]))
        for item in block[2:]:
            story.append(paragraph(item))
        story.append(Spacer(1, 13))

    story.append(paragraph("Yirong Qiang", "name"))
    contact = sections["Introduction"][1].replace(" | Email:", "<br/>Email:")
    contact_markup = escape(contact).replace("&lt;br/&gt;", "<br/>")
    contact_markup = contact_markup.replace("yirongqiang1@gmail.com", '<link href="mailto:yirongqiang1@gmail.com" color="#24382E">yirongqiang1@gmail.com</link>')
    story.append(Paragraph(contact_markup, styles["contact"]))
    story.append(HRFlowable(width="100%", thickness=1, color=INK))
    section("Education")
    for item in sections["Education Background"]:
        if item == "Key courses and Grades:":
            story.append(paragraph("Selected coursework and grades", "meta"))
        else:
            story.append(paragraph(item))
    section("Publications & Preprints")
    for publication in publications:
        authors = ", ".join(author["name"] + author.get("mark", "") for author in publication["authors"])
        venue = publication["venue"]
        if publication["status"] == "Under review":
            venue += " submission"
        item = f'{authors}. "{publication["title"]}." {venue}. {publication["status"]}.'
        publication_paragraph = paragraph(item, "publication", emphasize=True)
        note = publication.get("contributionNote")
        publication_paragraph.keepWithNext = bool(note)
        if not note:
            publication_paragraph.spaceAfter = 12
        story.append(publication_paragraph)
        if note:
            story.append(paragraph(note, "publication_note"))

    blocks = []
    for item in sections["Research Experience"]:
        if item.startswith("Research:"):
            blocks.append([item])
        else:
            blocks[-1].append(item)
    if len(blocks) != 4:
        raise ValueError("Expected four research experiences in the source CV.")
    for offset in (0, 2):
        story.append(PageBreak())
        section("Research Experience" if offset == 0 else "Research Experience / Continued")
        for block in blocks[offset:offset + 2]:
            research_block(block)

    story.append(PageBreak())
    for source_heading, display_heading in (
        ("Project Experience", "Project Experience"),
        ("Summer Camp (Excellent Camper/Early Admission)", "Summer Camps & Early Admission"),
        ("Selected Honors & Awards", "Selected Honors & Awards"),
        ("Leadership/Work Experience", "Leadership & Work Experience"),
        ("Other Qualifications", "Other Qualifications"),
    ):
        section(display_heading)
        for item in sections[source_heading]:
            story.append(paragraph(item))
    output.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(output), pagesize=A4, rightMargin=48, leftMargin=48,
        topMargin=38, bottomMargin=57, title="Yirong Qiang - Curriculum Vitae",
        author="Yirong Qiang", subject="Education, publications, research, and experience",
    )
    document.build(story, canvasmaker=NumberedCanvas)
    print(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the public, phone-free CV from the private source document.")
    parser.add_argument("--source", type=Path, default=ROOT / "CV.docx")
    parser.add_argument("--output", type=Path, default=ROOT / "tmp" / "cv" / "Yirong-Qiang-CV-generated.pdf")
    parser.add_argument("--font-dir", type=Path, default=Path("C:/Windows/Fonts"))
    arguments = parser.parse_args()
    build(arguments.source, arguments.output, arguments.font_dir)
