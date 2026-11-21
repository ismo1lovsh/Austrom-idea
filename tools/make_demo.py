"""Backendsiz namuna sahifa uchun frontend/demo-data.js ni yaratadi."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from alifbo import yangi
demo = json.loads((ROOT / "data/demo.json").read_text(encoding="utf-8"))
arts = [json.loads(l) for l in (ROOT / "data/articles.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
A = {a["id"]: a for a in arts}
def src(a): return {"id": a["id"], "kod": a["id"].split("-")[0], "number": a["number"], "title": yangi(a["title"]), "url": a["url"]}
def jav(aid, keyingi="modda"):
    a = A[aid]
    return {"javob": yangi(a["sodda"]), "sarlavha": yangi(a["holat"]), "asosiy_raqam": yangi(a["jazo"]), "manbalar": [src(a)],
            "keyingi": keyingi, "mediatsiya": "", "topildi": True, "video": {"url": "static/videos/169-modda.mp4", "title": "Bir harakat — tört xil jazo"} if aid.startswith("JK-169") else None}
javoblar = [
 {"kalit": ["sumka", "kelish", "guruh"], "javob": jav("JK-169-2")},
 {"kalit": ["ajrim", "shikoyat", "protest"], "javob": {"javob": "Sud ajrimiga protestni faqat prokuror keltiradi. Siz iş tarafi sifatida şikoyat berasiz: ajrim ustidan — xususiy şikoyat. Uni ajrim çiqargan sud orqali, my.sud.uz da elektron yoki qöğozda topşirasiz.", "sarlavha": "Ajrim ustidan xususiy şikoyat", "asosiy_raqam": "", "manbalar": [], "keyingi": "hujjat", "mediatsiya": "", "topildi": True, "video": None}},
 {"kalit": ["qoshni", "nizo", "sudsiz", "mediats"], "javob": {"javob": "Ha. Fuqarolik, oilaviy, mehnat va qöşniçilik nizolarini mediatsiya orqali sudsiz hal qiliş mumkin. Mediator ikki tomonni kelişuvga olib keladi, kelişuv bölmasa sudga murojaat qiliş huquqingiz saqlanadi.", "sarlavha": "Nizoni sudsiz hal qiliş", "asosiy_raqam": "", "manbalar": [], "keyingi": "tartib", "mediatsiya": "Mediatsiya sudga nisbatan tezroq va arzonroq, munosabatlarni ham saqlab qoladi.", "topildi": True, "video": None}},
 {"kalit": ["ogirl", "telefon", "dokon"], "javob": jav("JK-169-1")},
 {"kalit": [], "javob": {"javob": "Namuna sahifada bu savolga javob yöq. Kompyuterda AI kaliti bilan işga tuşirsangiz, istalgan savolga modda asosida javob beradi.", "sarlavha": "", "asosiy_raqam": "", "manbalar": [], "keyingi": "yöq", "mediatsiya": "", "topildi": False, "video": None}},
]
out = {"modda": demo["modda"], "src": {"MJTK-227": src(A["MJTK-227"]), "JK-169": src(A["JK-169-1"])},
       "codes": [{"kod": "JK", "nomi": "Jinoyat kodeksi", "moddalar": 4}, {"kod": "MJTK", "nomi": "Ma'muriy javobgarlik to'g'risidagi kodeks", "moddalar": 1}],
       "javoblar": javoblar, "tartib": demo["tartib"], "hujjat": demo["hujjat"], "hujjat_savollar": demo["hujjat_savollar"],
       "video": {"url": "static/videos/169-modda.mp4", "title": "Bir harakat — tört xil jazo"}}
(ROOT / "frontend/demo-data.js").write_text("window.DEMO = " + json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
print("frontend/demo-data.js tayyor")
