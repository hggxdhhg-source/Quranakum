(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const CDN = "https://cdn.mp3quran.net/audio/";
  const API = "https://www.mp3quran.net/api/v3/reciters?language=ar";
  const CACHE_KEY = "quranakum-audio-meta", PREF_KEY = "quranakum-audio", POS_KEY = "quranakum-audio-pos";
  const TTL = 24 * 3600 * 1000;


  const RECITERS = [
    { key: "minshawi", ar: "محمد صديق المنشاوي", en: "Muhammad Siddiq Al-Minshawi", apiId: 112, match: ["المنشاوي"],
      styles: [
        { moshafId: 112, label: "حفص عن عاصم · مرتل", server: CDN + "muhammad-minshawi/r1/", missing: [] },
        { moshafId: 113, label: "المصحف المجوّد", server: CDN + "muhammad-minshawi/r2/", missing: [] },
        { moshafId: 114, label: "المصحف المعلّم", server: CDN + "muhammad-minshawi/r3/", missing: [] },
        { moshafId: 10924, label: "حفص · تسجيل ١٩٦٧م (١١٠ سورة)", server: CDN + "muhammad-minshawi/r4/", missing: [16, 23, 24, 35] }
      ] },
    { key: "husary", ar: "محمود خليل الحصري", en: "Mahmoud Khalil Al-Husary", apiId: 118, match: ["الحصري"],
      styles: [
        { moshafId: 118, label: "حفص عن عاصم · مرتل", server: CDN + "mahmoud-husary/r1/", missing: [] },
        { moshafId: 119, label: "المصحف المجوّد", server: CDN + "mahmoud-husary/r2/", missing: [] }
      ] },
    { key: "alafasy", ar: "مشاري راشد العفاسي", en: "Mishary Rashid Alafasy", apiId: 123, match: ["العفاسي"],
      styles: [{ moshafId: 123, label: "حفص عن عاصم · مرتل", server: CDN + "mishary-alafasy/r1/", missing: [] }] },
   
    { key: "abdulbasit", ar: "عبد الباسط عبد الصمد", en: "Abdul Basit Abdus Samad", apiId: null, match: ["الباسط", "الصمد"], styles: [] },
    { key: "sudais", ar: "عبد الرحمن السديس", en: "Abdul Rahman Al-Sudais", apiId: null, match: ["السديس"], styles: [] }
  ];

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const norm = (s) => String(s).replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
  const ar = (s) => String(s).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  const fmt = (s) => {
    if (!isFinite(s)) return "٠:٠٠";
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, "0");
    return ar(h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`);
  };

  const prefs = Object.assign({ reciter: "minshawi", style: null, speed: 1, volume: 1, muted: false, repeat: false, autonext: true }, load(PREF_KEY, {}));
  const audio = new Audio();
  audio.preload = "metadata";
  let ctx = { names: [], getSurah: () => 1, goTo: () => {} };
  let surah = 1, checking = true, restored = false, lastSave = 0, slowTimer, dragging = false;

  const reciter = () => RECITERS.find((r) => r.key === prefs.reciter) || RECITERS[0];
  const style = () => { const r = reciter(); return r.styles.find((s) => s.moshafId === prefs.style) || r.styles[0]; };
  const urlFor = (n) => { const s = style(); return s && !s.missing.includes(n) ? s.server.replace(/\/?$/, "/") + String(n).padStart(3, "0") + ".mp3" : null; };

  function status(msg, retry) {
    $("#qaStatus").textContent = msg || "";
    $("#qaRetry").hidden = !retry;
    $("#qaPlayer").classList.toggle("qa-error", !!retry);
  }
  const busy = (on) => $("#qaPlayer").classList.toggle("qa-busy", on);

  function renderPickers() {
    $("#qaReciter").innerHTML = RECITERS.map((r) => {
      const ok = r.styles.length > 0;
      const note = ok ? "" : checking ? " — جارٍ التحقق..." : " — غير متاح حاليًا";
      return `<option value="${r.key}" ${ok ? "" : "disabled"} ${r.key === prefs.reciter ? "selected" : ""}>${r.ar}${note}</option>`;
    }).join("");
    const r = reciter();
    if (!style()) prefs.style = null; else prefs.style = style().moshafId;
    $("#qaStyle").innerHTML = r.styles.map((s) => `<option value="${s.moshafId}" ${s.moshafId === prefs.style ? "selected" : ""}>${s.label}</option>`).join("");
    $("#qaStyleWrap").hidden = r.styles.length < 2;
  }

  function updateNow() {
    const s = style();
    $("#qaNow").textContent = `سورة ${ctx.names[surah - 1] || ""} · ${ar(surah)} من ١١٤ · بصوت ${reciter().ar}${s ? " (" + s.label + ")" : ""}`;
    $("#qaPrev").disabled = surah <= 1;
    $("#qaNext").disabled = surah >= 114;
    if ("mediaSession" in navigator && window.MediaMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: `سورة ${ctx.names[surah - 1]}`, artist: reciter().ar, album: "قرآنكم" });
    }
  }

  function setSurah(n) {
    const wasPlaying = !audio.paused && !audio.ended;
    surah = n; restored = false;
    updateNow(); status("");
    const url = urlFor(n);
    audio.pause();
    if (!url) {
      audio.removeAttribute("src"); audio.load();
      setPlayState(false); busy(false);
      status(style() ? "التلاوة غير متاحة حاليًا لهذا القارئ. جرّب نوع تسجيل آخر أو قارئًا آخر." : "التلاوة غير متاحة حاليًا لهذا القارئ.");
      return;
    }
    audio.src = url;
    audio.playbackRate = prefs.speed;
    $("#qaSeek").value = 0; $("#qaCur").textContent = fmt(0); $("#qaDur").textContent = fmt(NaN);
    if (wasPlaying) play();
  }

  function play() {
    if (!audio.getAttribute("src")) { status("التلاوة غير متاحة حاليًا لهذا القارئ."); return; }
    const p = audio.play();
    if (p && p.catch) p.catch((e) => { if (e.name !== "AbortError") onError(); });
  }
  function setPlayState(playing) {
    $("#qaPlay").textContent = playing ? "⏸ إيقاف مؤقت" : "▶ تشغيل";
    $("#qaPlay").setAttribute("aria-label", playing ? "إيقاف مؤقت" : "تشغيل");
  }
  function onError() {
    if (!audio.getAttribute("src")) return;
    clearTimeout(slowTimer); busy(false); setPlayState(false);
    status(navigator.onLine ? "تعذر تحميل الصوت، حاول مرة أخرى." : "تحقق من اتصال الإنترنت وحاول مرة أخرى.", true);
  }
  function startLoading() {
    busy(true); status("جارٍ تحميل التلاوة...");
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => status("التحميل بطيء، يرجى الانتظار أو التحقق من الاتصال..."), 12000);
  }
  function doneLoading() { clearTimeout(slowTimer); busy(false); status(""); }

  function bind() {
    $("#qaPlay").addEventListener("click", () => (audio.paused ? play() : audio.pause()));
    $("#qaPrev").addEventListener("click", () => ctx.goTo(surah - 1));
    $("#qaNext").addEventListener("click", () => ctx.goTo(surah + 1));
    $("#qaReplay").addEventListener("click", () => { audio.currentTime = 0; play(); });
    $("#qaRetry").addEventListener("click", () => { const t = audio.currentTime; audio.load(); audio.currentTime = t || 0; play(); });
    $("#qaReciter").addEventListener("change", (e) => { prefs.reciter = e.target.value; prefs.style = null; save(PREF_KEY, prefs); renderPickers(); setSurah(surah); });
    $("#qaStyle").addEventListener("change", (e) => { prefs.style = Number(e.target.value); save(PREF_KEY, prefs); setSurah(surah); });

    const toggles = { qaRepeat: "repeat", qaAuto: "autonext" };
    Object.entries(toggles).forEach(([id, k]) => {
      const b = $("#" + id);
      const draw = () => { b.setAttribute("aria-pressed", String(prefs[k])); b.classList.toggle("on", prefs[k]); };
      b.addEventListener("click", () => { prefs[k] = !prefs[k]; save(PREF_KEY, prefs); draw(); });
      draw();
    });

    const speed = $("#qaSpeed"); speed.value = String(prefs.speed);
    speed.addEventListener("change", () => { prefs.speed = Number(speed.value); audio.playbackRate = prefs.speed; save(PREF_KEY, prefs); });

    const vol = $("#qaVol"), mute = $("#qaMute");
    vol.value = prefs.volume; audio.volume = prefs.volume; audio.muted = prefs.muted;
    const drawMute = () => { mute.textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔊"; mute.setAttribute("aria-label", audio.muted ? "إلغاء كتم الصوت" : "كتم الصوت"); };
    vol.addEventListener("input", () => { audio.volume = Number(vol.value); audio.muted = false; prefs.volume = audio.volume; prefs.muted = false; save(PREF_KEY, prefs); drawMute(); });
    mute.addEventListener("click", () => { audio.muted = !audio.muted; prefs.muted = audio.muted; save(PREF_KEY, prefs); drawMute(); });
    drawMute();

    const seek = $("#qaSeek");
    seek.addEventListener("input", () => { dragging = true; if (isFinite(audio.duration)) $("#qaCur").textContent = fmt((seek.value / 1000) * audio.duration); });
    seek.addEventListener("change", () => { if (isFinite(audio.duration)) audio.currentTime = (seek.value / 1000) * audio.duration; dragging = false; });

    audio.addEventListener("loadstart", () => { if (audio.getAttribute("src")) startLoading(); });
    audio.addEventListener("waiting", startLoading);
    audio.addEventListener("canplay", doneLoading);
    audio.addEventListener("playing", () => { doneLoading(); setPlayState(true); });
    audio.addEventListener("pause", () => setPlayState(false));
    audio.addEventListener("error", onError);
    audio.addEventListener("stalled", () => { if (!audio.paused) startLoading(); });
    audio.addEventListener("loadedmetadata", () => {
      $("#qaDur").textContent = fmt(audio.duration);
      const p = load(POS_KEY, null);
      if (!restored && p && p.r === prefs.reciter && p.m === prefs.style && p.n === surah && p.t > 3 && p.t < audio.duration - 5) audio.currentTime = p.t;
      restored = true;
    });
    audio.addEventListener("timeupdate", () => {
      if (!isFinite(audio.duration)) return;
      if (!dragging) { $("#qaSeek").value = (audio.currentTime / audio.duration) * 1000; $("#qaCur").textContent = fmt(audio.currentTime); }
      if (Date.now() - lastSave > 5000 && audio.currentTime > 0) { lastSave = Date.now(); save(POS_KEY, { r: prefs.reciter, m: prefs.style, n: surah, t: audio.currentTime }); }
    });
    audio.addEventListener("ended", () => {
      save(POS_KEY, null);
      if (prefs.repeat) { audio.currentTime = 0; play(); }
      else if (prefs.autonext && surah < 114) ctx.goTo(surah + 1), setTimeout(play, 0);
    });
    window.addEventListener("online", () => { if ($("#qaPlayer").classList.contains("qa-error")) status("عاد الاتصال، اضغط «إعادة المحاولة».", true); });

    if ("mediaSession" in navigator) {
      const h = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch {} };
      h("play", play); h("pause", () => audio.pause());
      h("previoustrack", () => surah > 1 && ctx.goTo(surah - 1)); h("nexttrack", () => surah < 114 && ctx.goTo(surah + 1));
    }
  }

 
  function apply(meta) {
    RECITERS.forEach((r) => { if (meta[r.key] && meta[r.key].length) r.styles = meta[r.key]; });
  }
  function fromApi(list) {
    const meta = {};
    RECITERS.forEach((r) => {
      let hit = r.apiId && list.find((x) => x.id === r.apiId && r.match.every((m) => norm(x.name).includes(norm(m))));
      hit = hit || list.find((x) => r.match.every((m) => norm(x.name).includes(norm(m))));
      if (!hit) return;
      const styles = (hit.moshaf || [])
        .filter((m) => [1, 21, 22].includes(m.rewaya_id) && m.server && m.surah_list)
        .sort((a, b) => (b.moshaf_type === 11) - (a.moshaf_type === 11) || b.surah_total - a.surah_total)
        .map((m) => {
          const have = new Set(m.surah_list.split(",").map(Number));
          return { moshafId: m.id, label: [...new Set(m.name.split(" - "))].join(" · "), server: m.server,
                   missing: Array.from({ length: 114 }, (_, i) => i + 1).filter((n) => !have.has(n)) };
        });
      if (styles.length) meta[r.key] = styles;
    });
    return meta;
  }
  async function refresh() {
    const cached = load(CACHE_KEY, null);
    if (cached && Date.now() - cached.ts < TTL) { apply(cached.data); return; }
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 10000);
    try {
      const res = await fetch(API, { signal: ctl.signal });
      if (!res.ok) throw new Error(res.status);
      const meta = fromApi((await res.json()).reciters || []);
      if (Object.keys(meta).length) { save(CACHE_KEY, { ts: Date.now(), data: meta }); apply(meta); }
    } catch (e) {
      if (cached) apply(cached.data); // نستخدم النسخة المحفوظة حتى لو انتهت صلاحيتها
    } finally { clearTimeout(t); }
  }

  const QuranAudio = {
    RECITERS,
    init(opts) {
      ctx = Object.assign(ctx, opts);
      surah = ctx.getSurah();
      if (!window.Audio) { status("المتصفح لا يدعم تشغيل الصوت."); return; }
      if (!reciter().styles.length) prefs.reciter = "minshawi";
      renderPickers(); bind(); updateNow(); setPlayState(false);
      refresh().then(() => {
        checking = false;
        if (!reciter().styles.length) prefs.reciter = "minshawi";
        const had = audio.getAttribute("src");
        renderPickers();
        if (!had) setSurah(surah); 
      });
    },
    setSurah,
    audio
  };
  window.QuranAudio = QuranAudio;
})();
