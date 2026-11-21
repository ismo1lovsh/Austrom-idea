"""Donişmand AI backend. Ishga tushirish: python backend/main.py"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from starlette.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import config
import store
import til
from alifbo import yangi
from rag import index, tokenize, BM25
from uzref import parse_ref, norm

app = FastAPI(title="Donişmand AI")
FRONT = config.ROOT / "frontend"
store.init()

NO_TR = {"/api/status", "/api/tts", "/api/stt", "/api/document/docx", "/api/auth/oneid", "/api/auth/logout"}


@app.middleware("http")
async def lang_middleware(request, call_next):
    """X-Lang: uz | uzc | ru. Rus tilida JSON javobdagi özbekça matnlar tarjima qilinadi."""
    lang = til.parse(request.headers.get("x-lang", ""))
    tok = til.LANG.set(lang)
    try:
        resp = await call_next(request)
    finally:
        til.LANG.reset(tok)
    path = request.url.path
    if lang != "ru" or not path.startswith("/api/") or path in NO_TR or "application/json" not in resp.headers.get("content-type", ""):
        return resp
    body = b"".join([c async for c in resp.body_iterator])
    headers = {k: v for k, v in resp.headers.items() if k.lower() != "content-length"}
    try:
        data = await run_in_threadpool(til.tr_obj, json.loads(body))
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    except Exception:
        pass
    return Response(body, status_code=resp.status_code, headers=headers, media_type="application/json")


def load(name, default):
    p = config.DATA_DIR / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default


VIDEOS = load("videos.json", [])
SCENARIOS = load("scenarios.json", [])
TEMPLATES = load("ariza_shablonlar.json", [])


def template_for(text):
    q = norm(text or "")
    return next((t for t in TEMPLATES if all(any(norm(k) in q for k in g) for g in t["kalit"])), None)


def fill_template(t, holat, j):
    fio = til.to_input((j.get("fio") or "").strip())
    if not fio:
        return {"turi": yangi(t["turi"]), "nega": yangi(t["nega"]), "idora": yangi(t["idora"]), "kanal": yangi(t["kanal"]),
                "yetishmaydi": [{"kalit": "fio", "savol": yangi(t["savollar"][0]["savol"])}], "asos": [yangi(a) for a in t["asos"]],
                "hujjat": {}, "mediatsiya": "", "manbalar": []}
    story = til.to_input(holat.strip())
    if not config.MOCK:
        try:
            from llm import formal
            story = formal(story)
        except Exception:
            pass
    if len(story) > 1 and story[0].isupper() and story[1].islower():  # "IIV" kabi qisqartmalarga tegmaymiz
        story = story[0].lower() + story[1:]
    if story and story[-1] not in ".!?":
        story += "."
    if til.cur() == "ru":
        h = {"uslub": "ariza", "kimga": [til.ru(x) for x in t["kimga"]], "kimdan": [f"От заявителя, гражданина {fio}"], "sarlavha": "ЗАЯВЛЕНИЕ",
             "matn": [f"Я, заявитель {fio}, настоящим сообщаю Вам, что {story}", til.ru(t["huquqiy"]), til.ru(t["talab"])],
             "soraymiz": [], "ilovalar": [], "imzo": ["Заявитель", fio]}
        return {"turi": til.ru(t["turi"]), "nega": til.ru(t["nega"]), "idora": til.ru(t["idora"]), "kanal": t["kanal"],
                "yetishmaydi": [], "asos": [til.ru(a) for a in t["asos"]], "hujjat": h, "mediatsiya": "", "manbalar": []}
    h = {"uslub": "ariza", "kimga": t["kimga"], "kimdan": [f"Arizachi fuqaro {fio}dan"], "sarlavha": "ARIZA",
         "matn": [f"Men, arizachi {fio}, ushbu orqali Sizga shuni ma'lum qilmoqchimanki, {story}", t["huquqiy"], t["talab"]],
         "soraymiz": [], "ilovalar": [], "imzo": ["Arizachi fuqaro", fio]}
    return {"turi": yangi(t["turi"]), "nega": yangi(t["nega"]), "idora": yangi(t["idora"]), "kanal": yangi(t["kanal"]),
            "yetishmaydi": [], "asos": [yangi(a) for a in t["asos"]], "hujjat": ny_doc(h), "mediatsiya": "", "manbalar": []}


def ny_doc(h):
    out = {}
    for k, v in h.items():
        out[k] = [yangi(x) for x in v] if isinstance(v, list) else (yangi(v) if isinstance(v, str) else v)
    return out
DRAFTS = load("drafts.json", [])
RIGHTS = load("rights.json", [])
ORGANS = load("organs.json", [])
TYPES = [("konst", "Konstitutsiya"), ("kodeks", "Kodekslar"), ("orq", "Özbekiston Respublikasi Qonunlari"),
         ("pf", "Prezident farmonlari"), ("pq", "Prezident qarorlari"), ("vmq", "Vazirlar Mahkamasi qarorlari"), ("boshqa", "Boşqa hujjatlar")]


# ---------------- yordamchilar ----------------
def user(authorization: str = Header(default="")):
    u = store.by_token(authorization.replace("Bearer ", "").strip())
    if not u:
        raise HTTPException(401, "Tizimga kiring")
    return u


def charge(u, what):
    try:
        store.charge(u["id"], config.COST[what])
    except store.LimitError:
        raise HTTPException(402, "Kunlik limit tugadi. Profil böliminda qöşimça limit oling yoki tarifni oşiring.")


def ai(fn, *a):
    try:
        return fn(*a)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"AI xizmatida xato: {e}")


def src(a):
    d = index.docs.get(a["doc"], {})
    return {"id": a["id"], "doc": a["doc"], "kod": a["doc"], "number": a["number"], "title": yangi(a["title"]),
            "hujjat": d.get("title", a.get("code", "")), "url": a.get("url") or d.get("url", "https://lex.uz")}


def video_key(key):
    return next((v for v in VIDEOS if v["key"] == key), None)


def video_for(arts):
    for a in arts:
        for v in VIDEOS:
            if v.get("doc") != a["doc"]:
                continue
            if str(a["number"]) in v.get("numbers", []) or (v.get("bob") and norm(a.get("bob", "")).startswith(norm(v["bob"]))):
                return v
    return None


def scenario(question):
    """Tayyor (tekshirilgan) javoblar: har bir kalit guruhidan kamida bitta so'z bo'lsa."""
    q = norm(question)
    for sc in SCENARIOS:
        if all(any(norm(k) in q for k in grp) for grp in sc["kalit"]):
            res = dict(sc["javob"])
            arts = index.article(*sc["modda"]) if sc.get("modda") else []
            res["manbalar"] = [src(a) for a in arts[:1]]
            res["video"] = video_key(sc["video"]) if sc.get("video") else video_for(arts)
            return res
    return None


def find_articles(question, doc=None):
    """1) aniq modda havolasi; 2) AI qidiruv so'rovlari + nomzodlar + AI tanlovi."""
    question = til.to_input(question)
    ref = parse_ref(question)
    if ref:
        arts = index.article(ref[0], ref[1]) or index.article("", ref[1])
        if arts:
            return arts[:3], ref
    if config.MOCK:
        return index.search(question, 4, doc), None
    from llm import rewrite, select
    rw = ai(rewrite, question)
    queries = [question] + rw.get("sorovlar", [])
    cands = index.multi_search(queries, 12, 40, doc)
    pref = {k.upper() for k in rw.get("kodekslar", [])}
    cands.sort(key=lambda a: 0 if a["doc"] in pref else 1)  # barqaror saralash: ehtimoliy kodeks oldinga
    ids = ai(select, question, cands) if cands else []
    arts = [index.get(i) for i in ids]
    arts = [a for a in arts if a][:6]
    return (arts or cands[:3]), None


