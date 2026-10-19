// 소개 사이트: 고른 언어 기억, 스크롤로 나타나기·머리글 바탕, 시작하기에서 지금 기기의 플랫폼 칸 표시, 언어 메뉴 바깥을 누르면 닫기
(function () {
  try {
    var current = document.documentElement.lang;
    if (current) localStorage.setItem("neulremote.site.lang", current);
  } catch (e) {}
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
      m.setAttribute("content", choice === "light" || (choice === "system" && light) ? "#F2F4F8" : choice === "dark" || !light ? "#10151E" : "#F2F4F8");
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

  // 머리글: 맨 위에서는 투명, 조금이라도 내리면 흐린 바탕
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

  var ua = navigator.userAgent;
  // iPadOS는 데스크톱 Safari처럼 보인다 → 터치가 있으면 iPad
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var platform = /Android/.test(ua) ? "android" : ios ? "ios" : /Windows/.test(ua) ? "windows" : /Macintosh/.test(ua) ? "mac" : "browser";
  var card = document.querySelector('.platform[data-platform="' + platform + '"]');
  // PC 앱이 아직 없으면 PC 브라우저 칸을 권한다
  if (card && card.classList.contains("is-soon")) card = document.querySelector('.platform[data-platform="browser"]');
  if (card) card.classList.add("is-you");
})();
