/* Donişmand AI — frontend (SPA) */
{
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mark = (s) => esc(s).replace(/\[([^\]]+)\]/g, "<mark>[$1]</mark>");
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
const I = window.I18N, L = I.L;
const S = { token: ls.get("hq_token"), status: {}, chatId: null, form: null, hl: null, rtab: "h", organs: null, voiceOn: true,
  autoVoice: ls.get("hq_autovoice") !== "0", voiceNext: false };

/* ---------------- belgilar ---------------- */
const P = {
  tarozi: "M12 3v18M7 21h10M4 7h16M6 7l-3 6a3 3 0 0 0 6 0L6 7zM18 7l-3 6a3 3 0 0 0 6 0l-3-6z",
  odam: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6",
  guruh: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c1-3.5 3.5-5 7-5s6 1.5 7 5M16 5.3a3 3 0 0 1 0 5.4M18 15c2 .6 3.4 2.2 4 5",
  politsiya: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  sud: "M14 4l6 6M11 7l6 6M12.5 5.5l-5 5M15.5 8.5l-5 5M9 12l-6 6M3 21h10",
  pul: "M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 10v4M18 10v4",
  qamoq: "M4 4h16v16H4zM8 4v16M12 4v16M16 4v16",
  hujjat: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
  ogohlantirish: "M12 3l10 18H2zM12 10v5M12 18v.01",
  togri: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6",
  mashina: "M3 13l2-5h14l2 5v5H3zM3 13h18M7 18v2M17 18v2",
  uy: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6",
  chegara: "M5 21V4M5 4h11l-2 4 2 4H5",
  back: "M15 5l-7 7 7 7", chev: "M9 5l7 7-7 7", plus: "M12 5v14M5 12h14", close: "M6 6l12 12M18 6L6 18",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2", search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v2H6", bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3", list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10", card: "M3 6h18v12H3zM3 10h18", star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  sound: "M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6", mute: "M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6",
  video: "M3 6h13v12H3zM16 10l5-3v10l-5-3", spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  kodeks: "M5 3h11l3 3v15H5zM9 8h6M9 12h6M9 16h4", calc: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01M9 18h.01M12 18h3", aliment: "M7 21v-5l-3-3 3-6h3l2 3 2-3h3l3 6-3 3v5M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9h8M8 12h8M8 15h5", camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z", qaror: "M6 3h12v18l-6-4-6 4z", konst: "M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z",
};
const MARK = (s = 34, bg = "#0F5F66") => `<svg width="${s}" height="${s}" viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" rx="30" fill="${bg}"/><path d="M38 30V90" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M38 30H57C77 30 90 43 90 60C90 77 77 90 57 90H38" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><g stroke="#9FD3D6" stroke-width="5" stroke-linecap="round"><path d="M51 51H70"/><path d="M51 61H75"/><path d="M51 71H65"/></g><path d="M93 13L96.5 23.5L107 27L96.5 30.5L93 41L89.5 30.5L79 27L89.5 23.5Z" fill="#F2B134"/></svg>`;
const CHOL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="cholsvg" aria-hidden="true"> <defs> <radialGradient id="gBg" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#23949C"/><stop offset=".55" stop-color="#0F5F66"/><stop offset="1" stop-color="#07363B"/></radialGradient> <radialGradient id="gSkin" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#FAD9B8"/><stop offset=".6" stop-color="#EDB98D"/><stop offset="1" stop-color="#C98559"/></radialGradient> <radialGradient id="gNose" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#F7CBA4"/><stop offset="1" stop-color="#D18E62"/></radialGradient> <linearGradient id="gBeard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#E9EDF0"/><stop offset="1" stop-color="#C5CDD3"/></linearGradient> <linearGradient id="gBeardSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient> <radialGradient id="gDoppi" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#4A4A4A"/><stop offset=".45" stop-color="#1C1C1C"/><stop offset="1" stop-color="#050505"/></radialGradient> <linearGradient id="gChapan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0A2C55"/><stop offset=".5" stop-color="#174A86"/><stop offset="1" stop-color="#0A2C55"/></linearGradient> <linearGradient id="gShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient> <clipPath id="clip"><circle cx="256" cy="256" r="236"/></clipPath> <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#00262A" flood-opacity=".45"/></filter> </defs> <ellipse cx="256" cy="496" rx="170" ry="12" fill="#000" opacity=".18"/> <g id="badge"><circle cx="256" cy="256" r="244" fill="#F2B134"/><circle cx="256" cy="256" r="236" fill="url(#gBg)"/></g> <g clip-path="url(#clip)"> <g id="chapan" filter="url(#soft)"> <path d="M70 520C80 430 160 392 210 384L256 446L302 384C352 392 432 430 442 520Z" fill="url(#gChapan)"/> <g stroke-width="7" opacity=".9"> <path d="M120 520C126 462 150 430 178 412" stroke="#F2B134"/><path d="M150 520C156 470 176 440 200 424" stroke="#2BB3A3"/> <path d="M392 520C386 462 362 430 334 412" stroke="#F2B134"/><path d="M362 520C356 470 336 440 312 424" stroke="#2BB3A3"/> <path d="M96 520C102 470 124 440 150 420" stroke="#C0392B"/><path d="M416 520C410 470 388 440 362 420" stroke="#C0392B"/> </g> <path d="M70 520C80 430 160 392 210 384L256 446L302 384C352 392 432 430 442 520Z" fill="url(#gShade)"/> </g> <g id="face" filter="url(#soft)"> <ellipse cx="168" cy="262" rx="17" ry="27" fill="url(#gNose)"/><ellipse cx="344" cy="262" rx="17" ry="27" fill="url(#gNose)"/> <ellipse cx="256" cy="262" rx="88" ry="100" fill="url(#gSkin)"/> <ellipse cx="226" cy="222" rx="34" ry="20" fill="#fff" opacity=".18"/> <circle cx="204" cy="272" r="17" fill="#E8826F" opacity=".35"/><circle cx="308" cy="272" r="17" fill="#E8826F" opacity=".35"/> </g> <g id="brows" class="brows"> <path d="M198 214C210 196 236 194 248 210C232 206 214 210 202 222Z" fill="#FFFFFF" stroke="#C9D1D6" stroke-width="2"/> <path d="M314 214C302 196 276 194 264 210C280 206 298 210 310 222Z" fill="#FFFFFF" stroke="#C9D1D6" stroke-width="2"/> </g> <g id="eyes" fill="none" stroke="#3B2A20" stroke-width="5.5" stroke-linecap="round"> <path d="M207 238Q223 251 239 238"/><path d="M273 238Q289 251 305 238"/> <path d="M198 244l-7 4M314 244l7 4" stroke-width="3" opacity=".6"/> </g> <g id="beard" class="jaw" filter="url(#soft)"> <path d="M168 266C164 330 186 404 222 438C232 448 244 458 256 464C268 458 280 448 290 438C326 404 348 330 344 266C334 296 306 312 292 306C282 320 268 326 256 326C244 326 230 320 220 306C206 312 178 296 168 266Z" fill="url(#gBeard)"/> <path d="M168 266C164 330 186 404 222 438C232 448 244 458 256 464C268 458 280 448 290 438C326 404 348 330 344 266C334 296 306 312 292 306C282 320 268 326 256 326C244 326 230 320 220 306C206 312 178 296 168 266Z" fill="url(#gBeardSide)"/> <g fill="none" stroke="#B9C3CA" stroke-width="3" stroke-linecap="round" opacity=".8"> <path d="M200 330C204 370 218 400 236 424"/><path d="M228 344C230 378 238 406 248 430"/><path d="M256 340V440"/> <path d="M284 344C282 378 274 406 264 430"/><path d="M312 330C308 370 294 400 276 424"/> </g> </g> <g id="mouthG"><ellipse class="mouth" cx="256" cy="316" rx="20" ry="2" fill="#4A1C14"/><ellipse class="tongue" cx="256" cy="322" rx="11" ry="0" fill="#C2564A"/></g> <path d="M256 236C243 260 238 280 256 290C274 280 269 260 256 236Z" fill="url(#gNose)"/> <ellipse cx="250" cy="270" rx="5" ry="7" fill="#fff" opacity=".35"/> <g id="mustache" filter="url(#soft)"> <path d="M256 294C236 280 204 284 186 308C210 302 232 310 256 304C280 310 302 302 326 308C308 284 276 280 256 294Z" fill="url(#gBeard)"/> </g> <g id="doppi" filter="url(#soft)"> <path d="M160 200C158 136 200 100 256 100C312 100 354 136 352 200Z" fill="url(#gDoppi)"/> <path d="M156 188Q256 170 356 188L356 210Q256 192 156 210Z" fill="#111"/> <path d="M164 198l10 -8l10 8l10 -8l10 8l10 -8l10 8l10 -8l10 8l10 -8l10 8l10 -8l10 8l10 -8l10 8l10 -8l10 8l10 -8" fill="none" stroke="#FFFFFF" stroke-width="2.5" opacity=".85"/> <g fill="#FFFFFF"> <path d="M256 112C274 126 276 152 256 170C238 152 240 126 256 112Z"/> <path d="M206 128C222 136 230 160 216 178C200 166 196 142 206 128Z" opacity=".95"/> <path d="M306 128C290 136 282 160 296 178C312 166 316 142 306 128Z" opacity=".95"/> </g> <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"> <path d="M256 112C262 104 270 104 272 110"/><path d="M206 128C204 118 210 112 216 116"/><path d="M306 128C308 118 302 112 296 116"/> </g> <ellipse cx="222" cy="120" rx="26" ry="12" fill="#fff" opacity=".12" transform="rotate(-25 222 120)"/> </g> </g> <path id="spark" d="M392 70L401 97L428 106L401 115L392 142L383 115L356 106L383 97Z" fill="#F2B134" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/> <ellipse cx="200" cy="96" rx="120" ry="40" fill="#FFFFFF" opacity=".07" transform="rotate(-20 200 96)"/> </svg>';
const WARN = `<div class="warnline">${'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2zM12 10v5M12 18v.01"/></svg>'} Bu javob tavsiyaviy xarakterga ega</div>`;
const asosHTML = (a) => (a || []).length ? `<div class="asos"><b>Asos:</b><ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
const icon = (n, s = 22, w = 1.9) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.hujjat}"/></svg>`;
const fill = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const PLAY = "M8 5l11 7-11 7z", PAUSE = "M7 5h3v14H7zM14 5h3v14h-3z";
const MIC = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;

/* ---------------- yordamchilar ---------------- */
let tT;
function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => el.classList.remove("on"), 3400); }
const loading = () => `<div class="card"><div class="typing"><i></i><i></i><i></i></div></div>`;
const errBox = (e) => `<div class="card"><p class="err">${esc(e.message || e)}</p>${e.code === 402 ? `<a class="btn acc" href="#profil">Limitni oşiriş</a>` : ""}</div>`;
const som = (n) => Number(n).toLocaleString("ru-RU").replace(/ /g, " ") + " söm";
const dfmt = (s) => { if (!s) return ""; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("ru-RU"); };
const daysLeft = (s) => Math.max(0, Math.ceil((new Date(s + "T23:59:59") - new Date()) / 864e5));

