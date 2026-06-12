/* ============================================================
   AHL WASH — ahlwash.com
   Nav · reveal · counters · FAQ · form · particles · mobile CTA
   ============================================================ */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav scroll effect ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile hamburger ---------- */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  const closeMenu = () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
    document.body.classList.remove("no-scroll");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
  };

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    document.body.classList.toggle("no-scroll", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("open")) closeMenu();
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("visible"));
  } else {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealIO.observe(el));
  }

  /* ---------- Stat counters ---------- */
  const counters = document.querySelectorAll(".stat-num[data-count]");
  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    if (reducedMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIO.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.dataset.count + (el.dataset.suffix || "")));
  }

  /* ---------- Active nav highlighting ---------- */
  const navAnchors = document.querySelectorAll(".nav-links a[data-nav]");
  const sectionsToWatch = ["services", "why-us", "pricing", "testimonials", "faq"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && navAnchors.length) {
    const activeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navAnchors.forEach((a) =>
              a.classList.toggle("active", a.dataset.nav === entry.target.id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sectionsToWatch.forEach((s) => activeIO.observe(s));
  }

  /* ---------- FAQ accordion ---------- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-q");
    const panel = item.querySelector(".faq-a");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      // close all
      faqItems.forEach((other) => {
        other.classList.remove("open");
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-a").style.maxHeight = "0px";
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  /* ---------- Floating mobile CTA ---------- */
  const floatingCta = document.getElementById("floatingCta");
  const hero = document.getElementById("home");
  if ("IntersectionObserver" in window) {
    const ctaIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          floatingCta.classList.toggle("show", !entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );
    ctaIO.observe(hero);
  }

  /* ---------- Quote form: validation + Netlify submit ---------- */
  const form = document.getElementById("quoteForm");
  const submitBtn = document.getElementById("submitBtn");
  const successEl = document.getElementById("formSuccess");
  const failEl = document.getElementById("formFail");

  const isLocal =
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1", ""].includes(location.hostname);

  const validators = [
    { id: "firstName", test: (v) => v.trim().length > 0, msg: "First name is required." },
    { id: "lastName", test: (v) => v.trim().length > 0, msg: "Last name is required." },
    { id: "phone", test: (v) => /^[\d\s()+\-.]{7,}$/.test(v.trim()), msg: "Enter a valid phone number." },
    { id: "zip", test: (v) => /^\d{5}$/.test(v.trim()), msg: "Enter a 5-digit ZIP code." },
    { id: "address", test: (v) => v.trim().length >= 5, msg: "Service address is required." },
    { id: "service", test: (v) => v !== "", msg: "Please pick an option." },
  ];

  const setFieldError = (input, msg) => {
    const field = input.closest(".field");
    field.classList.toggle("invalid", Boolean(msg));
    field.querySelector(".err").textContent = msg || "";
  };

  // clear errors as the user fixes fields
  validators.forEach(({ id }) => {
    const input = document.getElementById(id);
    input.addEventListener("input", () => setFieldError(input, ""));
  });

  const showSuccess = () => {
    form.hidden = true;
    successEl.hidden = false;
    successEl.focus({ preventScroll: false });
  };

  const showFail = () => {
    failEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Send My Quote Request →";
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    failEl.hidden = true;

    let firstInvalid = null;
    validators.forEach(({ id, test, msg }) => {
      const input = document.getElementById(id);
      if (!test(input.value)) {
        setFieldError(input, msg);
        if (!firstInvalid) firstInvalid = input;
      } else {
        setFieldError(input, "");
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    if (isLocal) {
      // Local static preview: the serverless API isn't running — simulate success.
      setTimeout(showSuccess, 900);
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json().then((data) => (res.ok && data.ok ? showSuccess() : showFail())))
      .catch(showFail);
  });

  /* ---------- Hero particle canvas (floating water droplets) ---------- */
  const canvas = document.getElementById("particles");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let rafId = null;
    let heroVisible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      const count = Math.min(60, Math.floor(canvas.offsetWidth / 22));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: 1 + Math.random() * 3,
        speed: 0.25 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.3,
        alpha: 0.15 + Math.random() * 0.4,
      }));
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -8) {
          p.y = canvas.offsetHeight + 8;
          p.x = Math.random() * canvas.offsetWidth;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 200, 255, ${p.alpha})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafId === null && heroVisible && !document.hidden) rafId = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    resize();
    spawn();
    start();

    window.addEventListener("resize", () => {
      resize();
      spawn();
    });

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          heroVisible = entries[0].isIntersecting;
          heroVisible ? start() : stop();
        },
        { threshold: 0 }
      ).observe(hero);
    }
  }
})();
