"""Claude bilan ishlash. Har bir vazifa strukturali javob (tool) orqali qaytadi."""
import json
import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from alifbo import yangi
import til

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

ALIFBO = ("Faqat o'zbek tilida, yangi lotin alifbosida yoz: sh o'rniga ş, ch o'rniga ç, "
          "o' o'rniga ö, g' o'rniga ğ (masalan: ariza topşiriş, çiqariş, töğri, şikoyat).")

BASE = f"""Sen O'zbekiston fuqarolariga huquqiy yordam beradigan AI maslahatçisan.
Qat'iy qoidalar:
- FAQAT berilgan HUJJAT/MODDA matnlariga tayan. Kerakli norma berilgan matnda bölmasa, buni oçiq ayt. Modda raqami, muddat, jarima miqdori, idora nomini hech qaçon öylab topma.
- Sodda tilda yoz. Yuridik atamani işlatsang, darhol oddiy söz bilan izohla.
- Protsessual hujjatlar: sud qarori/ajrimiga PROTEST faqat prokuror keltiradi; fuqaro va taraflar ŞIKOYAT beradi (apellyatsiya, kassatsiya yoki xususiy şikoyat).
- Nizo tinç yöl bilan hal bölişi mumkin bölsa, mediatsiyani ham taklif qil.
- Qonunni buzişga yordam berma.
- {ALIFBO}"""

KANALLAR = ("Ma'lum elektron kanallar: my.sud.uz — sudlarga elektron murojaat; my.gov.uz — Yagona interaktiv davlat xizmatlari portali; "
            "pm.gov.uz — Prezident virtual qabulxonasi. Boşqa sayt nomlarini öylab topma.")


def S(props, req=None):
    return {"type": "object", "properties": props, "required": req or list(props)}


STR, BOOL = {"type": "string"}, {"type": "boolean"}
ARR = lambda item: {"type": "array", "items": item}

