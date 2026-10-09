/* Ajax Heating & Cooling — site interactions */
(function () {
  "use strict";
  var d = document;

  /* Lead webhook — Headbanger n8n "HVAC Form Lead Tracking" (auto.sdagents.ai).
     Field IDs match the workflow's Google Sheet / email / Telegram mappings. */
  var LEAD_WEBHOOK = "https://auto.sdagents.ai/webhook/hvac-sites";

  /* ---- Sticky header shadow ---- */
  var header = d.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  var toggle = d.querySelector(".nav-toggle");
  var nav = d.querySelector(".nav");
  var backdrop = d.querySelector(".nav-backdrop");

  function setNav(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (backdrop) backdrop.classList.toggle("show", open);
    /* Lock scroll on <html>, not <body>: locking body turns it into a nested
       scroll container and the viewport jump-clamps the scroll position when
       the menu opens (header + drawer flew offscreen on scrolled pages). */
    d.documentElement.style.overflow = open && window.innerWidth <= 1000 ? "hidden" : "";
  }
  if (toggle) toggle.addEventListener("click", function () {
    setNav(!nav.classList.contains("open"));
  });
  if (backdrop) backdrop.addEventListener("click", function () { setNav(false); });

  /* Mobile dropdown accordion (only on small screens) */
  d.querySelectorAll(".has-dropdown > .nav__link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 1000) {
        e.preventDefault();
        var open = link.parentElement.classList.toggle("open");
        link.setAttribute("aria-expanded", open ? "true" : "false");
      }
    });
  });

  /* Close nav on link tap + on resize to desktop */
  d.querySelectorAll(".nav a:not(.has-dropdown > .nav__link)").forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); });
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1000) {
      setNav(false);
      d.querySelectorAll(".has-dropdown").forEach(function (dd) {
        dd.classList.remove("open");
        var l = dd.querySelector(".nav__link");
        if (l) l.setAttribute("aria-expanded", "false");
      });
    }
  });

  /* ---- FAQ: keep single-open behaviour optional (allow multiple) ---- */
  // Native <details> handles toggling; nothing required.

  /* ---- Scroll reveal ---- */
  var reveals = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Hide sticky mobile call bar while a quote form is on screen ---- */
  var mbar = d.querySelector(".mobile-bar");
  var qform = d.querySelector("form[data-quote-form]");
  if (mbar && qform && "IntersectionObserver" in window) {
    var mbio = new IntersectionObserver(function (entries) {
      mbar.classList.toggle("is-hidden", entries[0].isIntersecting);
    }, { threshold: 0.2 });
    mbio.observe(qform);
  }

  /* ---- Footer year ---- */
  d.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Quote / contact forms (front-end demo handler) ---- */
  d.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    if (form.dataset.leadSubmitBound === "true") return;
    form.dataset.leadSubmitBound = "true";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field, .field > div, .field-wrap") || input.parentElement;
        var ok = input.value.trim() !== "";
        if (input.type === "email") ok = ok && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value);
        if (field) field.classList.toggle("invalid", !ok);
        if (!ok && valid) { input.focus(); }
        if (!ok) valid = false;
      });
      if (!valid) return;

      var btn = form.querySelector('button[type="submit"]');
      var status = form.querySelector(".form-status");
      if (btn && btn.disabled) return;
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending..."; }

      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
      var p2 = function (x) { return String(x).padStart(2, "0"); };
      var n = new Date();
      var stamp = n.getFullYear() + "-" + p2(n.getMonth() + 1) + "-" + p2(n.getDate()) +
                  " " + p2(n.getHours()) + ":" + p2(n.getMinutes()) + ":" + p2(n.getSeconds());

      /* Map to the n8n "HVAC Form Lead Tracking" field IDs */
      var payload = new URLSearchParams();
      payload.append("1.3", val("name"));
      payload.append("2", val("email"));
      payload.append("3", val("message"));
      payload.append("4", val("phone"));
      payload.append("5.1", val("address"));
      payload.append("5.3", val("city"));
      payload.append("5.5", val("postal"));
      payload.append("source_url", window.location.href);
      payload.append("date_created", stamp);

      var isEnquiry = form.dataset.enquirySite === "true";
      var requestController = isEnquiry && typeof AbortController !== "undefined" ? new AbortController() : null;
      var receiptTimer = null;
      var settled = false;
      var done = function (ok, timedOut) {
        if (settled) return;
        settled = true;
        if (receiptTimer) clearTimeout(receiptTimer);
        /* Redirect only after the intake endpoint accepts the request. */
        if (ok && form.dataset.redirectOnSuccess) { window.location.href = form.dataset.redirectOnSuccess; return; }
        if (status) {
          status.className = "form-status " + (ok ? "ok" : "err");
          status.textContent = ok
            ? (form.dataset.enquirySite === "true" ? "Thank you. Headbanger Marketing has received your inquiry for review. A provider and appointment remain unconfirmed." : "Thank you. Your request has been received for review. The responding provider will confirm availability and next steps.")
            : (timedOut ? "We could not confirm receipt of your inquiry. Your details are still here. Please try again, or email contact@" + window.location.hostname + "." : "We could not submit your request. Your details are still here. Please try again, or email contact@" + window.location.hostname + ".");
        }
        if (ok) form.reset();
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Submit"; }
      };

      /* A new inquiry must recover after a timeout, with receipt left unconfirmed. */
      if (isEnquiry) receiptTimer = setTimeout(function () {
        done(false, true);
        if (requestController) requestController.abort();
      }, 15000);
      /* Read the intake acknowledgement before confirming receipt. */
      fetch(LEAD_WEBHOOK, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: payload.toString(),
        ...(requestController ? { signal: requestController.signal } : {})
      }).then(function (response) {
        if (!response.ok) { done(false); return; }
        if (!isEnquiry) { done(true); return; }
        var contentType = response.headers.get("content-type") || "";
        if (contentType.toLowerCase().indexOf("json") === -1) { done(true); return; }
        return response.json().then(function (acknowledgement) {
          var accepted = acknowledgement && typeof acknowledgement === "object" && !Array.isArray(acknowledgement)
            && acknowledgement.accepted !== false && acknowledgement.success !== false && acknowledgement.ok !== false
            && !acknowledgement.error;
          done(!!accepted);
        });
      }).catch(function () { done(false); });
    });

    /* clear invalid state on input */
    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field, .field > div, .field-wrap") || input.parentElement;
        if (field) field.classList.remove("invalid");
      });
    });
  });
})();
