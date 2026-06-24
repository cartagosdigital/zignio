/* ===========================================================
   ZIGNIO — interactions
   1. VSL: HTML5 video, 9:16 cover, autoplay (muted),
      custom progress bar, tap-to-unmute, tap-to-pause.
   2. Countdown to 3rd batch close.
   3. Scroll reveal.
   =========================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. VSL ---------- */
  const figure  = document.querySelector(".vsl");
  const cropEl  = document.querySelector(".vsl__crop");
  const barEl   = document.getElementById("vsl-bar");
  const soundEl = document.getElementById("vsl-sound");
  const overlay = document.getElementById("vsl-overlay");
  let raf;

  function createPlayer() {
    const video = document.createElement("video");
    video.src = "vsl.mp4";
    video.loop = true;
    // Both the JS property AND the HTML attribute are required for
    // autoplay to work on mobile browsers (iOS/Android).
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.style.position = "absolute";
    video.style.top = "50%";
    video.style.left = "50%";
    video.style.transform = "translate(-50%, -50%)";
    video.style.maxWidth = "none";
    document.getElementById("vsl-player").replaceWith(video);
    return video;
  }

  // size the video so a 16:9 clip fully covers the 9:16 frame
  function coverFit(video) {
    if (!cropEl || !video) return;
    const h = cropEl.clientHeight;
    const w = h * (16 / 9);
    video.style.width = w + "px";
    video.style.height = h + "px";
  }

  function tick(video) {
    if (video.duration > 0) {
      barEl.style.width = Math.min(100, (video.currentTime / video.duration) * 100) + "%";
    }
    raf = requestAnimationFrame(() => tick(video));
  }

  if (figure) {
    const video = createPlayer();
    figure.dataset.muted = "true";
    coverFit(video);
    window.addEventListener("resize", () => coverFit(video));

    video.addEventListener("play", () => {
      cancelAnimationFrame(raf);
      tick(video);
    });
    video.addEventListener("pause", () => cancelAnimationFrame(raf));

    if (!reduceMotion) {
      // Use IntersectionObserver so play() fires only when the video is
      // visible — required for mobile browsers to honour the autoplay policy.
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
              obs.disconnect();
            }
          });
        }, { threshold: 0.25 });
        io.observe(video);
      } else {
        video.play().catch(() => {});
      }
    }

    // tap video → play / pause
    if (overlay) {
      overlay.addEventListener("click", function () {
        if (video.paused) video.play();
        else video.pause();
      });
    }

    // sound toggle
    if (soundEl) {
      soundEl.addEventListener("click", function () {
        if (video.muted) {
          video.muted = false;
          video.volume = 1;
          figure.dataset.muted = "false";
          soundEl.setAttribute("aria-pressed", "true");
          if (video.paused) video.play();
        } else {
          video.muted = true;
          figure.dataset.muted = "true";
          soundEl.setAttribute("aria-pressed", "false");
        }
      });
    }
  }

  /* ---------- 2. Lotes + Countdown ---------- */
  // Lote windows (horário de Brasília, UTC-3). Price escalates per batch.
  const LOTES = [
    { n: 1, price: "97",  start: "2026-06-24T00:00:00-03:00", end: "2026-07-03T19:00:00-03:00" },
    { n: 2, price: "117", start: "2026-07-03T19:01:00-03:00", end: "2026-07-13T19:00:00-03:00" },
    { n: 3, price: "137", start: "2026-07-13T19:01:00-03:00", end: "2026-07-22T18:00:00-03:00" }
  ];

  const cd = document.getElementById("countdown");
  if (cd) {
    const out = {
      d: cd.querySelector('[data-cd="d"]'),
      h: cd.querySelector('[data-cd="h"]'),
      m: cd.querySelector('[data-cd="m"]'),
      s: cd.querySelector('[data-cd="s"]')
    };
    const valueEl = document.getElementById("offer-value");
    const loteEl  = document.getElementById("offer-lote");
    const labelEl = document.getElementById("cd-label");
    const ladder  = document.querySelectorAll("#lotes .lote");
    const pad = (n) => String(n).padStart(2, "0");

    // first lote whose window hasn't closed yet → the active/upcoming one
    function activeLote() {
      const now = Date.now();
      for (const l of LOTES) if (new Date(l.end).getTime() > now) return l;
      return null; // all closed
    }

    function paintLadder(active) {
      ladder.forEach((el) => {
        const n = Number(el.dataset.lote);
        el.classList.toggle("is-active", !!active && n === active.n);
        el.classList.toggle("is-past", !!active && n < active.n);
      });
    }

    function render() {
      const active = activeLote();
      if (!active) {
        labelEl.textContent = "Inscrições encerradas";
        out.d.textContent = out.h.textContent = out.m.textContent = out.s.textContent = "00";
        paintLadder(null);
        return;
      }
      if (valueEl) valueEl.innerHTML = active.price + '<span class="offer__cents">,00</span>';
      if (loteEl)  loteEl.textContent = "Lote " + active.n;
      if (labelEl) labelEl.textContent = "Lote " + active.n + " encerra em";
      paintLadder(active);

      let diff = Math.max(0, new Date(active.end).getTime() - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      out.d.textContent = pad(d);
      out.h.textContent = pad(h);
      out.m.textContent = pad(m);
      out.s.textContent = pad(s);
    }
    render();
    setInterval(render, 1000);
  }

  /* ---------- 3. Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(
    ".manifesto__grid, .timeline__item, .includes__grid, .mentor__grid, .card-quote, .offer__inner, .section-head"
  );
  if ("IntersectionObserver" in window && !reduceMotion) {
    revealEls.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }
})();