def mock_answer(arts):
    a = arts[0] if arts else None
    return {"javob": yangi(a.get("sodda") or a["text"][:400]) if a else "Demo rejim: mos modda bazada yöq.",
            "sarlavha": yangi(a.get("holat", a["title"])) if a else "", "asosiy_raqam": yangi(a.get("jazo", "")) if a else "",
            "manbalar": [a["id"]] if a else [], "keyingi": "modda" if a else "yöq", "mediatsiya": "", "topildi": bool(a)}


def explain_payload(arts):
    if config.MOCK:
        a = arts[0]
        exp = {"sarlavha": yangi(f"{a['doc']} {a['number']}-modda. {a['title']}"), "umumiy": yangi(a.get("sodda") or a["text"][:300]),
               "bandlar": [], "eslatma": ""}
    else:
        from llm import explain
        exp = ai(explain, arts)
    return {**exp, "matn": arts[0]["text"], "manbalar": [src(a) for a in arts[:1]], "video": video_for(arts),
            "doc": arts[0]["doc"], "number": arts[0]["number"]}


# ---------------- holat va kirish ----------------
@app.get("/api/status")
def status():
    from voice import enabled_stt, enabled_tts
    return {"mock": config.MOCK, "stt": enabled_stt(), "tts": enabled_tts(), "moddalar": len(index.articles), "model": config.CLAUDE_MODEL}


