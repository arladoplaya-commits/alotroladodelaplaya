/* Páginas de producto en vivo: las páginas /producto/... son archivos fijos
   (precio y nombre del día de la publicación). Este script las pone al día
   con data/menu.json: precio, nombre, descripción, foto, "agotado" y
   productos que ya no están en la carta. */
(function () {
  "use strict";
  var base = location.pathname.split("/producto/")[0].replace(/\/$/, "");
  var slug = decodeURIComponent((location.pathname.split("/producto/")[1] || "").replace(/\/$/, "").replace(/\.html$/, ""));
  if (!slug) return;
  function slugify(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var to = setTimeout(function () { ctl && ctl.abort(); }, 7000);
  fetch(base + "/data/menu.json?v=" + Math.floor(Date.now() / 60000), { cache: "no-store", signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      clearTimeout(to);
      if (!d || !d.products || !d.products.length) return;
      var p = null, i;
      for (i = 0; i < d.products.length; i++) if (slugify(d.products[i].name) === slug) { p = d.products[i]; break; }
      var run = function () { p ? update(d, p) : gone(); };
      run();
      setTimeout(run, 1500);
      setTimeout(run, 5000); // por si React termina de hidratar después
    })
    .catch(function () {});

  function gone() {
    var main = document.querySelector("main");
    if (!main) return;
    if (main.getAttribute("data-aol") === "gone") return;
    main.setAttribute("data-aol", "gone");
    main.innerHTML =
      '<a href="' + base + '/" style="display:inline-block;margin-bottom:16px;font-weight:700;color:#c2542f;text-decoration:none">🌊 Al Otro Lado de la Playa</a>' +
      '<div style="text-align:center;padding:40px 12px"><div style="font-size:48px">🌙</div>' +
      '<h1 style="font-size:22px;color:#c2542f;margin:12px 0 6px">Este antojo ya no está en la carta</h1>' +
      '<p style="color:#6b5a40;margin:0 0 20px">Mira todo lo que tenemos hoy.</p>' +
      '<a href="' + base + '/" style="display:inline-block;background:#e2574c;color:#fff;font-weight:800;padding:12px 22px;border-radius:16px;text-decoration:none">Ver la carta</a></div>';
    document.title = "Producto no disponible · Al Otro Lado de la Playa";
    var m = document.createElement("meta"); m.name = "robots"; m.content = "noindex";
    document.head.appendChild(m);
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { s.remove(); });
  }

  function update(d, p) {
    var main = document.querySelector("main");
    if (!main) return;
    var cur = (d.settings && d.settings.currency) || "$";
    var price = Number(p.price).toLocaleString("en-US");
    var h1 = main.querySelector("h1");
    if (h1) { var t = (p.emoji ? p.emoji + " " : "") + p.name; if (h1.textContent !== t) h1.textContent = t; }
    var pr = main.querySelector("span.rounded-full.font-display");
    if (pr) { var pt = price + " " + cur; if (pr.textContent !== pt) pr.textContent = pt; }
    var desc = main.querySelector("p.mt-3");
    if (desc && p.description && desc.textContent !== p.description) desc.textContent = p.description;
    var cat = null, k;
    for (k = 0; k < (d.categories || []).length; k++) if (d.categories[k].id === p.category) cat = d.categories[k];
    var catEl = main.querySelector("p.mt-1");
    if (catEl && cat) { var ct = (cat.emoji ? cat.emoji + " " : "") + cat.name; if (catEl.textContent !== ct) catEl.textContent = ct; }
    var img = main.querySelector("img");
    if (img && p.image) {
      var want = /^https?:/.test(p.image) ? p.image : base + p.image;
      if (img.getAttribute("src") !== want) { img.removeAttribute("srcset"); img.setAttribute("src", want); }
      img.alt = p.name;
    }
    var ul = main.querySelector('ul[aria-label="Ingredientes"]');
    if (ul && p.ingredients) {
      var cls = ul.firstElementChild ? ul.firstElementChild.className : "";
      var html = p.ingredients.map(function (x) { return '<li class="' + cls + '">' + esc(x) + "</li>"; }).join("");
      if (ul.innerHTML !== html) ul.innerHTML = html;
    }
    var order = main.querySelector('a[href*="?abrir="]');
    var soldOut = p.available === false;
    var banner = main.querySelector("[data-aol-soldout]");
    if (soldOut && !banner && order) {
      banner = document.createElement("div");
      banner.setAttribute("data-aol-soldout", "1");
      banner.style.cssText = "margin-top:16px;padding:10px 14px;border-radius:14px;background:#fdeae0;border:2px dashed #e8b08a;color:#b3562e;font-weight:700;text-align:center;font-size:14px";
      banner.textContent = "Agotado por ahora 🌙";
      order.parentNode.parentNode.insertBefore(banner, order.parentNode);
    }
    if (!soldOut && banner) banner.remove();
    if (order) {
      var wantHref = soldOut ? base + "/" : base + "?abrir=" + encodeURIComponent(p.id);
      order.setAttribute("href", wantHref);
      order.textContent = soldOut ? "Ver la carta" : "🛒 Pedir en la carta";
    }
    document.title = (p.emoji ? p.emoji + " " : "") + p.name + " · Al Otro Lado de la Playa";
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      try {
        var j = JSON.parse(s.textContent);
        if (j && j.offers) {
          j.name = p.name; j.description = p.description || j.description; j.offers.price = p.price;
          j.offers.availability = "https://schema.org/" + (soldOut ? "OutOfStock" : "InStock");
          s.textContent = JSON.stringify(j);
        }
      } catch (e) {}
    });
  }
})();
