"""lex.uz dan hujjatni (kodeks, qonun, qaror) bo'lim -> bob -> modda tuzilmasi bilan yuklash.

Bitta hujjat:
  python backend/scrape_lex.py https://lex.uz/uz/docs/-111453 JK
  python backend/scrape_lex.py <lex.uz havola> <QISQA_KOD> [tur]
     tur: kodeks | konst | orq | pf | pq | vmq | boshqa  (berilmasa sarlavhadan aniqlanadi)

Katalogdagi hammasi (data/catalog.json):
  python backend/scrape_lex.py --hammasi
"""
import json
import re
import sys
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import ARTICLES_FILE, DOCS_FILE, DATA_DIR

MODDA = re.compile(r"^\s*(\d+(?:[¹²³⁴⁵⁶⁷⁸⁹⁰]+|-\d+)?)\s*-\s*(?:modda|модда)\.?\s*(.*)$", re.I)
BOB = re.compile(r"^\s*\d+(?:[¹²³⁴⁵⁶⁷⁸⁹⁰]+|-\d+)?\s*-\s*(?:bob|боб)\b", re.I)
BOLIM = re.compile(r"(bo.?lim|бўлим|БЎЛИМ)", re.I)
BAND = re.compile(r"^\s*(\d+)\.\s+\S")
DATE = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})")