class LoginIn(BaseModel):
    fio: str = "Aliyev Vali Karimovič"
    pinfl: str = "30101990000000"


@app.post("/api/auth/oneid")
def oneid(body: LoginIn):
    """DEMO: haqiqiy OneID integratsiyasi uchun davlat tomonidan beriladigan client_id/secret kerak."""
    fio = body.fio.strip() or "Foydalanuvçi"
    token = store.login(yangi(fio), re.sub(r"\D", "", body.pinfl) or "30101990000000")
    return {"token": token}


@app.get("/api/me")
def me(u=Depends(user)):
    return {"fio": u["fio"], "pinfl": u["pinfl"][:4] + "••••••" + u["pinfl"][-4:], "usage": store.usage(u["id"])}


@app.post("/api/auth/logout")
def logout(u=Depends(user)):
    store.logout(u["id"])
    return {"ok": True}


@app.get("/api/usage")
def usage(u=Depends(user)):
    return store.usage(u["id"])


@app.get("/api/tariffs")
def tariffs():
    return {"tariflar": config.TARIFFS, "paketlar": config.CREDIT_PACKS}


class TariffIn(BaseModel):
    plan: str
    period: str = "oy"


@app.post("/api/tariff")
def tariff(body: TariffIn, u=Depends(user)):
    if body.plan not in config.TARIFFS:
        raise HTTPException(400, "Tarif topilmadi")
    store.set_tariff(u["id"], body.plan, body.period)
    return store.usage(u["id"])


class PackIn(BaseModel):
    pack: str


@app.post("/api/credits")
def credits(body: PackIn, u=Depends(user)):
    p = next((x for x in config.CREDIT_PACKS if x["id"] == body.pack), None)
    if not p:
        raise HTTPException(400, "Paket topilmadi")
    store.add_credits(u["id"], p["kredit"], p["narx"])
    return store.usage(u["id"])


# ---------------- 1. Yangi qonun loyihalari ----------------
@app.get("/api/home")
def home(u=Depends(user)):
    seen = store.seen_list(u["id"])
    return {"yangi_loyihalar": sum(1 for d in DRAFTS if d["id"] not in seen), "usage": store.usage(u["id"])}


@app.get("/api/drafts")
def drafts(u=Depends(user)):
    seen = store.seen_list(u["id"])
    keys = ("id", "nomi", "soha", "turi", "joylangan", "tugash", "kuchga", "holat", "qisqa")
    return [{k: d.get(k) for k in keys} | {"yangi": d["id"] not in seen}
            for d in sorted(DRAFTS, key=lambda x: x.get("saralash", x["joylangan"]), reverse=True)]


def draft_sections(d):
    if d.get("doc"):
        return [{"id": a["id"], "sarlavha": (a["title"] if a.get("band") else f"{a['number']}-modda. {a['title']}"), "matn": a["text"]}
                for i in index.by_doc.get(d["doc"], []) for a in [index.articles[i]]]
    return d["bolimlar"]


@app.get("/api/drafts/{did}")
def draft(did: str, u=Depends(user)):
    d = next((x for x in DRAFTS if x["id"] == did), None)
    if not d:
        raise HTTPException(404, "Loyiha topilmadi")
    store.seen_set(u["id"], did)
    return {**d, "bolimlar": draft_sections(d)}


class QIn(BaseModel):
    question: str


def search_q(question):
    """BM25 özbekça matnda qidiradi: rus tilidagi savolni avval özbekça sörovlarga aylantiramiz."""
    question = til.to_input(question)
    if til.cur() == "ru" and til.has_cyr(question) and not config.MOCK:
        try:
            from llm import rewrite
            return question + " " + " ".join(rewrite(question).get("sorovlar", []))
        except Exception:
            pass
    return question


