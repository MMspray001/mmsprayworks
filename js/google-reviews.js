(function () {
  var MAX_CHARS = 220;

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w[0].toUpperCase(); }).join("");
  }

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function truncate(text) {
    if (text.length <= MAX_CHARS) return text;
    return text.slice(0, MAX_CHARS).replace(/\s+\S*$/, "") + "…";
  }

  function setAll(selector, fn) {
    document.querySelectorAll(selector).forEach(fn);
  }

  function render(data) {
    if (data.rating != null) setAll('[data-gr="rating"]', function (el) { el.textContent = data.rating.toFixed(1); });
    if (data.count != null) setAll('[data-gr="count"]', function (el) { el.textContent = data.count; });
    if (data.writeReviewUrl) setAll('[data-gr="write-link"]', function (el) { el.href = data.writeReviewUrl; });
    if (data.mapsUrl) setAll('[data-gr="maps-link"]', function (el) { el.href = data.mapsUrl; });

    var list = document.querySelector('[data-gr="list"]');
    var tpl = document.getElementById("gr-card");
    if (!list || !tpl || !data.reviews || !data.reviews.length) return;

    list.innerHTML = "";
    data.reviews.forEach(function (r) {
      var card = tpl.content.cloneNode(true);
      var f = function (name) { return card.querySelector('[data-gr-field="' + name + '"]'); };

      if (f("name")) f("name").textContent = r.author;
      if (f("date")) f("date").textContent = formatDate(r.published) || r.relative;
      if (f("stars")) f("stars").textContent = "★★★★★".slice(0, Math.round(r.rating));
      if (f("text")) f("text").textContent = "\u201C" + truncate(r.text) + "\u201D";

      var photo = f("photo"), init = f("initials");
      if (photo && r.photo) {
        photo.src = r.photo;
        photo.alt = r.author;
        photo.referrerPolicy = "no-referrer";
        if (init) init.remove();
      } else {
        if (photo) photo.remove();
        if (init) init.textContent = initials(r.author);
      }

      list.appendChild(card);
    });

    document.dispatchEvent(new CustomEvent("google-reviews:loaded", { detail: data }));
  }

  fetch("/api/reviews")
    .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
    .then(render)
    .catch(function (err) { console.warn("Google reviews unavailable, keeping fallback content.", err); });
})();
