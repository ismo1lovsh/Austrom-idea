"""Ovoz: nutq -> matn (STT) va matn -> nutq (TTS).

Asosiy provayder: VoiceLab (https://docs.voicelab.uz), .env: VOICELAB_API_KEY  (vlk_...)
Zaxira: ElevenLabs, .env: ELEVENLABS_API_KEY (+ ELEVEN_VOICE_ID)
"""
import time
import uuid
import httpx
import config
from alifbo import eski

VL = config.VOICELAB_BASE.rstrip("/") + "/v1"
ELEVEN = "https://api.elevenlabs.io/v1"
_voice_cache = {}


def provider() -> str:
    if config.VOICELAB_API_KEY:
        return "voicelab"
    if config.ELEVENLABS_API_KEY:
        return "elevenlabs"
    return ""


def enabled_stt() -> bool:
    return bool(provider())


def enabled_tts() -> bool:
    p = provider()
    return p == "voicelab" or (p == "elevenlabs" and bool(config.ELEVEN_VOICE_ID))


def _h(extra=None):
    h = {"Authorization": f"Bearer {config.VOICELAB_API_KEY}"}
    h.update(extra or {})
    return h


def _items(data):
    if isinstance(data, list):
        return data
    for k in ("voices", "data", "items", "results"):
        if isinstance(data.get(k), list):
            return data[k]
    return []


def voicelab_voices(language="uz"):
    params = {"language": language}
    if config.VOICELAB_MODEL:
        params["model_id"] = config.VOICELAB_MODEL
    r = httpx.get(f"{VL}/voices", headers=_h(), params=params, timeout=30)
    r.raise_for_status()
    return _items(r.json())


def voicelab_voice_id(lang="uz") -> str:
    if lang == "ru" and config.VOICELAB_VOICE_ID_RU:
        return config.VOICELAB_VOICE_ID_RU
    if lang != "ru" and config.VOICELAB_VOICE_ID:
        return config.VOICELAB_VOICE_ID
    if lang not in _voice_cache:
        voices = voicelab_voices(lang)
        if not voices:
            raise RuntimeError(f"VoiceLab: '{lang}' tili uçun ovoz topilmadi. .env ga VOICELAB_VOICE_ID{'_RU' if lang == 'ru' else ''} yozing")
        v = voices[0]
        _voice_cache[lang] = v.get("voice_id") or v.get("id")
    return _voice_cache[lang]


# ---------------- STT ----------------
def speech_to_text(audio: bytes, filename: str, content_type: str, lang: str = "uz") -> str:
    vl = "ru" if lang == "ru" else "uz"
    if provider() == "voicelab":
        return _vl_stt(audio, filename or "savol.wav", content_type or "audio/wav", vl)
    r = httpx.post(f"{ELEVEN}/speech-to-text", headers={"xi-api-key": config.ELEVENLABS_API_KEY},
                   data={"model_id": config.ELEVEN_STT_MODEL, "language_code": "rus" if vl == "ru" else config.ELEVEN_LANG},
                   files={"file": (filename or "savol.wav", audio, content_type or "audio/wav")}, timeout=90)
    r.raise_for_status()
    return r.json().get("text", "").strip()


def _vl_stt(audio, filename, ctype, first="uz", deadline_s=45):
    job = None
    for lang in (first, "auto"):
        r = httpx.post(f"{VL}/stt", headers=_h({"Idempotency-Key": str(uuid.uuid4())}),
                       data={"language": lang, "include_speakers": "false"},
                       files={"audio": (filename, audio, ctype)}, timeout=90)
        if r.status_code in (400, 422) and lang == first:
            continue  # "uz" kodi qabul qilinmasa, avtomatik aniqlash
        r.raise_for_status()
        job = r.json()
        break
    if not job:
        raise RuntimeError("VoiceLab STT so'rovni qabul qilmadi")
    if job.get("transcript") and job.get("status") in (None, "completed"):
        return job["transcript"].strip()
    jid, t0 = job["id"], time.time()
    while time.time() - t0 < deadline_s:
        g = httpx.get(f"{VL}/stt/transcriptions/{jid}", headers=_h(), timeout=30)
        g.raise_for_status()
        d = g.json()
        if d.get("status") == "completed":
            return (d.get("transcript") or "").strip()
        if d.get("status") == "failed":
            raise RuntimeError("VoiceLab: transkripsiya muvaffaqiyatsiz")
        time.sleep(float(g.headers.get("Retry-After", 1)))
    raise RuntimeError("VoiceLab: javob kutish vaqti tugadi")


# ---------------- TTS ----------------
def text_to_speech(text: str, lang: str = "uz") -> tuple[bytes, str]:
    """(audio baytlari, media turi) qaytaradi. lang: uz | uzc | ru"""
    ru = lang == "ru"
    if not ru:
        text = eski(text)  # TTS an'anaviy yozuvni yaxshiroq o'qiydi
    if provider() == "voicelab":
        try:
            return _vl_tts(text, "ru" if ru else "uz")
        except Exception:
            if not (ru and config.ELEVENLABS_API_KEY and config.ELEVEN_VOICE_ID):
                raise
    r = httpx.post(f"{ELEVEN}/text-to-speech/{config.ELEVEN_VOICE_ID}?output_format=mp3_44100_128",
                   headers={"xi-api-key": config.ELEVENLABS_API_KEY}, json={"text": text[:2500], "model_id": config.ELEVEN_TTS_MODEL},
                   timeout=90)
    r.raise_for_status()
    return r.content, "audio/mpeg"


def _vl_tts(text, lang):
    body = {"text": text[:5000], "language": lang, "speed": 1}
    try:
        body["voice_id"] = voicelab_voice_id(lang)
    except Exception:
        if lang != "ru":
            raise  # ru: ovoz ID siz, standart ruscha ovoz bilan urinib köramiz
    if config.VOICELAB_MODEL and lang == "uz":  # model sozlamasi faqat özbekça oqim uçun
        body["model_id"] = config.VOICELAB_MODEL
    if True:
        r = httpx.post(f"{VL}/tts", headers=_h({"Idempotency-Key": "tts-" + uuid.uuid4().hex}), json=body, timeout=120)
        if r.status_code == 200:
            return r.content, "audio/wav"
        if r.status_code == 202:
            return _vl_wait_audio(r.json()), "audio/wav"
        raise RuntimeError(f"VoiceLab TTS {r.status_code}: {r.text[:300]}")


def _vl_wait_audio(job, deadline_s=60):
    url = job.get("status_url") or f"{VL}/tts/{job['id']}"
    if url.startswith("/"):
        url = config.VOICELAB_BASE.rstrip("/") + url
    t0 = time.time()
    while time.time() - t0 < deadline_s:
        g = httpx.get(url, headers=_h(), timeout=60, follow_redirects=True)
        g.raise_for_status()
        if g.headers.get("content-type", "").startswith("audio/"):
            return g.content
        d = g.json()
        if d.get("status") == "failed":
            raise RuntimeError("VoiceLab: ovoz yaratilmadi")
        link = d.get("audio_url") or d.get("url") or d.get("download_url") or (d.get("result") or {}).get("audio_url")
        if d.get("status") == "completed" and link:
            a = httpx.get(link, timeout=60, follow_redirects=True)
            a.raise_for_status()
            return a.content
        time.sleep(float(g.headers.get("Retry-After", 1)))
    raise RuntimeError("VoiceLab: ovoz kutish vaqti tugadi")
