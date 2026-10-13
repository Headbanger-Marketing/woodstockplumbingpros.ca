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
    if (window.innerWidth <= 1000) {
      if (open) requestAnimationFrame(function () { var first = nav.querySelector("a,button"); if (first) first.focus(); });
      else if (nav.contains(d.activeElement)) toggle.focus();
    }
  }
  if (toggle) toggle.addEventListener("click", function () {
    setNav(!nav.classList.contains("open"));
  });
  if (backdrop) backdrop.addEventListener("click", function () { setNav(false); });

  d.querySelectorAll(".has-dropdown").forEach(function (dropdown) {
    var button = dropdown.querySelector("button.nav__link");
    function open(state) { dropdown.classList.toggle("open", state); button.setAttribute("aria-expanded", String(state)); }
    button.addEventListener("click", function () { open(!dropdown.classList.contains("open")); });
    dropdown.addEventListener("mouseenter", function () { if (innerWidth > 1000) open(true); });
    dropdown.addEventListener("mouseleave", function () { if (innerWidth > 1000 && !dropdown.contains(d.activeElement)) open(false); });
    dropdown.addEventListener("focusout", function (event) { if (!dropdown.contains(event.relatedTarget)) open(false); });
    dropdown.addEventListener("keydown", function (event) { if (event.key === "Escape" && dropdown.classList.contains("open")) { open(false); button.focus(); event.stopPropagation(); } });
  });
  d.addEventListener("keydown", function (event) { if (event.key === "Escape" && nav && nav.classList.contains("open")) { setNav(false); toggle.focus(); } });

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

})();

