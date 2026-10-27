// عناصر الصفحة
const $ = (selector) => document.querySelector(selector);

// رسالة صغيرة للمستخدم
let toastTimer;

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// بيانات السور الـ ١١٤ (الأسماء وعدد الآيات)؛ نص الآيات يُحمَّل عند الفتح ويُحفظ على الجهاز
const NAMES = "الفاتحة,البقرة,آل عمران,النساء,المائدة,الأنعام,الأعراف,الأنفال,التوبة,يونس,هود,يوسف,الرعد,إبراهيم,الحجر,النحل,الإسراء,الكهف,مريم,طه,الأنبياء,الحج,المؤمنون,النور,الفرقان,الشعراء,النمل,القصص,العنكبوت,الروم,لقمان,السجدة,الأحزاب,سبأ,فاطر,يس,الصافات,ص,الزمر,غافر,فصلت,الشورى,الزخرف,الدخان,الجاثية,الأحقاف,محمد,الفتح,الحجرات,ق,الذاريات,الطور,النجم,القمر,الرحمن,الواقعة,الحديد,المجادلة,الحشر,الممتحنة,الصف,الجمعة,المنافقون,التغابن,الطلاق,التحريم,الملك,القلم,الحاقة,المعارج,نوح,الجن,المزمل,المدثر,القيامة,الإنسان,المرسلات,النبأ,النازعات,عبس,التكوير,الانفطار,المطففين,الانشقاق,البروج,الطارق,الأعلى,الغاشية,الفجر,البلد,الشمس,الليل,الضحى,الشرح,التين,العلق,القدر,البينة,الزلزلة,العاديات,القارعة,التكاثر,العصر,الهمزة,الفيل,قريش,الماعون,الكوثر,الكافرون,النصر,المسد,الإخلاص,الفلق,الناس".split(",");
const COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const MEDINAN = [2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,99,110];
const surahs = NAMES.map((name, i) => ({
  n: i + 1,
  name,
  count: COUNTS[i],
  kind: MEDINAN.includes(i + 1) ? "مدنية" : "مكية"
}));

// أدوات التخزين المحلي
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
// توحيد الحروف للبحث (يتجاهل الهمزات والتشكيل)
const norm = (s) => s
  .replace(/[\u064B-\u065F\u0670]/g, "")
  .replace(/[أإآٱ]/g, "ا")
  .replace(/ة/g, "ه")
  .replace(/ى/g, "ي")
  .trim();

let selectedSurah = load("quranakum-surah", 1);


// عرض قائمة السور

// المفضلة
let favs = load("quranakum-favs", []);
let showFavs = false;

function updateFavUI() {
  const on = favs.includes(selectedSurah);
  const btn = $("#favSurah");
  btn.textContent = on ? "★ في المفضلة" : "☆ أضف للمفضلة";
  btn.classList.toggle("is-fav", on);
  $("#favCount").textContent = favs.length.toLocaleString("ar-EG");
}

function toggleFav(n) {
  favs = favs.includes(n) ? favs.filter((x) => x !== n) : [...favs, n];
  save("quranakum-favs", favs);
  showToast(favs.includes(n) ? "أُضيفت السورة إلى المفضلة" : "أُزيلت من المفضلة");
  renderSurahs($("#surahSearch").value);
  updateFavUI();
}