TOOLS = {
    "qayta_yoz": {"name": "qidiruv_sorovlari", "description": "Savolni qonun matnidan qidiriş uçun huquqiy sörovlarga aylantiriş",
        "input_schema": S({"sorovlar": {**ARR(STR), "description": "3-6 ta qisqa qidiruv sörovi, ESKI lotin yozuvida, qonun tilida (masalan: 'haydovchilik guvohnomasini taqdim etmaslik', 'ichki ishlar xodimining talabi')"},
                           "kodekslar": {**ARR(STR), "description": "Ehtimoliy kodeks qisqartmalari: JK, MJTK, FK, FPK, JPK, MK, OK, KONST va h.k."}})},
    "tanla": {"name": "moddalarni_tanla", "description": "Savolga tegişli moddalarni tanlaş",
        "input_schema": S({"idlar": {**ARR(STR), "description": "Eng tegişli 1-6 ta modda id si, tegişlilik tartibida. Hech biri mos kelmasa bo'sh"}})},
    "javob": {"name": "javob_ber", "description": "Manbali javob",
        "input_schema": S({
            "javob": {**STR, "description": "Asosiy javob. Kazus bölsa: 1) holat, 2) qaysi norma qöllanadi, 3) xulosa va nima qiliş kerak. 3-8 gap"},
            "sarlavha": {**STR, "description": "Masalaning qisqa huquqiy nomi, 2-6 söz"},
            "asosiy_raqam": {**STR, "description": "Eng muhim raqam (jarima, muddat, jazo). Bölmasa bo'sh"},
            "manbalar": {**ARR(STR), "description": "Javobda işlatilgan modda id lari"},
            "keyingi": {"type": "string", "enum": ["yöq", "modda", "tartib", "hujjat"]},
            "mediatsiya": {**STR, "description": "Mos bölsa mediatsiya haqida 1 gap, aks holda bo'sh"},
            "topildi": BOOL})},
    "modda": {"name": "modda_tushuntir", "description": "Moddani qism va bandlar böyiça sodda tuşuntiriş",
        "input_schema": S({"sarlavha": STR, "umumiy": {**STR, "description": "2 gap, oddiy tilda"},
            "bandlar": ARR(S({"nomi": STR, "sodda": STR, "misol": STR, "oqibat": {**STR, "description": "Jazo/jarima moddadagidek, bölmasa bo'sh"}})),
            "eslatma": STR})},
    "tartib": {"name": "tartib_korsat", "description": "Murojaat qiliş tartibi",
        "input_schema": S({"nomi": STR, "idora": STR,
            "qadamlar": ARR(S({"sarlavha": STR, "matn": STR})), "hujjatlar": ARR(STR),
            "muddat": {**STR, "description": "FAQAT matnda bölsa, aks holda bo'sh"}, "manbalar": ARR(STR)})},
    "hujjat": {"name": "hujjat_tayyorla", "description": "Rasmiy hujjat loyihasi",
        "input_schema": S({"turi": STR, "nega": STR, "idora": STR, "kanal": STR,
            "yetishmaydi": {**ARR(S({"kalit": STR, "savol": STR})), "description": "Yetişmayotgan MUHIM ma'lumotlar, köpi bilan 6 ta. Foydalanuvçi bergan bölsa söralmaydi"},
            "hujjat": S({"kimga": ARR(STR), "kimdan": ARR(STR), "sarlavha": STR, "matn": ARR(STR),
                         "soraymiz": ARR(STR), "ilovalar": ARR(STR)}),
            "mediatsiya": STR, "manbalar": ARR(STR)})},
    "qa": {"name": "hujjatdan_javob", "description": "Faqat berilgan hujjat matnidan javob",
        "input_schema": S({"topildi": {**BOOL, "description": "Javob matnda bormi"},
            "javob": {**STR, "description": "Topilmasa: 'Bu masala hujjatda mavjud emas.'"},
            "iqtiboslar": {**ARR(S({"bolim_id": STR, "parcha": {**STR, "description": "Matndan AYNAN körçirilgan 5-25 sözli parça (yozuvini özgartirmasdan)"}})),
                           "description": "Javob asoslangan joylar"}})},
    "video": {"name": "video_ssenariy", "description": "Moddani tuşuntiruvçi qisqa animatsion video ssenariysi",
        "input_schema": S({"nomi": STR, "sahnalar": {**ARR(S({
            "sarlavha": {**STR, "description": "2-5 söz"},
            "matn": {**STR, "description": "Diktor matni, 1-2 qisqa gap"},
            "belgi": {"type": "string", "enum": ["tarozi", "odam", "guruh", "politsiya", "sud", "pul", "qamoq", "hujjat", "ogohlantirish", "togri", "mashina", "uy", "chegara"]},
            "raqam": {**STR, "description": "Ekranda katta körinadigan raqam/jazo, bölmasa bo'sh"}})),
            "description": "4-7 ta sahna: kiriş, holatlar/qismlar, oqibat, maslahat"}})},
    "yonalt": {"name": "murojaatga_yonalt", "description": "Muammoga mos idora va ariza turini aniqlaş",
        "input_schema": S({"idora_id": STR, "ariza_turi": {**STR, "description": "Idoraning ariza turlari ichidan biri"},
            "izoh": {**STR, "description": "Nega aynan şu idora, 1-2 gap"},
            "qadamlar": {**ARR(STR), "description": "3-5 ta qisqa qadam"}})},
}


RU_RULE = ("\nTIL (MUHIM): foydalanuvçi rus tilida işlayapti. Yuqoridagi alifbo qoidasi bekor. Barça matnli maydonlarni RUS TILIDA yoz "
           "(на русском языке, простым языком). Hujjat va modda nomlarini ham rus tilida ber: MJTK → КоАО (Кодекс об административной "
           "ответственности), JK → УК, JPK → УПК, FK → ГК, FPK → ГПК, MK → ТК, OK → Семейный кодекс, SK → Налоговый кодекс, "
           "Vazirlar Mahkamasi qarori → постановление Кабинета Министров, YPX → ДПС. Masalan: «КоАО, статья 126, часть 1».")
USER_FACING = {"javob", "modda", "tartib", "hujjat", "qa", "video", "yonalt", "fayl"}


