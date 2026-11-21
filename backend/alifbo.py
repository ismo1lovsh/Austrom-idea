"""Eski lotin yozuvi <-> yangi alifbo (ş, ç, ö, ğ)."""
import re

_APOS = "[ʻʼ‘’`´']"
_TO_NEW = [
    (re.compile(r"O" + _APOS), "Ö"), (re.compile(r"o" + _APOS), "ö"),
    (re.compile(r"G" + _APOS), "Ğ"), (re.compile(r"g" + _APOS), "ğ"),
    (re.compile(r"SH"), "Ş"), (re.compile(r"Sh"), "Ş"), (re.compile(r"sh"), "ş"),
    (re.compile(r"CH"), "Ç"), (re.compile(r"Ch"), "Ç"), (re.compile(r"ch"), "ç"),
]
_URL = re.compile(r"https?://\S+")


def yangi(text: str) -> str:
    """Matnni yangi alifboga o'tkazadi (havolalarga tegmaydi)."""
    if not text:
        return text
    parts, last = [], 0
    for m in _URL.finditer(text):
        parts.append(_conv(text[last:m.start()]))
        parts.append(m.group(0))
        last = m.end()
    parts.append(_conv(text[last:]))
    return "".join(parts)


def _conv(s: str) -> str:
    for rx, rep in _TO_NEW:
        s = rx.sub(rep, s)
    return s


def eski(text: str) -> str:
    """Ovoz (TTS) uchun: yangi harflarni an'anaviy yozuvga qaytaradi."""
    table = {"ş": "sh", "Ş": "Sh", "ç": "ch", "Ç": "Ch", "ö": "o'", "Ö": "O'", "ğ": "g'", "Ğ": "G'"}
    return "".join(table.get(ch, ch) for ch in text)