def fetch(url):
    r = httpx.get(url, timeout=90, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.text


def guess_type(title):
    t = title.lower()
    if "konstitutsiya" in t and "kodeks" not in t:
        return "konst"
    if "kodeks" in t:
        return "kodeks"
    if re.search(r"\bpf-|farmon", t):
        return "pf"
    if re.search(r"\bpq-|prezident.*qaror", t):
        return "pq"
    if "vazirlar mahkamasi" in t or "vmq" in t:
        return "vmq"
    if "o‘rq" in t or "o'rq" in t or "orq-" in t or "qonun" in t:
        return "orq"
    return "boshqa"


def meta(soup, url):
    raw = (soup.title.get_text(" ", strip=True) if soup.title else "").replace("\xa0", " ").strip()
    m = DATE.search(raw)
    date = f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else ""
    title = raw
    if m:
        title = raw[m.end():].strip(" .")
    head = soup.find("div", class_="ACT_TITLE")
    if (not title or len(title) < 8) and head and head.get_text(strip=True):
        title = head.get_text(" ", strip=True)
        title = title[0] + title[1:].lower() if title.isupper() else title
    return {"title": title or url, "date": date, "raw_title": raw}


def parse(html, short, url):
    soup = BeautifulSoup(html, "html.parser")
    info = meta(soup, url)
    arts, cur, bolim, bob, order = [], None, "", "", 0
    blocks = soup.find_all("div", class_=["TEXT_HEADER_DEFAULT", "CLAUSE_DEFAULT", "ACT_TEXT", "CHANGES_ORIGINS", "TEXT_CENTER"])
    for b in blocks:
        cls = b.get("class", [])
        txt = b.get_text(" ", strip=True)
        if not txt or "CHANGES_ORIGINS" in cls:
            continue
        if "TEXT_HEADER_DEFAULT" in cls or ("TEXT_CENTER" in cls and len(txt) < 160):
            if BOB.match(txt):
                bob = txt
            elif BOLIM.search(txt) and len(txt) < 160:
                bolim, bob = txt, ""
            continue
        if "CLAUSE_DEFAULT" in cls:
            m = MODDA.match(txt)
            if m:
                if cur:
                    arts.append(cur)
                order += 1
                cur = {"id": f"{short}-{m.group(1)}", "doc": short, "number": m.group(1), "title": m.group(2).strip(" .") or f"{m.group(1)}-modda",
                       "text": "", "bolim": bolim, "bob": bob, "order": order, "url": url}
            continue
        if "ACT_TEXT" in cls:
            if cur is None:  # moddasiz hujjat (qaror): raqamli bandlar
                m = BAND.match(txt)
                if not m:
                    continue
                order += 1
                cur = {"id": f"{short}-{m.group(1)}", "doc": short, "number": m.group(1), "title": f"{m.group(1)}-band",
                       "text": "", "bolim": bolim, "bob": bob, "order": order, "url": url, "band": True}
            elif cur.get("band"):
                m = BAND.match(txt)
                if m and m.group(1) != cur["number"]:
                    arts.append(cur)
                    order += 1
                    cur = {"id": f"{short}-{m.group(1)}", "doc": short, "number": m.group(1), "title": f"{m.group(1)}-band",
                           "text": "", "bolim": bolim, "bob": bob, "order": order, "url": url, "band": True}
            if len(cur["text"]) < 12000:
                cur["text"] += txt + "\n"
    if cur:
        arts.append(cur)
    if len(arts) < 3:
        arts = parse_text(soup, short, url)
    seen, out = set(), []
    for a in arts:  # takrorlarni olib tashlash
        if a["id"] not in seen and a["text"].strip():
            seen.add(a["id"])
            out.append(a)
    return info, out


SKIP = re.compile(r"(tahririda|tahrirda|qo.?shilgan|chiqarilgan|редакция|киритилган)", re.I)


def parse_text(soup, short, url):
    """Zaxira: sahifa matnini qatorlarga bo'lib, bo'lim/bob/modda sarlavhalarini topadi."""
    for t in soup(["script", "style", "nav", "header", "footer", "noscript"]):
        t.decompose()
    lines = [l.strip() for l in soup.get_text("\n").split("\n")]
    arts, cur, bolim, bob, order = [], None, "", "", 0
    for line in lines:
        if not line:
            continue
        if len(line) < 160 and BOB.match(line):
            bob = line
            continue
        if len(line) < 120 and BOLIM.search(line) and line.upper() == line:
            bolim, bob = line, ""
            continue
        m = MODDA.match(line)
        if m and len(line) < 260:
            if cur:
                arts.append(cur)
            order += 1
            cur = {"id": f"{short}-{m.group(1)}", "doc": short, "number": m.group(1), "title": m.group(2).strip(" .") or f"{m.group(1)}-modda",
                   "text": "", "bolim": bolim, "bob": bob, "order": order, "url": url}
            continue
        if cur and len(cur["text"]) < 12000:
            if line.startswith("(") and SKIP.search(line):
                continue
            cur["text"] += line + "\n"
    if cur:
        arts.append(cur)
    # mundarija va asosiy matnda takrorlansa — matni uzunini qoldiramiz
    best = {}
    for a in arts:
        if a["id"] not in best or len(a["text"]) > len(best[a["id"]]["text"]):
            best[a["id"]] = a
    return sorted(best.values(), key=lambda a: a["order"])


def save(short, info, arts, typ, url, soha=""):
    keep = []
    if ARTICLES_FILE.exists():
        for line in ARTICLES_FILE.read_text(encoding="utf-8").splitlines():
            if line.strip():
                a = json.loads(line)
                if a.get("doc", a["id"].split("-")[0]) != short:
                    keep.append(a)
    for a in arts:
        a["code"] = info["title"]
    with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
        for a in keep + arts:
            f.write(json.dumps(a, ensure_ascii=False) + "\n")
    docs = json.loads(DOCS_FILE.read_text(encoding="utf-8")) if DOCS_FILE.exists() else []
    docs = [d for d in docs if d["short"] != short]
    docs.append({"short": short, "title": info["title"], "type": typ or guess_type(info["raw_title"] or info["title"]),
                 "date": info["date"], "url": url, "soha": soha})
    DOCS_FILE.write_text(json.dumps(docs, ensure_ascii=False, indent=1), encoding="utf-8")


def variants(url):
    m = re.search(r"(-?\d{4,})", url)
    if not m:
        return [url]
    n = m.group(1).lstrip("-")
    out = [url]
    for i in (f"-{n}", n):
        for v in (f"https://lex.uz/uz/docs/{i}", f"https://lex.uz/docs/{i}", f"https://lex.uz/uz/acts/{i}", f"https://lex.uz/acts/{i}", f"https://lex.uz/m/acts/{i}"):
            if v not in out:
                out.append(v)
    return out


def one(url, short, typ="", soha=""):
    print(f"Yuklanmoqda: {short}  {url}")
    info, arts, last = None, [], ""
    for u in variants(url):
        try:
            html = fetch(u)
        except Exception as e:
            print(f"  - {u}: {e}")
            continue
        last = html
        info, arts = parse(html, short, url)
        if len(arts) >= 3:
            if u != url:
                print(f"  (manba: {u})")
            break
    if len(arts) < 3:
        dbg = DATA_DIR / f"_debug_{short}.html"
        dbg.write_text(last or "", encoding="utf-8")
        print(f"  ! Modda topilmadi. Sahifa saqlandi: {dbg}  (shu faylni yuboring)")
        return
    save(short, info, arts, typ, url, soha)
    boblar = len({a["bob"] for a in arts if a["bob"]})
    print(f"  OK: {info['title'][:70]} | {info['date']} | {len(arts)} ta modda, {boblar} ta bob")


def main():
    args = sys.argv[1:]
    if args[:1] == ["--hammasi"]:
        for c in json.loads((DATA_DIR / "catalog.json").read_text(encoding="utf-8")):
            try:
                one(c["url"], c["short"], c.get("type", ""), c.get("soha", ""))
            except Exception as e:
                print("  XATO:", e)
        return
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)
    one(args[0], args[1].upper(), args[2] if len(args) > 2 else "")


if __name__ == "__main__":
    main()
