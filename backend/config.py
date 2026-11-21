import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
# Arzon va tez model. Sifat kerak bo'lsa: claude-sonnet-5-5
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-5-5")

# VoiceLab (asosiy ovoz provayderi) — https://docs.voicelab.uz
VOICELAB_API_KEY = os.getenv("VOICELAB_API_KEY", "").strip()
VOICELAB_VOICE_ID = os.getenv("VOICELAB_VOICE_ID", "").strip()   # bo'sh bo'lsa, birinchi o'zbekcha ovoz tanlanadi
VOICELAB_VOICE_ID_RU = os.getenv("VOICELAB_VOICE_ID_RU", "").strip()  # rus tili ovozi; bo'sh bo'lsa, VoiceLab'dagi birinchi ruscha ovoz
VOICELAB_BASE = os.getenv("VOICELAB_BASE", "https://api.voicelab.uz")
VOICELAB_MODEL = os.getenv("VOICELAB_MODEL", "").strip()         # bo'sh = standart model (lison)

# ElevenLabs (zaxira)
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
ELEVEN_VOICE_ID = os.getenv("ELEVEN_VOICE_ID", "").strip()
ELEVEN_TTS_MODEL = os.getenv("ELEVEN_TTS_MODEL", "eleven_v3")
ELEVEN_STT_MODEL = os.getenv("ELEVEN_STT_MODEL", "scribe_v1")
ELEVEN_LANG = os.getenv("ELEVEN_LANG", "uzb")

DATA_DIR = ROOT / "data"
ARTICLES_FILE = DATA_DIR / "articles.jsonl"
DOCS_FILE = DATA_DIR / "docs.json"
DRAFTS_FILE = DATA_DIR / "drafts.json"
DB_FILE = DATA_DIR / "app.db"
VIDEOS_FILE = DATA_DIR / "videos.json"



# Kalit bo'lmasa, ilova "demo" rejimida ishlaydi (soxta javoblar), UI sinash uchun
MOCK = not ANTHROPIC_API_KEY

# ---- Tariflar va kreditlar (demo to'lov) ----
TZ_OFFSET_HOURS = 5  # Toshkent vaqti
TARIFFS = {
    "free": {"nomi": "Bepul", "kunlik": 30, "oylik_narx": 0, "yillik_narx": 0,
             "imkoniyatlar": ["Kuniga 30 kredit", "AI maslahat va qonunlar bazasi", "Oyiga 3 ta hujjat"]},
    "pro": {"nomi": "Pro", "kunlik": 300, "oylik_narx": 49990, "yillik_narx": 499900,
            "imkoniyatlar": ["Kuniga 300 kredit", "Cheksiz hujjat (Word)", "Ovozli javoblar", "Video tushuntiriş", "Chat tarixi"]},
    "premium": {"nomi": "Premium", "kunlik": 1000, "oylik_narx": 129900, "yillik_narx": 1299000,
                "imkoniyatlar": ["Kuniga 1000 kredit", "Pro dagi hamma imkoniyatlar", "Yangi qonunlar böyiça şaxsiy bildirişnoma",
                                 "Ustuvor (tezkor) javob", "Advokat bilan bog'lanish (demo)", "Oila uçun 3 ta akkaunt"]},
}
CREDIT_PACKS = [{"id": "s", "kredit": 50, "narx": 9900}, {"id": "m", "kredit": 200, "narx": 29900}, {"id": "l", "kredit": 500, "narx": 59900}]
COST = {"ask": 2, "article": 2, "video": 3, "document": 4, "find": 1, "route": 1, "qa": 2, "stt": 1, "tts": 1, "procedure": 2, "fayl": 4}