function renderSurahs(query = "") {
  const list = $("#surahList");
  const search = query.trim();

  const filtered = surahs.filter((surah) => {
    if (showFavs && !favs.includes(surah.n)) return false;
    return (
      !search ||
      norm(surah.name).includes(norm(search)) ||
      String(surah.n) === search ||
      surah.n.toLocaleString("ar-EG") === search
    );
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p class="muted empty">${
      showFavs && !search
        ? "لم تضف أي سورة للمفضلة بعد. اضغط ☆ بجانب أي سورة."
        : "لا توجد سورة بهذا الاسم."
    }</p>`;
    return;
  }

  list.innerHTML = filtered.map((surah) => {
    const fav = favs.includes(surah.n);
    return `
    <div class="surah-row">
      <button class="surah-item ${surah.n === selectedSurah ? "selected" : ""}" data-surah="${surah.n}">
        <span class="surah-number">${surah.n.toLocaleString("ar-EG")}</span>
        <span class="surah-name">
          ${surah.name}
          <span class="surah-meta">${surah.kind} · ${surah.count.toLocaleString("ar-EG")} آية</span>
        </span>
      </button>
      <button class="fav-btn ${fav ? "is-fav" : ""}" data-fav="${surah.n}"
        aria-label="${fav ? "إزالة" : "إضافة"} ${surah.name} ${fav ? "من" : "إلى"} المفضلة"
        aria-pressed="${fav}">${fav ? "★" : "☆"}</button>
    </div>`;
  }).join("");

  list.querySelectorAll("[data-surah]").forEach((b) =>
    b.addEventListener("click", () => selectSurah(Number(b.dataset.surah))));
  list.querySelectorAll("[data-fav]").forEach((b) =>
    b.addEventListener("click", () => toggleFav(Number(b.dataset.fav))));
}

$("#favSurah").addEventListener("click", () => toggleFav(selectedSurah));
$("#surahTabs").querySelectorAll("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => {
    showFavs = b.dataset.tab === "favs";
    $("#surahTabs").querySelectorAll(".filter-chip").forEach((c) =>
      c.classList.toggle("selected", c === b));
    renderSurahs($("#surahSearch").value);
  }));

// تحميل آيات السورة (من الإنترنت أول مرة ثم من ذاكرة الجهاز)
async function getAyahs(n) {
  const cached = load(`quranakum-s${n}`, null);
  if (cached) return cached;

  const response = await fetch(
    `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`
  );
  if (!response.ok) throw new Error("fetch failed");

  const result = await response.json();
  const ayahs = result.data.ayahs.map((a) => a.text);

  // الخدمة تضيف البسملة لأول آية في كل سورة ما عدا الفاتحة والتوبة
  if (n !== 1 && n !== 9) {
    ayahs[0] = ayahs[0].replace(/^(\S+\s+){4}/, "");
  }

  save(`quranakum-s${n}`, ayahs);
  return ayahs;
}

// عرض السورة المختارة
async function selectSurah(number) {
  const surah = surahs.find((item) => item.n === number);
  if (!surah) return;

  selectedSurah = number;
  save("quranakum-surah", number);

  $("#selectedSurahTitle").textContent = `سورة ${surah.name}`;
  $("#selectedSurahMeta").textContent =
    `${surah.kind} · ${surah.count.toLocaleString("ar-EG")} آية · رقمها ${number.toLocaleString("ar-EG")}`;

  // البسملة تظهر منفصلة في كل السور عدا الفاتحة (آية) والتوبة (بلا بسملة)
  $("#basmala").style.display = number === 1 || number === 9 ? "none" : "block";

  $("#prevSurah").disabled = number === 1;
  $("#nextSurah").disabled = number === 114;

  QuranAudio.setSurah(number);

  const box = $("#ayahContainer");
  box.innerHTML = '<p class="muted">جارٍ تحميل الآيات...</p>';
  renderSurahs($("#surahSearch").value);
  updateFavUI();

  try {
    const ayahs = await getAyahs(number);
    if (number !== selectedSurah) return; // المستخدم انتقل لسورة أخرى
    box.innerHTML = ayahs.map((ayah, i) => `
      <span class="ayah" data-i="${i}" tabindex="0">${ayah}</span>
      <span class="ayah-number">۝${(i + 1).toLocaleString("ar-EG")}</span>
    `).join(" ");
  } catch {
    box.innerHTML = `
      <p class="muted">تعذّر تحميل الآيات. تأكد من الإنترنت.</p>
      <button class="small-button" id="retryAyahs">إعادة المحاولة</button>`;
    $("#retryAyahs").addEventListener("click", () => selectSurah(number));
  }
}

// نسخ آية بالضغط عليها
$("#ayahContainer").addEventListener("click", async (event) => {
  const el = event.target.closest(".ayah");
  if (!el) return;
  const surah = surahs[selectedSurah - 1];
  const text = `﴿ ${el.textContent.trim()} ﴾ — سورة ${surah.name}، الآية ${Number(el.dataset.i) + 1}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("تم نسخ الآية");
  } catch {
    showToast("تعذّر النسخ على هذا المتصفح");
  }
});