def _call(key, system, user, max_tokens=1500):
    tool = TOOLS[key]
    if key in USER_FACING and til.cur() == "ru":
        system += RU_RULE
    msg = client.messages.create(
        model=CLAUDE_MODEL, max_tokens=max_tokens,
        system=system + f"\nJavobni faqat `{tool['name']}` vositasi orqali qaytar.",
        tools=[tool], tool_choice={"type": "tool", "name": tool["name"]},
        messages=[{"role": "user", "content": user}])
    for b in msg.content:
        if b.type == "tool_use":
            return b.input
    raise RuntimeError("Model javob qaytarmadi")


KEEP = {"manbalar", "kalit", "keyingi", "idlar", "sorovlar", "kodekslar", "bolim_id", "parcha", "belgi", "idora_id"}


def ny(x, key=""):
    """Natijani yangi alifboga o'tkazish (texnik maydonlardan tashqari)."""
    if til.cur() == "ru" or key in KEEP:
        return x
    if isinstance(x, str):
        return yangi(x)
    if isinstance(x, list):
        return [ny(i, key) for i in x]
    if isinstance(x, dict):
        return {k: ny(v, k) for k, v in x.items()}
    return x


def ctx(arts, limit=3500):
    return "\n\n".join(f"[id: {a['id']}] {a.get('code', a['doc'])}, {a['number']}-modda. {a['title']}\n{a['text'][:limit]}" for a in arts) or "(mos matn topilmadi)"


# ---------- vazifalar ----------
def rewrite(question):
    return _call("qayta_yoz", "Sen O'zbekiston qonunçiligi böyiça qidiruv mutaxassisisan. Kundalik tildagi savolni qonun matnidagi atamalarga aylantir. "
                 "Savol rus tilida yoki kirill yozuvida bölsa ham, qidiruv sörovlarini baribir ÖZBEK tilida, eski lotin yozuvida yoz "
                 "(qonunlar bazasi özbekça).", question, 300)


def select(question, cands):
    lst = "\n".join(f"{a['id']} | {a.get('code', a['doc'])} | {a['number']}-modda. {a['title']} | {a['text'][:160].replace(chr(10), ' ')}" for a in cands)
    return _call("tanla", "Sen huquqşunossan. Ro'yxatdan savolga javob beriş uçun kerak bo'ladigan moddalarni tanla. Kazusda faktlarga qöllanadigan normalarni tanla (javobgarlik, xodimning vakolati, fuqaroning huquqi).",
                 f"SAVOL: {question}\n\nNOMZOD MODDALAR:\n{lst}", 300).get("idlar", [])


def answer(question, arts, history=None):
    prev = ""
    if history:
        prev = "OLDINGI SUHBAT:\n" + "\n".join(f"{h['role']}: {h['text'][:600]}" for h in history[-6:]) + "\n\n"
    return ny(_call("javob", BASE + "\nKazus (hayotiy vaziyat) bölsa, faktlarni normalar bilan solişirib tahlil qil, lekin javobni " + XALQ +
                    " 3-6 qisqa gap: avval xulosa, keyin sababi, oxirida nima qiliş kerak. Asos bölgan moddalarni manbalar maydonida ber.",
                    f"{prev}MODDALAR:\n{ctx(arts)}\n\nSAVOL: {question}", 1200))


XALQ = ("USLUB: oddiy xalq tilida, lönda va qisqa gapir — xuddi tanişingizga tuşuntirayotgandek. Qonun matnini takrorlama, "
        "yuridik atamalarsiz yoz. Batafsil şart emas.")


def explain(arts):
    return ny(_call("modda", BASE + "\n" + XALQ + " umumiy — 2 qisqa gap; bandlar — 2-4 ta, har biri 1-2 qisqa gap; misol — bitta qisqa gap.",
                    f"MODDA MATNI:\n{ctx(arts, 6000)}\n\nUşbu moddani sodda qilib tuşuntir.", 1200))


def procedure(question, arts):
    return ny(_call("tartib", BASE + "\n" + KANALLAR, f"MODDALAR:\n{ctx(arts)}\n\nSAVOL: {question}\nMurojaat tartibini qadamma-qadam körsat.", 1500))