async function api(path, { body, form, blob, method } = {}) {
  const h = { "X-Lang": I.lang }; if (S.token) h.Authorization = "Bearer " + S.token;
  let opt = { method: method || (body || form ? "POST" : "GET"), headers: h };
  if (form) opt.body = form; else if (body) { h["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
  let r;
  try { r = await fetch("api/" + path, opt); } catch (e) { throw new Error("Server bilan aloqa yöq. Backend işlayaptimi?"); }
  if (r.status === 401 && !path.startsWith("auth")) { S.token = null; ls.set("hq_token", null); location.hash = "login"; throw new Error("Tizimga kiring"); }
  if (!r.ok) {
    let msg = "Xato " + r.status; try { msg = (await r.json()).detail || msg; } catch (e) {}
    const er = new Error(msg); er.code = r.status; if (r.status === 402) toast(msg); throw er;
  }
  return blob ? r.blob() : r.json();
}

function findQuote(text, q) {
  if (!q) return -1;
  const n = (s) => s.replace(/[ʻʼ‘’`´]/g, "'").toLowerCase();
  const T = n(text); let Q = n(q).trim(); let i = T.indexOf(Q);
  if (i < 0) { Q = Q.split(/\s+/).slice(0, 6).join(" "); i = T.indexOf(Q); if (i >= 0) return [i, Q.length]; return -1; }
  return [i, Q.length];
}
function hlText(text, q) {
  const f = findQuote(text, q); if (f === -1) return esc(text);
  return esc(text.slice(0, f[0])) + `<mark class="hlm">${esc(text.slice(f[0], f[0] + f[1]))}</mark>` + esc(text.slice(f[0] + f[1]));
}

/* ---------------- ovoz yozish (16 kHz WAV) ---------------- */
async function recordWav() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), bufs = [];
  proc.onaudioprocess = (e) => bufs.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  src.connect(proc); proc.connect(ctx.destination);
  const t0 = Date.now();
  return {
    async stop() {
      proc.disconnect(); src.disconnect(); stream.getTracks().forEach((t) => t.stop());
      const rate = ctx.sampleRate; await ctx.close();
      if (Date.now() - t0 < 900) throw new Error("Juda qisqa. Bosib, 2–3 soniya gapiring.");
      const len = bufs.reduce((n, b) => n + b.length, 0), all = new Float32Array(len); let o = 0;
      for (const b of bufs) { all.set(b, o); o += b.length; }
      const ratio = rate / 16000, outLen = Math.floor(len / ratio), pcm = new Int16Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const a = Math.floor(i * ratio), z = Math.min(len, Math.floor((i + 1) * ratio)); let sum = 0;
        for (let j = a; j < z; j++) sum += all[j];
        const v = Math.max(-1, Math.min(1, sum / Math.max(1, z - a))); pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      const buf = new ArrayBuffer(44 + pcm.length * 2), d = new DataView(buf), w = (p, s) => { for (let i = 0; i < s.length; i++) d.setUint8(p + i, s.charCodeAt(i)); };
      w(0, "RIFF"); d.setUint32(4, 36 + pcm.length * 2, true); w(8, "WAVE"); w(12, "fmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
      d.setUint32(24, 16000, true); d.setUint32(28, 32000, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); w(36, "data"); d.setUint32(40, pcm.length * 2, true);
      new Int16Array(buf, 44).set(pcm);
      return new Blob([buf], { type: "audio/wav" });
    },
  };
}
let REC = null;
/** Tugmani ovoz yozish tugmasiga aylantiradi: bosish — boshlash, yana bosish — to'xtatish. onWav(blob) */
async function toggleRec(btn, onWav) {
  if (REC) {
    const r = REC; REC = null; document.querySelectorAll(".rec").forEach((b) => b.classList.remove("rec"));
    try { onWav(await r.stop()); } catch (e) { toast(e.message); }
    return;
  }
  if (!S.status.stt) return toast("Ovoz uçun VoiceLab kaliti ulanmagan. Yozib yuboring.");
  try { REC = await recordWav(); btn.classList.add("rec"); toast("Gapiring… tugatgaç yana bosing"); }
  catch (e) { REC = null; toast("Mikrofonga ruxsat berilmadi"); }
}
async function sttText(wav) { const fd = new FormData(); fd.append("file", wav, "ovoz.wav"); return (await api("stt", { form: fd })).text; }

/* ---------------- sarlavha, so'rov paneli ---------------- */
function top({ title, back, right = "" } = {}) {
  $("top").innerHTML = title
    ? `${back !== false ? `<a class="ib" href="${back || "#home"}" aria-label="Orqaga">${icon("back")}</a>` : ""}<span class="ttl">${esc(title)}</span>${right}`
    : `<a class="brand" href="#home" data-notr>${MARK(34)}<b>Donişmand <span class="ai">AI</span></b></a><span style="flex:1"></span>${right}`;
}
let askHandler = null;
function ask(placeholder, handler) {
  $("askbar").hidden = !placeholder; document.body.classList.toggle("has-ask", !!placeholder);
  $("askIn").placeholder = placeholder || ""; $("askIn").value = ""; askHandler = handler;
}
$("askbar").onsubmit = (e) => { e.preventDefault(); const t = $("askIn").value.trim(); if (t && askHandler) { $("askIn").value = ""; askHandler(t); } };
$("askMic").onclick = () => toggleRec($("askMic"), async (wav) => {
  $("askIn").placeholder = "Tanilmoqda…";
  try { const t = await sttText(wav); if (t && askHandler) { S.voiceNext = true; askHandler(t); } } catch (e) { toast(e.message); }
  $("askIn").placeholder = "";
});
window.addEventListener("scroll", () => $("top").classList.toggle("sc", scrollY > 4), { passive: true });

/* ---------------- marshrutlar ---------------- */
const R = [
  [/^login$/, login], [/^(home)?$/, home], [/^loyihalar$/, drafts], [/^loyiha\/(.+)$/, draft],
  [/^savod$/, savod], [/^qonunlar\/(\w+)$/, lawsList], [/^qonun\/([\w-]+)$/, law], [/^modda\/([\w-]+)\/([\w-]+)$/, article],
  [/^huquq$/, rights], [/^huquq\/(.+)$/, rightTopic], [/^ariza$/, organs], [/^idora\/(\w+)$/, organ], [/^yoz$/, writeApp],
  [/^chat(?:\/(\d+))?$/, chat], [/^fayl$/, faylPage], [/^hisob$/, hisobMenu], [/^hisob\/(\w+)$/, hisobTool], [/^profil$/, profile], [/^tarif$/, tariffs], [/^arizalarim$/, myApps],
];
async function route() {
  stopVoice();
  const h = decodeURIComponent(location.hash.slice(1));
  if (!S.token && h !== "login") { location.hash = "login"; return; }
  const m = R.find(([rx]) => rx.test(h)) || R[1];
  const args = h.match(m[0]) || [];
  $("bar").hidden = m[1] === login; $("top").hidden = m[1] === login; ask(null);
  document.querySelectorAll(".bar a").forEach((a) => a.classList.toggle("on", (h || "home").startsWith(a.dataset.t)));
  $("main").innerHTML = loading(); scrollTo(0, 0);
  try { await m[1](...args.slice(1)); } catch (e) { $("main").innerHTML = errBox(e); }
}
window.addEventListener("hashchange", route);
const go = (h) => { if (location.hash === "#" + h) route(); else location.hash = h; };
const view = (html) => { $("main").innerHTML = `<div class="view">${html}</div>`; return $("main").firstElementChild; };

/* ---------------- kirish (OneID demo) ---------------- */
async function login() {
  $("top").innerHTML = ""; $("top").hidden = true;
  $("main").innerHTML = `<div class="login">
    <div class="big">${icon("tarozi", 300, 1.2)}</div>
    <div class="langs" data-notr>${Object.entries(I.LANGS).map(([k, n]) => `<button class="${k === I.lang ? "on" : ""}" data-l="${k}">${n}</button>`).join("")}</div>
    <div>
      <img src="static/brand/donishmand-chol.svg" width="150" height="150" alt="" class="chol">
      <h1 style="margin-top:14px" data-notr>Donişmand <span class="ai">AI</span></h1>
      <p>Qonunni tuşuning, huquqingizni biling, arizangizni bir neçta daqiqada tayyorlang.</p>
      <div class="feat">
        <div><i>${icon("bell", 16)}</i>Yangi qonun loyihalari haqida xabar</div>
        <div><i>${icon("book", 16)}</i>Kodeks va qonunlar — sodda tilda</div>
        <div><i>${icon("hujjat", 16)}</i>Ariza va şikoyatni AI tayyorlaydi</div>
      </div>
    </div>
    <div class="stack">
      ${installCard().replace("card", "card").replace('class="install card"', 'class="install card" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff"')}
      <button class="oneid" id="oneid">${icon("politsiya", 22)} OneID orqali kiriş</button>
      <p class="note" style="color:#CFE7E8;text-align:center;margin:0">Demo: haqiqiy OneID ulaniş uçun davlat tomonidan beriladigan rasmiy kalit kerak.</p>
    </div></div>`;
  $("main").querySelector(".langs").onclick = (e) => { const b = e.target.closest("[data-l]"); if (b) I.setLang(b.dataset.l); };
  $("oneid").onclick = () => {
    const sh = document.createElement("div"); sh.className = "sheet";
    sh.innerHTML = `<form class="box"><h2>OneID (demo kiriş)</h2><p class="sub">Haqiqiy tizimda ma'lumotlar OneID dan avtomatik olinadi.</p>
      <label class="f">F.I.Ş.<input name="fio" value="Aliyev Vali Karimoviç" required></label>
      <button class="btn acc block">Kiriş</button><button type="button" class="btn ghost block" data-x>Bekor qiliş</button></form>`;
    document.body.appendChild(sh);
    sh.querySelector("[data-x]").onclick = () => sh.remove();
    sh.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      try { const r = await api("auth/oneid", { body: { fio: e.target.fio.value } }); S.token = r.token; ls.set("hq_token", r.token); sh.remove(); $("top").hidden = false; go("home"); }
      catch (er) { toast(er.message); }
    };
  };
}

/* ---------------- 0. Bosh sahifa ---------------- */
async function home() {
  $("top").hidden = false;
  const [h, me] = await Promise.all([api("home"), api("me")]);
  top({ right: `<span class="pill ${S.status.mock ? "gold" : ""}">${S.status.mock ? "Demo" : "AI"}</span>` });
  const u = h.usage, first = (me.fio || "").split(" ")[1] || me.fio;
  view(`
    <div class="hello"><span class="sub">Assalomu alaykum,</span><h1>${esc(first)}</h1></div>${installCard()}
    <div class="grid2">
      <a class="tile t1" href="#loyihalar">${h.yangi_loyihalar ? `<span class="dot" aria-label="${h.yangi_loyihalar} ta yangi">${h.yangi_loyihalar}</span>` : ""}
        <span class="ic">${icon("bell", 26)}</span><span><b>Yangi qabul qilinayotgan qonunlar</b><span>Muhokamadagi loyihalar</span></span><span class="deco">${icon("bell", 120, 1)}</span></a>
      <a class="tile t2" href="#savod"><span class="ic">${icon("book", 26)}</span><span><b>Huquqiy savodxonlik</b><span>Kodeks, qonun, qarorlar</span></span><span class="deco">${icon("book", 120, 1)}</span></a>
      <a class="tile t3" href="#huquq"><span class="ic">${icon("tarozi", 26)}</span><span><b>Huquq va majburiyatlarim</b><span>Hayotiy vaziyatlar böyiça</span></span><span class="deco">${icon("tarozi", 120, 1)}</span></a>
      <a class="tile t4" href="#ariza"><span class="ic">${icon("hujjat", 26)}</span><span><b>Ariza yuboriş</b><span>Qayerga va qanday</span></span><span class="deco">${icon("hujjat", 120, 1)}</span></a>
    </div>
    <a class="mini filecta" href="#fayl"><span class="ic">${icon("scan", 22)}</span><span style="flex:1"><b>Hujjatni AI tekşirsin</b><br><span class="note">Rasm, PDF — jarima, qaror, şartnoma</span></span>${icon("chev", 18)}</a>
    <a class="mini calccta" href="#hisob"><span class="ic">${icon("calc", 22)}</span><span style="flex:1"><b>Hisoblab ber</b><br><span class="note">Davlat boji, sud muddati, aliment</span></span>${icon("chev", 18)}</a>
    <a class="mini" href="#profil"><span style="flex:1"><span class="row between" style="font-size:13px;margin-bottom:6px"><b>Bugungi limit</b><span class="note">${u.qoldi + u.qoshimcha} kredit qoldi</span></span>
      <span class="meter" style="display:block"><i style="width:${Math.round(100 * u.qoldi / u.kunlik_limit)}%"></i></span></span>${icon("chev", 18)}</a>
    <div class="stack"><h3>Tezkor savollar</h3><div class="chips" id="quick"></div></div>`);
  const qs = ["Meni YPX töxtatdi, hujjatlarim yonimda emas edi. Javobgarlik bormi?", "Ish beruvçi 2 oydan beri maoş bermayapti", "Jinoyat kodeksining 169-moddasi", "Sud ajrimiga qanday şikoyat beraman?"];
  $("quick").innerHTML = qs.map((q, i) => `<button class="chip" data-i="${i}">${esc(q)}</button>`).join("");
  $("quick").onclick = (e) => { const b = e.target.closest(".chip"); if (b) { S.pendingQ = L(qs[b.dataset.i]); S.chatId = null; go("chat"); } };
}

/* ---------------- 1. Yangi qonun loyihalari ---------------- */
function ring(left, total) {
  const r = 26, c = 2 * Math.PI * r, p = Math.max(0.04, Math.min(1, left / Math.max(1, total)));
  return `<div class="ring"><svg width="62" height="62"><circle cx="31" cy="31" r="${r}" stroke="#E3ECEE" stroke-width="6" fill="none"/><circle cx="31" cy="31" r="${r}" stroke="${left <= 3 ? "#A12B2B" : "#0F5F66"}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="${c * p} ${c}"/></svg><b>${left}<small>kun</small></b></div>`;
}
async function drafts() {
  top({ title: "Yangi qonun loyihalari" });
  const list = await api("drafts");
  const nw = list.filter((d) => d.yangi).length;
  view(`<div class="info"><b>Muhokamada</b>Loyihalarni qabul qilinişidan oldin örganing va savol bering. ${nw ? `<span class="tag red">${nw} ta yangi</span>` : ""}</div>
    <div class="list">${list.map((d) => {
      const qabul = d.holat === "qabul";
      const tot = qabul ? 1 : Math.max(1, Math.round((new Date(d.tugash) - new Date(d.joylangan)) / 864e5)), left = qabul ? 0 : daysLeft(d.tugash);
      const meta = qabul ? `Qabul qilingan: ${dfmt(d.joylangan)} · Kuchga kirgan: ${dfmt(d.kuchga)}` : `Joylandi: ${dfmt(d.joylangan)} · Muhokama: ${dfmt(d.tugash)} gaça`;
      return `<a class="draft ${d.yangi ? "new" : ""}" href="#loyiha/${esc(d.id)}">${d.yangi ? `<span class="rdot" aria-label="Yangi"></span>` : ""}${qabul ? `<div class="ring ok">${icon("togri", 34, 2)}<small>Qabul</small></div>` : ring(left, tot)}
        <div><div class="row" style="gap:6px;margin-bottom:6px"><span class="tag">${esc(d.soha)}</span><span class="note">${esc(d.turi)}</span></div>
        <h3>${esc(d.nomi)}</h3><p>${esc(d.qisqa)}</p><p class="note" style="margin-top:6px">${meta}</p></div></a>`;
    }).join("")}</div>
    <p class="note">Namuna loyihalar. Haqiqiy versiyada regulation.gov.uz dan avtomatik olinadi.</p>`);
}
async function draft(id) {
  const d = await api("drafts/" + id);
  top({ title: d.nomi, back: "#loyihalar" });
  const v = view(`
    <div class="row" style="gap:6px"><span class="tag">${esc(d.soha)}</span><span class="tag">${esc(d.turi)}</span>${d.holat === "qabul" ? `<span class="tag" style="background:var(--green-soft);color:var(--green)">Kuchga kirgan: ${dfmt(d.kuchga)}</span>` : `<span class="tag red">${daysLeft(d.tugash)} kun qoldi</span>`}</div>
    <h2>${esc(d.nomi)}</h2>${d.manba ? `<a class="note" href="${esc(d.manba)}">lex.uz da oçiş</a>` : ""}
    <div class="info"><b>Qisqaça mazmun</b>${esc(d.qisqa)}</div>
    <div id="qaOut" class="stack"></div>
    <h3>Loyiha matni</h3>
    ${d.bolimlar.length ? "" : `<div class="info warn"><b>Matn yuklanmagan</b>Terminalda: python backend\\scrape_lex.py --hammasi</div>`}
    <div class="stack" id="secs">${d.bolimlar.map((s) => `<details class="sec" data-id="${esc(s.id)}"><summary>${esc(s.sarlavha)}<span>${icon("chev", 16)}</span></summary><div class="tx">${esc(s.matn)}</div></details>`).join("")}</div>`);
  ask("Loyiha böyiça savol bering…", (q) => qa(q, "drafts/" + id + "/ask", (b) => openSec(d.bolimlar, b)));
}
function openSec(secs, it) {
  const s = secs.find((x) => String(x.id) === String(it.bolim_id)); if (!s) return;
  const el = document.querySelector(`.sec[data-id="${CSS.escape(String(s.id))}"]`); if (!el) return;
  document.querySelectorAll(".sec.hl").forEach((x) => x.classList.remove("hl"));
  el.open = true; el.classList.add("hl"); el.querySelector(".tx").innerHTML = hlText(s.matn, it.parcha);
  (el.querySelector(".hlm") || el).scrollIntoView({ behavior: "smooth", block: "center" });
}
async function qa(q, path, onCite) {
  const out = $("qaOut"); out.innerHTML = loading(); out.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const r = await api(path, { body: { question: q } });
    out.innerHTML = `<div class="qa ${r.topildi ? "" : "no"}">${WARN}<span class="q">Savol: ${esc(q)}</span><p>${esc(r.javob)}</p>
      ${r.topildi && (r.iqtiboslar || []).length ? `<div class="src">${r.iqtiboslar.map((it, i) => `<button data-i="${i}">${icon("search", 14)} Matnda körsat${r.iqtiboslar.length > 1 ? " " + (i + 1) : ""}</button>`).join("")}</div>` : ""}
      ${!r.topildi ? `<span class="note">AI faqat şu hujjat matnidan javob beradi.</span>` : ""}</div>`;
    out.onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) onCite(r.iqtiboslar[b.dataset.i]); };
    if (S.voiceNext) { S.voiceNext = false; autoSpeak(r.javob, out.firstElementChild); }
    if (r.topildi && r.iqtiboslar?.length) onCite(r.iqtiboslar[0]);
  } catch (e) { out.innerHTML = errBox(e); }
}

/* ---------------- 2. Huquqiy savodxonlik ---------------- */
const TICON = { konst: "konst", kodeks: "kodeks", orq: "book", pf: "qaror", pq: "qaror", vmq: "hujjat", boshqa: "list" };
async function savod() {
  top({ title: "Huquqiy savodxonlik" });
  const cats = await api("laws/categories");
  view(`<p class="sub">Hujjat turini tanlang yoki pastda masalangizni yozing/ayting — AI kerakli qonunlarni topadi.</p>
    <div class="cats">${cats.map((c) => `<a class="cat" href="#qonunlar/${c.type}"><span class="ic">${icon(TICON[c.type], 20)}</span><span><b>${esc(c.nomi)}</b><br><span>${c.soni} ta hujjat</span></span></a>`).join("")}</div>
    <div id="findOut" class="stack"></div>`);
  ask("Qaysi masala böyiça qonun kerak?", (q) => findLaws(q, ""));
}
async function findLaws(q, type) {
  const out = $("findOut"); out.innerHTML = loading(); out.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const r = await api("laws/find", { body: { query: q, type } });
    out.innerHTML = `<h3>«${esc(q)}» böyiça</h3>` + (r.length ? r.map((d) => `<div class="card law">
      <a href="#qonun/${d.short}" style="text-decoration:none;color:inherit"><span class="date">${dfmt(d.date)}</span><h3>${esc(d.title)}</h3></a>
      <div class="chips">${d.topilgan.map((m) => `<a class="chip" href="#modda/${d.short}/${m.number}">${esc(m.number)}-modda. ${esc(m.title).slice(0, 40)}</a>`).join("")}</div></div>`).join("")
      : `<div class="empty">Mos hujjat topilmadi. Bazaga qonunlarni yuklang.</div>`);
  } catch (e) { out.innerHTML = errBox(e); }
}
async function lawsList(type) {
  const cats = await api("laws/categories"), c = cats.find((x) => x.type === type) || { nomi: "Hujjatlar" };
  top({ title: c.nomi, back: "#savod" });
  const list = await api("laws?type=" + type);
  view(`<p class="sub">Eng yangilari birinçi</p>
    <div class="list">${list.map((d) => `<a class="item law" href="#qonun/${d.short}"><span class="ic">${icon(TICON[d.type], 20)}</span><span><span class="date">${dfmt(d.date)}</span><b>${esc(d.title)}</b><small>${esc(d.soha || "")}${d.moddalar ? " · " + d.moddalar + " ta modda" : ""}</small></span><span class="chev">${icon("chev", 18)}</span></a>`).join("")
      || `<div class="empty">Bu turdagi hujjatlar hali bazaga yuklanmagan.<br>scrape_lex.py bilan yuklang.</div>`}</div>
    <div id="findOut" class="stack"></div>`);
  ask("Şu turdagi hujjatlardan qidiriş…", (q) => findLaws(q, type));
}
async function law(short) {
  const d = await api("laws/" + short);
  top({ title: d.title, back: "#qonunlar/" + d.type });
  const body = d.tuzilma
    ? `<div class="tree stack">${d.tuzilma.map((b, bi) => `<details ${bi === 0 ? "open" : ""}><summary>${esc(b.nomi || "Moddalar")}</summary>${b.boblar.map((c) => `<details class="bob" open><summary>${esc(c.nomi || "—")}</summary>${c.moddalar.map((m) => `<a class="m" href="#modda/${short}/${m.number}"><b>${esc(m.number)}-m.</b><span>${esc(m.title)}</span></a>`).join("")}</details>`).join("")}</details>`).join("")}</div>`
    : `<div class="stack" id="secs">${d.bolimlar.map((s) => `<details class="sec" data-id="${esc(s.id)}"><summary>${esc(s.sarlavha)}<span>${icon("chev", 16)}</span></summary><div class="tx">${esc(s.matn)}</div></details>`).join("")}</div>`;
  view(`<div class="row" style="gap:6px"><span class="tag">${esc(d.soha || d.type)}</span><span class="note">${dfmt(d.date)} · ${d.moddalar} ta modda</span></div>
    <h2>${esc(d.title)}</h2>
    <a class="note" href="${esc(d.url)}">lex.uz da oçiş</a>
    <div id="qaOut" class="stack"></div>${body}`);
  ask("Hujjat içidan savol bering…", (q) => qa(q, "laws/" + short + "/ask", (it) => {
    if (d.tuzilma) { S.hl = it.parcha; go(`modda/${short}/${it.bolim_id.split("-").slice(1).join("-")}`); }
    else openSec(d.bolimlar.map((s) => ({ id: s.id, matn: s.matn })), it);
  }));
}
async function article(short, num) {
  const a = await api(`laws/${short}/${num}`);
  top({ title: `${short} ${num}-modda`, back: "#qonun/" + short });
  const hl = S.hl; S.hl = null;
  const v = view(`<span class="note">${esc(a.hujjat)}${a.bolim ? " › " + esc(a.bolim) : ""}${a.bob ? " › " + esc(a.bob) : ""}</span>
    <h2>${esc(a.number)}-modda. ${esc(a.title)}</h2>
    <div class="card"><div class="article">${hlText(a.matn, hl)}</div><a class="note" href="${esc(a.url)}">Manba: lex.uz</a></div>
    <div class="row"><button class="btn acc" data-a="explain">${icon("spark", 18)} AI tuşuntirsin</button><button class="btn" data-a="video">${icon("video", 18)} Video yaratiş</button>
      ${a.video ? `<button class="btn line" data-a="mp4">Tayyor video</button>` : ""}</div>
    <div id="expOut" class="stack"></div><div id="qaOut" class="stack"></div>`);
  if (hl) setTimeout(() => document.querySelector(".hlm")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
  v.onclick = async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "mp4") playMp4(a.video);
    if (b.dataset.a === "video") makeVideo(short, num, b);
    if (b.dataset.a === "explain") {
      const out = $("expOut"); out.innerHTML = loading();
      try { const r = await api("article", { body: { doc: short, number: num } }); out.innerHTML = WARN + explainHTML(r, false); }
      catch (er) { out.innerHTML = errBox(er); }
    }
  };
  ask(`${num}-modda böyiça savol…`, (q) => qa(`${q} (${num}-modda)`, "laws/" + short + "/ask", (it) => {
    const el = document.querySelector(".article"); el.innerHTML = hlText(a.matn, it.parcha); el.querySelector(".hlm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
}
function explainHTML(r, offerVideo = true) {
  return `<div class="card"><h3>${esc(r.sarlavha)}</h3><p style="margin:0;font-size:15px;line-height:1.55">${esc(r.umumiy)}</p></div>
    ${(r.bandlar || []).map((b) => `<div class="band"><h4>${esc(b.nomi)}</h4><p>${esc(b.sodda)}</p>${b.misol ? `<div class="ex">Misol: ${esc(b.misol)}</div>` : ""}${b.oqibat ? `<span class="oq">${esc(b.oqibat)}</span>` : ""}</div>`).join("")}
    ${r.eslatma ? `<div class="info"><b>Eslatma</b>${esc(r.eslatma)}</div>` : ""}`;
}

/* ---------------- 3. Huquq va majburiyatlarim ---------------- */
let RIGHTS = null;
async function rights() {
  top({ title: "Huquq va majburiyatlarim" });
  RIGHTS = RIGHTS || await api("rights");
  const draw = () => {
    const ob = S.rtab === "m";
    view(`<div class="tabs2"><button class="${ob ? "" : "on"}" data-t="h">Huquqlarim</button><button class="${ob ? "on" : ""}" data-t="m">Majburiyatlarim</button></div>
      <p class="sub">${ob ? "Qaysi vaziyatda nimalarni bajarişingiz şart" : "Qaysi vaziyatda qanday huquqlaringiz bor"}</p>
      <div class="topics">${RIGHTS.map((t) => `<a class="topic ${ob ? "ob" : ""}" href="#huquq/${esc(t.id)}"><span class="ic">${icon(t.belgi, 20)}</span><b>${esc(t.nomi)}</b><span class="note">${(ob ? t.majburiyatlar : t.huquqlar).length} ta band</span></a>`).join("")}</div>`);
    $("main").querySelector(".tabs2").onclick = (e) => { const b = e.target.closest("button"); if (b) { S.rtab = b.dataset.t; draw(); } };
  };
  draw();
}
async function rightTopic(id) {
  RIGHTS = RIGHTS || await api("rights");
  const t = RIGHTS.find((x) => x.id === id); if (!t) throw new Error("Mavzu topilmadi");
  top({ title: t.nomi, back: "#huquq" });
  const draw = () => {
    const ob = S.rtab === "m", items = ob ? t.majburiyatlar : t.huquqlar;
    const v = view(`<div class="tabs2"><button class="${ob ? "" : "on"}" data-t="h">Huquqlarim</button><button class="${ob ? "on" : ""}" data-t="m">Majburiyatlarim</button></div>
      <ul class="blist ${ob ? "ob" : ""}">${items.map((x, i) => `<li><i>${i + 1}</i><span>${esc(x)}</span></li>`).join("")}</ul>
      <p class="note">Qisqa ma'lumot. Aniq norma va manba uçun AI dan söraşingiz mumkin.</p>
      ${t.asos ? `<div class="asos"><b>Asos:</b> ${esc(t.asos)}</div>` : ""}
      <div class="row">${t.video ? `<button class="btn" data-a="vid" style="flex:1">${icon("video", 18)} Video orqali tuşuntiriş</button>` : ""}<button class="btn acc" data-a="ai" style="flex:1">${icon("spark", 18)} AI tuşuntiriş</button></div>
      <div id="aiOut" class="stack"></div>`);
    v.querySelector(".tabs2").onclick = (e) => { const b = e.target.closest("button"); if (b) { S.rtab = b.dataset.t; draw(); } };
    v.querySelector("[data-a=vid]")?.addEventListener("click", () => playMp4(t.video));
    v.querySelector("[data-a=ai]").onclick = async () => {
      const out = $("aiOut"); out.innerHTML = loading();
      try { const r = await api("ask", { body: { question: t.id === "bojxona" ? (I.lang === "ru" ? "Сколько товаров можно беспошлинно ввезти через аэропорт, какая норма?" : "Aeroport orqali çet eldan qança miqdorda narsa bojsiz olib kirsa böladi, norma qança?") : `${t.sorov}. ${ob ? "Fuqaroning majburiyatlari" : "Fuqaroning huquqlari"} qanday? Faqat qonundan javob ber.` } }); out.innerHTML = answerHTML(r); bindAnswer(out, r); }
      catch (e) { out.innerHTML = errBox(e); }
    };
  };
  draw();
  ask(`«${t.nomi}» böyiça savol…`, (q) => { S.pendingQ = q; S.chatId = null; go("chat"); });
}

/* ---------------- 4. Ariza yuborish ---------------- */
async function organs() {
  top({ title: "Ariza yuboriş" });
  S.organs = S.organs || await api("organs");
  view(`<div class="info warn"><b>Qayerga murojaat qiliş kerakligini bilmaysizmi?</b>Pastda muammoingizni yozing yoki ayting — AI idora va ariza turini topadi.</div>
    <div id="routeOut" class="stack"></div>
    <h3>Idoralar</h3>
    <div class="list">${S.organs.map((o) => `<a class="item" href="#idora/${o.id}"><span class="ic">${icon(o.belgi, 20)}</span><span><b>${esc(o.nomi)}</b><small>${esc(o.tavsif)}</small></span><span class="chev">${icon("chev", 18)}</span></a>`).join("")}</div>`);
  ask("Muammoingizni ayting…", routeProblem);
}
async function routeProblem(q) {
  const out = $("routeOut"); out.innerHTML = loading(); out.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    S.organs = S.organs || await api("organs");
    const r = await api("organs/route", { body: { question: q } });
    const o = S.organs.find((x) => x.id === r.idora_id) || S.organs[0];
    out.innerHTML = `<div class="card"><span class="note">«${esc(q)}»</span>
      <div class="row"><span class="ic" style="width:44px;height:44px;border-radius:13px;background:var(--accent);color:#fff;display:grid;place-items:center">${icon(o.belgi, 22)}</span><span><b style="font-size:16px">${esc(o.nomi)}</b><br><span class="tag">${esc(r.ariza_turi)}</span></span></div>
      ${r.izoh ? `<p style="margin:0;font-size:14px;color:var(--mute)">${esc(r.izoh)}</p>` : ""}
      ${(r.qadamlar || []).length ? `<ol class="stack" style="margin:0;padding-left:20px;font-size:14px;gap:4px">${r.qadamlar.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}
      <div class="row"><button class="btn acc" data-a="yoz">Arizani tayyorlaş</button><a class="btn ghost" href="#idora/${o.id}">Idora sahifasi</a></div></div>`;
    out.querySelector("[data-a=yoz]").onclick = () => { S.form = { idora: o.nomi, idoraId: o.id, turi: r.ariza_turi, holat: q, mode: "ai" }; go("yoz"); };
    if (S.voiceNext) { S.voiceNext = false; autoSpeak(I.lang === "ru" ? `Обратитесь в: ${o.nomi}. ${r.ariza_turi}. ${r.izoh || ""}` : `${o.nomi}ga murojaat qiling. ${r.ariza_turi}. ${r.izoh || ""}`, out.firstElementChild); }
  } catch (e) { out.innerHTML = errBox(e); }
}
async function organ(id) {
  S.organs = S.organs || await api("organs");
  const o = S.organs.find((x) => x.id === id); if (!o) throw new Error("Idora topilmadi");
  top({ title: o.nomi, back: "#ariza" });
  const v = view(`<div class="card"><div class="row"><span class="ic" style="width:52px;height:52px;border-radius:15px;background:var(--accent);color:#fff;display:grid;place-items:center">${icon(o.belgi, 26)}</span>
      <span style="flex:1"><b style="font-size:17px">${esc(o.nomi)}</b><br><span class="note">${esc(o.tavsif)}</span></span></div>
      <div class="info"><b>Topşiriş kanali</b>${esc(o.kanal)} — <a href="${esc(o.url)}">${esc(o.url.replace("https://", ""))}</a></div></div>
    <h3>Ariza turini tanlang</h3>
    <div class="list">${o.arizalar.map((a, i) => `<button class="item" data-i="${i}"><span class="ic">${icon("hujjat", 20)}</span><span><b>${esc(a)}</b><small>AI yoki özingiz töldirasiz</small></span><span class="chev">${icon("chev", 18)}</span></button>`).join("")}</div>
    <div id="routeOut" class="stack"></div>`);
  v.querySelector(".list").onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) { S.form = { idora: o.nomi, idoraId: o.id, turi: o.arizalar[b.dataset.i], holat: "", mode: "ai" }; go("yoz"); } };
  ask("Qaysi biri kerakligini bilmasangiz, muammoni ayting…", routeProblem);
}
function writeApp() {
  const F = S.form || (S.form = { idora: "", turi: "", holat: "", mode: "ai" });
  top({ title: F.turi || "Ariza tayyorlaş", back: F.idoraId ? "#idora/" + F.idoraId : "#ariza" });
  const v = view(`
    <div class="row between"><span class="tag">${esc(F.idora || "Idora AI tomonidan aniqlanadi")}</span>
      <div class="seg"><button class="${F.mode === "ai" ? "on" : ""}" data-m="ai">AI ga aytaman</button><button class="${F.mode === "qol" ? "on" : ""}" data-m="qol">Özim töldiraman</button></div></div>
    <div class="steps" id="st"><span class="on">1. Holat</span><span>2. Ma'lumot</span><span>3. Körib çiqiş</span></div>
    <div id="formBox" class="stack"></div><div id="docOut" class="stack"></div>`);
  v.querySelector(".seg").onclick = (e) => { const b = e.target.closest("[data-m]"); if (b) { F.mode = b.dataset.m; writeApp(); } };
  const box = $("formBox");
  if (F.mode === "ai") {
    box.innerHTML = `<label class="f">Holatingizni yozing yoki ayting<textarea id="holat" placeholder="Masalan: Ish beruvçi 2 oydan beri ish haqimni bermayapti, 1-sentabrdan beri işlayman.">${esc(F.holat)}</textarea></label>
      <div class="row"><button class="btn acc" id="go">Davom etiş</button><button class="btn line" id="hm">${MIC} Ovoz bilan</button></div>`;
    $("hm").onclick = () => toggleRec($("hm"), async (w) => { try { $("holat").value = ($("holat").value + " " + await sttText(w)).trim(); } catch (e) { toast(e.message); } });
    $("go").onclick = () => { F.holat = $("holat").value.trim(); if (F.holat.length < 15) return toast("Holatni batafsilroq yozing"); F.javoblar = {}; docAI(); };
  } else {
    box.innerHTML = `<form class="stack" id="qf">
      <label class="f">F.I.Ş.<input name="fio" required></label>
      <label class="f">Yaşaş manzili<input name="manzil" required></label>
      <label class="f">Telefon<input name="tel" inputmode="tel"></label>
      <label class="f">Kimga (idora)<input name="kimga" value="${esc(F.idora)}" required></label>
      <label class="f">Mazmuni (nima böldi)<textarea name="mazmun" required></textarea></label>
      <label class="f">Talabingiz (har biri yangi qatorda)<textarea name="talab" style="min-height:80px" required></textarea></label>
      <label class="f">Ilovalar (ixtiyoriy, har biri yangi qatorda)<textarea name="ilova" style="min-height:60px"></textarea></label>
      <button class="btn acc">Körib çiqiş</button></form>`;
    $("qf").onsubmit = (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const lines = (s) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);
      const ru = I.lang === "ru";
      S.doc = { turi: F.turi || L("Ariza"), idora: f.kimga, kanal: "", nega: "", hujjat: { kimga: ru ? ["Руководителю", f.kimga] : [f.kimga, "rahbariga"],
        kimdan: [(ru ? "Заявитель: " : "Arizaçi: ") + f.fio, (ru ? "Адрес: " : "Manzil: ") + f.manzil, f.tel ? (ru ? "Тел.: " : "Tel: ") + f.tel : ""].filter(Boolean),
        sarlavha: (F.turi || (ru ? "Заявление" : "Ariza")).toUpperCase(), matn: lines(f.mazmun), soraymiz: lines(f.talab), ilovalar: lines(f.ilova) } };
      preview();
    };
  }
}
async function docAI() {
  const F = S.form, out = $("docOut"); out.innerHTML = loading(); out.scrollIntoView({ behavior: "smooth" });
  setSteps(1);
  try {
    const r = await api("document", { body: { holat: F.holat, javoblar: F.javoblar, turi: F.turi, idora: F.idora } });
    S.doc = r;
    const head = `<div class="card"><div class="row between"><span class="pill dark">${esc(r.turi)}</span><span class="note">${esc(r.idora)}</span></div>
      ${r.nega ? `<div class="info"><b>Nega aynan şu hujjat</b>${esc(r.nega)}</div>` : ""}${asosHTML(r.asos)}${r.mediatsiya ? `<div class="info med"><b>Sudsiz yöl: mediatsiya</b>${esc(r.mediatsiya)}</div>` : ""}</div>`;
    if ((r.yetishmaydi || []).length) {
      out.innerHTML = head + `<form class="card stack" id="qs"><h3>Bir neçta ma'lumot kerak</h3>
        ${r.yetishmaydi.map((q) => `<label class="f">${esc(q.savol)}<span class="row" style="flex-wrap:nowrap"><input name="${esc(q.kalit)}" autocomplete="off" style="flex:1"><button type="button" class="mic" data-mic="${esc(q.kalit)}" aria-label="Ovoz bilan">${MIC}</button></span></label>`).join("")}
        <div class="row"><button class="btn acc">Davom etiş</button><button class="btn ghost" type="button" id="skip">Ötkazib, körib çiqiş</button></div></form>`;
      $("qs").onsubmit = (e) => { e.preventDefault(); new FormData(e.target).forEach((v, k) => { if (v.trim()) F.javoblar[k] = v.trim(); }); docAI(); };
      $("qs").querySelectorAll("[data-mic]").forEach((b) => { b.onclick = () => toggleRec(b, async (w) => {
        const inp = $("qs").querySelector(`[name="${b.dataset.mic}"]`);
        try { inp.value = (await sttText(w)).replace(/[.!?]+$/, ""); } catch (e) { toast(e.message); }
      }); });
      $("skip").onclick = () => preview(head);
    } else preview(head);
  } catch (e) { out.innerHTML = errBox(e); setSteps(0); }
}
const setSteps = (n) => { const st = $("st"); if (st) [...st.children].forEach((s, i) => { s.className = i < n ? "done" : i === n ? "on" : ""; }); };
function paperHTML(h) {
  if (h.uslub === "ariza") return `<div class="paper"><div class="to b">${[...(h.kimga || []), ...(h.kimdan || [])].map((l) => `<div>${mark(l)}</div>`).join("")}</div>
    <h5>${mark(h.sarlavha)}</h5>${(h.matn || []).map((p) => `<p>${mark(p)}</p>`).join("")}
    ${(h.soraymiz || []).map((x, i) => `<p>${i + 1}. ${mark(x)}</p>`).join("")}
    ${(h.ilovalar || []).length ? `<div style="font-weight:700;margin-top:8px">Ilovalar:</div><ol>${h.ilovalar.map((x) => `<li>${mark(x)}</li>`).join("")}</ol>` : ""}
    <div class="sig b"><span>${esc((h.imzo || [])[0] || "")}</span><span>${esc((h.imzo || [])[1] || "")}</span></div></div>`;
  return `<div class="paper"><div class="to">${(h.kimga || []).map((l) => `<div>${mark(l)}</div>`).join("")}<div style="height:8px"></div>${(h.kimdan || []).map((l) => `<div>${mark(l)}</div>`).join("")}</div>
    <h5>${mark(h.sarlavha)}</h5>${(h.matn || []).map((p) => `<p>${mark(p)}</p>`).join("")}
    ${(h.soraymiz || []).length ? `<p class="req">Yuqoridagilarni inobatga olib, SÖRAYMAN:</p><ol>${h.soraymiz.map((x) => `<li>${mark(x)}</li>`).join("")}</ol>` : ""}
    ${(h.ilovalar || []).length ? `<div style="font-weight:700;margin-top:8px">Ilovalar:</div><ol>${h.ilovalar.map((x) => `<li>${mark(x)}</li>`).join("")}</ol>` : ""}
    <div class="sig"><span>«____» ________ ${new Date().getFullYear()} y.</span><span>Imzo: ________</span></div></div>`;
}
function preview(head = "") {
  setSteps(2);
  const r = S.doc, F = S.form || {};
  const o = (S.organs || []).find((x) => x.id === F.idoraId);
  $("docOut").innerHTML = head + WARN + paperHTML(r.hujjat) + `<div class="card">
    ${r.kanal || o ? `<div class="info"><b>Qanday topşiriladi</b>${esc(r.kanal || o.kanal)}${o ? ` — <a href="${esc(o.url)}">${esc(o.url.replace("https://", ""))}</a>` : ""}</div>` : ""}
    <p class="note" style="margin:0">Sariq [qavs] lardagi joylarni töldiring. Topşirişdan oldin tekşirib çiqing.</p>
    ${I.lang === "uz" ? `<label class="check"><input type="checkbox" id="old"> Eski yozuvda (o', g', sh, ch)</label>` : ""}
    <button class="btn acc block" id="dl">Tasdiqlayman — Word yuklab oliş</button></div>`;
  $("docOut").querySelector(".paper").scrollIntoView({ behavior: "smooth", block: "start" });
  $("dl").onclick = () => downloadDoc(r.hujjat, r.turi, r.idora || F.idora, true);
}
async function downloadDoc(hujjat, turi, idora, saqla) {
  try {
    const b = await api("document/docx", { body: { hujjat, eski: !!$("old")?.checked, nomi: turi || "hujjat", idora: idora || "", saqla }, blob: true });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = (turi || "hujjat") + ".docx"; document.body.appendChild(a); a.click(); a.remove();
    toast(saqla ? "Yuklab olindi va «Mening arizalarim»ga saqlandi" : "Yuklab olindi");
  } catch (e) { if (e.code !== 402) toast(e.message); }
}

/* ---------------- Chat (markaziy mikrofon) ---------------- */
async function chat(id) {
  S.chatId = id ? Number(id) : S.chatId;
  top({ title: "AI yordamçi", right: `<button class="ib" id="avB" aria-label="Ovozli javob" title="Ovozli javob">${icon(S.autoVoice ? "sound" : "mute")}</button><button class="ib" id="newC" aria-label="Yangi suhbat">${icon("plus")}</button><button class="ib" id="histB" aria-label="Suhbatlar tarixi">${icon("history")}</button>` });
  view(`<div id="chatBox" class="stack"></div>`);
  $("newC").onclick = () => { S.chatId = null; go("chat"); };
  $("avB").onclick = () => { S.autoVoice = !S.autoVoice; ls.set("hq_autovoice", S.autoVoice ? "1" : "0"); $("avB").innerHTML = icon(S.autoVoice ? "sound" : "mute"); if (!S.autoVoice) stopVoice(); toast(S.autoVoice ? "Ovozli javob yoqildi" : "Ovozli javob öçirildi"); };
  $("histB").onclick = openHistory;
  const box = $("chatBox");
  if (S.chatId) {
    const msgs = await api("chats/" + S.chatId);
    box.innerHTML = msgs.map((m) => m.role === "user" ? `<div class="msg-me">${esc(m.content.text)}</div>` : `<div data-r>${answerHTML(m.content)}</div>`).join("");
    box.querySelectorAll("[data-r]").forEach((el, i) => bindAnswer(el, msgs.filter((m) => m.role !== "user")[i].content));
  } else {
    box.innerHTML = `<div class="chat-hero"><img src="static/brand/donishmand-chol.svg" width="120" height="120" alt="" class="chol"><h2>Savolingizni ayting</h2>
      <p class="sub">Pastdagi mikrofonni bosing yoki yozing. Javob qonun moddasi bilan beriladi.</p></div>`;
  }
  ask("Savolingizni yozing…", (q) => sendChat(q));
  if (S.pendingQ) { const q = S.pendingQ; S.pendingQ = null; sendChat(q); }
  if (S.autoRec) { S.autoRec = false; voiceChat(); }
}
async function sendChat(q, voiceFn) {
  const box = $("chatBox"); if (!box) return;
  box.querySelector(".chat-hero")?.remove();
  if (q) box.insertAdjacentHTML("beforeend", `<div class="msg-me">${esc(q)}</div>`);
  const el = document.createElement("div"); el.innerHTML = loading(); box.appendChild(el); el.scrollIntoView({ behavior: "smooth", block: "end" });
  try {
    const r = voiceFn ? await voiceFn() : await api("ask", { body: { question: q, chat_id: S.chatId } });
    if (r.transcript) el.insertAdjacentHTML("beforebegin", `<div class="msg-me">${esc(r.transcript)}</div>`);
    S.chatId = r.chat_id; history.replaceState(null, "", "#chat/" + r.chat_id);
    el.innerHTML = answerHTML(r); bindAnswer(el, r);
    if (voiceFn || S.voiceNext) { S.voiceNext = false; autoSpeak(speechText(r), el); }
  } catch (e) { el.innerHTML = errBox(e); }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function voiceChat() {
  toggleRec($("bigMic"), (wav) => {
    const fd = new FormData(); fd.append("file", wav, "savol.wav"); fd.append("chat_id", S.chatId || "");
    sendChat("", () => api("voice", { form: fd }));
  });
}
$("bigMic").onclick = () => {
  stopVoice();
  const inChat = /^#chat/.test(location.hash);
  if (REC) return voiceChat();
  if (inChat) return voiceChat();
  if (!S.status.stt) { go("chat"); return; }
  S.autoRec = true; S.chatId = null; go("chat");
};
async function openHistory() {
  const d = document.createElement("div"); d.className = "drawer";
  d.innerHTML = `<div class="pane"><div class="row between"><h2>Suhbatlar</h2><button class="ib" data-x aria-label="Yopiş">${icon("close")}</button></div><div class="stack" id="hl">${loading()}</div></div>`;
  document.body.appendChild(d);
  d.onclick = async (e) => {
    if (e.target === d || e.target.closest("[data-x]")) return d.remove();
    const del = e.target.closest("[data-del]"); if (del) { await api("chats/" + del.dataset.del, { method: "DELETE" }); del.closest(".hist").remove(); return; }
    const h = e.target.closest("[data-c]"); if (h) { d.remove(); S.chatId = Number(h.dataset.c); go("chat/" + h.dataset.c); }
  };
  try {
    const list = await api("chats");
    $("hl").innerHTML = list.map((c) => `<div class="hist" data-c="${c.id}"><span>${esc(c.title)}</span><small>${dfmt(c.updated)}</small><button class="ib" style="width:34px;height:34px" data-del="${c.id}" aria-label="Öçiriş">${icon("trash", 16)}</button></div>`).join("") || `<div class="empty">Hali suhbat yöq</div>`;
  } catch (e) { $("hl").innerHTML = errBox(e); }
}
function faylHTML(r) {
  const f = r.fayl || {};
  return `<div class="card ans">${WARN}
    <div class="tiles"><div class="tl"><small>Hujjat turi</small><b>${esc(f.turi || "—")}</b></div></div>
    ${f.qisqa ? `<p>${esc(f.qisqa)}</p>` : ""}
    ${(f.malumotlar || []).length ? `<h4 class="fh">Asosiy ma'lumotlar</h4><div class="facts">${f.malumotlar.map((m) => `<div><span>${esc(m.nomi)}</span><b>${esc(m.qiymat)}</b></div>`).join("")}</div>` : ""}
    ${(f.muammolar || []).length ? `<div class="info warn"><b>Muammolar va xatolar</b><ul style="margin:4px 0 0;padding-left:18px">${f.muammolar.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <h4 class="fh">Nima qiliş kerak</h4>
    ${r.sarlavha || r.asosiy_raqam ? `<div class="tiles"><div class="tl"><small>Masala</small><b>${esc(r.sarlavha || "—")}</b></div>${r.asosiy_raqam ? `<div class="tl red"><small>Asosiy</small><b>${esc(r.asosiy_raqam)}</b></div>` : ""}</div>` : ""}
    <p>${esc(r.javob || "")}</p>
    ${r.mediatsiya ? `<div class="info med"><b>Sudsiz yöl: mediatsiya</b>${esc(r.mediatsiya)}</div>` : ""}
    ${asosHTML(r.asos)}<div class="srcs">${r.asos ? "" : srcLinks(r.manbalar)}</div>
    <div class="row"><button class="btn acc" data-a="ariza">Şikoyat tayyorlaş</button>${(r.manbalar || []).length ? `<button class="btn ghost" data-a="open">Moddani oçiş</button>` : ""}
      <button class="btn ghost" data-a="where">Qayerga murojaat?</button>${canTTS() ? `<button class="btn line" data-a="tts">Tingla</button>` : ""}</div></div>`;
}
function answerHTML(r) {
  if (r.tur === "fayl") return faylHTML(r);
  if (r.tur === "modda") return `<div class="stack">${WARN}${explainHTML(r)}<div class="srcs">${srcLinks(r.manbalar)}</div>
    <div class="row"><button class="btn acc" data-a="open">Moddani oçiş</button><button class="btn" data-a="video">${icon("video", 18)} Video</button>${canTTS() ? `<button class="btn line" data-a="tts">Tingla</button>` : ""}</div></div>`;
  return `<div class="card ans">${WARN}
    ${r.sarlavha || r.asosiy_raqam ? `<div class="tiles"><div class="tl"><small>Masala</small><b>${esc(r.sarlavha || "—")}</b></div>${r.asosiy_raqam ? `<div class="tl red"><small>Asosiy</small><b>${esc(r.asosiy_raqam)}</b></div>` : ""}</div>` : ""}
    <p>${esc(r.javob)}</p>
    ${r.mediatsiya ? `<div class="info med"><b>Sudsiz yöl: mediatsiya</b>${esc(r.mediatsiya)}</div>` : ""}
    ${asosHTML(r.asos)}<div class="srcs">${r.asos ? "" : srcLinks(r.manbalar)}</div>
    <div class="row">${r.video ? `<button class="btn" data-a="video">${icon("video", 18)} Video</button>` : ""}${(r.manbalar || []).length ? `<button class="btn acc" data-a="open">Moddani oçiş</button>` : ""}
      <button class="btn ghost" data-a="ariza">Ariza tayyorlaş</button><button class="btn ghost" data-a="where">Qayerga murojaat?</button>
      ${!r.video && (r.manbalar || []).length ? `<button class="btn ghost" data-a="video">Video</button>` : ""}${canTTS() ? `<button class="btn line" data-a="tts">Tingla</button>` : ""}</div></div>`;
}
const srcLinks = (m) => (m || []).map((s) => `<a href="#modda/${esc(s.doc)}/${esc(s.number)}">${esc(s.kod)} ${esc(s.number)}-modda</a>`).join("");
function bindAnswer(el, r) {
  el.onclick = (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const m = (r.manbalar || [])[0] || (r.doc ? { doc: r.doc, number: r.number } : null);
    const a = b.dataset.a;
    if (a === "open" && m) go(`modda/${m.doc}/${m.number}`);
    if (a === "video" && m) { if (r.video) playMp4(r.video); else makeVideo(m.doc, m.number, b); }
    if (a === "ariza") { const f = r.fayl; S.form = { idora: "", turi: "", holat: f ? `${f.turi}. ${f.qisqa || ""} ${(f.muammolar || []).join(" ")}`.trim() : r.question || "", mode: "ai" }; go("yoz"); }
    if (a === "where") { go("ariza"); setTimeout(() => routeProblem(r.question || r.sarlavha), 300); }
    if (a === "tts") speak(r.javob || [r.umumiy, ...(r.bandlar || []).map((x) => x.nomi + ". " + x.sodda + " " + (x.oqibat || ""))].join(" "), b);
  };
}
function speechText(r) {
  if (r.tur === "modda") return [r.sarlavha, r.umumiy, ...(r.bandlar || []).map((b) => `${b.nomi}. ${b.sodda}${b.oqibat ? " " + b.oqibat : ""}`)].join(". ");
  return r.javob || "";
}
function stopVoice() { lipStop(); if (AUD) { AUD.pause(); AUD = null; } try { if (BSAY) { BSAY.paused = true; speechSynthesis.cancel(); BSAY = null; } } catch (e) {} document.querySelectorAll(".speaking").forEach((x) => x.remove()); }
/* ---- brauzer ovozi (rus tili uçun zaxira: VoiceLab ruscha ovoz bermasa) ---- */
let BSAY = null;
const canBrowserSay = () => I.lang === "ru" && "speechSynthesis" in window;
const canTTS = () => S.status.tts || canBrowserSay();
function browserSay(text, onStart, onEnd) {
  const u = new SpeechSynthesisUtterance(text.slice(0, 3000)); u.lang = "ru-RU"; u.rate = 1;
  const v = speechSynthesis.getVoices().find((x) => /^ru/i.test(x.lang)); if (v) u.voice = v;
  const fake = { paused: false }; BSAY = fake;
  u.onstart = () => onStart && onStart(fake); u.onend = u.onerror = () => { fake.paused = true; onEnd && onEnd(); };
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
/* ---- lab harakati: ovoz balandligiga qarab og'iz ochiladi ---- */
let LIP = null, ACTX = null;
function lipStop() { if (LIP) { cancelAnimationFrame(LIP.raf); LIP = null; } }
function lipSync(audio, svg) {
  lipStop(); if (!svg) return;
  const mouth = svg.querySelector(".mouth"), tongue = svg.querySelector(".tongue"), jaw = svg.querySelector(".jaw"), brows = svg.querySelector(".brows");
  let an = null, buf = null;
  try {
    ACTX = ACTX || new (window.AudioContext || window.webkitAudioContext)();
    if (ACTX.state === "suspended") ACTX.resume();
    const src = ACTX.createMediaElementSource(audio); an = ACTX.createAnalyser(); an.fftSize = 512;
    src.connect(an); an.connect(ACTX.destination); buf = new Uint8Array(an.fftSize);
  } catch (e) { an = null; }
  let open = 0, t0 = performance.now();
  const step = () => {
    let target;
    if (an) { an.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; } target = Math.min(1, Math.sqrt(sum / buf.length) * 7); }
    else { const t = (performance.now() - t0) / 1000; target = audio.paused ? 0 : Math.max(0, Math.sin(t * 13) * 0.5 + Math.sin(t * 7.3) * 0.35 + 0.25); }
    open += (target - open) * 0.45;
    mouth.setAttribute("ry", (2 + open * 15).toFixed(1)); mouth.setAttribute("rx", (20 - open * 3).toFixed(1));
    tongue.setAttribute("ry", Math.max(0, open * 7 - 1).toFixed(1));
    jaw.setAttribute("transform", `translate(0 ${(open * 9).toFixed(1)})`);
    brows.setAttribute("transform", `translate(0 ${(-open * 3).toFixed(1)})`);
    if (LIP) LIP.raf = requestAnimationFrame(step);
  };
  LIP = { raf: requestAnimationFrame(step) };
}
/** Javobni avtomatik ovoz chiqarib o'qiydi (ovozli savolga ovozli javob). */
async function autoSpeak(text, el, force) {
  if (!canTTS() || (!S.autoVoice && !force) || !text) return;
  stopVoice();
  const ind = document.createElement("div"); ind.className = "speaking";
  ind.innerHTML = `<span class="talker">${CHOL_SVG}</span><span class="sp"><b>Donişmand bobo</b><span class="st">Ovoz tayyorlanmoqda…</span><span class="wave"><i></i><i></i><i></i><i></i></span></span><button type="button" class="btn line" style="min-height:36px;padding:0 12px">Töxtatiş</button>`;
  el.prepend(ind); ind.querySelector("button").onclick = stopVoice;
  const viaBrowser = () => browserSay(text, (fake) => { ind.querySelector(".st").textContent = "gapirmoqda…"; ind.classList.add("on"); lipSync(fake, ind.querySelector(".talker svg")); },
    () => { lipStop(); ind.classList.remove("on"); ind.querySelector(".st").textContent = "javob berdi"; setTimeout(() => ind.remove(), 1800); });
  if (!S.status.tts) return viaBrowser();
  try {
    const b = await api("tts", { body: { text: text.slice(0, 2400) }, blob: true });
    if (!ind.isConnected) return;
    AUD = new Audio(URL.createObjectURL(b));
    ind.querySelector(".st").textContent = "gapirmoqda…"; ind.classList.add("on");
    AUD.onended = () => { lipStop(); ind.classList.remove("on"); ind.querySelector(".st").textContent = "javob berdi"; setTimeout(() => ind.remove(), 1800); };
    await AUD.play();
    lipSync(AUD, ind.querySelector(".talker svg"));
  } catch (e) { if (canBrowserSay() && e.code !== 402) return viaBrowser(); ind.remove(); if (e.code !== 402) toast("Ovozli javob: " + e.message); }
}
let AUD;
async function speak(text, btn) {
  if (!S.status.tts && canBrowserSay()) return browserSay(text);
  try { btn.disabled = true; const t = btn.textContent; btn.textContent = "…"; const b = await api("tts", { body: { text }, blob: true }); AUD?.pause(); AUD = new Audio(URL.createObjectURL(b)); await AUD.play(); btn.textContent = t; }
  catch (e) { if (canBrowserSay()) browserSay(text); else toast(e.message); }
  btn.disabled = false;
}


/* ---------------- Video ---------------- */
function vShell(title) {
  const m = document.createElement("div"); m.className = "vmodal";
  m.innerHTML = `<div class="vtop"><b>${esc(title)}</b><button class="ib" data-x aria-label="Yopiş" style="background:#1B3340;color:#fff">${icon("close")}</button></div><div class="vstage"><div class="vframe" id="vf"></div></div>`;
  document.body.appendChild(m); return m;
}
function playMp4(v) {
  if (!v) return toast("Bu mavzu uçun video hali yöq");
  const m = vShell(v.title || "Video"); let closed = false;
  m.querySelector("[data-x]").onclick = () => { closed = true; m.querySelector("video")?.pause(); m.remove(); };
  const wait = 5000 + Math.random() * 1000;
  $("vf").innerHTML = `<div class="prep"><div class="pmark">${MARK(96)}</div><b>Donişmand AI video tayyorlamoqda…</b>
    <span id="pstep">Qonun matni tahlil qilinmoqda</span><div class="pbar"><i id="pfill"></i></div></div>`;
  const steps = ["Qonun matni tahlil qilinmoqda", "Ssenariy yozilmoqda", "Sahnalar yiğilmoqda", "Ovoz qöşilmoqda"];
  const t0 = performance.now();
  (function tick() {
    if (closed) return;
    const k = Math.min(1, (performance.now() - t0) / wait);
    $("pfill").style.width = k * 100 + "%"; $("pstep").textContent = steps[Math.min(steps.length - 1, Math.floor(k * steps.length))];
    if (k < 1) return requestAnimationFrame(tick);
    $("vf").innerHTML = `<video src="${esc(v.url)}" controls autoplay playsinline></video><div class="wm">${MARK(30)}<span>Donişmand <b>AI</b></span></div>`;
    $("vf").querySelector("video").onerror = () => { $("vf").innerHTML = `<div class="prep"><b>Video fayli topilmadi</b><span>${esc(v.url.replace("static/", "frontend/"))} faylini joylang</span></div>`; };
  })();
}
function sceneArt(b) {
  const c = { qamoq: "#A12B2B", ogohlantirish: "#B7791F", pul: "#2E7D4F", togri: "#2E7D4F" }[b] || "#F2B134";
  return `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="rgba(255,255,255,.08)"/><circle cx="100" cy="100" r="70" fill="${c}"/>
    <circle cx="168" cy="44" r="10" fill="rgba(255,255,255,.25)"/><circle cx="34" cy="160" r="6" fill="rgba(255,255,255,.25)"/>
    <g transform="translate(52 52) scale(4)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${P[b] || P.tarozi}"/></g></svg>`;
}
async function makeVideo(doc, num, btn) {
  const t = btn?.innerHTML; if (btn) { btn.disabled = true; btn.textContent = "Ssenariy tayyorlanmoqda…"; }
  try { const s = await api("video", { body: { doc, number: num } }); playScenes(s); }
  catch (e) { if (e.code !== 402) toast(e.message); }
  if (btn) { btn.disabled = false; btn.innerHTML = t; }
}
function playScenes(s) {
  const m = vShell(s.nomi), sc = s.sahnalar || [];
  if (!sc.length) { m.remove(); return toast("Ssenariy bo'sh"); }
  m.insertAdjacentHTML("beforeend", `<div class="vprog">${sc.map(() => "<i><b></b></i>").join("")}</div>
    <div class="vctl"><button class="btn" style="background:#1B3340" data-c="prev">${icon("back", 18)}</button><button class="btn acc" data-c="play">${fill(PAUSE)}</button>
    <button class="btn" style="background:#1B3340" data-c="next">${icon("chev", 18)}</button>${S.status.tts ? `<button class="btn" style="background:#1B3340" data-c="snd">${icon(S.voiceOn ? "sound" : "mute", 18)}</button>` : ""}</div>`);
  let i = 0, playing = true, t0 = 0, dur = 4000, raf, audio = null, closed = false;
  const cache = {};
  const bars = [...m.querySelectorAll(".vprog i")];
  const tts = (k) => { if (!S.status.tts || !S.voiceOn) return null; if (!cache[k]) cache[k] = api("tts", { body: { text: sc[k].sarlavha + ". " + sc[k].matn }, blob: true }).catch(() => null); return cache[k]; };
  async function show(k) {
    i = Math.max(0, Math.min(sc.length - 1, k)); const x = sc[i];
    $("vf").innerHTML = `<div class="scene"><div class="art">${sceneArt(x.belgi)}</div><div><h2>${esc(x.sarlavha)}</h2><p>${esc(x.matn)}</p>${x.raqam ? `<span class="num">${esc(x.raqam)}</span>` : ""}</div></div><div class="wm">${MARK(30)}<span>Donişmand <b>AI</b></span></div>`;
    bars.forEach((b, j) => { b.className = j < i ? "done" : ""; b.firstChild.style.width = j < i ? "100%" : "0"; });
    audio?.pause(); audio = null;
    dur = Math.max(3800, (x.sarlavha + " " + x.matn).split(/\s+/).length * 430);
    const p = tts(i); tts(i + 1 < sc.length ? i + 1 : i);
    if (p) { const b = await p; if (closed || i !== sc.indexOf(x)) return; if (b) { audio = new Audio(URL.createObjectURL(b)); try { await audio.play(); } catch (e) {} audio.onloadedmetadata = () => { dur = Math.max(dur, audio.duration * 1000 + 500); }; } }
    t0 = performance.now();
  }
  function tick() {
    if (closed) return;
    if (playing) { const k = Math.min(1, (performance.now() - t0) / dur); bars[i].firstChild.style.width = k * 100 + "%"; if (k >= 1) { if (i < sc.length - 1) show(i + 1); else { playing = false; m.querySelector("[data-c=play]").innerHTML = fill(PLAY); bars[i].className = "done"; } } }
    raf = requestAnimationFrame(tick);
  }
  m.onclick = (e) => {
    if (e.target.closest("[data-x]")) { closed = true; audio?.pause(); cancelAnimationFrame(raf); m.remove(); return; }
    const c = e.target.closest("[data-c]")?.dataset.c; if (!c) return;
    if (c === "next") show(i + 1); if (c === "prev") show(i - 1);
    if (c === "play") { if (!playing && i === sc.length - 1 && bars[i].className === "done") show(0); playing = !playing; if (playing) { t0 = performance.now() - 0; audio?.play(); } else audio?.pause(); e.target.closest("button").innerHTML = fill(playing ? PAUSE : PLAY); }
    if (c === "snd") { S.voiceOn = !S.voiceOn; e.target.closest("button").innerHTML = icon(S.voiceOn ? "sound" : "mute", 18); if (!S.voiceOn) audio?.pause(); }
  };
  show(0); tick();
}

/* ---------------- Hujjatni tekshirish (rasm / PDF) ---------------- */
async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5e6) return file;
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ? new File([b], "hujjat.jpg", { type: "image/jpeg" }) : file), "image/jpeg", 0.86));
  } catch (e) { return file; }
}
function faylPage() {
  top({ title: "Hujjatni tekşiriş" });
  const v = view(`<div class="info"><b>Rasm yoki PDF yuklang</b>Jarima qarori, sud qarori, şartnoma yoki boşqa hujjatni yuklang — AI uni tahlil qilib, nima qiliş kerakligini aytadi.</div>
    <div class="row"><label class="btn acc" style="flex:1">${icon("hujjat", 18)} Fayl tanlash<input type="file" id="ff" accept="image/*,application/pdf" hidden></label>
      <label class="btn" style="flex:1">${icon("camera", 18)} Rasmga olish<input type="file" id="fc" accept="image/*" capture="environment" hidden></label></div>
    <div id="fprev"></div><div id="fOut" class="stack"></div>`);
  let file = null;
  const run = async (q = "") => {
    if (!file) return toast(L("Rasm yoki PDF yuklang"));
    const out = $("fOut");
    out.innerHTML = `<div class="card"><div class="row" style="flex-wrap:nowrap"><div class="typing"><i></i><i></i><i></i></div><span class="note">Hujjat tahlil qilinmoqda…</span></div></div>`;
    out.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const fd = new FormData(); fd.append("file", file, file.name || "hujjat"); fd.append("question", q); fd.append("chat_id", S.fileChat || "");
      const r = await api("fayl", { form: fd }); S.fileChat = r.chat_id;
      out.innerHTML = (q ? `<div class="msg-me">${esc(q)}</div>` : "") + `<div data-r>${faylHTML(r)}</div>`;
      bindAnswer(out.querySelector("[data-r]"), r);
      if (S.voiceNext) { S.voiceNext = false; autoSpeak(r.javob, out.querySelector("[data-r]")); }
    } catch (e) { out.innerHTML = errBox(e); }
  };
  const pick = async (inp) => {
    const f0 = inp.files[0]; inp.value = ""; if (!f0) return;
    if (!/^image\/|application\/pdf/.test(f0.type)) return toast(L("Faqat rasm (JPG, PNG) yoki PDF"));
    file = await shrinkImage(f0); S.fileChat = null;
    if (file.size > 10 * 1024 * 1024) { file = null; return toast(L("Fayl juda katta (10 MB gaça)")); }
    $("fprev").innerHTML = /^image\//.test(file.type) ? `<img class="fthumb" src="${URL.createObjectURL(file)}" alt="">` : `<div class="card row" style="flex-wrap:nowrap">${icon("hujjat", 26)}<b data-notr>${esc(f0.name)}</b></div>`;
    run();
  };
  $("ff").onchange = () => pick($("ff")); $("fc").onchange = () => pick($("fc"));
  ask("Faylga savol bering…", (q) => run(q));
}