// السورة السابقة/التالية وحجم الخط
$("#prevSurah").addEventListener("click", () => selectSurah(selectedSurah - 1));
$("#nextSurah").addEventListener("click", () => selectSurah(selectedSurah + 1));

let ayahSize = load("quranakum-size", 25);
function applySize() {
  document.documentElement.style.setProperty("--ayah-size", ayahSize + "px");
  save("quranakum-size", ayahSize);
}
$("#fontUp").addEventListener("click", () => { ayahSize = Math.min(48, ayahSize + 2); applySize(); });
$("#fontDown").addEventListener("click", () => { ayahSize = Math.max(16, ayahSize - 2); applySize(); });
applySize();

// البحث عن سورة
$("#surahSearch").addEventListener("input", (event) => {
  renderSurahs(event.target.value);
});


// البحث عن سورة
$("#surahSearch").addEventListener("input", (event) => {
  renderSurahs(event.target.value);
});

// بيانات الأذكار
const adhkar = [
  {
    id: 1,
    category: "morning",
    label: "أذكار الصباح",
    text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.",
    source: "صحيح مسلم · ٦٩٠٨",
    url: "https://sunnah.com/muslim:6908",
    target: 1
  },
  {
    id: 2,
    category: "morning",
    label: "أذكار الصباح",
    text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
    source: "صحيح البخاري · ٦٣٠٦",
    url: "https://sunnah.com/bukhari:6306",
    target: 1
  },
  {
    id: 3,
    category: "evening",
    label: "أذكار المساء",
    text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.",
    source: "صحيح مسلم · ٦٩٠٨",
    url: "https://sunnah.com/muslim:6908",
    target: 1
  },
  {
    id: 4,
    category: "evening",
    label: "أذكار المساء",
    text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
    source: "صحيح البخاري · ٦٣٠٦",
    url: "https://sunnah.com/bukhari:6306",
    target: 1
  },
  {
    id: 5,
    category: "general",
    label: "ذكر عام",
    text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    source: "صحيح البخاري · ٦٤٠٥",
    url: "https://sunnah.com/bukhari:6405",
    target: 100
  },
  {
    id: 6,
    category: "general",
    label: "ذكر عام",
    text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
    source: "صحيح البخاري · ٣٢٩٣",
    url: "https://sunnah.com/bukhari:3293",
    target: 100
  },
  {
    id: 7,
    category: "general",
    label: "ذكر عام",
    text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ.",
    source: "صحيح البخاري · ٦٣٦٩",
    url: "https://sunnah.com/bukhari:6369",
    target: 1
  },
  {
    id: 8,
    category: "general",
    label: "ذكر عام",
    text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى.",
    source: "صحيح مسلم · ٦٩٠٤",
    url: "https://sunnah.com/muslim:6904",
    target: 1
  }
];

const categoryNames = {
  morning: "أذكار الصباح",
  evening: "أذكار المساء",
  general: "ذكر عام"
};

let currentFilter = "all";
let adhkarCounts = {};

try {
  adhkarCounts = JSON.parse(
    localStorage.getItem("quranakum-adhkar-v2") || "{}"
  );
} catch {
  adhkarCounts = {};
}
// تبدأ الأذكار من الصفر كل يوم
const todayKey = new Date().toDateString();
if (adhkarCounts._d !== todayKey) adhkarCounts = { _d: todayKey };

