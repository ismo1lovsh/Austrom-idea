"""Hujjatni Word (.docx) ko'rinishida yaratish."""
import io
from datetime import date
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt
from alifbo import eski

FONT = "Times New Roman"


def _p(doc, text="", *, align=None, bold=False, size=14, indent=False, before=0, after=6, left=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before, pf.space_after = Pt(before), Pt(after)
    pf.line_spacing = 1.15
    if align is not None:
        p.alignment = align
    if indent:
        pf.first_line_indent = Cm(1.25)
    if left is not None:
        pf.left_indent = Cm(left)
    r = p.add_run(text)
    r.bold, r.font.size, r.font.name = bold, Pt(size), FONT
    return p


def _ariza(doc, h, t):
    """Namuna (bildirgi) shakli: o'ng yuqorida adresat, o'rtada sarlavha, pastda imzo qatori."""
    lines = h.get("kimga", []) + h.get("kimdan", [])
    for i, line in enumerate(lines):
        _p(doc, t(line), left=9.0, after=0, bold=True, size=14)
    _p(doc, t(h.get("sarlavha", "ARIZA")).upper(), align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, before=18, after=10)
    for para in h.get("matn", []):
        p = _p(doc, t(para), align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True, after=2)
        p.paragraph_format.line_spacing = 1.0
    req = h.get("soraymiz") or []
    for i, item in enumerate(req, 1):
        _p(doc, f"{i}. {t(item)}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True, after=2)
    ilova = h.get("ilovalar") or []
    if ilova:
        _p(doc, t("Ilovalar:"), bold=True, before=8, after=2)
        for i, item in enumerate(ilova, 1):
            _p(doc, f"{i}. {t(item)}", after=0, left=0.6)
    _p(doc, "", after=18)
    imzo = h.get("imzo") or ["Arizachi", ""]
    tbl = doc.add_table(rows=1, cols=2)
    c1, c2 = tbl.rows[0].cells
    c1.width, c2.width = Cm(8.25), Cm(8.25)
    r = c1.paragraphs[0].add_run(t(imzo[0]))
    r.bold, r.font.name, r.font.size = True, FONT, Pt(14)
    c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = c2.paragraphs[0].add_run(t(imzo[1] if len(imzo) > 1 else ""))
    r.bold, r.font.name, r.font.size = True, FONT, Pt(14)


def build_docx(h: dict, old_script: bool = False) -> bytes:
    """h: {kimga[], kimdan[], sarlavha, matn[], soraymiz[], ilovalar[]}"""
    t = eski if old_script else (lambda s: s)
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    sec.left_margin, sec.right_margin = Cm(3.0), Cm(1.5)
    sec.top_margin = sec.bottom_margin = Cm(2.0)
    st = doc.styles["Normal"]
    st.font.name, st.font.size = FONT, Pt(14)
    if h.get("uslub") == "ariza":
        _ariza(doc, h, t)
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()

    for line in h.get("kimga", []):
        _p(doc, t(line), left=9.0, after=0, bold=True)
    _p(doc, "", after=4)
    for line in h.get("kimdan", []):
        _p(doc, t(line), left=9.0, after=0)

    _p(doc, t(h.get("sarlavha", "ARIZA")).upper(), align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, before=24, after=14)
    for para in h.get("matn", []):
        _p(doc, t(para), align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True)

    req = h.get("soraymiz") or h.get("soraymiz") or []
    if req:
        _p(doc, t("Yuqoridagilarni inobatga olib, SÖRAYMAN:"), align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, before=10, after=6)
        for i, item in enumerate(req, 1):
            _p(doc, f"{i}. {t(item)}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True)

    ilova = h.get("ilovalar") or []
    if ilova:
        _p(doc, t("Ilovalar:"), bold=True, before=10, after=2)
        for i, item in enumerate(ilova, 1):
            _p(doc, f"{i}. {t(item)}", after=0, left=0.6)

    tbl = doc.add_table(rows=1, cols=2)
    tbl.autofit = True
    c1, c2 = tbl.rows[0].cells
    c1.width, c2.width = Cm(8.25), Cm(8.25)
    r = c1.paragraphs[0].add_run(f"«____» ____________ {date.today().year} y.")
    r.font.name, r.font.size = FONT, Pt(14)
    c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = c2.paragraphs[0].add_run(t("Imzo: ______________"))
    r.font.name, r.font.size = FONT, Pt(14)
    doc.paragraphs[-1].paragraph_format.space_after = Pt(24)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
