"""Savoldan modda raqami va kodeksni ajratib olish.

- O'zbekcha son so'zlari -> raqam: "ikki yuz o'n yettinchi moddasi" -> "217-moddasi"
- Kodeks nomi -> qisqartma: "Jinoyat kodeksi" -> JK
"""
import re

UNITS = {"bir": 1, "ikki": 2, "uch": 3, "tort": 4, "besh": 5, "olti": 6, "yetti": 7, "sakkiz": 8, "toqqiz": 9}
TENS = {"on": 10, "yigirma": 20, "ottiz": 30, "qirq": 40, "ellik": 50, "oltmish": 60, "yetmish": 70, "sakson": 80, "toqson": 90}
ORD_SUFFIX = ("inchisi", "inchi", "nchisi", "nchi", "ning", "ta")

# Tartib muhim: uzunroq/aniqroq nomlar oldin
CODE_NAMES = [
    ("JPK", r"jinoyat[\s-]*protsessual"),
    ("FPK", r"fuqarolik[\s-]*protsessual"),
    ("MSPK", r"ma.?muriy\s+sud"),
    ("MJTK", r"ma.?muriy\s+javobgarlik"),
    ("JIK", r"jinoyat[\s-]*ijroiya"),
    ("JK", r"jinoyat\s+kodeks"),
    ("FK", r"fuqarolik\s+kodeks"),
    ("MK", r"mehnat\s+kodeks"),
    ("OK", r"oila\s+kodeks"),
    ("SK", r"soliq\s+kodeks"),
    ("UJK", r"uy[\s-]*joy\s+kodeks"),
    ("YK", r"yer\s+kodeks"),
    ("KONST", r"konstitutsiya"),
    # rus tilidagi nomlar (kirill -> lotin norm() dan keyin)
    ("JPK", r"ugolovno[\s-]*protsessual"),
    ("FPK", r"grajdansk\w*[\s-]*protsessual"),
    ("MJTK", r"administrativn\w*\s+otvetstvennost|koao"),
    ("JK", r"ugolovn\w*\s+kodeks"),
    ("FK", r"grajdansk\w*\s+kodeks"),
    ("MK", r"trudov\w*\s+kodeks"),
    ("OK", r"semeyn\w*\s+kodeks"),
    ("SK", r"nalogov\w*\s+kodeks"),
]
RU_ABBR = {"uk": "JK", "upk": "JPK", "gpk": "FPK", "gk": "FK", "tk": "MK", "nk": "SK", "koao": "MJTK"}
ABBR = {"jk", "mjtk", "fk", "fpk", "jpk", "mk", "ok", "sk", "mspk", "jik", "ujk", "yk"}


def norm(text: str) -> str:
    t = text.lower()
    t = t.replace("ş", "sh").replace("ç", "ch").replace("ö", "o").replace("ğ", "g")
    t = re.sub(r"[ʻʼ‘’`´']", "", t)
    cyr = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts","ч":"ch","ш":"sh","ъ":"","ь":"","э":"e","ю":"yu","я":"ya","ў":"o","қ":"q","ғ":"g","ҳ":"h","ы":"i","щ":"sh"}
    return "".join(cyr.get(c, c) for c in t)


def _word_value(w: str):
    for suf in ORD_SUFFIX:
        if w.endswith(suf) and len(w) > len(suf) + 1:
            base = w[: -len(suf)]
            v = _base_value(base) or _base_value(base + "i")
            if v is not None:
                return v
    return _base_value(w)


def _base_value(w: str):
    if w in UNITS:
        return ("u", UNITS[w])
    if w in TENS:
        return ("t", TENS[w])
    if w == "yuz":
        return ("h", 100)
    if w == "ming":
        return ("k", 1000)
    return None


def words_to_digits(text: str) -> str:
    """Normallashtirilgan matndagi son so'zlarini raqamga aylantiradi."""
    tokens = re.findall(r"\d+|[a-z]+|[^a-z\d]+", text)
    out, run = [], []

    def flush():
        if not run:
            return
        total, cur = 0, 0
        for kind, v in run:
            if kind == "k":
                total += max(cur, 1) * 1000
                cur = 0
            elif kind == "h":
                cur = max(cur, 1) * 100
            else:
                cur += v
        out.append(str(total + cur))
        run.clear()

    for tok in tokens:
        if tok.isalpha():
            v = _word_value(tok)
            if v:
                run.append(v)
                continue
        if run and tok.strip() == "":
            continue  # son so'zlari orasidagi bo'shliq
        flush()
        out.append(tok)
    flush()
    return re.sub(r"(\d)(?=[a-z])", r"\1 ", "".join(out))


def detect_code(text_norm: str) -> str:
    for code, rx in CODE_NAMES:
        if re.search(rx, text_norm):
            return code
    for w in re.findall(r"[a-z]+", text_norm):
        if w in ABBR:
            return w.upper()
        if w in RU_ABBR:
            return RU_ABBR[w]
    return ""


REF = re.compile(r"(\d+(?:-\d+)?)\s*-?\s*(?:chi\s+|inchi\s+|nchi\s+)?modda")
REF2 = re.compile(r"modda\w*\s*(?:raqami\s*)?(\d+(?:-\d+)?)")


RU_REF = re.compile(r"(?:\bstat(?:ya|yu|i|ye|e|yam|yax|yey)\b|\bst\.)\s*(?:n|№)?\s*(\d+(?:-\d+)?)|(\d+(?:-\d+)?)\s*-?\s*(?:ya|aya|oy)?\s*stat(?:ya|yu|i|ye|e)\b")


def parse_ref(text: str):
    """(kod, raqam) yoki None."""
    t = words_to_digits(norm(text))
    rm = RU_REF.search(t)
    if rm:
        return detect_code(t), rm.group(1) or rm.group(2)
    m = REF.search(t) or REF2.search(t)
    if not m:
        m2 = re.search(r"\b(" + "|".join(sorted(ABBR, key=len, reverse=True)) + r")\s*(\d+(?:-\d+)?)\b", t)
        if m2:
            return m2.group(1).upper(), m2.group(2)
        return None
    return detect_code(t), m.group(1)
