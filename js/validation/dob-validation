Webflow.push(function () {

  /* =========================
     DOB VALIDATION (Date de naissance)
     Input format: JJ MM AAAA
     Rule: must be older than 15 years
     Error message says: 18 years
  ========================= */

  const DOB_RULE_YEARS = 15;
  const DOB_MESSAGE_YEARS = 18;

  const DOB_DEBUG = false;
  const dlog = (...a) => DOB_DEBUG && console.log("[dob]", ...a);
  const dwarn = (...a) => DOB_DEBUG && console.warn("[dob]", ...a);

  const birthInput = document.querySelector('[data-field="birth-date"]');
  if (!birthInput) {
    dwarn("DOB input not found: [data-field='birth-date']");
    return;
  }

  function todayMidnight() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function dobCutoffDate() {
    const today = todayMidnight();
    const cutoff = new Date(today);

    const m = cutoff.getMonth();
    const day = cutoff.getDate();

    cutoff.setFullYear(cutoff.getFullYear() - DOB_RULE_YEARS);

    // Handle Feb 29 etc
    if (cutoff.getMonth() !== m) {
      cutoff.setDate(0);
    } else {
      cutoff.setDate(day);
    }

    cutoff.setHours(0, 0, 0, 0);
    return cutoff;
  }

  // Parse "JJ MM AAAA" / "JJMMYYYY" / "JJ-MM-AAAA" / "JJ/MM/AAAA"
  function parseDobFR(raw) {
    const v = String(raw || "").trim();
    if (!v) return null;

    const digits = v.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    const dd = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    const yyyy = Number(digits.slice(4, 8));

    const dt = new Date(yyyy, mm - 1, dd);
    dt.setHours(0, 0, 0, 0);

    if (
      dt.getFullYear() !== yyyy ||
      dt.getMonth() !== mm - 1 ||
      dt.getDate() !== dd
    ) return null;

    return dt;
  }

  function getDobStep() {
    return birthInput.closest('[data-form="step"]') || null;
  }

  function getDobErrorWrapper() {
    const step = getDobStep();
    return step?.querySelector('[error-msg="birth-date"]') || null;
  }

  function getDobNextButton() {
    const step = birthInput.closest('[data-form="step"]');
    return step?.querySelector('[data-form="next-btn"]') || null;
  }

  function setDobButtonState(isValid) {
    const btn = getDobNextButton();
    if (!btn) return;

    if (isValid) {
      btn.classList.remove("disabled");
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
    } else {
      btn.classList.add("disabled");
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.4";
    }
  }

  function showDobError() {
    const w = getDobErrorWrapper();
    if (w) w.style.display = "flex";
    else dwarn("DOB error wrapper not found");

    setDobButtonState(false);
  }

  function hideDobError() {
    const w = getDobErrorWrapper();
    if (w) w.style.display = "none";

    setDobButtonState(true);
  }

  function dobValidationResult() {
    const raw = birthInput.value;
    const parsed = parseDobFR(raw);
    const cutoff = dobCutoffDate();

    dlog("dobValidationResult()", {
      raw,
      parsed,
      cutoff,
      ruleYears: DOB_RULE_YEARS
    });

    if (!String(raw || "").trim()) return "empty";
    if (!parsed) return "invalid";
    if (parsed > cutoff) return "tooYoung";

    return true;
  }

  // TryFormly hook
  window.birthDateValidation = function () {

    const res = dobValidationResult();
    const msg = `Vous devez avoir au moins ${DOB_MESSAGE_YEARS} ans pour travailler chez Top Soutien Scolaire.`;

    if (res !== true) {

      showDobError();

      if (window.unfilledArr) {
        window.unfilledArr = window.unfilledArr.filter(item => item.input !== birthInput.name);
        window.unfilledArr.push({
          input: birthInput.name,
          customError: msg
        });
      }

      return false;
    }

    hideDobError();

    if (window.unfilledArr) {
      window.unfilledArr = window.unfilledArr.filter(item => item.input !== birthInput.name);
    }

    return true;
  };

  /* =========================
     INPUT EVENTS
  ========================= */

  birthInput.addEventListener("input", function () {
    const res = dobValidationResult();
    if (res === true) hideDobError();
    else showDobError();
  });

  birthInput.addEventListener("blur", function () {
    window.birthDateValidation();
  });

  /* =========================
     HARD BLOCK NEXT BUTTON
  ========================= */

  document.addEventListener("click", function (e) {

    const nextBtn = e.target.closest('[data-form="next-btn"]');
    if (!nextBtn) return;

    const step = getDobStep();
    if (!step) return;

    if (!step.contains(nextBtn)) return;

    const ok = window.birthDateValidation();

    if (!ok) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }
    }

  }, true);

  /* =========================
     TryFormly validation event
  ========================= */

  document.addEventListener("formlyValidation", function () {
    if (dobValidationResult() !== true) {
      window.birthDateValidation();
    }
  });

  /* =========================
     Initial state
  ========================= */

  hideDobError();
  setDobButtonState(dobValidationResult() === true);

  dlog("DOB validation ready");

});