def grounded_qa(question, title, sections):
    question = til.to_input(question)
    if til.cur() == "ru" and not config.MOCK:
        # Foydalanuvçi ekranda rusça matnni köradi — iqtibos ham şu matndan bölişi kerak
        tt = til.ru_many([s["sarlavha"] for s in sections] + [s["matn"] for s in sections] + [title])
        n = len(sections)
        sections = [{**s, "sarlavha": tt[i], "matn": tt[n + i]} for i, s in enumerate(sections)]
        title = tt[-1]
    if config.MOCK:
        bm = BM25([tokenize(s["sarlavha"] + " " + s["matn"]) for s in sections])
        sc = bm.scores(tokenize(question))
        if not sc:
            return {"topildi": False, "javob": "Bu masala hujjatda mavjud emas.", "iqtiboslar": []}
        s = sections[max(sc, key=sc.get)]
        first = re.split(r"(?<=\.)\s", s["matn"])[0]
        return {"topildi": True, "javob": yangi(f"Demo javob: {s['sarlavha']} — {first}"), "iqtiboslar": [{"bolim_id": s["id"], "parcha": first[:160]}]}
    from llm import doc_qa
    return ai(doc_qa, question, title, sections)


@app.post("/api/drafts/{did}/ask")
def draft_ask(did: str, body: QIn, u=Depends(user)):
    d = next((x for x in DRAFTS if x["id"] == did), None)
    if not d:
        raise HTTPException(404, "Loyiha topilmadi")
    secs = draft_sections(d)
    if not secs:
        raise HTTPException(409, "Hujjat matni hali yuklanmagan: python backend\\scrape_lex.py --hammasi")
    charge(u, "qa")
    if len(secs) > 14:  # uzun hujjat: eng mos bandlarni tanlaymiz
        bm = BM25([tokenize(x["sarlavha"] + " " + x["matn"]) for x in secs])
        sc = bm.scores(tokenize(search_q(body.question)))
        secs = [secs[i] for i in sorted(sc, key=sc.get, reverse=True)[:12]] or secs[:12]
    return grounded_qa(body.question, d["nomi"], secs)


# ---------------- 2. Huquqiy savodxonlik (qonunlar bazasi) ----------------
@app.get("/api/laws/categories")
def categories(u=Depends(user)):
    cnt = {}
    for d in index.docs.values():
        cnt[d.get("type", "boshqa")] = cnt.get(d.get("type", "boshqa"), 0) + 1
    return [{"type": t, "nomi": n, "soni": cnt.get(t, 0)} for t, n in TYPES]


def doc_info(d):
    return {"short": d["short"], "title": yangi(d["title"]), "type": d.get("type", "boshqa"), "date": d.get("date", ""),
            "url": d.get("url"), "soha": yangi(d.get("soha", "")), "moddalar": len(index.by_doc.get(d["short"], []))}


@app.get("/api/laws")
def laws(type: str = "", u=Depends(user)):
    ds = [doc_info(d) for d in index.docs.values() if not type or d.get("type") == type]
    return sorted(ds, key=lambda x: x["date"], reverse=True)


class FindIn(BaseModel):
    query: str
    type: str = ""


@app.post("/api/laws/find")
def laws_find(body: FindIn, u=Depends(user)):
    charge(u, "find")
    query = til.to_input(body.query)
    if config.MOCK:
        arts = index.search(query, 15)
    else:
        from llm import rewrite
        rw = ai(rewrite, query)
        arts = index.multi_search([query] + rw.get("sorovlar", []), 15, 40)
    if body.type:
        arts = [a for a in arts if index.docs.get(a["doc"], {}).get("type") == body.type]
    groups = {}
    for a in arts:
        g = groups.setdefault(a["doc"], {**doc_info(index.docs[a["doc"]]), "topilgan": []})
        if len(g["topilgan"]) < 4:
            g["topilgan"].append({"number": a["number"], "title": yangi(a["title"])})
    return list(groups.values())[:10]


@app.get("/api/laws/{short}")
def law(short: str, u=Depends(user)):
    d = index.docs.get(short.upper())
    if not d:
        raise HTTPException(404, "Hujjat topilmadi")
    info = doc_info(d)
    if d.get("type") in ("kodeks", "konst"):
        return {**info, "tuzilma": index.structure(d["short"])}
    return {**info, "bolimlar": [{"id": a["id"], "number": a["number"], "sarlavha": a["title"], "matn": a["text"]}
                                 for i in index.by_doc.get(d["short"], []) for a in [index.articles[i]]]}


