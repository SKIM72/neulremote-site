// 소개 사이트: 고른 언어 기억, 테마, 스크롤로 나타나기·머리글 바탕, 시작하기에서 지금 기기의 플랫폼 표시,
// 여섯 자리 확인 직접 해 보기 (D-111 ⑤)
(function () {
  try {
    var current = document.documentElement.lang;
    if (current) localStorage.setItem("neulremote.site.lang", current);
  } catch (e) {}
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 테마: 시스템 설정 따르기(기본)·라이트·다크 (앱 설정과 같게). 머리의 짧은 스크립트가 그리기 전에 적용한다
  var root = document.documentElement;
  function themeChoice() {
    var t = root.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : "system";
  }
  function applyTheme(choice) {
    if (choice === "light" || choice === "dark") root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme");
    try {
      if (choice === "system") localStorage.removeItem("neulremote.site.theme");
      else localStorage.setItem("neulremote.site.theme", choice);
    } catch (err) {}
    // 브라우저 위 막대 색도 맞춘다
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      var light = /light/.test(m.getAttribute("media") || "");
      m.setAttribute("content", choice === "light" || (choice === "system" && light) ? "#F7F8FC" : choice === "dark" || !light ? "#0F141C" : "#F7F8FC");
    });
    document.querySelectorAll("[data-theme-choice]").forEach(function (b) {
      if (b.getAttribute("data-theme-choice") === choice) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }
  applyTheme(themeChoice());

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest(".lang-menu a[data-lang]");
    if (link) {
      try { localStorage.setItem("neulremote.site.lang", link.getAttribute("data-lang")); } catch (err) {}
    }
    var pick = e.target.closest && e.target.closest("[data-theme-choice]");
    if (pick) {
      applyTheme(pick.getAttribute("data-theme-choice"));
      var box = pick.closest("details");
      if (box) box.removeAttribute("open");
    }
    document.querySelectorAll("details.lang[open]").forEach(function (menu) {
      if (!menu.contains(e.target)) menu.removeAttribute("open");
    });
  });

  // 머리글: 조금이라도 내리면 한 단계 밝은 면
  var top = document.querySelector(".top");
  function onScroll() { if (top) top.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // 화면에 들어오면 떠오르기 (한 번만). 관찰을 못 하는 브라우저는 바로 보인다
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          seen.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (el) { seen.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // 시작하기: 지금 기기의 플랫폼 (PC 앱이 아직 없으면 PC 브라우저)
  var ua = navigator.userAgent;
  // iPadOS는 데스크톱 Safari처럼 보인다 → 터치가 있으면 iPad
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var platform = /Android/.test(ua) ? "android" : ios ? "ios" : /Windows/.test(ua) ? "windows" : /Macintosh/.test(ua) ? "mac" : "browser";
  var card = document.querySelector('.platform[data-platform="' + platform + '"]');
  if (card && card.classList.contains("is-soon")) card = document.querySelector('.platform[data-platform="browser"]');
  if (card) card.classList.add("is-you");

  // 여섯 자리 확인 (같은 Wi‑Fi에서 처음 연결할 때 두 화면에 같은 숫자): 들어올 때마다 새 숫자, 같다고 누르면 페어링
  var pairing = document.querySelector("[data-pairing]");
  if (pairing) {
    var digits = pairing.querySelectorAll("[data-digits]");
    var pairBtn = pairing.querySelector("[data-pair]");
    var done = pairing.querySelector("[data-done]");
    var newDigits = function () {
      var n = 0;
      try {
        var a = new Uint32Array(1);
        crypto.getRandomValues(a);
        n = a[0] % 1000000;
      } catch (e) {
        n = Math.floor(Math.random() * 1000000);
      }
      var s = String(n).padStart(6, "0");
      return s.slice(0, 3) + " " + s.slice(3);
    };
    var show = function () {
      var value = newDigits();
      digits.forEach(function (d) {
        d.classList.add("is-new");
        setTimeout(function () {
          d.textContent = value;
          d.classList.remove("is-new");
        }, reduce ? 0 : 180);
      });
      pairing.classList.remove("is-paired");
      if (pairBtn) pairBtn.hidden = false;
      if (done) done.hidden = true;
    };
    show();
    if (pairBtn) pairBtn.addEventListener("click", function () {
      pairing.classList.add("is-paired");
      pairBtn.hidden = true;
      if (done) done.hidden = false;
    });
    var again = pairing.querySelector("[data-again]");
    if (again) again.addEventListener("click", show);
  }
})();
