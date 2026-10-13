// Bilgilendirme sayfası (Aşama 1, sunucusuz). Kişisel veri istemez, kayıt tutmaz.
// Evre ve geri sayım sayfaya gömülü tarihlerle hesaplanır (Plan 8.3). Türkiye'de yaz saati yok: +03:00.
(function () {
  "use strict";

  var ZAMAN = {
    hazirlik: Date.parse("2026-10-15T08:00:00+03:00"),
    gorevGunu: Date.parse("2026-10-21T00:00:00+03:00"),
    acilis: Date.parse("2026-10-21T12:30:00+03:00"),
    bitis: Date.parse("2026-10-21T12:50:00+03:00")
  };
  var KAMPUSLER = { l: "Levent", t: "Tepeören" };

  // Test için: ?simdi=2026-10-21T12:29:50%2B03:00 (yalnızca görünümü değiştirir)
  var arama = new URLSearchParams(location.search);
  var sapma = 0;
  var testZamani = arama.get("simdi") && Date.parse(arama.get("simdi"));
  if (testZamani) sapma = testZamani - Date.now();
  function simdi() { return Date.now() + sapma; }

  function evre(t) {
    if (t < ZAMAN.hazirlik) return "bilgi";
    if (t < ZAMAN.gorevGunu) return "hazirlik";
    if (t < ZAMAN.acilis) return "gorev-gunu";
    if (t < ZAMAN.bitis) return "gorev";
    return "kapanis";
  }

  // ---- Kampüs (?k=l / ?k=t) cihazda hatırlanır; kişisel veri değildir
  function kampusAyarla() {
    var k = arama.get("k");
    try {
      if (k && KAMPUSLER[k]) localStorage.setItem("kampus", k);
      else k = localStorage.getItem("kampus");
    } catch (e) { /* özel gezinme: yok say */ }
    if (k && KAMPUSLER[k]) {
      var el = document.getElementById("kampus");
      el.textContent = KAMPUSLER[k] + " yerleşkesi";
      el.hidden = false;
    }
  }

  // ---- Geri sayım
  var rakamlar = {};
  document.querySelectorAll(".rakam").forEach(function (el) { rakamlar[el.dataset.birim] = el; });
  var oncekiEvre = null;

  function yaz(birim, deger) {
    var el = rakamlar[birim];
    var metin = birim === "gun" ? String(deger) : String(deger).padStart(2, "0");
    if (el.textContent !== metin) {
      el.textContent = metin;
      el.classList.remove("degisti");
      void el.offsetWidth; // animasyonu yeniden başlat
      el.classList.add("degisti");
    }
  }

  function guncelle() {
    var t = simdi();
    var e = evre(t);
    var kalan = Math.max(0, ZAMAN.acilis - t);
    var sn = Math.floor(kalan / 1000);
    yaz("gun", Math.floor(sn / 86400));
    yaz("saat", Math.floor(sn / 3600) % 24);
    yaz("dakika", Math.floor(sn / 60) % 60);
    yaz("saniye", sn % 60);
    if (e !== oncekiEvre) { evreyiUygula(e); oncekiEvre = e; }
  }

  function evreyiUygula(e) {
    document.documentElement.dataset.evre = e;
    var sayac = document.getElementById("sayac");
    var durum = document.getElementById("durum");
    var dugme = document.getElementById("hazirlik-dugmesi");
    var mesajlar = {
      "gorev": "Görev başladı! Sayfayı yenile ve göreve katıl.",
      "kapanis": "Görev tamamlandı. Teşekkürler dedektifler!"
    };
    sayac.hidden = e === "gorev" || e === "kapanis";
    durum.hidden = !mesajlar[e];
    durum.textContent = mesajlar[e] || "";
    var dugmeMetni = {
      "bilgi": "Hazırlık testi 15 Ekim'de açılıyor",
      "hazirlik": "Hazırlık testi birazdan açılıyor",
      "gorev-gunu": "Görev bugün 12.30'da başlıyor!",
      "gorev": "Görev başladı!",
      "kapanis": "Görev tamamlandı"
    };
    dugme.textContent = dugmeMetni[e];
    dugme.setAttribute("aria-disabled", "true");
  }

  document.getElementById("hazirlik-dugmesi").addEventListener("click", function (ev) {
    if (this.getAttribute("aria-disabled") === "true") ev.preventDefault();
  });

  // ---- Poster bulmacası köşesi: yalnızca cihazda, kayıt tutulmaz
  var form = document.getElementById("bulmaca-formu");
  var girdi = document.getElementById("cevap");
  var mesaj = document.getElementById("bulmaca-mesaj");
  var odul = document.getElementById("odul");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var deger = girdi.value.replace(/\D/g, "");
    if (!deger) { mesaj.textContent = "Önce bir sayı yaz."; return; }
    if (deger === "21") {
      mesaj.textContent = "Şifreyi çözdün! Görev günü 21 Ekim. TeraBit dans ediyor, sen de Şifre Çözücü oldun!";
      odul.hidden = false;
    } else {
      mesaj.textContent = "Bir daha dene! Yalnızca yanan lambaların noktalarını say ve topla.";
      odul.hidden = true;
    }
  });

  kampusAyarla();
  guncelle();
  setInterval(guncelle, 1000);
})();
