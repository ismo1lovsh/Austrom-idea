"""Qonunlar bazasi va qidiruv (BM25, sof Python)."""
import json
import math
import re
from collections import Counter, defaultdict

from config import ARTICLES_FILE, DOCS_FILE
from uzref import norm


def normalize(text: str) -> str:
    return norm(text)


def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", norm(text))
    # O'zbek tili qo'shimchalarga boy: so'z o'zagini taxminan ajratamiz (birinchi 6 harf)
    return [w[:6] for w in words if len(w) > 1]


class BM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        self.k1, self.b = k1, b
        self.docs = [Counter(d) for d in corpus]
        self.lens = [len(d) for d in corpus]
        self.avg = sum(self.lens) / max(1, len(self.lens))
        df = Counter(t for d in self.docs for t in d)
        n = len(corpus)
        self.idf = {t: math.log((n - f + 0.5) / (f + 0.5) + 1) for t, f in df.items()}

    def scores(self, query, subset=None):
        idx = subset if subset is not None else range(len(self.docs))
        out = {}
        for i in idx:
            d, ln, s = self.docs[i], self.lens[i], 0.0
            for t in query:
                f = d.get(t)
                if f:
                    s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * ln / self.avg))
            if s > 0:
                out[i] = s
        return out


class Index:
    def __init__(self):
        self.load()

    def load(self):
        self.articles, self.docs = [], {}
        if ARTICLES_FILE.exists():
            for line in ARTICLES_FILE.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    a = json.loads(line)
                    a.setdefault("doc", a["id"].split("-")[0])
                    self.articles.append(a)
        if DOCS_FILE.exists():
            for d in json.loads(DOCS_FILE.read_text(encoding="utf-8")):
                self.docs[d["short"]] = d
        for a in self.articles:  # hujjat ma'lumoti yo'q bo'lsa — moddadan
            if a["doc"] not in self.docs:
                self.docs[a["doc"]] = {"short": a["doc"], "title": a.get("code", a["doc"]), "type": "kodeks",
                                       "date": "", "url": a.get("url", "https://lex.uz")}
        self.by_doc = defaultdict(list)
        for i, a in enumerate(self.articles):
            self.by_doc[a["doc"]].append(i)
        # sarlavha og'irroq hisoblanadi (3 marta)
        corpus = [tokenize(f"{a['title']} {a['title']} {a['title']} {a.get('bob', '')} {a['text']}") for a in self.articles]
        self.bm = BM25(corpus) if corpus else None

    def get(self, aid):
        return next((a for a in self.articles if a["id"] == aid), None)

    def article(self, doc, number):
        return [a for a in self.articles if str(a["number"]) == str(number) and (not doc or a["doc"] == doc)]

    def search(self, query, k=8, doc=None):
        if not self.bm:
            return []
        subset = self.by_doc.get(doc, []) if doc else None
        sc = self.bm.scores(tokenize(query), subset)
        return [self.articles[i] for i in sorted(sc, key=sc.get, reverse=True)[:k]]

    def multi_search(self, queries, k_each=12, limit=40, doc=None):
        """Bir nechta so'rov natijalarini birlashtiradi (tartib: eng yuqori ball)."""
        if not self.bm:
            return []
        best = {}
        for q in queries:
            subset = self.by_doc.get(doc, []) if doc else None
            sc = self.bm.scores(tokenize(q), subset)
            top = sorted(sc, key=sc.get, reverse=True)[:k_each]
            mx = max((sc[i] for i in top), default=1)
            for r, i in enumerate(top):
                best[i] = max(best.get(i, 0), sc[i] / mx - r * 0.01)
        return [self.articles[i] for i in sorted(best, key=best.get, reverse=True)[:limit]]

    def structure(self, doc):
        """Kodeks: bo'lim -> bob -> moddalar."""
        tree, cur_b, cur_c = [], None, None
        for i in self.by_doc.get(doc, []):
            a = self.articles[i]
            b, c = a.get("bolim", ""), a.get("bob", "")
            if cur_b is None or cur_b["nomi"] != b:
                cur_b = {"nomi": b, "boblar": []}
                tree.append(cur_b)
                cur_c = None
            if cur_c is None or cur_c["nomi"] != c:
                cur_c = {"nomi": c, "moddalar": []}
                cur_b["boblar"].append(cur_c)
            cur_c["moddalar"].append({"id": a["id"], "number": a["number"], "title": a["title"]})
        return tree


index = Index()