def document(holat, javoblar, arts, turi_hint=""):
    extra = "\n".join(f"- {k}: {v}" for k, v in (javoblar or {}).items() if v)
    hint = f"\nFoydalanuvçi tanlagan hujjat turi: {turi_hint}" if turi_hint else ""
    return ny(_call("hujjat", BASE + "\n" + KANALLAR,
                    f"MODDALAR:\n{ctx(arts)}\n\nHOLAT:\n{holat}{hint}\n\nQÖŞIMÇA MA'LUMOTLAR:\n{extra or '(yöq)'}\n\n"
                    "Rasmiy uslubda hujjat loyihasini tayyorla. Bilinmagan ma'lumotni [qavs] içida qoldir.", 2500))


def doc_qa(question, title, sections):
    body = "\n\n".join(f"[bolim_id: {s['id']}] {s['sarlavha']}\n{s['matn']}" for s in sections)
    return ny(_call("qa", f"""Sen hujjat böyiça savollarga javob beradigan yordamçisan.
QAT'IY: faqat quyidagi hujjat matnidan javob ber. Öz bilimingdan, boşqa qonunlardan foydalanma, taxmin qilma.
Javob matnda bölmasa: topildi=false va javob='Bu masala hujjatda mavjud emas.'
Iqtibosni matndan AYNAN körçir (harflarini özgartirma). Javob matnini {ALIFBO}""",
                        f"HUJJAT: {title}\n\n{body}\n\nSAVOL: {question}", 1200))


def video(arts):
    return ny(_call("video", BASE + "\nSen ta'limiy animatsion videolar ssenaristisan. Qiziqarli, lekin aniq: jazo va raqamlar faqat matndan.",
                    f"MODDA:\n{ctx(arts, 5000)}\n\nŞu modda böyiça 40-60 soniyalik tuşuntiruvçi video ssenariysini yoz.", 1500))


def route(problem, organs):
    lst = "\n".join(f"{o['id']}: {o['nomi']} — ariza turlari: {', '.join(o['arizalar'])}" for o in organs)
    return ny(_call("yonalt", BASE + "\n" + KANALLAR, f"IDORALAR:\n{lst}\n\nFUQARO MUAMMOSI: {problem}", 600))


def formal(story):
    """Fuqaro og'zaki aytgan holatni rasmiy uslubga o'tkazadi (faktlarni o'zgartirmaydi)."""
    msg = client.messages.create(
        model=CLAUDE_MODEL, max_tokens=600,
        system=("Fuqaro aytgan holatni sudga yoziladigan arizaning rasmiy uslubiga keltir. Birinchi shaxsda yoz, 2-4 gap. "
               "Faktlarni o'zgartirma, yangi fakt, sana, raqam, modda qo'shma. Faqat matnni qaytar, kirish so'zlarisiz. "
               "Matnni kichik harf bilan boshla, chunki u 'shuni ma'lum qilmoqchimanki,' so'zidan keyin keladi. Eski lotin yozuvida yoz."
               if til.cur() != "ru" else
               "Перепиши рассказ гражданина в официальном стиле заявления в суд, от первого лица, 2–4 предложения. "
               "Не меняй факты, не добавляй новые факты, даты, суммы и статьи. Верни только текст, без вступления. "
               "Начни с маленькой буквы: текст идёт после слов «сообщаю Вам, что»."),
        messages=[{"role": "user", "content": story}])
    return msg.content[0].text.strip()


# ---------- tarjima (rus tili) ----------
TOOLS["tarjima"] = {"name": "tarjima", "description": "Matnlarni rus tiliga tarjima",
    "input_schema": S({"tarjimalar": {**ARR(STR), "description": "Har bir kiriş matnining rusça tarjimasi, AYNAN şu tartibda va şu sonda"}})}