/* ---------------- Hisoblab ber (davlat boji, muddatlar, aliment) ---------------- */
let ST = null;
const stv = async () => (ST = ST || await api("stavkalar"));
const num = (v) => Number(String(v || "").replace(/[^\d]/g, "")) || 0;
const fmtIn = (el) => { const n = num(el.value); el.value = n ? n.toLocaleString("ru-RU").replace(/ /g, " ") : ""; };
const bhm = (k) => Math.round(ST.bhm * k);
const srcList = (keys) => `<div class="asos"><b>Asos:</b><ul>${keys.map((k) => ST.manbalar[k]).filter(Boolean).map((m) => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.nomi)}</a></li>`).join("")}</ul></div>`;
const TOOLS_H = [
  ["sud", "tarozi", "Sudmi yoki kelişuvmi?", "Sud va mediatsiya yölini pul va vaqt böyiça solişturiş"],
  ["notarius", "hujjat", "Notariusga tayyorgarlik", "Davlat boji va olib boriladigan hujjatlar"],
  ["aliment", "aliment", "Aliment hisoblagiçi", "Oylik aliment miqdori va eng kam summa"],
];
async function hisobMenu() {
  top({ title: "Hisoblab ber" });
  await stv();
  view(`<div class="info"><b>Donişmand bobo hisoblab beradi</b>Davlat boji, sud va mediatsiya muddatlari hamda alimentni amaldagi qonunçilik böyiça hisoblaydi.</div>
    <div class="row" style="gap:6px"><span class="tag">1 BHM = ${som(ST.bhm)}</span><span class="note">${dfmt(ST.bhm_sana)} dan</span></div>
    <div class="list">${TOOLS_H.map(([id, ic, t, d]) => `<a class="item" href="#hisob/${id}"><span class="ic">${icon(ic, 20)}</span><span><b>${t}</b><small>${d}</small></span><span class="chev">${icon("chev", 18)}</span></a>`).join("")}</div>
    <p class="note">Natija ma'lumot uçun. Aniq summani tegişli idora yoki notarius tasdiqlaydi.</p>`);
}
async function hisobTool(id) {
  await stv();
  const t = TOOLS_H.find((x) => x[0] === id); if (!t) throw new Error("Hisoblagiç topilmadi");
  top({ title: t[2], back: "#hisob" });
  ({ sud: calcSud, notarius: calcNotarius, aliment: calcAliment })[id]();
}
function resultActions(sayText, acts) {
  return `<div class="row">${acts.map(([a, label, cls]) => `<button class="btn ${cls || "ghost"}" data-h="${a}">${label}</button>`).join("")}
    ${canTTS() ? `<button class="btn line" data-h="say">${icon("sound", 18)} Donişmand tuşuntirsin</button>` : ""}</div>`;
}
function bindResult(box, sayText, handlers) {
  box.onclick = (e) => {
    const b = e.target.closest("[data-h]"); if (!b) return;
    if (b.dataset.h === "say") return autoSpeak(sayText(), box, true);
    handlers[b.dataset.h]?.();
  };
}
async function organTo(id, turi, holat) {
  S.organs = S.organs || await api("organs");
  const o = S.organs.find((x) => x.id === id) || {};
  S.form = { idora: o.nomi || "", idoraId: o.id, turi: turi || "", holat: holat || "", mode: "ai" }; go("yoz");
}
function calcSud() {
  const sd = ST.sud, md = ST.mediatsiya;
  const v = view(`<p class="sub">Nizo turini tanlang — sud va kelişuv (mediatsiya) yölini pul va vaqt böyiça solişturamiz.</p>
    <div class="seg wrap" id="nt"><button class="on" data-t="mulk">Pul yoki mol-mulk</button><button data-t="ajrim">Nikohdan ajraliş</button><button data-t="aliment">Aliment</button><button data-t="ishhaqi">Ish haqi</button></div>
    <label class="f" id="sumF">Nizo summasi (söm)<input id="sum" inputmode="numeric" placeholder="Masalan: 20 000 000"></label>
    <label class="check" id="takF" hidden><input type="checkbox" id="tak"> Takroriy ajraliş</label>
    <label class="f">Mediator haqi, agar kelişilgan bölsa (söm)<input id="med" inputmode="numeric" placeholder="Kelişuvga köra"></label>
    <div id="res" class="stack"></div>`);
  let tur = "mulk";
  const calc = () => {
    $("sumF").hidden = tur !== "mulk"; $("takF").hidden = tur !== "ajrim";
    const sum = num($("sum").value), med = num($("med").value);
    let boj = 0, bojTxt = "";
    if (tur === "mulk") { boj = Math.max(Math.round(sum * sd.mulkiy_foiz / 100), bhm(sd.mulkiy_min_bhm)); bojTxt = `Summaning ${sd.mulkiy_foiz}%, lekin kamida ${sd.mulkiy_min_bhm} BHM`; }
    if (tur === "ajrim") { const k = $("tak").checked ? sd.ajrim_takror_bhm : sd.ajrim_bhm; boj = bhm(k); bojTxt = `${k} BHM`; }
    if (tur === "aliment" || tur === "ishhaqi") { boj = 0; bojTxt = "Da'vogar davlat bojidan ozod"; }
    const fast = tur === "aliment" || tur === "ishhaqi";
    const d1 = sd.tayyorlov_kun + (fast ? sd.tez_korish_kun : sd.korish_kun), d2 = sd.tayyorlov_kun + (fast ? sd.tez_korish_kun : sd.korish_max_kun);
    const save = boj - med, need = tur !== "mulk" || sum > 0;
    $("res").innerHTML = !need ? `<div class="empty">Nizo summasini kiriting</div>` : `
      <div class="cmp2">
        <div class="card"><span class="tag">Sud yöli</span><div class="big">${som(boj)}</div><span class="note">Davlat boji · ${bojTxt}</span>
          <div class="kv"><span>Muddat</span><b>${d1 === d2 ? `~${d1} kun` : `~${d1}–${d2} kun`}</b></div><span class="note">Tayyorlov ${sd.tayyorlov_kun} kun + körish ${fast ? `${sd.tez_korish_kun} kun` : "1–2 oy"}. Apellyatsiya uçun qöşimça boj tölanadi.</span></div>
        <div class="card good"><span class="tag">Kelişuv yöli</span><div class="big">${som(med)}</div><span class="note">${med ? "Mediator haqi" : "Davlat boji yöq · mediator haqi kelişuvga köra"}</span>
          <div class="kv"><span>Muddat</span><b>~${md.kun} kun</b></div><span class="note">Taraflar roziligi bilan yana ${md.uzaytirish_kun} kungaça.</span></div>
      </div>
      ${save > 0 ? `<div class="info med"><b>Donişmand maslahati</b>Avval kelişuvni sinab köring: ${som(save)} tejaysiz va nizo taxminan ${md.kun} kunda hal böladi. Kelişuv bölmasa ham sudga boriş huquqingiz saqlanadi.</div>`
        : `<div class="info"><b>Donişmand maslahati</b>${fast ? "Bu nizo uçun davlat boji tölanmaydi va sud uni tezroq köradi. Kelişuv yöli ham ixtiyoriy." : "Kelişuv yöli ham, sud yöli ham mumkin. Munosabatni saqlaş muhim bölsa, mediatsiyani tanlang."}</div>`}
      <div class="info"><b>Bilib qöying</b>Sud jarayonida mediativ kelişuv tuzilib, ariza körmasdan qoldirilsa, tölangan davlat boji qaytariladi.</div>
      ${srcList(["boj", fast ? "boj_ozod" : "bhm", "boj_qaytarish", "fpk", "mediatsiya"])}
      ${resultActions(null, [["med", "Mediatsiyaga murojaat", "acc"], ["sud", "Da'vo arizasi"]])}`;
    bindResult($("res"), () => I.lang === "ru"
      ? `Через суд: госпошлина ${boj.toLocaleString("ru-RU")} сум, срок примерно ${d1}–${d2} дней. Через медиацию: госпошлины нет, срок около ${md.kun} дней.`
      : `Sud yöli: davlat boji ${boj.toLocaleString("ru-RU")} söm, muddat taxminan ${d1}–${d2} kun. Kelişuv yöli: davlat boji yöq, taxminan ${md.kun} kun.`,
      { med: () => organTo("adliya", "Mediatsiyaga murojaat", tur === "mulk" ? `${som(sum)} miqdoridagi nizo böyiça mediatsiya orqali kelişmoqçiman.` : ""),
        sud: () => organTo("sud", "Da'vo arizasi", tur === "aliment" ? "Aliment undiriş" : tur === "ajrim" ? "Nikohdan ajraliş" : tur === "ishhaqi" ? "Ish haqini undiriş" : `${som(sum)} undiriş`) });
  };
  $("nt").onclick = (e) => { const b = e.target.closest("[data-t]"); if (!b) return; tur = b.dataset.t; $("nt").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); calc(); };
  ["sum", "med"].forEach((id) => { $(id).oninput = () => { fmtIn($(id)); calc(); }; });
  $("tak").onchange = calc; calc();
}
const NOT_HUJJAT = {
  meros: ["Merosxörning pasporti", "Vafot etganlik töğrisidagi guvohnoma", "Qarindoşlikni tasdiqlovçi hujjat (tuğilganlik yoki nikoh guvohnomasi)", "Mol-mulkka egalik hujjatlari (kadastr ma'lumoti, texnik pasport)"],
  sotuv: ["Ikki tomonning pasportlari", "Mulkka egalik hujjati (kadastr ma'lumoti)", "Er yoki xotinning roziligi (mulk umumiy bölsa)"],
  avto: ["Egasining pasporti", "Avtomobilning texnik pasporti", "Işonçli şaxsning pasport ma'lumotlari"],
  uy: ["Egasining pasporti", "Mulkka egalik hujjati (kadastr ma'lumoti)", "Işonçli şaxsning pasport ma'lumotlari"],
};
function calcNotarius() {
  const n = ST.notarius;
  const v = view(`<p class="sub">Qaysi notarial harakat kerak? Davlat bojini hisoblab, olib boriladigan hujjatlarni körsatamiz.</p>
    <div class="seg wrap" id="na"><button class="on" data-t="meros">Meros guvohnomasi</button><button data-t="sotuv">Uy-joy oldi-sotdisi</button><button data-t="avto">Avtomobilga işonçnoma</button><button data-t="uy">Uy-joyga işonçnoma</button></div>
    <div id="nf" class="stack"></div><div id="res" class="stack"></div>`);
  let tur = "meros";
  const form = () => {
    $("nf").innerHTML = tur === "meros"
      ? `<label class="f">Uy-joy, yer, avtomobil soni<input id="kn" type="number" min="0" max="20" value="1"></label><label class="check"><input type="checkbox" id="kb"> Boşqa mol-mulk ham bor (omonat, pul, buyumlar)</label>`
      : tur === "sotuv" ? `<div class="seg wrap" id="jy"><button class="on" data-j="m">Toşkent, Nukus yoki viloyat markazi</button><button data-j="b">Boşqa şahar yoki tuman</button></div><label class="check"><input type="checkbox" id="qr"> Yaqin qarindoşga (er/xotin, ota-ona, bolalar, nevaralar, aka-uka, opa-singil)</label>`
      : `<label class="check"><input type="checkbox" id="qr"> Yaqin qarindoşga (er/xotin, ota-ona, bolalar, nevaralar, aka-uka, opa-singil${tur === "avto" ? ", jiyanlar" : ""})</label>`;
    $("nf").oninput = $("nf").onchange = calc;
    $("jy")?.addEventListener("click", (e) => { const b = e.target.closest("[data-j]"); if (b) { $("jy").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); calc(); } });
    calc();
  };
  const calc = () => {
    let boj = 0, izoh = "";
    const qr = $("qr")?.checked;
    if (tur === "meros") { const k = Math.max(0, Number($("kn").value) || 0), b = $("kb").checked; boj = k * bhm(n.meros_kochmas_bhm) + (b ? bhm(n.meros_boshqa_bhm) : 0); izoh = `Har bir uy-joy, yer yoki avtomobil — ${som(bhm(n.meros_kochmas_bhm))}${b ? `, boşqa mol-mulk — ${som(bhm(n.meros_boshqa_bhm))}` : ""}`; }
    if (tur === "sotuv") { const m = $("jy").querySelector(".on").dataset.j === "m"; boj = bhm(m ? n.kochmas_markaz_bhm : n.kochmas_boshqa_bhm); if (qr) boj = Math.round(boj * n.qarindosh_chegirma_foiz / 100); izoh = `${m ? n.kochmas_markaz_bhm : n.kochmas_boshqa_bhm} BHM${qr ? `, qarindoşga — ${n.qarindosh_chegirma_foiz}%` : ""}`; }
    if (tur === "avto") { const k = qr ? n.ishonchnoma_avto_qarindosh_bhm : n.ishonchnoma_avto_boshqa_bhm; boj = bhm(k); izoh = `${k} BHM`; }
    if (tur === "uy") { const k = qr ? n.ishonchnoma_kochmas_qarindosh_bhm : n.ishonchnoma_kochmas_boshqa_bhm; boj = bhm(k); izoh = `${k} BHM`; }
    $("res").innerHTML = `<div class="card"><span class="tag">Davlat boji</span><div class="big">${som(boj)}</div><span class="note">${izoh}</span></div>
      <div class="card"><h3>Olib boriladigan hujjatlar</h3><ul class="checks">${NOT_HUJJAT[tur].map((x) => `<li>${esc(x)}</li>`).join("")}</ul><span class="note">Taxminiy röyxat — notarius aniqlaştiradi. Bu faqat davlat boji: boşqa xarajatlarni notariusdan söraş kerak.</span></div>
      ${srcList(["boj", "bhm"])}${resultActions(null, [])}`;
    bindResult($("res"), () => I.lang === "ru" ? `Госпошлина составит ${boj.toLocaleString("ru-RU")} сум. Возьмите с собой: ${NOT_HUJJAT[tur].map(L).join(", ")}.`
      : `Davlat boji ${boj.toLocaleString("ru-RU")} söm böladi. Özingiz bilan olib boring: ${NOT_HUJJAT[tur].join(", ")}.`, {});
  };
  $("na").onclick = (e) => { const b = e.target.closest("[data-t]"); if (!b) return; tur = b.dataset.t; $("na").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); form(); };
  form();
}
function calcAliment() {
  const a = ST.aliment, minOne = Math.round(ST.mhtekm * a.min_foiz_mhtekm / 100);
  const v = view(`<p class="sub">Ota yoki onaning oylik daromadi va bolalar soni böyiça alimentni hisoblaymiz.</p>
    <label class="f">Aliment tölovçining oylik daromadi (söm)<input id="inc" inputmode="numeric" placeholder="Masalan: 6 000 000"></label>
    <label class="f">Voyaga yetmagan bolalar soni<input id="kids" type="number" min="1" max="12" value="1"></label>
    <div id="res" class="stack"></div>`);
  const calc = () => {
    const inc = num($("inc").value), k = Math.max(1, Math.min(12, Number($("kids").value) || 1));
    const sh = k >= 3 ? a.ulush["3"] : a.ulush[String(k)], frac = k >= 3 ? "1/2" : k === 2 ? "1/3" : "1/4";
    const byShare = Math.round(inc * sh), minAll = minOne * k, pay = Math.max(byShare, minAll);
    $("res").innerHTML = !inc ? `<div class="empty">Daromadni kiriting</div>` : `
      <div class="card"><span class="tag">Oylik aliment</span><div class="big">${som(pay)}</div>
        <div class="kv"><span>Daromadning ${frac} qismi</span><b>${som(byShare)}</b></div>
        <div class="kv"><span>Eng kam miqdor (${k} bola × ${som(minOne)})</span><b>${som(minAll)}</b></div>
        ${pay > byShare ? `<span class="note">Daromad ulushi eng kam miqdordan past — eng kam miqdor olinadi.</span>` : ""}</div>
      <div class="info"><b>Bilib qöying</b>Sud taraflarning ahvoliga qarab miqdorni kamaytirişi yoki köpaytirişi mumkin. Aliment da'vosi uçun davlat boji tölanmaydi, sud işni tayyorlangandan keyin ${ST.sud.tez_korish_kun} kun içida köradi.</div>
      ${srcList(["aliment", "bhm", "boj_ozod", "fpk"])}
      ${resultActions(null, [["ariza", "Aliment arizasini tayyorlaş", "acc"]])}`;
    bindResult($("res"), () => I.lang === "ru" ? `Алименты составят примерно ${pay.toLocaleString("ru-RU")} сум в месяц. Госпошлина за иск не платится.`
      : `Aliment oyiga taxminan ${pay.toLocaleString("ru-RU")} söm böladi. Aliment da'vosi uçun davlat boji tölanmaydi.`,
      { ariza: () => organTo("sud", "Da'vo arizasi", `Voyaga yetmagan ${k} nafar bolam uçun aliment undirişni söraymiz. Tölovçining oylik daromadi taxminan ${som(inc)}.`) });
  };
  $("inc").oninput = () => { fmtIn($("inc")); calc(); }; $("kids").oninput = calc; calc();
}