// عرض الأذكار
function renderAdhkar() {
  const items = adhkar.filter((item) => {
    return (
      currentFilter === "all" ||
      item.category === currentFilter
    );
  });

  const totalTarget = adhkar.reduce((total, item) => total + item.target, 0);
  const totalCount = adhkar.reduce(
    (total, item) => total + Math.min(item.target, adhkarCounts[item.id] || 0),
    0
  );
  const progress = Math.round((totalCount / totalTarget) * 100);
  const progressBar = $("#adhkarProgressBar");
  const progressTrack = progressBar.parentElement;
  const completedItems = adhkar.filter(
    (item) => (adhkarCounts[item.id] || 0) >= item.target
  ).length;

  $("#adhkarProgressText").textContent = `${progress.toLocaleString("ar-EG")}٪ مكتمل`;
  $("#adhkarProgressDetail").textContent = completedItems === adhkar.length
    ? "ما شاء الله، أتممت وردك اليوم. تقبّل الله منك."
    : `أتممت ${completedItems.toLocaleString("ar-EG")} من ${adhkar.length.toLocaleString("ar-EG")} أذكار اليوم`;
  progressBar.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", String(progress));

  $("#adhkarGrid").innerHTML = items.map((item) => {
    const count = adhkarCounts[item.id] || 0;
    const itemProgress = Math.min(100, Math.round((count / item.target) * 100));

    return `
      <article class="dhikr-card panel${count >= item.target ? " is-complete" : ""}">
        <div class="dhikr-card-heading">
          <span class="dhikr-type">${categoryNames[item.category]}</span>
          <span class="dhikr-target">${item.target === 1 ? "مرة واحدة" : `${item.target.toLocaleString("ar-EG")} مرة`}</span>
        </div>

        <p class="dhikr-text quran-font">${item.text}</p>

        <div class="dhikr-bottom">
          <span class="dhikr-count">إنجازك <strong>${count.toLocaleString("ar-EG")}</strong><span> / ${item.target.toLocaleString("ar-EG")}</span><a class="dhikr-source" href="${item.url}" target="_blank" rel="noopener">${item.source} ↗</a></span>
          <button
            class="dhikr-action"
            data-dhikr="${item.id}"
            aria-label="${count >= item.target ? "اكتمل" : `تسبيح ${item.text}`}"
            ${count >= item.target ? "disabled" : ""}
          >
            ${count >= item.target ? "اكتمل ✓" : "سبّح"}
          </button>
        </div>
        <div class="dhikr-item-progress" role="progressbar" aria-label="إنجاز ${item.text}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${itemProgress}">
          <span style="width: ${itemProgress}%"></span>
        </div>
      </article>
    `;
  }).join("");

  $("#adhkarGrid")
    .querySelectorAll("[data-dhikr]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.dhikr);
        const item = adhkar.find((dhikr) => dhikr.id === id);

        adhkarCounts[id] = Math.min(
          item.target,
          (adhkarCounts[id] || 0) + 1
        );

        localStorage.setItem(
          "quranakum-adhkar-v2",
          JSON.stringify(adhkarCounts)
        );

        renderAdhkar();

        if (adhkarCounts[id] === item.target) {
          showToast("أحسنت، أتممت هذا الذكر");
        }
      });
    });
}

// فلترة الأذكار
$("#adhkarFilters")
  .querySelectorAll("[data-filter]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;

      $("#adhkarFilters")
        .querySelectorAll(".filter-chip")
        .forEach((chip) => {
          chip.classList.toggle("selected", chip === button);
          chip.setAttribute("aria-pressed", String(chip === button));
        });

      renderAdhkar();
    });
  });

