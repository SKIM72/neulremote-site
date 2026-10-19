// 소개 사이트: 고른 언어 기억, 스크롤로 나타나기·머리글 바탕, 시작하기에서 지금 기기의 플랫폼 칸 표시, 언어 메뉴 바깥을 누르면 닫기
(function () {
  try {
    var current = document.documentElement.lang;
    if (current) localStorage.setItem("neulremote.site.lang", current);
  } catch (e) {}
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest(".lang-menu a[data-lang]");
    if (link) {
      try { localStorage.setItem("neulremote.site.lang", link.getAttribute("data-lang")); } catch (err) {}
    }
    var menu = document.querySelector("details.lang[open]");
    if (menu && !menu.contains(e.target)) menu.removeAttribute("open");
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
