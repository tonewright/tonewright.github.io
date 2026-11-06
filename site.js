(() => {
  const io = new IntersectionObserver((seen) => seen.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".rise").forEach((el) => io.observe(el));

  document.querySelectorAll(".card").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  const nav = document.querySelector(".nav");
  const scrolled = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", scrolled, { passive: true });
  scrolled();

  const q = document.getElementById("q");
  if (q) {
    const none = document.getElementById("none");
    q.addEventListener("input", () => {
      const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      document.querySelectorAll("[data-text]").forEach((c) => {
        c.hidden = !words.every((w) => c.dataset.text.includes(w));
        shown += !c.hidden;
      });
      document.querySelectorAll(".group").forEach((g) => (g.hidden = !g.querySelector("[data-text]:not([hidden])")));
      none.hidden = shown > 0;
    });
    addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== q) {
        e.preventDefault();
        q.focus();
      }
    });
  }

  const chips = document.getElementById("chips");
  if (chips) {
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
      const f = b.dataset.f;
      document.querySelectorAll(".rel").forEach((r) => (r.hidden = f !== "all" && r.dataset.p !== f));
      const days = [...document.querySelectorAll(".day")];
      days.forEach((d) => (d.hidden = !d.querySelector(".rel:not([hidden])")));
      const first = days.find((d) => !d.hidden);
      if (first) first.querySelector(".when").append(document.querySelector(".latest"));
      document.getElementById("empty").hidden = !!first;
    });
  }

  const links = [...document.querySelectorAll(".toc a[href^='#']")];
  if (links.length) {
    const heads = links.map((a) => document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))));
    const spy = () => {
      let k = 0;
      heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top < 140) k = i; });
      links.forEach((a, i) => a.classList.toggle("on", i === k));
    };
    let queued = false;
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; spy(); }); } }, { passive: true });
    spy();
  }
})();