// أدعية ومكتبة أحاديث الصحيحين
const duas = [
  {
    title: "خير الدنيا والآخرة",
    text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    source: "القرآن الكريم · سورة البقرة، الآية ٢٠١",
    url: "https://quran.com/2/201"
  },
  {
    title: "دعاء ذي النون",
    text: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
    source: "القرآن الكريم · سورة الأنبياء، الآية ٨٧",
    url: "https://quran.com/21/87"
  },
  {
    title: "دعاء موسى عليه السلام",
    text: "رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي ۝ يَفْقَهُوا قَوْلِي",
    source: "القرآن الكريم · سورة طه، الآيات ٢٥–٢٨",
    url: "https://quran.com/20/25-28"
  },
  {
    title: "الثبات والهداية",
    text: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ",
    source: "القرآن الكريم · سورة آل عمران، الآية ٨",
    url: "https://quran.com/3/8"
  },
  {
    title: "دعاء الاستعاذة من الهم",
    text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
    source: "صحيح البخاري · ٦٣٦٩",
    url: "https://sunnah.com/bukhari:6369"
  },
  {
    title: "سؤال الهداية والتقوى",
    text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
    source: "صحيح مسلم · ٦٩٠٤",
    url: "https://sunnah.com/muslim:6904"
  },
  {
    title: "دعاء الاستغفار",
    text: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ",
    source: "صحيح البخاري · ٨٣٤",
    url: "https://sunnah.com/bukhari:834"
  },
  {
    title: "صلاح الأسرة والذرية",
    text: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    source: "القرآن الكريم · سورة الفرقان، الآية ٧٤",
    url: "https://quran.com/25/74"
  }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function setupDuaLibrary() {
  const hadiths = window.QURANAKUM_HADITHS;
  const featuredHadith = hadiths?.find(
    (hadith) => hadith.collection === "bukhari" && hadith.number === 13
  );
  const previewDua = duas[0];

  $("#libraryPreview").innerHTML = `
    <article class="library-preview-card panel">
      <div class="library-preview-item">
        <span class="dhikr-type">دعاء من القرآن</span>
        <h3>${previewDua.title}</h3>
        <p class="quran-font">${previewDua.text}</p>
        <a href="${previewDua.url}" target="_blank" rel="noopener">${previewDua.source} ↗</a>
      </div>
      ${featuredHadith ? `
        <div class="library-preview-item">
        <span class="dhikr-type">حديث من صحيح البخاري</span>
        <h3>من كمال الإيمان</h3>
        <p class="quran-font">«لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»</p>
        <a href="${escapeHtml(featuredHadith.url)}" target="_blank" rel="noopener">صحيح البخاري · ١٣ ↗</a>
        </div>
      ` : ""}
    </article>
  `;

  $("#duasGrid").innerHTML = duas.map((dua, index) => `
    <article class="dua-card panel">
      <span class="dua-index">${String(index + 1).padStart(2, "0")}</span>
      <h3>${dua.title}</h3>
      <p class="dua-text quran-font">${dua.text}</p>
      <div class="dua-card-footer">
        <a href="${dua.url}" target="_blank" rel="noopener">${dua.source} <span aria-hidden="true">↗</span></a>
        <button class="copy-text-button" data-copy-text="${index}" aria-label="نسخ ${dua.title}">نسخ الدعاء</button>
      </div>
    </article>
  `).join("");

  const pageSize = 10;
  let page = 0;
  let search = "";
  let collection = "all";
  const normalizeArabic = (value) => value
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي");

  if (!Array.isArray(hadiths) || hadiths.length !== 500) {
    $("#hadithResults").textContent = "تعذّر تحميل مكتبة الأحاديث. تأكد من وجود ملف QuranakumHadiths.js.";
    $("#hadithPrev").disabled = true;
    $("#hadithNext").disabled = true;
    return;
  }

  const expandedLibrary = $("#libraryExpanded");
  const expandLibraryButton = $("#libraryExpand");
  const collapseLibraryButton = $("#libraryCollapse");
  const toggleLibrary = (expanded) => {
    expandedLibrary.hidden = !expanded;
    expandLibraryButton.hidden = expanded;
    expandLibraryButton.setAttribute("aria-expanded", String(expanded));
    collapseLibraryButton.hidden = !expanded;
  };
  expandLibraryButton.addEventListener("click", () => toggleLibrary(true));
  collapseLibraryButton.addEventListener("click", () => {
    toggleLibrary(false);
    $("#hadiths").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function getFilteredHadiths() {
    const normalizedSearch = normalizeArabic(search);

    return hadiths.filter((hadith) => {
      const matchesCollection = collection === "all" || hadith.collection === collection;
      const searchable = `${hadith.text} ${hadith.number} ${hadith.arabicNumber || ""}`;
      const normalizedText = normalizeArabic(searchable);
      return matchesCollection && normalizedText.includes(normalizedSearch);
    });
  }

  function renderHadithPage() {
    const filtered = getFilteredHadiths();
    const pageCount = Math.ceil(filtered.length / pageSize);
    page = Math.min(page, Math.max(0, pageCount - 1));
    const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

    $("#hadithResults").textContent = `عدد النتائج: ${filtered.length.toLocaleString("ar-EG")}`;
    $("#hadithPageLabel").textContent = pageCount
      ? `صفحة ${(page + 1).toLocaleString("ar-EG")} من ${pageCount.toLocaleString("ar-EG")}`
      : "لا توجد نتائج";
    $("#hadithPrev").disabled = page === 0;
    $("#hadithNext").disabled = pageCount === 0 || page >= pageCount - 1;
    $("#hadithList").innerHTML = visible.map((hadith) => {
      const bookName = hadith.collection === "bukhari" ? "صحيح البخاري" : "صحيح مسلم";
      return `
        <article class="hadith-card panel">
          <div class="hadith-card-heading">
            <span class="dhikr-type">${bookName}</span>
            <span class="hadith-number">حديث رقم ${Number(hadith.number).toLocaleString("ar-EG")}</span>
          </div>
          <p class="hadith-text quran-font">${escapeHtml(hadith.text)}</p>
          <div class="hadith-card-footer">
            <a href="${escapeHtml(hadith.url)}" target="_blank" rel="noopener">عرض المصدر الأصلي ↗</a>
            <button class="copy-text-button" data-copy-hadith="${escapeHtml(hadith.text)}">نسخ الحديث</button>
          </div>
        </article>
      `;
    }).join("");
  }

  $("#hadithSearch").addEventListener("input", (event) => {
    search = event.target.value.trim();
    page = 0;
    renderHadithPage();
  });
  $("#hadithBook").addEventListener("change", (event) => {
    collection = event.target.value;
    page = 0;
    renderHadithPage();
  });
  $("#hadithPrev").addEventListener("click", () => {
    page--;
    renderHadithPage();
  });
  $("#hadithNext").addEventListener("click", () => {
    page++;
    renderHadithPage();
  });

  document.querySelectorAll("[data-library]").forEach((button) => {
    button.addEventListener("click", () => {
      const showHadiths = button.dataset.library === "hadiths";
      document.querySelectorAll("[data-library]").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("selected", selected);
        tab.setAttribute("aria-selected", String(selected));
      });
      $("#duasPanel").hidden = showHadiths;
      $("#hadithsPanel").hidden = !showHadiths;
      if (showHadiths) renderHadithPage();
    });
  });

  document.querySelector("#hadiths").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-text], [data-copy-hadith]");
    if (!button) return;
    const text = button.dataset.copyHadith ?? duas[Number(button.dataset.copyText)]?.text;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      showToast("تم النسخ");
    } catch {
      showToast("تعذّر النسخ على هذا المتصفح");
    }
  });

  renderHadithPage();
}