TR_SYS = ("Ты профессиональный юридический переводчик с узбекского на русский. Переводи точно и естественно, сохраняя числа, "
          "даты, [квадратные скобки], переносы строк и кавычки «». Ничего не добавляй и не сокращай. Термины: Ma'muriy javobgarlik "
          "to'g'risidagi kodeks (MJTK) → Кодекс об административной ответственности (КоАО); Jinoyat kodeksi (JK) → Уголовный кодекс (УК); "
          "Jinoyat-protsessual kodeksi (JPK) → Уголовно-процессуальный кодекс (УПК); Fuqarolik protsessual kodeksi (FPK) → ГПК; "
          "Mehnat kodeksi (MK) → Трудовой кодекс (ТК); Vazirlar Mahkamasi → Кабинет Министров; YPX → ДПС; IIV → ОВД; hokimlik → хокимият; "
          "mahalla → махалля; söm → сум; modda → статья; qism → часть; band → пункт; bob → глава; bölim → раздел; "
          "Donişmand bobo → Донишманд-бобо. Короткие названия кодексов (JK, MJTK и т.п.) переводи как УК, КоАО и т.п.")


def translate_ru(items):
    payload = json.dumps(items, ensure_ascii=False)
    out = _call_raw("tarjima", TR_SYS, f"Переведи на русский язык каждый элемент JSON-массива ({len(items)} шт.):\n{payload}",
                    min(8000, 400 + len(payload) * 2))
    return out.get("tarjimalar", [])


def _call_raw(key, system, user, max_tokens):
    tool = TOOLS[key]
    msg = client.messages.create(model=CLAUDE_MODEL, max_tokens=max_tokens, system=system,
                                 tools=[tool], tool_choice={"type": "tool", "name": tool["name"]},
                                 messages=[{"role": "user", "content": user}])
    for b in msg.content:
        if b.type == "tool_use":
            return b.input
    raise RuntimeError("Model javob qaytarmadi")


# ---------- yuklangan hujjat (rasm / PDF) tahlili ----------
TOOLS["fayl"] = {"name": "hujjat_tahlili", "description": "Yuklangan hujjatni öqib, asosiy ma'lumotlarni ajratiş",
    "input_schema": S({
        "turi": {**STR, "description": "Hujjat turi, masalan: 'Ma'muriy jarima haqidagi qaror', 'Sud ajrimi', 'Mehnat şartnomasi'"},
        "qisqa": {**STR, "description": "Hujjatda nima yozilgan — 2-3 sodda gap"},
        "malumotlar": {**ARR(S({"nomi": STR, "qiymat": STR})), "description": "Hujjatdagi muhim ma'lumotlar: raqam, sana, summa, idora, modda, muddat. FAQAT hujjatda yozilgani"},
        "muammolar": {**ARR(STR), "description": "Hujjatdagi xatolar, yetişmayotgan rekvizitlar, şubhali yoki e'tibor beriş kerak bölgan joylar (faqat hujjatga asoslanib). Bölmasa bo'sh"},
        "sorovlar": {**ARR(STR), "description": "Qonunlar bazasidan qidiriş uçun 3-5 qisqa sörov, ÖZBEK tilida, eski lotin yozuvida (masalan: 'tonirovka jarima', 'ma'muriy jarima ustidan shikoyat muddati')"},
        "savol": {**STR, "description": "Foydalanuvçi uçun eng muhim savol, hujjat asosida (masalan: 'Bu jarima qonuniymi va qanday şikoyat qilaman?')"},
        "oqildi": {**BOOL, "description": "Hujjat matni öqildimi (rasm xira yoki hujjat emas bölsa false)"}})}


def fayl_extract(data_b64, media_type, user_q=""):
    if media_type == "application/pdf":
        block = {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": data_b64}}
    else:
        block = {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data_b64}}
    q = f"Foydalanuvçining savoli: {user_q}" if user_q else "Foydalanuvçi bu hujjat böyiça nima qiliş kerakligini bilmoqçi."
    return ny(_call("fayl", BASE + "\nSen yuklangan hujjatni (rasm yoki PDF) öqiysan. Faqat hujjatda körinib turgan narsani yoz, "
                    "körinmagan raqam, sana, ismni öylab topma. Şaxsiy ma'lumotlarni (pasport, JŞŞIR) to'liq takrorlama.",
                    [block, {"type": "text", "text": q + "\nHujjatni tahlil qil."}], 1500))