@app.get("/api/laws/{short}/{number}")
def law_article(short: str, number: str, u=Depends(user)):
    arts = index.article(short.upper(), number)
    if not arts:
        raise HTTPException(404, "Modda topilmadi")
    a = arts[0]
    return {**src(a), "matn": a["text"], "bolim": a.get("bolim", ""), "bob": a.get("bob", ""), "video": video_for(arts)}


@app.post("/api/laws/{short}/ask")
def law_ask(short: str, body: QIn, u=Depends(user)):
    short = short.upper()
    if short not in index.docs:
        raise HTTPException(404, "Hujjat topilmadi")
    charge(u, "qa")
    ref = parse_ref(body.question)
    arts = index.article(short, ref[1]) if ref else []
    arts += [a for a in index.search(search_q(body.question), 12, short) if a not in arts]
    if not arts:
        return {"topildi": False, "javob": "Bu masala hujjatda mavjud emas.", "iqtiboslar": []}
    lim = 100000 if til.cur() == "ru" else 3000  # ru: ekrandagi tarjima bilan bir xil matn
    secs = [{"id": a["id"], "sarlavha": f"{a['number']}-modda. {a['title']}", "matn": a["text"][:lim]} for a in arts[:8 if lim > 3000 else 12]]
    return grounded_qa(body.question, index.docs[short]["title"], secs)


class ArtIn(BaseModel):
    query: str = ""
    doc: str = ""
    number: str = ""


@app.post("/api/article")
def article(body: ArtIn, u=Depends(user)):
    doc, num = body.doc.upper(), body.number
    if not num:
        ref = parse_ref(body.query)
        if not ref:
            raise HTTPException(400, "Modda raqamini yozing, masalan: MJTK 227")
        doc, num = ref
    arts = index.article(doc, num)
    if not arts:
        raise HTTPException(404, yangi(f"{doc + ' ' if doc else ''}{num}-modda bazada topilmadi."))
    charge(u, "article")
    return explain_payload(arts[:1])


@app.post("/api/video")
def video(body: ArtIn, u=Depends(user)):
    arts = index.article(body.doc.upper(), body.number)
    if not arts:
        raise HTTPException(404, "Modda topilmadi")
    charge(u, "video")
    a = arts[0]
    if config.MOCK:
        parts = [p for p in re.split(r"(?<=[.;])\s+", a.get("sodda") or a["text"]) if p][:4]
        sc = [{"sarlavha": yangi(f"{a['number']}-modda"), "matn": yangi(a["title"]), "belgi": "tarozi", "raqam": ""}]
        sc += [{"sarlavha": f"{i + 1}-qadam", "matn": yangi(p[:160]), "belgi": ["odam", "hujjat", "ogohlantirish", "sud"][i % 4], "raqam": ""} for i, p in enumerate(parts)]
        if a.get("jazo"):
            sc.append({"sarlavha": "Oqibat", "matn": yangi(a["jazo"]), "belgi": "qamoq", "raqam": yangi(a["jazo"])})
        sc.append({"sarlavha": "Esda tuting", "matn": "Qonunni biliş — özingizni himoya qiliş.", "belgi": "togri", "raqam": ""})
        return {"nomi": yangi(a["title"]), "sahnalar": sc}
    from llm import video as vid
    return ai(vid, arts[:1])


# ---------------- Hisoblab ber (davlat boji, muddatlar, aliment) ----------------
@app.get("/api/stavkalar")
def stavkalar(u=Depends(user)):
    """Hisoblagiçlar uçun tekşirilgan stavkalar (data/stavkalar.json, manbalari bilan)."""
    return load("stavkalar.json", {})


# ---------------- 3. Huquq va majburiyatlarim ----------------
@app.get("/api/rights")
def rights(u=Depends(user)):
    return [{**r, "video": video_key(r["video"]) if r.get("video") else None} for r in RIGHTS]


# ---------------- 4. Ariza yuborish ----------------
@app.get("/api/organs")
def organs(u=Depends(user)):
    return ORGANS


