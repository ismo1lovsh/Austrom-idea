"""Ilova tili: uz (yangi lotin), uzc (özbek kirill), ru (rus).

- So'rov tili `X-Lang` sarlavhasidan olinadi va LANG kontekst o'zgaruvchisida turadi.
- uzc: matn kirill yozuviga o'giriladi (lotin <-> kirill, AI kerak emas).
- ru: AI javoblari to'g'ridan-to'g'ri rus tilida yoziladi; qolgan o'zbekcha matnlar
  (ma'lumotlar, qonun matni, xato xabarlari) Claude bilan tarjima qilinib, data/tr_ru.json da saqlanadi.
"""
import contextvars
import json
import re
import threading
from concurrent.futures import ThreadPoolExecutor

import config
from alifbo import yangi

LANGS = ("uz", "uzc", "ru")
LANG = contextvars.ContextVar("LANG", default="uz")


def cur() -> str:
    return LANG.get()


def parse(header: str) -> str:
    h = (header or "").strip().lower()
    return h if h in LANGS else "uz"


# ---------------- lotin -> kirill ----------------
_APOS = "'ʻʼ‘’`´"
_V = set("aeiouöAEIOUÖ")
_MAP1 = {"a": "а", "b": "б", "c": "с", "d": "д", "e": "е", "f": "ф", "g": "г", "h": "ҳ", "i": "и", "j": "ж", "k": "к", "l": "л",
         "m": "м", "n": "н", "o": "о", "p": "п", "q": "қ", "r": "р", "s": "с", "t": "т", "u": "у", "v": "в", "w": "в", "x": "х",
         "y": "й", "z": "з", "ş": "ш", "ç": "ч", "ö": "ў", "ğ": "ғ"}
_KEEP = re.compile(r"https?://\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:uz|com|org|net|ru|gov)\b[\w/.-]*|\b(?:AI|OneID|Word|PDF|VoiceLab|Click|Payme|Pro|Premium|PWA|UzTR|Study in Uzbekistan|Claude)\b")


def _word_cyr(w: str) -> str:
    out, i, n = [], 0, len(w)
    allcap = w.isupper() and len(w) > 1
    while i < n:
        c, lc = w[i], w[i].lower()
        nx = w[i + 1] if i + 1 < n else ""
        up = c.isupper()

        def put(s, two=False):
            if up and (allcap or two and nx.isupper()):
                out.append(s.upper())
            elif up:
                out.append(s[0].upper() + s[1:])
            else:
                out.append(s)

        pair = lc + nx.lower()
        if lc in "og" and nx and nx in _APOS:
            put("ў" if lc == "o" else "ғ"); i += 2; continue
        if pair in ("sh", "ch"):
            put("ш" if pair == "sh" else "ч", True); i += 2; continue
        if pair in ("yo", "yu", "ya", "ye") and not (pair == "yo" and i + 2 < n and w[i + 2] in _APOS):
            put({"yo": "ё", "yu": "ю", "ya": "я", "ye": "е"}[pair], True); i += 2; continue
        if pair == "ts" and re.match(r"i[aoyu]", w[i + 2:i + 4].lower() or ""):
            put("ц", True); i += 2; continue
        if c in _APOS:
            out.append("ъ" if out else ""); i += 1; continue
        if lc == "e":
            prev = w[i - 1] if i else ""
            put("э" if (not prev or not prev.isalpha()) else "е"); i += 1; continue
        if lc in _MAP1:
            put(_MAP1[lc]); i += 1; continue
        out.append(c); i += 1
    return "".join(out)


def cyr(text: str) -> str:
    if not text or not isinstance(text, str):
        return text
    parts, last = [], 0
    for m in _KEEP.finditer(text):
        parts.append(_cyr_plain(text[last:m.start()]))
        parts.append(m.group(0))
        last = m.end()
    parts.append(_cyr_plain(text[last:]))
    return "".join(parts)


def _cyr_plain(s):
    return re.sub(r"[A-Za-zşçöğŞÇÖĞ" + _APOS + r"]+", lambda m: _word_cyr(m.group(0)), s)


# ---------------- kirill -> lotin (foydalanuvchi kirillda yozsa) ----------------
_C2L = {"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k",
        "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "ts",
        "ч": "ç", "ш": "ş", "ъ": "'", "ь": "", "э": "e", "ю": "yu", "я": "ya", "ў": "ö", "қ": "q", "ғ": "ğ", "ҳ": "h", "ы": "i", "щ": "ş"}
_UZ_ONLY = re.compile(r"[ўқғҳЎҚҒҲ]")


def lat(text: str) -> str:
    """Özbek kirill -> yangi lotin. Rus matniga tegmaydi (faqat uzc rejimida çaqiriladi)."""
    if not text:
        return text
    out = []
    for i, ch in enumerate(text):
        lo = ch.lower()
        if lo == "е" and (i == 0 or not text[i - 1].isalpha()):
            r = "ye"
        else:
            r = _C2L.get(lo)
        if r is None:
            out.append(ch)
            continue
        if ch.isupper() and r:
            nxt = text[i + 1] if i + 1 < len(text) else ""
            r = r.upper() if nxt.isupper() else r[0].upper() + r[1:]
        out.append(r)
    return "".join(out)


