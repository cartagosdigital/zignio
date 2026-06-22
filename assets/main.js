/* ===========================================================
   ZIGNIO — interactions
   1. VSL: YouTube IFrame API, 9:16 cover, autoplay (muted),
      custom progress bar, tap-to-unmute, tap-to-pause.
   2. Countdown to 3rd batch close.
   3. Scroll reveal.
   =========================================================== */

(function () {
  "use strict";

  const VIDEO_ID = "jqC8WOZy_eI";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. VSL ---------- */
  const figure  = document.querySelector(".vsl");
  const cropEl  = document.querySelector(".vsl__crop");
  const barEl   = document.getElementById("vsl-bar");
  const soundEl = document.getElementById("vsl-sound");
  const overlay = document.getElementById("vsl-overlay");
  let player, raf;

  // size the YouTube iframe so a 16:9 video fully covers the 9:16 frame
  function coverFit() {
    if (!cropEl) return;
    const h = cropEl.clientHeight;
    const w = h * (16 / 9);                 // width needed for a 16:9 video at full height
    const iframe = cropEl.querySelector("iframe");
    if (iframe) {
      iframe.style.width = w + "px";
      iframe.style.height = h + "px";
      iframe.style.left = "50%";
      iframe.style.top = "50%";
      iframe.style.transform = "translate(-50%, -50%)";
      iframe.style.position = "absolute";
      iframe.style.maxWidth = "none";
    }
  }

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) { createPlayer(); return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = createPlayer;
  }

  function createPlayer() {
    player = new YT.Player("vsl-player", {
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        playlist: VIDEO_ID
      },
      events: {
        onReady: onReady,
        onStateChange: onStateChange
      }
    });
  }

  function onReady(e) {
    coverFit();
    figure.dataset.muted = "true";
    if (!reduceMotion) {
      e.target.mute();
      e.target.playVideo();
    }
  }

  function tick() {
    if (player && player.getDuration) {
      const d = player.getDuration();
      const t = player.getCurrentTime();
      if (d > 0) barEl.style.width = Math.min(100, (t / d) * 100) + "%";
    }
    raf = requestAnimationFrame(tick);
  }

  function onStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
      cancelAnimationFrame(raf);
      tick();
    } else {
      cancelAnimationFrame(raf);
    }
  }

  // tap video → play / pause
  if (overlay) {
    overlay.addEventListener("click", function () {
      if (!player) return;
      const state = player.getPlayerState();
      if (state === YT.PlayerState.PLAYING) player.pauseVideo();
      else player.playVideo();
    });
  }

  // sound toggle
  if (soundEl) {
    soundEl.addEventListener("click", function () {
      if (!player) return;
      const muted = player.isMuted();
      if (muted) {
        player.unMute();
        player.setVolume(100);
        figure.dataset.muted = "false";
        soundEl.setAttribute("aria-pressed", "true");
        if (player.getPlayerState() !== YT.PlayerState.PLAYING) player.playVideo();
      } else {
        player.mute();
        figure.dataset.muted = "true";
        soundEl.setAttribute("aria-pressed", "false");
      }
    });
  }

  window.addEventListener("resize", coverFit);
  if (figure) loadYouTubeAPI();

  /* ---------- 2. Countdown ---------- */
  const cd = document.getElementById("countdown");
  if (cd) {
    // Target: end of current day + 3 days (kept rolling so the page never shows 00s).
    const KEY = "zignio_cd_target";
    let target = Number(localStorage.getItem(KEY));
    const now = Date.now();
    if (!target || target < now) {
      target = now + 1000 * 60 * 60 * 47 + 1000 * 60 * 23; // ~1d 23h 23m window
      try { localStorage.setItem(KEY, String(target)); } catch (_) {}
    }
    const out = {
      d: cd.querySelector('[data-cd="d"]'),
      h: cd.querySelector('[data-cd="h"]'),
      m: cd.querySelector('[data-cd="m"]'),
      s: cd.querySelector('[data-cd="s"]')
    };
    const pad = (n) => String(n).padStart(2, "0");
    function render() {
      let diff = Math.max(0, target - Date.now());
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