@app.post("/api/organs/route")
def organ_route(body: QIn, u=Depends(user)):
    charge(u, "route")
    body.question = til.to_input(body.question)
    t = template_for(body.question)
    if t:
        return {"idora_id": t["idora_id"], "ariza_turi": yangi(t["turi"]), "izoh": yangi(t["izoh"]), "qadamlar": [yangi(x) for x in t["qadamlar"]],
                "idora": yangi(t["idora"])}
    if config.MOCK:
        q = norm(body.question)
        rules = [("mehnat", ["ish haqi", "maosh", "ishdan", "ish beruvchi"]), ("iiv", ["ogirla", "urdi", "yoqol", "patrul", "politsiya"]),
                 ("sud", ["sud", "ajrim", "dava", "hukm"]), ("hokimlik", ["svet", "gaz", "suv", "yer", "qurilish"]), ("soliq", ["soliq"])]
        oid = next((o for o, ks in rules if any(k in q for k in ks)), "prezident")
        o = next(x for x in ORGANS if x["id"] == oid)
        return {"idora_id": oid, "ariza_turi": o["arizalar"][0], "izoh": "Demo: kalit sözlar böyiça aniqlandi.", "qadamlar": ["Arizani tayyorlang", f"{o['kanal']} orqali topşiring", "Javobni kuting"]}
    from llm import route
    return ai(route, body.question, ORGANS)


@app.post("/api/procedure")
def procedure(body: QIn, u=Depends(user)):
    charge(u, "procedure")
    arts, _ = find_articles(body.question)
    if config.MOCK:
        return {"nomi": yangi(body.question), "idora": "Demo", "qadamlar": [{"sarlavha": "Demo", "matn": "AI kaliti ulanganda batafsil tartib körsatiladi."}],
                "hujjatlar": [], "muddat": "", "manbalar": []}
    from llm import procedure as proc
    res = ai(proc, body.question, arts)
    return res | {"manbalar": [src(index.get(i)) for i in res.get("manbalar", []) if index.get(i)]}


class DocIn(BaseModel):
    holat: str
    javoblar: dict = {}
    turi: str = ""
    idora: str = ""


@app.post("/api/document")
def document(body: DocIn, u=Depends(user)):
    if len(body.holat.strip()) < 15:
        raise HTTPException(400, "Holatni batafsilroq yozing")
    charge(u, "document")
    body.holat = til.to_input(body.holat)
    body.javoblar = {k: til.to_input(v) if isinstance(v, str) else v for k, v in (body.javoblar or {}).items()}
    t = template_for(body.holat)
    if t:
        return fill_template(t, body.holat, body.javoblar)
    if config.MOCK:
        j = body.javoblar
        asked = [{"kalit": "fio", "savol": "F.I.Ş. va yaşaş manzilingiz"}, {"kalit": "tel", "savol": "Telefon raqamingiz"}]
        return {"turi": body.turi or "Ariza", "nega": "Demo rejim: AI kaliti ulanganda hujjat turi holatdan aniqlanadi.",
                "idora": body.idora or "[Idora nomi]", "kanal": "my.gov.uz yoki idoraning özi",
                "yetishmaydi": [q for q in asked if not j.get(q["kalit"])],
                "hujjat": {"kimga": [body.idora or "[Idora nomi]", "rahbariga"], "kimdan": [j.get("fio") or "[F.I.Ş.]", "Tel: " + (j.get("tel") or "[telefon]")],
                           "sarlavha": (body.turi or "Ariza").upper(), "matn": [yangi(body.holat)], "soraymiz": ["Murojaatimni körib çiqib, qonuniy çora körişingizni."],
                           "ilovalar": []}, "mediatsiya": "", "manbalar": []}
    from llm import document as doc
    arts, _ = find_articles(body.holat)
    res = ai(doc, body.holat, body.javoblar, arts, body.turi)
    if body.idora and not res.get("idora"):
        res["idora"] = body.idora
    return res | {"manbalar": [src(index.get(i)) for i in res.get("manbalar", []) if index.get(i)]}


class DocxIn(BaseModel):
    hujjat: dict
    eski: bool = False
    nomi: str = "hujjat"
    idora: str = ""
    saqla: bool = True


@app.post("/api/document/docx")
def document_docx(body: DocxIn, u=Depends(user)):
    if u["tariff"] == "free" and body.saqla and store.ariza_count_month(u["id"]) >= 3:
        raise HTTPException(402, "Bepul tarifda oyiga 3 ta hujjat. Pro tarifda cheksiz.")
    from docgen import build_docx
    lang = til.cur()
    h = til.cyr_obj(body.hujjat) if lang == "uzc" else body.hujjat
    data = build_docx(h, old_script=body.eski and lang == "uz", lang=lang)
    if body.saqla:
        store.ariza_save(u["id"], body.nomi, body.idora, body.hujjat)
    name = re.sub(r"[^A-Za-z0-9_-]+", "_", norm(body.nomi)).strip("_") or "hujjat"
    return Response(data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    headers={"Content-Disposition": f'attachment; filename="{name}.docx"'})


