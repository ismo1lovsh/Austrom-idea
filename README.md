# Donişmand AI — AI huquqiy maslahatchi

Lex Hackathon, 1-trek: **Huquqiy xizmatlarni ko'rsatish**.

Platforma 4 ta bo'limdan iborat:

- **Kirish**: OneID orqali (demo).
- **Bosh sahifa** — 4 ta bo'lim:
  1. **Yangi qabul qilinayotgan qonunlar** — muhokamadagi loyihalar, ko'rilmaganlari qizil nuqta bilan. Savolga AI faqat loyiha matnidan javob beradi va javob turgan joyni matnda ochib ko'rsatadi.
  2. **Huquqiy savodxonlik** — Konstitutsiya, kodekslar, qonunlar, Prezident va VM qarorlari; kodekslar bo'lim → bob → modda; modda tushuntirish va video.
  3. **Huquq va majburiyatlarim** — hayotiy vaziyatlar bo'yicha.
  4. **Ariza yuborish** — idoralar, ariza turlari, AI yo'naltiruvchi, Word hujjat.
- **Markaziy mikrofon** — AI yordamchi (chat), suhbatlar tarixi.
- **Profil** — limit diagrammasi, yangilanish vaqti, qo'shimcha limit, Pro/Premium tariflar (demo to'lov), Mening arizalarim, chiqish.

Mos keladigan holatlarda AI nizoni **mediatsiya** orqali sudsiz hal qilishni ham taklif qiladi.

---

## 1. O'rnatish (bir marta)

Kerakli dasturlar: **Python 3.11+** (o'rnatishda "Add Python to PATH" belgisini qo'ying) va Google Chrome.

Loyiha papkasida terminal (Windows: `cmd`) oching:

```
pip install -r requirements.txt
```

## 2. Kalitlar

`.env.example` faylidan nusxa olib, uni `.env` deb nomlang va kalitlarni yozing:

```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-haiku-5-5
VOICELAB_API_KEY=vlk_...
```

- `VOICELAB_API_KEY`: voicelab.uz kabinetidagi API kalit (`vlk_` bilan boshlanadi). Bitta kalit ham ovozli savolni (STT), ham javobni ovozda o'qishni (TTS) ishlatadi.
- Kalitni tekshirish va o'zbekcha ovozlar ro'yxatini ko'rish: `python tools/test_voicelab.py`
- ElevenLabs ixtiyoriy zaxira: `VOICELAB_API_KEY` bo'sh bo'lsa, `ELEVENLABS_API_KEY` ishlatiladi.
- Kalitlar bo'lmasa ham ilova **demo rejimda** ishlaydi (javoblar namuna asosida bo'ladi).
- $5 balans demo uchun yetarli. `claude-haiku-5-5` arzon va tez model. Sifatliroq javob kerak bo'lsa, `claude-sonnet-5-5` ni qo'ying.

## 3. Qonunlarni yuklash (internet kerak)

Katalogdagi hamma hujjatlarni (Konstitutsiya, JK, MJTK, Mehnat kodeksi, FPK) bo'lim → bob → modda tuzilmasi bilan yuklash:

```
python backend\scrape_lex.py --hammasi
```

Bitta hujjat qo'shish (kodeks, qonun, Prezident qarori, VM qarori — turi sarlavhadan o'zi aniqlanadi):

```
python backend\scrape_lex.py https://lex.uz/uz/docs/-ID QISQA_KOD
```

Doimiy ro'yxatga qo'shish uchun `data/catalog.json` ga yozing. Havolada `/uz/` bo'lsin (lotin yozuvi).

## 4. Ishga tushirish

```
python backend/main.py
```

Keyin brauzerda **http://localhost:8000** ni oching. Windows'da `start.bat` faylini ikki marta bosish ham kifoya.

Mikrofon faqat `localhost` yoki `https` manzillarida ishlaydi, shuning uchun demoni shu kompyuterda ko'rsating.

## 5. Hakamlarga demo ssenariysi (3 daqiqa)

1. **Maslahat**: mikrofonni bosing va "MJTK 227-moddani tushunmadim" deng. AI moddani bandma-band tushuntiradi.
2. "Do'stim bilan kelishib sumka olsak, jazo qanday?" deb so'rang. Javob 169-modda 2-qismiga havola bilan chiqadi, "Video" tugmasi esa qismlar bo'yicha videoni ochadi.
3. **Hujjat**: "Sud ajrimiga protest bermoqchiman" deb yozing. AI protestni faqat prokuror keltirishini tushuntirib, **xususiy shikoyat** tayyorlaydi. Ma'lumotlarni to'ldiring, ko'rib chiqing va Word faylni yuklab oling.
4. **Tartib**: "Sud ajrimiga shikoyat berish" tanlansa, qadamlar va my.sud.uz kanali ko'rsatiladi.

## Tuzilma

```
backend/
  main.py         API (FastAPI) + sahifani berish
  llm.py          Claude: javob, modda, tartib, hujjat (strukturali javob)
  rag.py          qidiruv (BM25) va kodeks tuzilmasi
  uzref.py        "ikki yuz o'n yettinchi modda" -> 217, kodeks nomini aniqlash
  store.py        SQLite: foydalanuvchi, limit, tarif, chatlar, arizalar
  voice.py        VoiceLab: nutq→matn va matn→nutq (zaxira: ElevenLabs)
  docgen.py       Word (.docx) yaratish: Times New Roman 14, rasmiy shakl
  alifbo.py       eski ↔ yangi alifbo (ş, ç, ö, ğ)
  scrape_lex.py   lex.uz dan kodeksni moddalarga bo'lib olish
data/
  articles.jsonl  moddalar bazasi
  videos.json     modda → video bog'lanishi
frontend/
  index.html, style.css, app.js, videos/
```

## Muhim

- AI faqat bazadagi moddalarga tayanadi. Modda topilmasa, javob o'ylab topilmaydi, foydalanuvchi huquqshunosga yo'naltiriladi.
- Tayyorlangan hujjat — **loyiha**. `[qavs]` ichidagi joylar to'ldirilib, topshirishdan oldin tekshirilishi kerak.
- `.env` faylni hech kimga yubormang va GitHub'ga yuklamang.

## Ma'lumot fayllari

- `data/drafts.json` — muhokamadagi qonun loyihalari (hozir namuna). Yangisini qo'shsangiz, foydalanuvchilarda qizil nuqta chiqadi.
- `data/rights.json` — huquq va majburiyatlar mavzulari.
- `data/organs.json` — idoralar va ariza turlari.
- `data/catalog.json` — lex.uz dan yuklanadigan hujjatlar ro'yxati.
- `data/app.db` — foydalanuvchilar, limit, chatlar, arizalar (avtomatik yaratiladi).
- `data/ariza_shablonlar.json` — tayyor ariza shablonlari (masalan, kamera orqali chiziq uchun jarima). Holatda kalit so'zlar bo'lsa, ariza shu shablon bo'yicha tuziladi.
- `data/scenarios.json` — demo uchun tekshirilgan tayyor javoblar (tonirovka, bojxona normalari).
- `frontend/brand/` — logotiplar: `logo-mark.svg` (D belgisi), `donishmand-chol.svg` (3D chol).