// المسبحة الإلكترونية
function setupTasbeeh() {
  const DHIKR = [
    "سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "اللَّهُ أَكْبَرُ",
    "لَا إِلَهَ إِلَّا اللَّهُ", "أَسْتَغْفِرُ اللَّهَ",
    "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ"
  ];
  const GOALS = [33, 100, 1000];
  const today = new Date().toDateString();
  const st = Object.assign(
    { i: 0, goal: 33, count: 0, laps: 0, total: Number(localStorage.getItem("quranakum-total")) || 0, day: today, today: 0, vib: true },
    load("quranakum-tasbeeh", {})
  );
  if (st.day !== today) { st.day = today; st.today = 0; }

  const C = 2 * Math.PI * 100;
  const ring = $("#ringProgress");
  ring.style.strokeDasharray = C;
  const fmt = (n) => n.toLocaleString("ar-EG");

  function draw() {
    $("#dhikrPhrase").textContent = DHIKR[st.i];
    $("#counterNumber").textContent = fmt(st.count);
    $("#goalLabel").textContent = `من ${fmt(st.goal)}`;
    $("#lapCount").textContent = fmt(st.laps);
    $("#todayCount").textContent = fmt(st.today);
    $("#totalCount").textContent = fmt(st.total);
    ring.style.strokeDashoffset = C * (1 - st.count / st.goal);
    $("#vibToggle").textContent = st.vib ? "الاهتزاز: يعمل" : "الاهتزاز: متوقف";
    $("#vibToggle").setAttribute("aria-pressed", String(st.vib));
    $("#dhikrChips").innerHTML = DHIKR.map((d, i) =>
      `<button class="chip-pro ${i === st.i ? "selected" : ""}" data-i="${i}">${d}</button>`).join("");
    $("#goalChips").innerHTML = GOALS.map((g) =>
      `<button class="chip-pro ${g === st.goal ? "selected" : ""}" data-g="${g}">${fmt(g)}</button>`).join("");
  }
  const persist = () => { save("quranakum-tasbeeh", st); localStorage.setItem("quranakum-total", st.total); };

  $("#countButton").addEventListener("click", () => {
    st.count++; st.total++; st.today++;
    let done = false;
    if (st.count >= st.goal) { st.count = 0; st.laps++; done = true; }
    if (navigator.vibrate && st.vib) navigator.vibrate(done ? [80, 50, 80] : 12);
    if (done) showToast("تقبّل الله ذكرك");
    persist(); draw();
  });
  $("#dhikrChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    st.i = Number(b.dataset.i); st.count = 0; persist(); draw();
  });
  $("#goalChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-g]"); if (!b) return;
    st.goal = Number(b.dataset.g); st.count = 0; persist(); draw();
  });
  $("#vibToggle").addEventListener("click", () => { st.vib = !st.vib; persist(); draw(); });
  $("#resetTasbeeh").addEventListener("click", () => {
    st.count = 0; st.laps = 0; persist(); draw(); showToast("تمت إعادة العداد");
  });
  draw();
}