def has_cyr(s: str) -> bool:
    return bool(re.search(r"[А-Яа-яЁёЎўҚқҒғҲҳ]", s or ""))


def to_input(text: str) -> str:
    """Foydalanuvçi yozgan matnni qidiruv uçun tayyorlaydi: özbek kirill -> lotin."""
    if cur() == "uzc" and has_cyr(text):
        return lat(text)
    return text


# ---------------- rus tiliga tarjima (kesh bilan) ----------------
_LOCK = threading.Lock()
_CACHE = None
CACHE_FILE = config.DATA_DIR / "tr_ru.json"
SEED_FILE = config.DATA_DIR / "tr_ru_seed.json"
SEED_SRC = ("drafts.json", "rights.json", "organs.json", "scenarios.json", "ariza_shablonlar.json", "docs.json")


def ck(s: str) -> str:
    s = yangi(s or "")
    s = re.sub(r"[ʻʼ‘’`´]", "'", s)
    return re.sub(r"\s+", " ", s).strip()


def _strings(o, out, skip):
    if isinstance(o, dict):
        for k, v in o.items():
            if k not in skip:
                _strings(v, out, skip)
    elif isinstance(o, list):
        for v in o:
            _strings(v, out, skip)
    elif isinstance(o, str) and wants(o):
        out.append(o)


def _seed_strings(o, out):
    """tr_ru_seed.json tartibi aynan şu yuriş tartibiga mos (özgartirmang)."""
    if isinstance(o, dict):
        for k, v in o.items():
            if k not in SEED_SKIP:
                _seed_strings(v, out)
    elif isinstance(o, list):
        for v in o:
            _seed_strings(v, out)
    elif isinstance(o, str):
        if re.search(r"[A-Za-zÀ-ž]{2}", o) and not re.match(r"^(https?://|static/)", o):
            out.append(o)


def _load():
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    c = {}
    if CACHE_FILE.exists():
        try:
            c = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            c = {}
    # Statik ma'lumotlar uçun tayyor tarjimalar (AI siz ham işlaydi)
    if SEED_FILE.exists():
        try:
            seed = json.loads(SEED_FILE.read_text(encoding="utf-8"))
            src = []
            for f in SEED_SRC:
                p = config.DATA_DIR / f
                if p.exists():
                    _seed_strings(json.loads(p.read_text(encoding="utf-8")), src)
            uniq = list(dict.fromkeys(src))
            for a, b in zip(uniq, seed):
                c.setdefault(ck(a), b)
        except Exception:
            pass
    for a, b in STATIC.items():
        c.setdefault(ck(a), b)
    _CACHE = c
    return c


def _save():
    try:
        CACHE_FILE.write_text(json.dumps(_CACHE, ensure_ascii=False, indent=0), encoding="utf-8")
    except Exception:
        pass


SEED_SKIP = {"id", "url", "video", "short", "type", "doc", "number", "belgi", "kalit", "holat", "joylangan", "tugash", "kuchga",
             "modda", "keyingi", "manba", "sorov", "date", "kod", "idora_id", "saralash", "kanal"}
STATIC = {"Pro": "Pro", "Premium": "Premium", "Bepul": "Бесплатный", "ARIZA": "ЗАЯВЛЕНИЕ", "Ariza": "Заявление",
          "Konstitutsiya": "Конституция", "Kodekslar": "Кодексы", "Özbekiston Respublikasi Qonunlari": "Законы Республики Узбекистан",
          "Prezident farmonlari": "Указы Президента", "Prezident qarorlari": "Постановления Президента",
          "Vazirlar Mahkamasi qarorlari": "Постановления Кабинета Министров", "Boşqa hujjatlar": "Другие документы",
          "Tayyorlangan": "Подготовлено", "Demo": "Демо", "Not Found": "Не найдено",
          "Tizimga kiring": "Войдите в систему",
          "Kunlik limit tugadi. Profil böliminda qöşimça limit oling yoki tarifni oşiring.": "Дневной лимит исчерпан. Купите дополнительный лимит в профиле или повысьте тариф.",
          "Bepul tarifda oyiga 3 ta hujjat. Pro tarifda cheksiz.": "На бесплатном тарифе — 3 документа в месяц. На Pro — без ограничений.",
          "Holatni batafsilroq yozing": "Опишите ситуацию подробнее", "Ovoz eşitilmadi, qaytadan gapiring": "Голос не расслышан, повторите ещё раз",
          "Bu masala hujjatda mavjud emas.": "Этого вопроса в документе нет.", "Hujjat topilmadi": "Документ не найден", "Modda topilmadi": "Статья не найдена",
          "Suhbat topilmadi": "Диалог не найден", "Loyiha topilmadi": "Проект не найден", "Tarif topilmadi": "Тариф не найден", "Paket topilmadi": "Пакет не найден",
          "Savol bo'sh": "Пустой вопрос", "Modda raqamini yozing, masalan: MJTK 227": "Укажите номер статьи, например: КоАО 227",
          "Kuniga 30 kredit": "30 кредитов в день", "AI maslahat va qonunlar bazasi": "Консультации ИИ и база законов", "Oyiga 3 ta hujjat": "3 документа в месяц",
          "Kuniga 300 kredit": "300 кредитов в день", "Cheksiz hujjat (Word)": "Безлимитные документы (Word)", "Ovozli javoblar": "Голосовые ответы",
          "Video tushuntiriş": "Видеообъяснения", "Chat tarixi": "История чатов", "Kuniga 1000 kredit": "1000 кредитов в день",
          "Pro dagi hamma imkoniyatlar": "Все возможности Pro", "Yangi qonunlar böyiça şaxsiy bildirişnoma": "Персональные уведомления о новых законах",
          "Ustuvor (tezkor) javob": "Приоритетный (быстрый) ответ", "Advokat bilan bog'lanish (demo)": "Связь с адвокатом (демо)", "Oila uçun 3 ta akkaunt": "3 аккаунта для семьи",
          "Bir harakat — tört xil jazo": "Одно действие — четыре разных наказания", "Olib qöyiş va tintuv": "Выемка и обыск",
          "Çegaradan bojsiz olib kiriş normalari": "Нормы беспошлинного ввоза через границу"}