/* Receipt-confirmed enquiries. Keep field IDs compatible with the intake workflow. */
(function () {
  "use strict";
  var d = document;
  var webhook = "https://auto.sdagents.ai/webhook/hvac-sites";
  var forms = d.querySelectorAll("form[data-quote-form], form[data-enquiry-form]");
  function sourceUrl(path, search) {
    var url = new URL(path || window.location.pathname, window.location.origin);
    var query = new URLSearchParams(search === undefined ? window.location.search : search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid"].forEach(function (key) {
      if (query.has(key)) url.searchParams.set(key, query.get(key).slice(0, 512));
    });
    return url.href;
  }


  function focusQuote() {
    if (window.location.hash !== "#quote") return;
    var form = d.getElementById("quote");
    if (!form) return;
    var header = d.querySelector(".site-header");
    form.style.scrollMarginTop = Math.max(24, (header ? header.getBoundingClientRect().bottom : 0) + 24) + "px";
    form.scrollIntoView({ block: "start", behavior: "instant" });
    var first = form.querySelector('input[name="name"]');
    if (first) first.focus({ preventScroll: true });
  }
  d.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var destination = new URL(link.href, window.location.href);
    if (destination.origin === window.location.origin && destination.hash === "#quote") {
      var source = window.location.pathname === "/contact/" && forms[0] && forms[0].dataset.sourceUrl ? forms[0].dataset.sourceUrl : sourceUrl();
      var sourcePath = new URL(source).pathname;
      var slug = sourcePath.match(/^\/services\/([a-z0-9-]+)\/$/);
      try { sessionStorage.setItem("quote-context", JSON.stringify({ path: sourcePath, search: new URL(source).search, service: slug ? slug[1] : "", time: Date.now() })); } catch (_) {}
      forms.forEach(function (form) { form.dataset.sourceUrl = source; });
      if (d.getElementById("quote")) {
        event.preventDefault(); window.location.hash = "quote"; requestAnimationFrame(focusQuote);
      }
    }
  });
  window.addEventListener("hashchange", focusQuote);
  window.addEventListener("load", focusQuote, { once: true });
  if (window.location.hash === "#quote") requestAnimationFrame(focusQuote);

  forms.forEach(function (form) {
    if (form.dataset.leadSubmitBound === "true") return;
    var busy = false;
    var received = false;
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var preferred = form.querySelector('[name="preferred_contact"]');
    try {
      var context = JSON.parse(sessionStorage.getItem("quote-context") || "null");
      if (window.location.pathname === "/contact/" && context && Date.now() - context.time < 3600000 && /^\/(?:services|blog|locations)\/[a-z0-9-]+\/$/.test(context.path)) {
        form.dataset.sourceUrl = sourceUrl(context.path, context.search || "");
        var serviceField = form.querySelector('[name="service"]');
        if (serviceField && Array.from(serviceField.options).some(function (o) { return o.value === context.service; })) serviceField.value = context.service;
      }
    } catch (_) {}
    function contactChoice() {
      var choice = preferred ? preferred.value : "email";
      ["email", "phone"].forEach(function (name) {
        var input = form.querySelector('[name="' + name + '"]');
        if (!input) return;
        input.disabled = name !== choice;
        input.required = name === choice;
        var field = input.closest("[data-contact-field]");
        if (field) { field.hidden = name !== choice; field.classList.remove("invalid"); }
        input.removeAttribute("aria-invalid");
      });
    }
    if (preferred) preferred.addEventListener("change", contactChoice);
    contactChoice();

    function fieldFor(input) { return input.closest("[data-field], .field > div, .field, label"); }
    function validInput(input) {
      if (input.disabled) return true;
      var value = input.value.trim();
      if (input.type === "checkbox") return !input.required || input.checked;
      if (input.required && !value) return false;
      if (!value) return true;
      if (input.type === "email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) && input.checkValidity();
      if (input.type === "tel") return /^[+()\d\s.\-]+$/.test(value) && value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15;
      if (input.name === "postal") return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ][ -]?\d[ABCEGHJ-NPRSTVWXYZ]\d$/i.test(value);
      return input.checkValidity();
    }
    form.querySelectorAll("input, textarea, select").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = fieldFor(input);
        if (field) field.classList.remove("invalid");
        input.removeAttribute("aria-invalid");
      });
    });
    function showStatus(ok, text) {
      if (!status) return;
      status.className = "form-status " + (ok ? "ok" : "err error");
      status.textContent = text;
    }
    function accepted(ack) {
      if (!ack || typeof ack !== "object" || Array.isArray(ack)) return false;
      var negative = ack.accepted === false || ack.success === false || ack.ok === false || ack.failed === true || ack.rejected === true || ack.receipt === "not_confirmed"
        || Boolean(ack.error) || (Array.isArray(ack.errors) ? ack.errors.length > 0 : Boolean(ack.errors))
        || /^(error|failed|failure|rejected|denied)$/i.test(String(ack.status || ""));
      return !negative && (ack.accepted === true || ack.success === true);
    }
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (busy || received) return;
      var firstInvalid = null;
      form.querySelectorAll("input, textarea, select").forEach(function (input) {
        if (input.disabled || input.name === "website") return;
        var ok = validInput(input);
        var field = fieldFor(input);
        if (field) field.classList.toggle("invalid", !ok);
        input.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        showStatus(false, "Please check the highlighted details before sending your request.");
        var details = firstInvalid.closest("details");
        if (details) details.open = true;
        firstInvalid.focus();
        return;
      }
      var value = function (name) {
        var input = form.querySelector('[name="' + name + '"]');
        return input && !input.disabled ? input.value.trim() : "";
      };
      if (value("website")) return;
      var now = new Date();
      var pad = function (x) { return String(x).padStart(2, "0"); };
      var stamp = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
      var message = value("message");
      var electrical = form.hasAttribute("data-enquiry-form");
      var service = value("service");
      var interest = form.querySelector('[name="service"] option:checked');
      if (service) message = "Project interest: " + (interest ? interest.textContent.trim() : service) + "\n" + message;
      var submittedChannel = value("preferred_contact");
      var payload = new URLSearchParams({
        "1.3": value("name"), "2": value("email"), "3": message, "4": value("phone"),
        "5.1": value("address"), "5.3": value("city"), "5.5": value("postal"),
        source_url: form.dataset.sourceUrl || sourceUrl(), date_created: stamp, preferred_contact: submittedChannel
      });
      if (service) payload.append("service", service);
      if (form.querySelector('[name="consent"]')) payload.append("consent", "contact_and_provider_assessment_agreed");
      if (electrical) { payload.append("source_domain", form.dataset.domain); payload.append("trade", "Electrical"); payload.append("service", service); }
      busy = true;
      if (button) button.disabled = true;
      form.setAttribute("aria-busy", "true");
      showStatus(true, "Sending your request. Please wait for receipt confirmation.");
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 90000);
      try {
        var response = await fetch(webhook, {
          method: "POST", mode: "cors", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: payload.toString(), signal: controller.signal
        });
        if (!response.ok) throw new Error("Receipt unconfirmed");
        var ack = await response.json();
        if (!accepted(ack)) throw new Error("Receipt unconfirmed");
        received = true;
        form.dataset.receiptConfirmed = "true";
        showStatus(true, "Thank you. Headbanger Marketing has received your request for Jayden's Mechanical to review. Coverage, availability and any appointment require separate confirmation. " + (submittedChannel === "phone" ? "Watch for a phone call using the number you provided." : "Check the email address you provided for follow-up."));
        try { sessionStorage.removeItem("quote-context"); sessionStorage.setItem("quote-confirmation", JSON.stringify({ channel: submittedChannel, time: Date.now() })); } catch (_) {}
        if (form.dataset.redirectOnSuccess) window.location.href = form.dataset.redirectOnSuccess;
      } catch (error) {
        showStatus(false, "We could not confirm receipt. Your request may already have reached intake. Your details are still here. Email contact@" + (form.dataset.domain || window.location.hostname) + " to confirm before sending again.");
      } finally {
        clearTimeout(timer);
        busy = false;
        form.removeAttribute("aria-busy");
        if (button) button.disabled = received;
        if (status && !form.dataset.redirectOnSuccess) status.focus({ preventScroll: true });
        else if (status && !received) status.focus({ preventScroll: true });
      }
    });
    form.dataset.leadSubmitBound = "true";
    if (button) button.disabled = false;
    var fallback = form.querySelector("[data-form-fallback]");
    if (fallback) fallback.hidden = true;
  });
})();