@app.get("/api/arizalar")
def arizalar(u=Depends(user)):
    return store.arizalar(u["id"])


# ---------------- Chat (markaziy mikrofon) ----------------
class AskIn(BaseModel):
    question: str
    chat_id: int | None = None


def do_ask(u, question, chat_id):
    question = til.to_input(question.strip())
    if not question:
        raise HTTPException(400, "Savol bo'sh")
    charge(u, "ask")
    history = []
    if chat_id:
        msgs = store.chat_messages(u["id"], chat_id) or []
        history = [{"role": m["role"], "text": m["content"].get("text") or m["content"].get("javob") or m["content"].get("umumiy", "")} for m in msgs]
    sc = scenario(question)
    if sc:
        res = {"tur": "javob", "question": question, **sc}
        chat_id = store.chat_add(u["id"], chat_id, "user", {"text": question}, title=question)
        store.chat_add(u["id"], chat_id, "ai", res)
        return {**res, "chat_id": chat_id}
    arts, ref = find_articles(question)
    short_q = len(question.split()) <= 16
    if ref and arts and short_q:
        res = {"tur": "modda", "question": question, **explain_payload(arts[:1])}
    else:
        if config.MOCK:
            r = mock_answer(arts)
        else:
            from llm import answer
            r = ai(answer, question, arts, history)
        used = [index.get(i) for i in r.get("manbalar", [])]
        used = [a for a in used if a] or (arts[:1] if r.get("topildi") else [])
        res = {"tur": "javob", "question": question, **r, "manbalar": [src(a) for a in used], "video": video_for(used)}
    chat_id = store.chat_add(u["id"], chat_id, "user", {"text": question}, title=question)
    store.chat_add(u["id"], chat_id, "ai", res)
    return {**res, "chat_id": chat_id}


@app.post("/api/ask")
def ask(body: AskIn, u=Depends(user)):
    return do_ask(u, body.question, body.chat_id)


def _stt(upload_bytes, filename, ctype):
    from voice import enabled_stt, speech_to_text
    if not enabled_stt():
        raise HTTPException(400, "Ovoz uçun VoiceLab kaliti kerak (.env: VOICELAB_API_KEY)")
    try:
        text = speech_to_text(upload_bytes, filename or "ovoz.wav", ctype, til.cur())
    except Exception as e:
        raise HTTPException(502, f"Nutqni tanib bölmadi: {e}")
    if not text:
        raise HTTPException(422, "Ovoz eşitilmadi, qaytadan gapiring")
    return text


@app.post("/api/voice")
async def voice_ask(file: UploadFile = File(...), chat_id: str = Form(""), u=Depends(user)):
    charge(u, "stt")
    text = _stt(await file.read(), file.filename, file.content_type)
    return {"transcript": text if til.cur() == "ru" else yangi(text), **do_ask(u, text, int(chat_id) if chat_id.isdigit() else None)}


@app.post("/api/stt")
async def stt(file: UploadFile = File(...), u=Depends(user)):
    charge(u, "stt")
    t = _stt(await file.read(), file.filename, file.content_type)
    return {"text": t if til.cur() == "ru" else yangi(t)}


FAYL_TURLARI = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}


@app.post("/api/fayl")
async def fayl(file: UploadFile = File(...), question: str = Form(""), chat_id: str = Form(""), u=Depends(user)):
    """Yuklangan hujjat (rasm yoki PDF): AI öqiydi, qonunlardan tegişli moddalarni topadi va nima qiliş kerakligini aytadi."""
    data = await file.read()
    mt = (file.content_type or "").lower()
    if mt == "image/jpg":
        mt = "image/jpeg"
    if mt not in FAYL_TURLARI:
        raise HTTPException(400, "Faqat rasm (JPG, PNG) yoki PDF")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "Fayl juda katta (10 MB gaça)")
    if config.MOCK:
        raise HTTPException(400, "Hujjatni tahlil qiliş uçun AI kaliti kerak (.env: ANTHROPIC_API_KEY)")
    return await run_in_threadpool(_fayl_job, u, data, mt, til.to_input(question.strip()), int(chat_id) if chat_id.isdigit() else None)