/* ---------------- Profil ---------------- */
function donut(u) {
  const tot = u.kunlik_limit + u.qoshimcha, r = 52, c = 2 * Math.PI * r;
  const segs = [[u.qoldi, "#0F5F66"], [u.qoshimcha, "#F2B134"], [u.sarflandi, "#DCE6E8"]];
  let off = 0;
  const arcs = segs.map(([v, col]) => { const l = c * (v / Math.max(1, tot)); const s = `<circle cx="66" cy="66" r="${r}" fill="none" stroke="${col}" stroke-width="16" stroke-dasharray="${l} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 66 66)"/>`; off += l; return s; }).join("");
  return `<svg viewBox="0 0 132 132" role="img" aria-label="Limit: ${u.qoldi + u.qoshimcha} qoldi"><circle cx="66" cy="66" r="${r}" fill="none" stroke="#F0F4F5" stroke-width="16"/>${arcs}
    <text x="66" y="64" text-anchor="middle" font-family="Playfair Display,serif" font-weight="700" font-size="26" fill="#10202A">${u.qoldi + u.qoshimcha}</text><text x="66" y="82" text-anchor="middle" font-size="11" fill="#5B6B74">kredit qoldi</text></svg>`;
}
function resetIn(iso) { const ms = new Date(iso) - new Date(); const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4); return `${h} soat ${m} daqiqa`; }
async function profile() {
  top({ title: "Profil", back: "#home" });
  const me = await api("me"), u = me.usage, ini = (me.fio || "?").split(" ").map((x) => x[0]).slice(0, 2).join("");
  const v = view(`
    <div class="card prof"><span class="ava">${esc(ini)}</span><span style="flex:1"><b style="font-size:17px">${esc(me.fio)}</b><br><span class="note">JŞŞIR: ${esc(me.pinfl)} · OneID</span></span>
      <span class="pill ${u.tarif === "free" ? "" : "dark"}">${esc(u.tarif_nomi)}</span></div>
    <div class="card"><div class="row between"><h3>AI limiti</h3><span class="note">Bugun</span></div>
      <div class="donut">${donut(u)}<div class="legend">
        <div><i style="background:#0F5F66"></i>Kunlik qoldi: <b>${u.qoldi}</b> / ${u.kunlik_limit}</div>
        <div><i style="background:#F2B134"></i>Qöşimça: <b>${u.qoshimcha}</b></div>
        <div><i style="background:#DCE6E8"></i>Sarflandi: <b>${u.sarflandi}</b></div></div></div>
      <div class="info"><b>Limit yangilanadi</b>Ertaga 00:00 da — ${resetIn(u.reset)} dan keyin${u.tarif_tugash ? `<br>Tarif amal qiladi: ${dfmt(u.tarif_tugash)} gaça` : ""}</div>
      <div class="row"><button class="btn acc" data-a="buy">${icon("plus", 18)} Qöşimça limit</button><a class="btn" href="#tarif">${icon("star", 18)} Tariflar</a></div>
      <p class="note" style="margin:0">1 savol — 2 kredit, hujjat — 4, video — 3, ovoz — 1.</p></div>
    <div class="list">
      <a class="item" href="#arizalarim"><span class="ic">${icon("hujjat", 20)}</span><span><b>Mening arizalarim</b><small>Tayyorlangan hujjatlar</small></span><span class="chev">${icon("chev", 18)}</span></a>
      <button class="item" data-a="hist"><span class="ic">${icon("history", 20)}</span><span><b>Suhbatlar tarixi</b><small>AI bilan oldingi suhbatlar</small></span><span class="chev">${icon("chev", 18)}</span></button>
      <button class="item" data-a="lang"><span class="ic">${icon("globe", 20)}</span><span><b>Til</b><small data-notr>${I.LANGS[I.lang]}</small></span><span class="chev">${icon("chev", 18)}</span></button>
      <button class="item" data-a="out"><span class="ic" style="background:var(--red-soft);color:var(--red)">${icon("logout", 20)}</span><span><b>Çiqiş</b></span></button></div>`);
  v.onclick = async (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "buy") buyCredits();
    if (a === "hist") openHistory();
    if (a === "lang") langSheet();
    if (a === "out") { try { await api("auth/logout", { method: "POST" }); } catch (er) {} S.token = null; ls.set("hq_token", null); go("login"); }
  };
}
function langSheet() {
  const sh = document.createElement("div"); sh.className = "sheet";
  sh.innerHTML = `<div class="box"><h2>Ilova tili</h2><div class="list" data-notr>${Object.entries(I.LANGS).map(([k, n]) => `<button class="item" data-l="${k}"><span><b>${n}</b></span>${k === I.lang ? `<span class="chev" style="color:var(--accent)">${icon("togri", 20)}</span>` : ""}</button>`).join("")}</div>
    <button class="btn ghost block" data-x>Yopiş</button></div>`;
  document.body.appendChild(sh);
  sh.onclick = (e) => { if (e.target === sh || e.target.closest("[data-x]")) return sh.remove(); const b = e.target.closest("[data-l]"); if (b) I.setLang(b.dataset.l); };
}
async function buyCredits() {
  const t = await api("tariffs");
  const sh = document.createElement("div"); sh.className = "sheet";
  sh.innerHTML = `<div class="box"><h2>Qöşimça limit</h2><p class="sub">Kunlik limit tugaganda işlatiladi, kun almaşganda yonib ketmaydi.</p>
    <div class="packs">${t.paketlar.map((p) => `<button class="pack" data-p="${p.id}"><b>${p.kredit}</b><span>kredit</span><br><span style="font-weight:700;color:var(--ink)">${som(p.narx)}</span></button>`).join("")}</div>
    <p class="note">Demo tölov: haqiqiy pul yeçilmaydi.</p><button class="btn ghost block" data-x>Yopiş</button></div>`;
  document.body.appendChild(sh);
  sh.onclick = async (e) => {
    if (e.target === sh || e.target.closest("[data-x]")) return sh.remove();
    const p = e.target.closest("[data-p]"); if (!p) return;
    try { await api("credits", { body: { pack: p.dataset.p } }); sh.remove(); toast("Limit qöşildi"); route(); } catch (er) { toast(er.message); }
  };
}
async function tariffs() {
  top({ title: "Tariflar", back: "#profil" });
  const [t, me] = await Promise.all([api("tariffs"), api("me")]);
  S.period = S.period || "oy";
  const draw = () => {
    const yil = S.period === "yil";
    const v = view(`<div class="row between"><p class="sub">AI imkoniyatlarini kengaytiring</p><div class="seg"><button class="${yil ? "" : "on"}" data-p="oy">Oylik</button><button class="${yil ? "on" : ""}" data-p="yil">Yillik</button></div></div>
      <div class="plans">${Object.entries(t.tariflar).map(([k, p]) => {
        const narx = yil ? p.yillik_narx : p.oylik_narx, save = p.oylik_narx ? Math.round(100 - (p.yillik_narx / (p.oylik_narx * 12)) * 100) : 0, cur = me.usage.tarif === k;
        return `<div class="plan ${cur ? "cur" : ""} ${k === "premium" ? "prem" : ""}">${yil && save ? `<span class="save tag red">−${save}%</span>` : ""}
          <h3>${esc(p.nomi)}</h3><div class="price">${narx ? `${som(narx)} <small>/ ${yil ? "yil" : "oy"}</small>` : "Bepul"}</div>
          ${yil && narx ? `<span class="note">Oyiga ${som(Math.round(narx / 12))}</span>` : ""}
          <ul>${p.imkoniyatlar.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          ${cur ? `<span class="pill" style="align-self:flex-start">Joriy tarif</span>` : `<button class="btn ${k === "premium" ? "" : "acc"}" ${k === "premium" ? 'style="background:#F2B134;color:#3A2A00"' : ""} data-k="${k}">${k === "free" ? "Bepulga qaytiş" : "Tanlaş"}</button>`}</div>`;
      }).join("")}</div><p class="note">Demo tölov: haqiqiy pul yeçilmaydi. Tölov tizimi (Click/Payme) keyingi bosqiçda ulanadi.</p>`);
    v.onclick = async (e) => {
      const p = e.target.closest("[data-p]"); if (p) { S.period = p.dataset.p; return draw(); }
      const k = e.target.closest("[data-k]")?.dataset.k; if (!k) return;
      try { await api("tariff", { body: { plan: k, period: S.period } }); toast(`${t.tariflar[k].nomi} tarifi faollaşdi`); go("profil"); } catch (er) { toast(er.message); }
    };
  };
  draw();
}
async function myApps() {
  top({ title: "Mening arizalarim", back: "#profil" });
  const list = await api("arizalar");
  const v = view(`<div class="list">${list.map((a, i) => `<button class="item" data-i="${i}"><span class="ic">${icon("hujjat", 20)}</span><span><b>${esc(a.turi)}</b><small>${esc(a.idora || "—")} · ${dfmt(a.created)}</small></span><span class="tag">${esc(a.holat)}</span></button>`).join("")
    || `<div class="empty">Hali ariza yöq. «Ariza yuboriş» bölimida tayyorlang.</div>`}</div><div id="one" class="stack"></div>`);
  v.querySelector(".list").onclick = (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return; const a = list[b.dataset.i];
    $("one").innerHTML = paperHTML(a.hujjat) + `${I.lang === "uz" ? `<label class="check"><input type="checkbox" id="old"> Eski yozuvda</label>` : ""}<button class="btn acc block" id="re">Word yuklab oliş</button>`;
    $("re").onclick = () => downloadDoc(a.hujjat, a.turi, a.idora, false);
    $("one").scrollIntoView({ behavior: "smooth" });
  };
}

/* ---------------- ilovani o'rnatish (PWA) ---------------- */
let INSTALL = null;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); INSTALL = e; document.querySelectorAll(".install").forEach((x) => (x.hidden = false)); });
window.addEventListener("appinstalled", () => { INSTALL = null; document.querySelectorAll(".install").forEach((x) => x.remove()); toast("Ilova örnatildi"); });
function installCard() {
  if (standalone()) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="install card" ${INSTALL || ios ? "" : "hidden"}><div class="row" style="flex-wrap:nowrap">${MARK(44)}<span style="flex:1"><b>Ilovani telefonga örnating</b><br><span class="note">${ios ? "Safari: «Ulaşiş» ⬆ → «Bosh ekranga»" : "Bosh ekranda ikonka bilan oçiladi"}</span></span>
    ${ios ? "" : `<button class="btn acc" data-install>Örnatiş</button>`}</div></div>`;
}
document.addEventListener("click", async (e) => {
  if (!e.target.closest("[data-install]") || !INSTALL) return;
  INSTALL.prompt(); const r = await INSTALL.userChoice; if (r.outcome === "accepted") INSTALL = null;
});
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("/sw.js").catch(() => {});
if (standalone()) document.documentElement.classList.add("pwa");

/* ---------------- start ---------------- */
(async () => {
  I.start();
  try { S.status = await api("status"); } catch (e) { S.status = {}; }
  route();
})();
}
