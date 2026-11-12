/* Modo navideño: se activa desde el panel (Hoy → 🎄 Modo navideño).
   Convierte la web del cliente en una escena de Navidad: cielo de noche con luna y estrellas,
   luces de colores, arbolitos, trineo, nieve, gorro de Santa en el logo y cuenta atrás.
   Lee settings.christmas de data/menu.json (y de la app si ya cargó). */
(function () {
  "use strict";
  var ID = "aol-xmas-style";
  var CSS = [
    /* ---- escena del encabezado ---- */
    "html.aol-xmas .pc-hero{--pc-sky-1:#0f2b46;--pc-sky-2:#2b6285;--pc-sky-3:#bfe0ec;--pc-sea-back:#d8e9ef;--pc-sea-mid:#eef6f8;--pc-sea-front:#fff;--pc-foam:#e4f1f5;--pc-sand:#fdf3e0;--pc-palm:#1f7a46;box-shadow:0 2px 4px #0003,0 14px 30px -10px #0f2b46aa,0 0 0 3px #c0392b,0 0 0 6px #fff,0 0 0 9px #1f7a46}",
    "html.aol-xmas .pc-stars{opacity:1!important}",
    "html.aol-xmas .pc-moon{opacity:1!important;transform:none!important}",
    "html.aol-xmas .pc-sun,html.aol-xmas .pc-sun-glow,html.aol-xmas .pc-sparkle{display:none!important}",
    "html.aol-xmas .pc-clouds span{background:#ffffff55!important}",
    "html.aol-xmas .pc-palm svg,html.aol-xmas .pc-bunting svg{display:none}",
    "html.aol-xmas .pc-palm{filter:drop-shadow(0 4px 6px #0006)}",
    "html.aol-xmas .pc-palm::before{content:'🎄';position:absolute;left:0;right:0;bottom:-4px;text-align:center;font-size:112px;line-height:1}",
    "html.aol-xmas .pc-palm-right::before{font-size:84px}",
    "html.aol-xmas .pc-bunting{left:0!important;right:0!important;top:0!important;height:34px!important;" +
      "background:radial-gradient(circle,#ff4d4d 0 4px,transparent 5px) 0 2px/64px 30px repeat-x," +
      "radial-gradient(circle,#ffd84d 0 4px,transparent 5px) 16px 8px/64px 30px repeat-x," +
      "radial-gradient(circle,#4cd97b 0 4px,transparent 5px) 32px 2px/64px 30px repeat-x," +
      "radial-gradient(circle,#59b8ff 0 4px,transparent 5px) 48px 8px/64px 30px repeat-x;" +
      "filter:drop-shadow(0 0 5px #fffd);animation:aol-twinkle 1.4s ease-in-out infinite alternate}",
    "html.aol-xmas .pc-bunting::before{content:'';position:absolute;left:-6px;right:-6px;top:-22px;height:38px;border-bottom:2px solid #1d2e22;border-radius:50%}",
    "html.aol-xmas .pc-hero::after{content:'🦌🦌🛷';position:absolute;top:46px;left:-120px;font-size:24px;white-space:nowrap;z-index:4;pointer-events:none;animation:aol-sleigh 20s linear infinite;filter:drop-shadow(0 0 6px #fff8)}",
    "@keyframes aol-sleigh{0%{left:-120px;top:56px}50%{top:34px}100%{left:105%;top:60px}}",
    "@keyframes aol-twinkle{from{filter:drop-shadow(0 0 2px #fff8) brightness(.8)}to{filter:drop-shadow(0 0 7px #fff) brightness(1.25)}}",
    /* ---- página ---- */
    "html.aol-xmas .aol-page{background-image:radial-gradient(circle at 12% 0,#c0392b14 0,transparent 38%),radial-gradient(circle at 92% 10%,#1f7a4614 0,transparent 36%),linear-gradient(180deg,#fff4f0 0,#fdf3e0 280px)!important}",
    "html.aol-xmas .aol-card,html.aol-xmas .aol-featured{border-color:#efc6bd!important;box-shadow:0 10px 22px -16px #c0392b99,0 0 0 1px #fff inset}",
    "html.aol-xmas .aol-featured::after{content:'🎁';position:absolute;top:6px;right:8px;font-size:18px;filter:drop-shadow(0 1px 2px #0004)}",
    "html.aol-xmas .aol-cat{color:#a32e22!important;text-shadow:0 1px #fff}",
    "html.aol-xmas .aol-cat-rule{color:#1f7a46aa!important}",
    "html.aol-xmas .aol-cat::before,html.aol-xmas .aol-cat::after{content:'❄';font-size:.7em;color:#6fb1c9}",
    "html.aol-xmas .aol-price{color:#1f7a46!important;background:#eaf6ee!important;--tw-ring-color:#b6dfc3!important}",
    "html.aol-xmas .aol-navbar{border-color:#efc6bd!important;background-color:#fff6f2e6!important}",
    "html.aol-xmas .aol-daily{border-color:#1f7a4666!important;background:#1f7a460d!important}",
    "html.aol-xmas [class*='bg-[#e2574c]']{background-color:#c0392b!important}",
    "html.aol-xmas [class*='hover:bg-[#d34a40]']:hover{background-color:#a32e22!important}",
    "html.aol-xmas [class*='text-[#c2542f]']{color:#a32e22!important}",
    "html.aol-xmas [class*='text-[#e2574c]']{color:#c0392b!important}",
    "html.aol-xmas [class*='border-[#e2574c]']{border-color:#1f7a46!important}",
    "html.aol-xmas [class*='ring-[#e2574c]']{--tw-ring-color:#1f7a46!important}",
    /* ---- cinta superior ---- */
    "#aol-xmas-bar{position:relative;z-index:60;display:flex;align-items:center;justify-content:center;padding:8px 12px;" +
      "background:repeating-linear-gradient(45deg,#c0392b 0,#c0392b 14px,#a32e22 14px,#a32e22 28px);color:#fff;font:800 13px/1.25 system-ui,sans-serif;" +
      "text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.25);border-bottom:3px solid #1f7a46}",
    "#aol-xmas-bar b{font-weight:900;letter-spacing:.02em}",
    "#aol-xmas-bar em{font-style:normal;background:#fff;color:#a32e22;border-radius:99px;padding:1px 9px;margin-left:6px;white-space:nowrap}",
    /* ---- gorro de Santa ---- */
    ".aol-hatwrap{position:relative!important}",
    ".aol-hat{position:absolute;left:-8px;top:-20px;width:62px;height:56px;transform:rotate(-20deg);z-index:8;pointer-events:none;filter:drop-shadow(0 2px 3px #0005)}",
    ".aol-hat i{position:absolute;display:block}",
    ".aol-hat .c{left:6px;top:6px;width:0;height:0;border-left:25px solid transparent;border-right:25px solid transparent;border-bottom:36px solid #c0392b;border-radius:50% 50% 0 0}",
    ".aol-hat .b{left:0;top:34px;width:62px;height:15px;background:#fff;border-radius:9px;box-shadow:inset 0 -3px #e3e3e3}",
    ".aol-hat .p{right:2px;top:0;width:16px;height:16px;background:#fff;border-radius:50%;box-shadow:inset -2px -2px #e3e3e3}",
    /* ---- nieve ---- */
    "#aol-xmas-snow{position:fixed;inset:0;pointer-events:none;z-index:55;overflow:hidden}",
    "#aol-xmas-snow i{position:absolute;top:-24px;color:#fff;text-shadow:0 0 3px rgba(60,90,120,.7),0 0 8px #fff6;font-style:normal;will-change:transform;animation:aol-fall linear infinite}",
    "@keyframes aol-fall{to{transform:translate3d(var(--dx,20px),112vh,0) rotate(360deg)}}",
    "@media (prefers-reduced-motion:reduce){#aol-xmas-snow,html.aol-xmas .pc-hero::after{display:none}html.aol-xmas .pc-bunting{animation:none}}",
    "@media print{#aol-xmas-snow,#aol-xmas-bar,.aol-hat{display:none!important}}"
  ].join("");

  function daysToXmas() {
    var n = new Date(), y = n.getFullYear();
    var t = new Date(y, 11, 25), today = new Date(y, n.getMonth(), n.getDate());
    return Math.round((t - today) / 86400000);
  }

  function addHat() {
    if (document.querySelector(".aol-hat")) return;
    var logo = document.querySelector('img[src*="logo.png"]');
    var host = logo && logo.parentElement;
    if (!host) return;
    host.classList.add("aol-hatwrap");
    var h = document.createElement("span");
    h.className = "aol-hat";
    h.setAttribute("aria-hidden", "true");
    h.innerHTML = '<i class="c"></i><i class="b"></i><i class="p"></i>';
    host.appendChild(h);
  }

  function on() {
    if (!document.getElementById(ID)) {
      var st = document.createElement("style");
      st.id = ID;
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    document.documentElement.classList.add("aol-xmas");
    if (!document.getElementById("aol-xmas-bar")) {
      var bar = document.createElement("div");
      bar.id = "aol-xmas-bar";
      bar.setAttribute("role", "note");
      var d = daysToXmas();
      var extra = d > 1 ? "<em>Faltan " + d + " días para Navidad</em>" : d === 1 ? "<em>¡Mañana es Navidad!</em>" : d === 0 ? "<em>¡Hoy es Navidad!</em>" : "";
      bar.innerHTML = "<span>🎄 <b>¡Felices Fiestas!</b> Pide tu antojo navideño por WhatsApp 🎁 " + extra + "</span>";
      document.body.insertBefore(bar, document.body.firstChild);
    }
    if (!document.getElementById("aol-xmas-snow")) {
      var snow = document.createElement("div");
      snow.id = "aol-xmas-snow";
      snow.setAttribute("aria-hidden", "true");
      var flakes = ["❄", "❅", "❆", "•", "✦"];
      for (var i = 0; i < 42; i++) {
        var f = document.createElement("i");
        f.textContent = flakes[i % flakes.length];
        f.style.left = Math.round((i * 100) / 42 + Math.random() * 2) + "%";
        f.style.fontSize = 9 + Math.round(Math.random() * 17) + "px";
        f.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
        f.style.animationDuration = 6 + Math.round(Math.random() * 10) + "s";
        f.style.animationDelay = "-" + Math.round(Math.random() * 14) + "s";
        f.style.setProperty("--dx", Math.round(Math.random() * 120 - 60) + "px");
        snow.appendChild(f);
      }
      document.body.appendChild(snow);
    }
    addHat();
    // el logo aparece cuando la app termina de cargar: reintentar un momento
    var tries = 0, t = setInterval(function () { addHat(); if (document.querySelector(".aol-hat") || ++tries > 20) clearInterval(t); }, 500);
  }
  function off() {
    document.documentElement.classList.remove("aol-xmas");
    ["aol-xmas-bar", "aol-xmas-snow"].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    document.querySelectorAll(".aol-hat").forEach(function (e) { e.remove(); });
  }
  function set(v) { v ? on() : off(); }
  window.aolXmas = set;

  function start() {
    if (typeof window.__aolXmasWant !== "undefined") return set(window.__aolXmasWant);
    var base = location.pathname.split("/producto/")[0].replace(/\/[^\/]*\.html$/, "").replace(/\/$/, "");
    fetch(base + "/data/menu.json?v=" + Math.floor(Date.now() / 60000), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (typeof window.__aolXmasWant !== "undefined") return;
        set(!!(d && d.settings && d.settings.christmas));
      })
      .catch(function () {});
  }
  // Esperar a que la web termine de cargar/hidratar antes de tocar el <body>
  function later() { setTimeout(start, 800); }
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later);
  // Si el dueño lo activa o lo apaga mientras la página está abierta, se nota solo
  function recheck() {
    if (document.hidden || typeof window.__aolXmasWant !== "undefined") return;
    var base = location.pathname.split("/producto/")[0].replace(/\/[^\/]*\.html$/, "").replace(/\/$/, "");
    fetch(base + "/data/menu.json?v=" + Math.floor(Date.now() / 30000), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.settings) set(!!d.settings.christmas); })
      .catch(function () {});
  }
  document.addEventListener("visibilitychange", recheck);
  setInterval(recheck, 90000);
})();