def _fayl_job(u, data, mt, question, chat_id):
    import base64
    from llm import fayl_extract, answer, select
    charge(u, "fayl")
    ext = ai(fayl_extract, base64.b64encode(data).decode(), mt, question)
    if not ext.get("oqildi", True):
        msg = ("Документ не удалось прочитать. Сфотографируйте его ровно и целиком при хорошем освещении и загрузите снова."
               if til.cur() == "ru" else "Hujjat öqilmadi. Rasmni yoruğ joyda, tekis va töliq olib qayta yuklang.")
        return {"tur": "fayl", "fayl": ext, "javob": msg, "topildi": False, "manbalar": [], "asos": []}
    q = question or ext.get("savol") or "Bu hujjat böyiça nima qiliş kerak?"
    facts = "; ".join(f"{m.get('nomi')}: {m.get('qiymat')}" for m in ext.get("malumotlar", [])[:12])
    full_q = f"Foydalanuvçi hujjat yukladi: {ext.get('turi', '')}. {ext.get('qisqa', '')} Ma'lumotlar: {facts}. SAVOL: {q}"
    cands = index.multi_search((ext.get("sorovlar") or []) + [q], 12, 40)
    ids = ai(select, full_q, cands) if cands else []
    arts = [a for a in (index.get(i) for i in ids) if a][:6] or cands[:3]
    r = ai(answer, full_q, arts, None)
    used = [a for a in (index.get(i) for i in r.get("manbalar", [])) if a] or (arts[:1] if r.get("topildi") else [])
    res = {"tur": "fayl", "question": q, **r, "fayl": {k: ext.get(k) for k in ("turi", "qisqa", "malumotlar", "muammolar")},
           "manbalar": [src(a) for a in used], "video": video_for(used)}
    title = "📎 " + (ext.get("turi") or "Hujjat")
    chat_id = store.chat_add(u["id"], chat_id, "user", {"text": title + (f" — {question}" if question else "")}, title=title)
    store.chat_add(u["id"], chat_id, "ai", res)
    return {**res, "chat_id": chat_id}


class TTSIn(BaseModel):
    text: str


@app.post("/api/tts")
def tts(body: TTSIn, u=Depends(user)):
    from voice import enabled_tts, text_to_speech
    if not enabled_tts():
        raise HTTPException(400, "Ovoz sozlanmagan (.env: VOICELAB_API_KEY)")
    try:
        text = til.lat(body.text) if til.cur() == "uzc" and til.has_cyr(body.text) else body.text
        data, mt = text_to_speech(text, til.cur())
    except Exception as e:
        raise HTTPException(502, f"Ovoz yaratib bölmadi: {e}")
    charge(u, "tts")  # faqat muvaffaqiyatli bo'lsa
    try:
        return Response(data, media_type=mt)
    except Exception as e:
        raise HTTPException(502, f"Ovoz yaratib bölmadi: {e}")


@app.get("/api/chats")
def chats(u=Depends(user)):
    return store.chats(u["id"])


@app.get("/api/chats/{cid}")
def chat(cid: int, u=Depends(user)):
    m = store.chat_messages(u["id"], cid)
    if m is None:
        raise HTTPException(404, "Suhbat topilmadi")
    return m


@app.delete("/api/chats/{cid}")
def chat_del(cid: int, u=Depends(user)):
    store.chat_delete(u["id"], cid)
    return {"ok": True}


# ---------------- frontend ----------------
app.mount("/static", StaticFiles(directory=FRONT), name="static")


@app.get("/")
def home_page():
    return FileResponse(FRONT / "index.html")


@app.get("/manifest.webmanifest")
def manifest():
    return FileResponse(FRONT / "manifest.webmanifest", media_type="application/manifest+json")


@app.get("/sw.js")
def service_worker():
    return FileResponse(FRONT / "sw.js", media_type="application/javascript", headers={"Cache-Control": "no-cache"})


if __name__ == "__main__":
    import uvicorn
    print("\n  Donişmand AI ishga tushdi:  http://localhost:8000")
    print("  Rejim:", "DEMO (Anthropic kaliti yo'q)" if config.MOCK else f"AI ({config.CLAUDE_MODEL})", "|", len(index.articles), "ta modda\n")
    uvicorn.run(app, host="127.0.0.1", port=8000)
