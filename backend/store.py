"""SQLite: foydalanuvchilar, kredit limiti, chatlar, arizalar, ko'rilgan loyihalar."""
import json
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone

import config

_lock = threading.Lock()
TZ = timezone(timedelta(hours=config.TZ_OFFSET_HOURS))


def _db():
    con = sqlite3.connect(config.DB_FILE, check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con


def init():
    with _lock, _db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, token TEXT UNIQUE, fio TEXT, pinfl TEXT,
            tariff TEXT DEFAULT 'free', tariff_until TEXT, extra INTEGER DEFAULT 0, used INTEGER DEFAULT 0,
            day TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS chats(id INTEGER PRIMARY KEY, user INTEGER, title TEXT, updated TEXT);
        CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, chat INTEGER, role TEXT, content TEXT, ts TEXT);
        CREATE TABLE IF NOT EXISTS arizalar(id INTEGER PRIMARY KEY, user INTEGER, turi TEXT, idora TEXT,
            hujjat TEXT, holat TEXT, created TEXT);
        CREATE TABLE IF NOT EXISTS seen(user INTEGER, draft TEXT, PRIMARY KEY(user, draft));
        CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY, user INTEGER, tur TEXT, summa INTEGER, ts TEXT);
        """)


def now():
    return datetime.now(TZ)


def today():
    return now().strftime("%Y-%m-%d")


# ---------- foydalanuvchi ----------
def login(fio: str, pinfl: str):
    token = secrets.token_urlsafe(24)
    with _lock, _db() as c:
        row = c.execute("SELECT id FROM users WHERE pinfl=?", (pinfl,)).fetchone()
        if row:
            c.execute("UPDATE users SET token=?, fio=? WHERE id=?", (token, fio, row["id"]))
        else:
            c.execute("INSERT INTO users(token,fio,pinfl,day,created) VALUES(?,?,?,?,?)", (token, fio, pinfl, today(), now().isoformat()))
    return token


def by_token(token: str):
    if not token:
        return None
    with _db() as c:
        r = c.execute("SELECT * FROM users WHERE token=?", (token,)).fetchone()
    return dict(r) if r else None


def logout(uid):
    with _lock, _db() as c:
        c.execute("UPDATE users SET token=NULL WHERE id=?", (uid,))


# ---------- kredit ----------
def _roll(c, u):
    """Kun almashsa, kunlik sarfni nolga tushiradi; tarif muddati tugasa — bepulga."""
    changes = {}
    if u["day"] != today():
        changes.update(used=0, day=today())
    if u["tariff"] != "free" and u["tariff_until"] and u["tariff_until"] < now().isoformat():
        changes.update(tariff="free", tariff_until=None)
    if changes:
        sets = ", ".join(f"{k}=?" for k in changes)
        c.execute(f"UPDATE users SET {sets} WHERE id=?", (*changes.values(), u["id"]))
        u.update(changes)
    return u


def usage(uid):
    with _lock, _db() as c:
        u = _roll(c, dict(c.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()))
    t = config.TARIFFS[u["tariff"]]
    reset = (now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return {"tarif": u["tariff"], "tarif_nomi": t["nomi"], "tarif_tugash": u["tariff_until"],
            "kunlik_limit": t["kunlik"], "sarflandi": u["used"], "qoldi": max(0, t["kunlik"] - u["used"]),
            "qoshimcha": u["extra"], "reset": reset.isoformat()}


class LimitError(Exception):
    pass


def charge(uid, amount):
    with _lock, _db() as c:
        u = _roll(c, dict(c.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()))
        limit = config.TARIFFS[u["tariff"]]["kunlik"]
        free_left = max(0, limit - u["used"])
        if free_left >= amount:
            c.execute("UPDATE users SET used=used+? WHERE id=?", (amount, uid))
        elif free_left + u["extra"] >= amount:
            c.execute("UPDATE users SET used=?, extra=extra-? WHERE id=?", (limit, amount - free_left, uid))
        else:
            raise LimitError()


def set_tariff(uid, plan, period):
    days = 365 if period == "yil" else 30
    until = (now() + timedelta(days=days)).isoformat()
    t = config.TARIFFS[plan]
    summa = t["yillik_narx"] if period == "yil" else t["oylik_narx"]
    with _lock, _db() as c:
        c.execute("UPDATE users SET tariff=?, tariff_until=? WHERE id=?", (plan, until if plan != "free" else None, uid))
        c.execute("INSERT INTO payments(user,tur,summa,ts) VALUES(?,?,?,?)", (uid, f"tarif:{plan}:{period}", summa, now().isoformat()))


def add_credits(uid, amount, summa):
    with _lock, _db() as c:
        c.execute("UPDATE users SET extra=extra+? WHERE id=?", (amount, uid))
        c.execute("INSERT INTO payments(user,tur,summa,ts) VALUES(?,?,?,?)", (uid, f"kredit:{amount}", summa, now().isoformat()))


# ---------- chatlar ----------
def chat_add(uid, chat_id, role, content, title=None):
    with _lock, _db() as c:
        if not chat_id:
            cur = c.execute("INSERT INTO chats(user,title,updated) VALUES(?,?,?)", (uid, (title or "Yangi suhbat")[:80], now().isoformat()))
            chat_id = cur.lastrowid
        elif not c.execute("SELECT 1 FROM chats WHERE id=? AND user=?", (chat_id, uid)).fetchone():
            raise KeyError("chat")
        c.execute("INSERT INTO messages(chat,role,content,ts) VALUES(?,?,?,?)", (chat_id, role, json.dumps(content, ensure_ascii=False), now().isoformat()))
        c.execute("UPDATE chats SET updated=? WHERE id=?", (now().isoformat(), chat_id))
    return chat_id


def chats(uid):
    with _db() as c:
        return [dict(r) for r in c.execute("SELECT id,title,updated FROM chats WHERE user=? ORDER BY updated DESC LIMIT 50", (uid,))]


def chat_messages(uid, chat_id):
    with _db() as c:
        if not c.execute("SELECT 1 FROM chats WHERE id=? AND user=?", (chat_id, uid)).fetchone():
            return None
        return [{"role": r["role"], "content": json.loads(r["content"])} for r in
                c.execute("SELECT role,content FROM messages WHERE chat=? ORDER BY id", (chat_id,))]


def chat_delete(uid, chat_id):
    with _lock, _db() as c:
        c.execute("DELETE FROM messages WHERE chat IN (SELECT id FROM chats WHERE id=? AND user=?)", (chat_id, uid))
        c.execute("DELETE FROM chats WHERE id=? AND user=?", (chat_id, uid))


# ---------- arizalar ----------
def ariza_save(uid, turi, idora, hujjat):
    with _lock, _db() as c:
        cur = c.execute("INSERT INTO arizalar(user,turi,idora,hujjat,holat,created) VALUES(?,?,?,?,?,?)",
                        (uid, turi, idora, json.dumps(hujjat, ensure_ascii=False), "Tayyorlangan", now().isoformat()))
        return cur.lastrowid


def arizalar(uid):
    with _db() as c:
        return [{**dict(r), "hujjat": json.loads(r["hujjat"])} for r in
                c.execute("SELECT * FROM arizalar WHERE user=? ORDER BY id DESC", (uid,))]


def ariza_count_month(uid):
    with _db() as c:
        return c.execute("SELECT COUNT(*) FROM arizalar WHERE user=? AND created>=?", (uid, now().strftime("%Y-%m-01"))).fetchone()[0]


# ---------- ko'rilgan loyihalar ----------
def seen_set(uid, draft):
    with _lock, _db() as c:
        c.execute("INSERT OR IGNORE INTO seen VALUES(?,?)", (uid, draft))


def seen_list(uid):
    with _db() as c:
        return {r[0] for r in c.execute("SELECT draft FROM seen WHERE user=?", (uid,))}
