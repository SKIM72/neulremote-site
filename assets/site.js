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

  // 연결 시연 — 가상 화면 (D-202): 왼쪽 폰(내 폰)의 가상 Android를 만지면 오른쪽 폰(조작받는 폰)이 조금 늦게 그대로 따라 움직이고,
  // 누른 자리에 동그라미가 뜬다. 두 폰은 같은 마크업이고 상태(앱·글자 크기·테마·스크롤)를 함께 넣는다.
  // 화면에 보이면 손가락이 알아서 돈다(연결 → 설정 → 쓸어 올리기 → 디스플레이 → 글자 크기 → 어두운 테마 → 홈, 다음 바퀴는 되돌리기).
  // 방문자가 만지면 손가락은 사라지고, 12초 동안 아무것도 안 하면 다시 돈다. 움직임 줄이기면 자동 재생 없이 시작한다
  var vd = document.querySelector("[data-vd]");
  if (vd) (function () {
    var box = vd.querySelector("[data-vd-mine]");
    var hostBox = vd.querySelector("[data-vd-host]");
    var L = box.querySelector("[data-vp]"), R = hostBox.querySelector("[data-vp]");
    var finger = box.querySelector(".vd-finger"), touch = hostBox.querySelector(".vd-touch");
    var vdToggle = vd.querySelector("[data-vd-toggle]");
    var DELAY = 90; // 조작받는 폰이 따라오는 지연 (ms)
    var app = "home", connected = false, font = 0, dark = false;
    // 조작받는 폰에 넣을 일을 DELAY 뒤 화면 그릴 때 한꺼번에: key가 같은 것(글자 크기·스크롤·동그라미 자리)은 마지막 것만 한다
    // (타이머를 일마다 걸면 빠르게 끌 때 밀려서 오른쪽 폰이 수백 ms 늦게 따라왔다)
    var queue = [], pumping = false;
    var pump = function () {
      var now = performance.now(), due = [];
      while (queue.length && queue[0].t <= now) due.push(queue.shift());
      due.forEach(function (job, i) {
        if (job.key) for (var j = i + 1; j < due.length; j++) if (due[j].key === job.key) return;
        job.fn();
      });
      if (queue.length) requestAnimationFrame(pump); else pumping = false;
    };
    var later = function (fn, key) {
      queue.push({ t: performance.now() + DELAY, fn: fn, key: key });
      if (!pumping) { pumping = true; requestAnimationFrame(pump); }
    };
    var both = function (fn) { fn(L); later(function () { fn(R); }); };
    var one = function (vp, sel) { return vp.querySelector(sel); };
    var scroller = one(L, "[data-vp-scroll]");

    // 화면 전환이 끝나면 가려진 화면은 그리지 않는다 (data-settled → content-visibility: hidden). 글자 크기를 바꿀 때마다 가려진 홈·설정
    // 목록까지 다시 배치하느라 두 폰에 41ms(일본어 61ms)가 걸려 막대를 끄는 동안 끊겼다 → 1ms
    var settle = function (vp) {
      vp.removeAttribute("data-settled");
      clearTimeout(vp.settleTimer);
      vp.settleTimer = setTimeout(function () { vp.setAttribute("data-settled", ""); }, reduce ? 0 : 460);
    };
    settle(L);
    settle(R);

    // --- 상태 바꾸기 (방문자와 자동 재생이 같은 길로)
    var setApp = function (next, origin) {
      if (next === app) return;
      var prev = app;
      app = next;
      var hadFocus = box.contains(document.activeElement);
      both(function (vp) {
        if (origin) { vp.style.setProperty("--ox", origin.x + "%"); vp.style.setProperty("--oy", origin.y + "%"); }
        if (next === "settings" && prev === "home") one(vp, "[data-vp-scroll]").scrollTop = 0;
        vp.setAttribute("data-app", next);
        settle(vp);
      });
      // 키보드로 쓰는 중이면 새 화면의 첫 단추로
      if (hadFocus) {
        var page = one(L, next === "home" ? ".vp-home" : next === "settings" ? ".vp-settings" : next === "display" ? ".vp-display" : ".vp-other");
        var first = page && page.querySelector("button, input");
        if (first) { try { first.focus({ preventScroll: true }); } catch (err) {} }
      }
    };
    var openApp = function (el) {
      var kind = el.getAttribute("data-open");
      var r = el.getBoundingClientRect(), b = L.getBoundingClientRect();
      var origin = { x: Math.round((r.left + r.width / 2 - b.left) / b.width * 100), y: Math.round((r.top + r.height / 2 - b.top) / b.height * 100) };
      if (kind === "other") {
        var k = el.getAttribute("data-k");
        both(function (vp) {
          var src = one(vp, '[data-k="' + k + '"]');
          var ic = one(vp, "[data-vp-other-ic]");
          ic.innerHTML = src.querySelector(".vp-app-ic").innerHTML;
          ic.style.setProperty("--c", src.style.getPropertyValue("--c"));
          one(vp, "[data-vp-other-n]").textContent = src.querySelector(".vp-app-n").textContent;
        });
      }
      setApp(kind, kind === "display" ? null : origin);
    };
    var goBack = function () { if (app === "display") setApp("settings"); else if (app !== "home") setApp("home"); };
    var setFont = function (v, moveThumb) {
      font = v;
      if (moveThumb) one(L, "[data-vp-font]").value = v;
      // 배율은 0.02 단위로: 프레임마다 새 글자 크기를 준비하는 일을 반으로 줄인다 (눈에는 이어져 보인다)
      var fs = (1 + Math.round(v / 4) * 4 / 200).toFixed(2);
      if (L.style.getPropertyValue("--fs") !== fs) L.style.setProperty("--fs", fs);
      later(function () { if (R.style.getPropertyValue("--fs") !== fs) R.style.setProperty("--fs", fs); one(R, "[data-vp-font]").value = v; }, "fs");
    };
    var setDark = function (on) {
      dark = on;
      both(function (vp) { vp.setAttribute("data-theme", on ? "dark" : "light"); one(vp, "[data-vp-dark]").setAttribute("aria-checked", String(on)); });
    };
    var setConnected = function (on) {
      connected = on;
      vd.classList.toggle("is-connected", on);
      var hadFocus = box.contains(document.activeElement);
      if (!on) setApp("home");
      if (hadFocus) { try { box.querySelector(on ? "[data-vd-home]" : "[data-vd-connect]").focus({ preventScroll: true }); } catch (err) {} }
    };
    var act = function (el) {
      if (el.hasAttribute("data-vd-connect")) setConnected(true);
      else if (el.hasAttribute("data-vd-end")) setConnected(false);
      else if (el.hasAttribute("data-vd-home")) setApp("home");
      else if (el.hasAttribute("data-vd-back") || el.hasAttribute("data-vp-back")) goBack();
      else if (el.hasAttribute("data-vp-dark")) setDark(!dark);
      else if (el.hasAttribute("data-open")) openApp(el);
    };

    // --- 조작받는 폰의 동그라미·눌린 모양 (가상 화면 안 비율 0~100)
    var showTouch = function (nx, ny) {
      later(function () { touch.style.setProperty("--tx", nx.toFixed(2)); touch.style.setProperty("--ty", ny.toFixed(2)); touch.classList.add("is-on"); }, "touch");
    };
    var hideTouch = function () { later(function () { touch.classList.remove("is-on"); }, "touch"); };
    var pressed = null;
    var pressKey = function (k, on) { later(function () { var e = one(R, '[data-k="' + k + '"]'); if (e) e.classList.toggle("is-pressed", on); }); };
    var norm = function (x, y) { var b = L.getBoundingClientRect(); return { x: (x - b.left) / b.width * 100, y: (y - b.top) / b.height * 100 }; };

    // --- 방문자의 손: 누르기, 마우스로 목록 끌기(터치는 브라우저가 스크롤), 막대
    var down = false, drag = null, swallow = false, glide = 0;
    L.addEventListener("pointerdown", function (e) {
      down = true;
      var n = norm(e.clientX, e.clientY);
      showTouch(n.x, n.y);
      var k = e.target.closest("[data-k]");
      if (k) { pressed = k.getAttribute("data-k"); pressKey(pressed, true); }
      cancelAnimationFrame(glide);
      if (e.pointerType === "mouse" && app === "settings" && scroller.contains(e.target)) drag = { y: e.clientY, top: scroller.scrollTop, moved: false, v: 0, lastY: e.clientY, lastT: e.timeStamp };
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var n = norm(e.clientX, e.clientY);
      if (n.x >= 0 && n.x <= 100 && n.y >= 0 && n.y <= 100) showTouch(n.x, n.y);
      if (drag) {
        var dy = e.clientY - drag.y;
        if (Math.abs(dy) > 5) drag.moved = true;
        if (drag.moved) scroller.scrollTop = drag.top - dy;
        var dt = e.timeStamp - drag.lastT;
        if (dt > 0) { drag.v = (e.clientY - drag.lastY) / dt; drag.lastY = e.clientY; drag.lastT = e.timeStamp; }
      }
    });
    var release = function () {
      if (!down) return;
      down = false;
      hideTouch();
      if (pressed) { pressKey(pressed, false); pressed = null; }
      if (drag && drag.moved) {
        // 끌었으면 그 끝의 click은 버리고, 놓은 속도로 조금 더 미끄러진다
        swallow = true;
        setTimeout(function () { swallow = false; }, 0);
        var v = drag.v * 16;
        var slideOn = function () { if (Math.abs(v) < 0.4) return; scroller.scrollTop -= v; v *= 0.94; glide = requestAnimationFrame(slideOn); };
        if (!reduce) slideOn();
      }
      drag = null;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    box.addEventListener("click", function (e) {
      if (swallow) { swallow = false; e.preventDefault(); return; }
      var t = e.target.closest("[data-vd-connect], [data-vd-end], [data-vd-home], [data-vd-back], [data-vp-back], [data-vp-dark], [data-open]");
      if (t && box.contains(t)) act(t);
    });
    one(L, "[data-vp-font]").addEventListener("input", function (e) { setFont(Number(e.target.value), false); });
    // 스크롤은 비율로 옮긴다 (두 폰의 화면 크기가 다르다)
    scroller.addEventListener("scroll", function () {
      var max = scroller.scrollHeight - scroller.clientHeight;
      var ratio = max > 0 ? scroller.scrollTop / max : 0;
      later(function () { var s2 = one(R, "[data-vp-scroll]"); s2.scrollTop = ratio * (s2.scrollHeight - s2.clientHeight); }, "scroll");
    }, { passive: true });

    // --- 시계·날짜 (지금 시각, 페이지 언어)
    var tick = function () {
      var now = new Date();
      var hm = now.getHours() + ":" + ("0" + now.getMinutes()).slice(-2);
      vd.querySelectorAll("[data-vp-clock]").forEach(function (el) { el.textContent = hm; });
      var day = "";
      try { day = new Intl.DateTimeFormat(document.documentElement.lang || undefined, { month: "long", day: "numeric", weekday: "short" }).format(now); } catch (err) {}
      vd.querySelectorAll("[data-vp-date]").forEach(function (el) { el.textContent = day; });
    };
    tick();
    setInterval(tick, 20000);

    // --- 자동 재생: 손가락이 같은 동작을 한다. 단계마다 표(tk)를 확인해 멈추면 바로 그친다
    var auto = false, userOff = reduce, vdVisible = false, tk = 0, idle = null;
    var wait = function (ms, my, next) { setTimeout(function () { if (my === tk && auto) next(); }, ms); };
    var at = function (el, fx, fy) {
      var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      return { x: r.left - b.left + r.width * (fx == null ? 0.5 : fx), y: r.top - b.top + r.height * (fy == null ? 0.56 : fy) };
    };
    var place = function (p, ms) {
      finger.style.setProperty("--move", ms + "ms");
      finger.style.setProperty("--x", p.x.toFixed(1) + "px");
      finger.style.setProperty("--y", p.y.toFixed(1) + "px");
    };
    var touchAt = function (p) {
      var b = box.getBoundingClientRect(), n = norm(p.x + b.left, p.y + b.top);
      if (n.x >= 0 && n.x <= 100 && n.y >= 0 && n.y <= 100) showTouch(n.x, n.y);
    };
    var frames = function (ms, my, frame, done) {
      var t0 = performance.now();
      var step = function (now) {
        if (my !== tk || !auto) return;
        var t = Math.min(1, (now - t0) / ms);
        frame(t);
        if (t < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    };
    var tap = function (el, my, next) {
      var p = at(el);
      finger.classList.add("is-on");
      place(p, 640);
      wait(720, my, function () {
        p = at(el);
        finger.classList.add("is-down");
        el.classList.add("is-pressed");
        var k = el.getAttribute("data-k");
        if (k) pressKey(k, true);
        if (L.contains(el)) touchAt(p);
        wait(190, my, function () {
          finger.classList.remove("is-down");
          el.classList.remove("is-pressed");
          if (k) pressKey(k, false);
          hideTouch();
          act(el);
          wait(240, my, next);
        });
      });
    };
    // 목록을 쓸어 item이 화면 가운데쯤 오게: 손가락은 앞 60% 동안 움직이고 목록은 조금 더 미끄러진다
    var swipeTo = function (item, my, next) {
      var max = scroller.scrollHeight - scroller.clientHeight;
      var from = scroller.scrollTop;
      var d = Math.max(0, Math.min(max, item.offsetTop - scroller.clientHeight * 0.52)) - from;
      if (Math.abs(d) < 6) { next(); return; }
      var start = at(L, 0.5, d > 0 ? 0.72 : 0.42);
      var travel = Math.max(-L.clientHeight * 0.42, Math.min(L.clientHeight * 0.42, -d));
      place(start, 600);
      wait(680, my, function () {
        finger.classList.add("is-down", "is-drag");
        touchAt(start);
        wait(150, my, function () {
          var lifted = false;
          frames(1050, my, function (t) {
            var f = Math.min(1, t / 0.6);
            f = f * (2 - f);
            var p = { x: start.x, y: start.y + travel * f };
            scroller.scrollTop = from + d * (1 - Math.pow(1 - t, 3));
            if (t < 0.6) { place(p, 0); touchAt(p); }
            else if (!lifted) { lifted = true; finger.classList.remove("is-down"); hideTouch(); }
          }, function () {
            finger.classList.remove("is-down", "is-drag");
            hideTouch();
            wait(260, my, next);
          });
        });
      });
    };
    // 글자 크기 막대를 to까지 끈다 (글자가 커지며 막대 자리도 밀리므로 프레임마다 자리를 다시 잰다)
    var slideTo = function (to, my, next) {
      var range = one(L, "[data-vp-font]");
      var from = Number(range.value);
      var thumb = function (v) {
        var r = range.getBoundingClientRect(), b = box.getBoundingClientRect(), th = L.clientWidth * 0.06;
        return { x: r.left - b.left + th / 2 + (r.width - th) * v / 100, y: r.top - b.top + r.height / 2 };
      };
      place(thumb(from), 640);
      wait(720, my, function () {
        finger.classList.add("is-down", "is-drag");
        touchAt(thumb(from));
        wait(170, my, function () {
          frames(1250, my, function (t) {
            var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            var v = from + (to - from) * e;
            setFont(v, true);
            var p = thumb(v);
            place(p, 0);
            touchAt(p);
          }, function () {
            finger.classList.remove("is-down", "is-drag");
            hideTouch();
            wait(300, my, next);
          });
        });
      });
    };
    var label = function () { if (vdToggle) vdToggle.textContent = vdToggle.getAttribute(userOff ? "data-play" : "data-pause"); };
    var stopAuto = function () {
      auto = false;
      tk += 1;
      finger.classList.remove("is-on", "is-down", "is-drag");
      box.querySelectorAll(".is-pressed").forEach(function (el) { el.classList.remove("is-pressed"); });
      later(function () { touch.classList.remove("is-on"); R.querySelectorAll(".is-pressed").forEach(function (el) { el.classList.remove("is-pressed"); }); });
    };
    var runAuto = function () {
      if (auto) return;
      auto = true;
      tk += 1;
      var my = tk;
      var homeKey = box.querySelector("[data-vd-home]");
      // 손가락은 화면 아래쪽에서 나타난다
      place(at(box, 0.62, 0.84), 0);
      var loop = function () {
        if (!connected) { tap(box.querySelector("[data-vd-connect]"), my, function () { wait(900, my, loop); }); return; }
        if (app !== "home") { tap(homeKey, my, function () { wait(700, my, loop); }); return; }
        tap(one(L, '[data-k="app-settings"]'), my, function () {
          wait(620, my, function () {
            var item = one(L, '[data-k="item-display"]');
            swipeTo(item, my, function () {
              tap(item, my, function () {
                wait(620, my, function () {
                  slideTo(font < 50 ? 100 : 0, my, function () {
                    wait(420, my, function () {
                      tap(one(L, "[data-vp-dark]"), my, function () {
                        wait(1400, my, function () {
                          tap(homeKey, my, function () { wait(1500, my, loop); });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      };
      wait(500, my, loop);
    };
    // 방문자가 만지면 넘겨주고, 한동안 쉬면 다시 돈다
    var takeOver = function () {
      if (auto) stopAuto();
      clearTimeout(idle);
      if (!userOff) idle = setTimeout(function () { if (vdVisible && !userOff) runAuto(); }, 12000);
    };
    box.addEventListener("pointerdown", takeOver);
    box.addEventListener("keydown", takeOver);
    box.addEventListener("wheel", takeOver, { passive: true });
    if (vdToggle) vdToggle.addEventListener("click", function () {
      userOff = !userOff;
      clearTimeout(idle);
      if (userOff) stopAuto(); else runAuto();
      label();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        vdVisible = entries[0].isIntersecting;
        clearTimeout(idle);
        if (vdVisible && !userOff) runAuto();
        else if (!vdVisible) stopAuto();
      }, { threshold: 0.35 }).observe(vd);
    }
    label();
  })();

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
