(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v) => Math.min(1, Math.max(0, v));

  const win = document.getElementById("window"), bars = [...document.querySelectorAll("#bars button")], credit = document.getElementById("credit"), shot = document.getElementById("shot");
  let at = 0, timer, held = false, seen = true;
  const picture = (b) => {
    const img = new Image();
    img.sizes = win.querySelector("img").sizes;
    img.srcset = b.dataset.srcset;
    img.src = b.dataset.src;
    return img;
  };
  const preload = (n) => picture(bars[n]);
  const show = async (n) => {
    if (n === at) return;
    at = n;
    const b = bars[n], img = picture(b);
    img.alt = b.dataset.alt;
    await img.decode().catch(() => {});
    if (n !== at) return;
    img.className = "next";
    img.addEventListener("animationend", () => { while (win.firstChild !== img) win.firstChild.remove(); img.className = ""; }, { once: true });
    win.append(img);
    shot.style.setProperty("--tint", b.dataset.tint);
    credit.innerHTML = b.dataset.credit;
    cycle();
  };
  const cycle = () => {
    clearTimeout(timer);
    bars.forEach((x, i) => { x.removeAttribute("aria-current"); if (i === at) { void x.offsetWidth; x.setAttribute("aria-current", "true"); } });
    shot.classList.toggle("held", held || !seen || document.hidden);
    if (still || held || !seen || document.hidden) return;
    const next = (at + 1) % bars.length;
    preload(next);
    timer = setTimeout(() => show(next), 6000);
  };
  bars.forEach((b, i) => (b.onclick = () => show(i)));
  const hold = (on) => { held = on; cycle(); };
  shot.addEventListener("pointerenter", () => hold(true));
  shot.addEventListener("pointerleave", () => hold(false));
  shot.addEventListener("focusin", () => hold(true));
  shot.addEventListener("focusout", () => hold(false));
  document.addEventListener("visibilitychange", cycle);
  addEventListener("load", () => new IntersectionObserver((e) => { seen = e[0].isIntersecting; cycle(); }).observe(shot));

  const say = document.getElementById("say"), spans = [...say.children];
  const turn = document.getElementById("turn"), lines = [...turn.querySelectorAll(".turn__line")], steps = [...turn.querySelectorAll(".turn__steps i")];
  const tilt = shot.querySelector(".tilt"), game = document.getElementById("game");
  const N = +turn.dataset.frames, frames = [], first = turn.querySelector("img");
  let canvas = null, ctx = null, shown = -1, want = 0;
  const paint = () => {
    if (!ctx) return;
    let k = -1;
    for (let d = 0; d < N && k < 0; d++) k = frames[(want + d) % N]?.done ? (want + d) % N : frames[(want - d + N) % N]?.done ? (want - d + N) % N : -1;
    if (k < 0 || k === shown) return;
    shown = k;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[k], 0, 0, canvas.width, canvas.height);
  };
  const frame = () => {
    const h = innerHeight;
    const top = shot.getBoundingClientRect().top, gt = game.getBoundingClientRect().top, r = say.getBoundingClientRect(), t = turn.getBoundingClientRect();
    tilt.style.setProperty("--p", still ? 1 : clamp(1 - (top - h * 0.25) / (h * 0.55)).toFixed(3));
    game.style.setProperty("--g", still ? 1 : clamp((h - gt) / (h * 0.9)).toFixed(3));
    const p = clamp((h * 0.85 - r.top) / (r.height + h * 0.35));
    spans.forEach((s, i) => s.style.setProperty("--o", clamp(p * spans.length * 1.15 - i).toFixed(2)));
    const q = Math.min(0.999, clamp(-t.top / (t.height - h)));
    const k = Math.floor(q * lines.length);
    lines.forEach((l, i) => l.classList.toggle("on", i === k));
    steps.forEach((d, i) => d.classList.toggle("on", i === k));
    want = Math.min(N - 1, Math.floor(clamp((q - 0.04) / 0.92) * N));
    paint();
  };
  let queued = false;
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } }, { passive: true });
  addEventListener("resize", frame);
  frame();

  const order = [];
  for (let step = 8; step >= 1; step /= 2) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
  const load = () => {
    for (const i of order) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        img.done = true;
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", first.alt);
          ctx = canvas.getContext("2d");
          first.replaceWith(canvas);
        }
        paint();
      };
      img.src = `${turn.dataset.path}${String(i).padStart(2, "0")}.webp`;
      frames[i] = img;
    }
  };
  if (!still && N) {
    const io = new IntersectionObserver((seen) => { if (seen.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "150% 0px" });
    io.observe(turn);
  }
})();