// الوضع الليلي والنهاري
function setupTheme() {
  const savedTheme = localStorage.getItem("quranakum-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }

  updateThemeButton();

  $("#themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const isLight = document.body.classList.contains("light-mode");

    localStorage.setItem(
      "quranakum-theme",
      isLight ? "light" : "dark"
    );

    updateThemeButton();
  });
}

function updateThemeButton() {
  const isLight = document.body.classList.contains("light-mode");

  $("#themeToggle").textContent = isLight ? "☾" : "☼";
}

// قائمة الموبايل
function setupNavigation() {
  const nav = $("#mainNav");
  const toggle = $("#menuToggle");

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "×" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    });
  });

  // تمييز القسم الظاهر في الشاشة
  if ("IntersectionObserver" in window) {
    const sections = document.querySelectorAll("main section[id]");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`
          );
        });
      });
    }, {
      rootMargin: "-35% 0px -55% 0px"
    });

    sections.forEach((section) => observer.observe(section));
  }
}

// نسخ آية اليوم
$("#copyVerse").addEventListener("click", async () => {
  const verse =
    "﴿ وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ ۚ " +
    "وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ ﴾ " +
    "— سورة الحديد، الآية ٤";

  try {
    await navigator.clipboard.writeText(verse);
    showToast("تم نسخ الآية");
  } catch {
    showToast("تعذّر النسخ، جرّب تشغيل الموقع عبر Live Server");
  }
});

// مواقيت الصلاة (القاهرة افتراضيًا أو حسب موقعك الفعلي)
const PRAYERS = [
  ["الفجر", "Fajr"], ["الشروق", "Sunrise"], ["الظهر", "Dhuhr"],
  ["العصر", "Asr"], ["المغرب", "Maghrib"], ["العشاء", "Isha"]
];
const CAIRO = { latitude: 30.0444, longitude: 31.2357 };
let todayTimings = null;
let todayTz = undefined;

// اتجاه القبلة: زاوية من الشمال الحقيقي نحو الكعبة
function qiblaBearing({ latitude, longitude }) {
  const r = Math.PI / 180;
  const p1 = latitude * r, p2 = 21.4225 * r, dl = (39.8262 - longitude) * r;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) / r + 360) % 360;
}

function showQibla(c) {
  const b = qiblaBearing(c);
  $("#qiblaArrow").style.transform = `rotate(${b}deg)`;
  $("#qiblaText").textContent =
    `اتجاه القبلة ${Math.round(b).toLocaleString("ar-EG")}° من الشمال (مع عقارب الساعة)`;
}

// اسم المدينة من الإحداثيات
async function placeName(c) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=ar&lat=${c.latitude}&lon=${c.longitude}`);
    const a = (await r.json()).address || {};
    return [a.city || a.town || a.village || a.county || a.state, a.country]
      .filter(Boolean).join("، ") || "موقعك الحالي";
  } catch {
    return "موقعك الحالي";
  }
}

