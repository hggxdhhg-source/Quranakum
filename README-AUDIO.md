# نظام التلاوة في قرآنكم

- المصدر: MP3Quran API v3 — https://www.mp3quran.net/ar/api
- رابط السورة = `server` الخاص بالتسجيل + رقم السورة من ٣ خانات + `.mp3` (مثال: `…/muhammad-minshawi/r1/001.mp3`).
- الملفات: `QuranAudio.js` (المنطق + إعدادات القرّاء) و`Quranakum.html` و`Quranakum.css` و`Quranakum.js` و`sw.js`.

## إضافة قارئ جديد
1. افتح `https://www.mp3quran.net/api/v3/reciters?language=ar` وابحث عن اسم القارئ.
2. انسخ `id` واسمه، ثم تأكد أن في `moshaf` تسجيلًا `surah_total` فيه ١١٤ (أو اعرف السور الناقصة من `surah_list`).
3. أضف عنصرًا في مصفوفة `RECITERS` داخل `QuranAudio.js`:
```js
{ key: "اسم-فريد", ar: "الاسم بالعربي", en: "English name", apiId: 123, match: ["كلمة من الاسم"],
  styles: [{ moshafId: 123, label: "حفص عن عاصم · مرتل", server: "https://cdn.mp3quran.net/audio/…/r1/", missing: [] }] }
```
`styles` اختيارية: لو تركتها فارغة يظهر القارئ فقط إذا وجده الـ API وقت التشغيل.
