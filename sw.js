// Service Worker – derleme sırasında vite.config.ts bu şablondan dist/sw.js üretir (sürüm ve dosya listesi).
// Kişisel veri önbelleğe alınmaz: yalnızca sitenin kendi dosyaları; API (supabase.co) ve Google'a dokunulmaz.
const SURUM = "21649f67e447";
const DOSYALAR = ["./","./assets/index-B3V6G-QL.js","./assets/index-DfClXT7X.css","./favicon.svg","./index.html","./logo/eu-codeweek.svg","./logo/tvo.png"];
const ONBELLEK = "terabit-" + SURUM;
const AG_SURESI = 4000; // ms; zayıf Wi-Fi'da önbellekteki kabuk açılır

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll(DOSYALAR.map((d) => new Request(d, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a.startsWith("terabit-") && a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  );
});

async function sayfa(istek) {
  const kontrol = new AbortController();
  const zaman = setTimeout(() => kontrol.abort(), AG_SURESI);
  try {
    // Sayfa her zaman sunucuyla doğrulanır: yeni sürüm yayınlanınca ilk açılışta gelir
    return await fetch(istek.url, { cache: "no-cache", credentials: "same-origin", signal: kontrol.signal });
  } catch {
    const secenek = { cacheName: ONBELLEK, ignoreSearch: true, ignoreVary: true };
    return (await caches.match("./index.html", secenek)) || (await caches.match("./", secenek)) || Response.error();
  } finally {
    clearTimeout(zaman);
  }
}

self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET" || new URL(istek.url).origin !== self.location.origin) return;
  if (istek.mode === "navigate") { e.respondWith(sayfa(istek)); return; }
  // Dosya adları içerik özetli (assets/index-XXXX.js): önbellekteki kopya her zaman doğrudur
  // ignoreVary: modül betiği isteği Origin başlığı taşır; önbellekteki kopya yine de aynı dosyadır
  e.respondWith(caches.match(istek, { cacheName: ONBELLEK, ignoreSearch: true, ignoreVary: true }).then((c) => c || fetch(istek)));
});