_CODE = re.compile(r"^[A-Z]{1,6}(?:[-\s]?[\d.-]+)*$|^[A-Z]+-[\w-]+$")


def wants(s: str) -> bool:
    """Bu satrni rus tiliga ögiriş kerakmi?"""
    if not isinstance(s, str) or len(s) < 2 or has_cyr(s):
        return False
    if not re.search(r"[A-Za-zşçöğŞÇÖĞ]{2}", s):
        return False
    if re.match(r"^(https?://|static/|/)", s) or re.match(r"^[\w.-]+\.(uz|com|org|ru|gov)\b", s):
        return False
    if re.match(r"^\d{4}-\d{2}-\d{2}", s) or _CODE.match(s.strip()):
        return False
    return True


def _batches(items, max_chars=5000, max_n=40):
    b, size = [], 0
    for s in items:
        if b and (size + len(s) > max_chars or len(b) >= max_n):
            yield b
            b, size = [], 0
        b.append(s)
        size += len(s)
    if b:
        yield b


def _translate_batch(batch):
    from llm import translate_ru
    res = translate_ru(batch)
    if len(res) != len(batch):
        raise RuntimeError("tarjima soni mos emas")
    return res


def ru_many(strings):
    """Röyxatni tarjima qiladi (keşdan yoki Claude orqali). Xato bölsa — asl matn."""
    c = _load()
    todo = list(dict.fromkeys(s for s in strings if ck(s) not in c))
    if todo and not config.MOCK:
        batches = list(_batches(todo))
        with ThreadPoolExecutor(max_workers=6) as ex:
            for b, res in zip(batches, ex.map(_safe_batch, batches)):
                if res:
                    with _LOCK:
                        for a, r in zip(b, res):
                            if r and r.strip():
                                c[ck(a)] = r
        with _LOCK:
            _save()
    return [c.get(ck(s), s) for s in strings]


def _safe_batch(b):
    try:
        return _translate_batch(b)
    except Exception:
        if len(b) > 1:  # yarmiga bölib qayta urinamiz
            h = len(b) // 2
            return (_safe_batch(b[:h]) or b[:h]) + (_safe_batch(b[h:]) or b[h:])
        return None


def ru(s: str) -> str:
    return ru_many([s])[0] if wants(s) else s


# Javobda tarjima qilinmaydigan texnik maydonlar
SKIP = {"id", "url", "short", "type", "doc", "number", "belgi", "kalit", "holat", "key", "kod", "idora_id", "token", "pinfl", "tarif",
        "date", "joylangan", "tugash", "kuchga", "created", "updated", "reset", "tarif_tugash", "keyingi", "uslub", "tur", "question",
        "text", "transcript", "chat_id", "parcha", "bolim_id", "role", "manba", "saralash", "numbers", "model", "kanal", "idlar",
        "sorovlar", "kodekslar", "bob_key", "mock", "stt", "tts", "fio", "sorov"}


def tr_obj(o):
    """JSON obyektidagi barça özbekça satrlarni rus tiliga ögiradi."""
    found = []
    _strings(o, found, SKIP)
    if not found:
        return o
    uniq = list(dict.fromkeys(found))
    m = dict(zip(uniq, ru_many(uniq)))

    def rep(x, k=None):
        if k in SKIP:
            return x
        if isinstance(x, dict):
            return {kk: rep(v, kk) for kk, v in x.items()}
        if isinstance(x, list):
            return [rep(v, k) for v in x]
        if isinstance(x, str):
            return m.get(x, x)
        return x
    return rep(o)


def cyr_obj(o, skip=frozenset({"url", "id", "short", "doc", "kod", "number"})):
    if isinstance(o, dict):
        return {k: (v if k in skip else cyr_obj(v, skip)) for k, v in o.items()}
    if isinstance(o, list):
        return [cyr_obj(v, skip) for v in o]
    if isinstance(o, str):
        return cyr(o)
    return o
