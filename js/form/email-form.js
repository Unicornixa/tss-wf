(function () {
  const BASE = "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@main/js";
  const AB_CLASS = "ab-b";
  const AB_STORAGE_KEY = "vwo_ab_time_to_call_v1";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function initEmailForm() {
    const form = document.querySelector('[data-form="multistep"]');
    if (!form) {
      console.warn("[email form] Form not found");
      return;
    }

    console.log("[email form] Form found:", form);

    let formRedirectUrl = "/demande-de-tarifs/merci";

    function setRedirectByProfile(profileValue) {
      let redirectUrl = "/demande-de-tarifs/merci";

      if (
        profileValue === "Student" ||
        profileValue === "Coach" ||
        profileValue === "Adult"
      ) {
        redirectUrl = "/demande-de-tarifs/merci-beaucoup";
      }

      formRedirectUrl = redirectUrl;
      console.log("[email form] profile redirect set:", formRedirectUrl);
    }

    const profileInputs = form.querySelectorAll('[name="Profil"]');
    profileInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const value =
          form.querySelector('[name="Profil"]:checked')?.value || "";
        setRedirectByProfile(value);
      });
    });

    const queryParam = /[Pp]rofil=([^&]*)/.exec(window.location.search);
    if (queryParam) {
      setRedirectByProfile(queryParam[1]);
    }

    let excludeField = form.querySelector('[name="Exclude reason"]');

    if (!excludeField) {
      excludeField = document.createElement("input");
      excludeField.type = "hidden";
      excludeField.name = "Exclude reason";
      form.appendChild(excludeField);
    }

    const timeToCallDropdown = form.querySelector('[data-dropdown="time_to_call"]');
    const timeToCallWrapper = timeToCallDropdown?.closest(".form_field-wrapper");

    function getLevel() {
      const checked = form.querySelector('[name="Niveau"]:checked');
      if (checked) return checked.value;

      const select = form.querySelector('select[name="Niveau"]');
      if (select) return select.value;

      const generic = form.querySelector('[name="Niveau"]');
      if (generic) return generic.value;

      return "";
    }

    function clearTimeToCallFields() {
      if (timeToCallDropdown) {
        timeToCallDropdown.value = "";
      }

      [
        "time-to-call-label",
        "time-to-call-value",
        "time-to-call-start",
        "time-to-call-end",
        "time-to-call-timezone"
      ].forEach((id) => {
        const field = form.querySelector(`#${id}`);
        if (field) field.value = "";
      });

      console.log("[email form] Time to call fields cleared");
    }

    function isVariantBByClass() {
      return document.documentElement.classList.contains(AB_CLASS);
    }

    function isVariantBByStorage() {
      try {
        return localStorage.getItem(AB_STORAGE_KEY) === "B";
      } catch (e) {
        return false;
      }
    }

    function isVariantB() {
      return isVariantBByClass() || isVariantBByStorage();
    }

    function isHiddenByAB() {
      return !isVariantB();
    }

    function updateTimeToCallVisibility() {
      const targetGeo = form.querySelector('[name="Target Geo"]')?.value || "";
      const excludeReason = form.querySelector('[name="Exclude reason"]')?.value || "";

      const hiddenByBusinessLogic = targetGeo === "FALSE" || !!excludeReason;
      const hiddenByAB = isHiddenByAB();
      const shouldClear = hiddenByBusinessLogic || hiddenByAB;

      if (!timeToCallWrapper) {
        console.warn("[email form] Time to call wrapper not found");
        return;
      }

      timeToCallWrapper.style.display = hiddenByBusinessLogic ? "none" : "";

      if (shouldClear) {
        clearTimeToCallFields();
      }

      console.log("[email form] Time to call hidden:", shouldClear, {
        hiddenByBusinessLogic,
        hiddenByAB,
        isVariantB: isVariantB(),
        isVariantBByClass: isVariantBByClass(),
        isVariantBByStorage: isVariantBByStorage(),
        targetGeo,
        excludeReason
      });
    }

    function updateExcludeReason() {
      const level = getLevel();
      excludeField.value = level === "Supérieur" ? "Supérieur" : "";
      console.log("[email form] Exclude reason:", excludeField.value || "(empty)");

      updateTimeToCallVisibility();
    }

    const levelInputs = form.querySelectorAll('[name="Niveau"]');
    levelInputs.forEach((input) => {
      input.addEventListener("change", updateExcludeReason);
    });

    const targetGeoField = form.querySelector('[name="Target Geo"]');
    if (targetGeoField) {
      targetGeoField.addEventListener("change", updateTimeToCallVisibility);
    }

    function startABVisibilityWatch() {
      const MAX_WAIT = 3200;
      const INTERVAL = 100;
      const start = Date.now();

      updateTimeToCallVisibility();

      const timer = setInterval(() => {
        updateTimeToCallVisibility();

        const timedOut = Date.now() - start >= MAX_WAIT;
        if (timedOut) {
          clearInterval(timer);
        }
      }, INTERVAL);
    }

    document.addEventListener("DOMContentLoaded", updateTimeToCallVisibility);
    window.addEventListener("pageshow", function () {
      updateTimeToCallVisibility();
      startABVisibilityWatch();
    });

    updateExcludeReason();
    updateTimeToCallVisibility();
    startABVisibilityWatch();

    $(form).on("submit", function () {
      console.log("Form submitted");

      updateExcludeReason();
      updateTimeToCallVisibility();

      const $form = $(this);

      const email = $form.find('input[type="email"]').val();
      const phoneFull = $form.find("#FullPhone").val();
      const firstName = $form.find('input[name="Pr-nom"]').val();
      const lastName = $form.find('input[name="Nom"]').val();

      const timeToCallLabel = $form.find("#time-to-call-label").val() || "";
      const timeToCallValue = $form.find("#time-to-call-value").val() || "";
      const timeToCallStart = $form.find("#time-to-call-start").val() || "";
      const timeToCallEnd = $form.find("#time-to-call-end").val() || "";
      const timeToCallTimezone = $form.find("#time-to-call-timezone").val() || "";

      const zip = $form.find('input[data-form-field="zip"]').val() || "";

      const targetGeo = $form.find('[name="Target Geo"]').val() || "";
      const excludeReason = $form.find('[name="Exclude reason"]').val() || "";

      console.log("[email form] Target Geo:", targetGeo);
      console.log("[email form] Exclude reason:", excludeReason);
      console.log("[email form] TimeToCallLabel:", timeToCallLabel);
      console.log("[email form] TimeToCallValue:", timeToCallValue);
      console.log("[email form] TimeToCallStart:", timeToCallStart);
      console.log("[email form] TimeToCallEnd:", timeToCallEnd);
      console.log("[email form] TimeToCallTimezone:", timeToCallTimezone);
      console.log("[email form] Zip:", zip);

      if (targetGeo === "FALSE" || excludeReason) {
        formRedirectUrl = "/demande-de-tarifs/nsq";
        console.log("[email form] NSQ override applied");
      }

      if (email) {
        sessionStorage.setItem("email", email);
        console.log("[sessionStorage] Saved email:", email);
      }
      if (phoneFull) {
        sessionStorage.setItem("fullPhone", phoneFull);
        console.log("[sessionStorage] Saved full phone:", phoneFull);
      }
      if (firstName) {
        sessionStorage.setItem("firstName", firstName);
        console.log("[sessionStorage] Saved first name:", firstName);
      }
      if (lastName) {
        sessionStorage.setItem("lastName", lastName);
        console.log("[sessionStorage] Saved last name:", lastName);
      }
      if (timeToCallLabel) {
        sessionStorage.setItem("timeToCallLabel", timeToCallLabel);
        console.log("[sessionStorage] Saved timeToCallLabel:", timeToCallLabel);
      }
      if (timeToCallValue) {
        sessionStorage.setItem("timeToCallValue", timeToCallValue);
        console.log("[sessionStorage] Saved timeToCallValue:", timeToCallValue);
      }
      if (timeToCallStart) {
        sessionStorage.setItem("timeToCallStart", timeToCallStart);
        console.log("[sessionStorage] Saved timeToCallStart:", timeToCallStart);
      }
      if (timeToCallEnd) {
        sessionStorage.setItem("timeToCallEnd", timeToCallEnd);
        console.log("[sessionStorage] Saved timeToCallEnd:", timeToCallEnd);
      }
      if (timeToCallTimezone) {
        sessionStorage.setItem("timeToCallTimezone", timeToCallTimezone);
        console.log("[sessionStorage] Saved timeToCallTimezone:", timeToCallTimezone);
      }
      if (zip) {
        sessionStorage.setItem("zip", zip);
        console.log("[sessionStorage] Saved zip:", zip);
      }

      const timeToCall = {
        label: timeToCallLabel,
        value: timeToCallValue,
        start: timeToCallStart,
        end: timeToCallEnd,
        timezone: timeToCallTimezone
      };

      sessionStorage.setItem("timeToCall", JSON.stringify(timeToCall));
      console.log("[sessionStorage] Saved timeToCall object:", timeToCall);

      let finalRedirect = formRedirectUrl;

      try {
        sessionStorage.setItem("storage_test", "1");
        sessionStorage.removeItem("storage_test");
        console.log("sessionStorage working normally");
      } catch (error) {
        if (email) {
          finalRedirect += `?email=${encodeURIComponent(email)}`;
          console.log("sessionStorage blocked, adding email to URL:", finalRedirect);
        }
      }

      $form.attr("redirect", finalRedirect);
      $form.attr("data-redirect", finalRedirect);
      $form.data("redirect", finalRedirect);

      console.log("Setting timeout for redirect to:", finalRedirect);
      setTimeout(function () {
        console.log("Executing redirect to:", finalRedirect);
        window.location.href = finalRedirect;
      }, 1000);
    });

    console.log("[email form] Initialization complete");
  }

  Promise.all([
    loadScript(`${BASE}/validation/phone-validation.js`),
    loadScript(`${BASE}/validation/email-validation.js`),
    loadScript(`${BASE}/validation/zip-validation.js`),
    loadScript(`https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@11090ba/js/logic/zip-targeting.js`),
    loadScript(`${BASE}/logic/zip-dropdown.js`),
    loadScript(`https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@cb4d1a3/js/logic/time-to-call-filter.js`)
  ])
    .then(() => {
      initEmailForm();
    })
    .catch((err) => {
      console.error("[email form] Failed to load dependencies:", err);
    });
})();
