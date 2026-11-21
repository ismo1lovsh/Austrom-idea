"""VoiceLab kalitini tekshirish: python tools/test_voicelab.py
1) o'zbekcha ovozlar ro'yxati, 2) matn -> ovoz (test.wav), 3) ovoz -> matn."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
import config, voice

if not config.VOICELAB_API_KEY:
    sys.exit(".env faylida VOICELAB_API_KEY yo'q")
print("1) O'zbekcha ovozlar:")
try:
    for v in voice.voicelab_voices("uz")[:10]:
        print("   ", v.get("voice_id") or v.get("id"), "|", v.get("name"), "|", v.get("gender", ""))
except Exception as e:
    print("   XATO:", e)
print("2) TTS sinovi...")
try:
    audio, _ = voice.text_to_speech("Assalomu alaykum! Men huquqiy maslahatchiman.")
    Path("test.wav").write_bytes(audio)
    print("   OK -> test.wav", len(audio), "bayt")
except Exception as e:
    print("   XATO:", e)
    sys.exit()
print("3) STT sinovi...")
try:
    print("   Tanildi:", voice.speech_to_text(audio, "test.wav", "audio/wav"))
except Exception as e:
    print("   XATO:", e)