function updateNextPrayer() {
  if (!todayTimings) return;
  const [hh, mm] = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: todayTz
  }).format(new Date()).split(":").map(Number);
  const mins = (hh % 24) * 60 + mm;

  const list = PRAYERS.filter(([, k]) => k !== "Sunrise").map(([ar, k]) => {
    const [h, m] = todayTimings[k].split(" ")[0].split(":").map(Number);
    return { ar, k, t: h * 60 + m };
  });
  const next = list.find((p) => p.t > mins) || { ...list[0], t: list[0].t + 1440 };
  const diff = next.t - mins;
  $("#prayerStatus").textContent =
    `الصلاة القادمة: ${next.ar} بعد ${Math.floor(diff / 60).toLocaleString("ar-EG")} س و ${(diff % 60).toLocaleString("ar-EG")} د`;
  document.querySelectorAll(".prayer-time").forEach((el) =>
    el.classList.toggle("next", el.dataset.k === next.k));
}

async function loadPrayerTimes(coords, name) {
  const status = $("#prayerStatus");
  const c = coords || CAIRO;
  const now = new Date();
  status.textContent = "جارٍ تحميل مواقيت الصلاة...";

  try {
    const date = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    // بدون تحديد method: الخدمة تختار طريقة الحساب المناسبة لبلدك تلقائيًا
    const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${c.latitude}&longitude=${c.longitude}` +
      (coords ? "" : "&method=5");
    const response = await fetch(url);
    if (!response.ok) throw new Error("fail");
    const result = await response.json();
    if (result.code !== 200) throw new Error("fail");

    todayTimings = result.data.timings;
    todayTz = result.data.meta.timezone;

    const hj = result.data.date.hijri;
    $("#todayDate").textContent =
      new Intl.DateTimeFormat("ar-EG", { dateStyle: "full", timeZone: todayTz }).format(now) +
      ` · ${Number(hj.day).toLocaleString("ar-EG")} ${hj.month.ar} ${Number(hj.year).toLocaleString("ar-EG")} هـ`;

    $("#prayerTimes").innerHTML = PRAYERS.map(([ar, k]) => `
      <div class="prayer-time" data-k="${k}">
        <span>${ar}</span>
        <strong>${todayTimings[k].split(" ")[0]}</strong>
      </div>`).join("");

    $("#locationName").textContent = name || "القاهرة، مصر";
    showQibla(c);
    updateNextPrayer();
  } catch {
    status.textContent = "تعذّر تحميل المواقيت. تأكد من الإنترنت واضغط تحديث.";
  }
}

const savedPlace = load("quranakum-place", null);
$("#refreshPrayer").addEventListener("click", () =>
  loadPrayerTimes(savedPlace?.coords, savedPlace?.name));

$("#useLocation").addEventListener("click", () => {
  const btn = $("#useLocation");
  if (!navigator.geolocation) return showToast("المتصفح لا يدعم تحديد الموقع");
  if (!window.isSecureContext)
    return showToast("تحديد الموقع يعمل فقط على موقع https أو localhost");

  btn.disabled = true;
  btn.textContent = "جارٍ تحديد موقعك...";
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const c = { latitude: coords.latitude, longitude: coords.longitude };
      const name = await placeName(c);
      save("quranakum-place", { coords: c, name });
      await loadPrayerTimes(c, name);
      btn.disabled = false;
      btn.textContent = "موقعي ⌖";
      showToast(`تم تحديد موقعك: ${name}`);
    },
    (err) => {
      btn.disabled = false;
      btn.textContent = "موقعي ⌖";
      showToast(
        err.code === 1 ? "الإذن مرفوض: اسمح بالموقع من إعدادات المتصفح" :
        err.code === 3 ? "انتهت مهلة تحديد الموقع، جرّب مرة أخرى" :
        "تعذّر تحديد موقعك، تأكد من تشغيل GPS");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
});
setInterval(updateNextPrayer, 30000);

// تشغيل أجزاء الموقع
QuranAudio.init({ names: NAMES, getSurah: () => selectedSurah, goTo: (n) => selectSurah(n) });
renderSurahs();
selectSurah(selectedSurah);
renderAdhkar();
setupDuaLibrary();
setupTasbeeh();
setupTheme();
setupNavigation();
loadPrayerTimes(savedPlace?.coords, savedPlace?.name);

// تشغيل الموقع كتطبيق يعمل بدون إنترنت (يتطلب https أو localhost)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
