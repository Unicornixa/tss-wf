(function () {
  const BASE = "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@latest/js";

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

    function getLevel() {
      const checked = form.querySelector('[name="Niveau"]:checked');
      if (checked) return checked.value;

      const select = form.querySelector('select[name="Niveau"]');
      if (select) return select.value;

      const generic = form.querySelector('[name="Niveau"]');
      if (generic) return generic.value;

      return "";
    }

    function updateExcludeReason() {
      const level = getLevel();
      excludeField.value = level === "Supérieur" ? "Supérieur" : "";
      console.log("[email form] Exclude reason:", excludeField.value || "(empty)");
    }

    const levelInputs = form.querySelectorAll('[name="Niveau"]');
    levelInputs.forEach((input) => {
      input.addEventListener("change", updateExcludeReason);
    });

    $(form).on("submit", function () {
      console.log("Form submitted");

      updateExcludeReason();

      const $form = $(this);

      const email = $form.find('input[type="email"]').val();
      const phoneFull = $form.find("#FullPhone").val();
      const firstName = $form.find('input[name="Pr-nom"]').val();
      const lastName = $form.find('input[name="Nom"]').val();

      const targetGeo = $form.find('[name="Target Geo"]').val() || "";
      const excludeReason = $form.find('[name="Exclude reason"]').val() || "";

      console.log("[email form] Target Geo:", targetGeo);
      console.log("[email form] Exclude reason:", excludeReason);

      // New exclusion logic overrides old redirect rules
      if (targetGeo === "FALSE" || excludeReason) {
        formRedirectUrl = "/demande-de-tarifs/nsq";
        console.log("[email form] NSQ override applied");
      }

      // Save values to sessionStorage
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

      // Build redirect URL (fallback to URL param if sessionStorage is blocked)
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

      // Keep redirect attrs updated too
      $form.attr("redirect", finalRedirect);
      $form.attr("data-redirect", finalRedirect);
      $form.data("redirect", finalRedirect);

      // Timeout before redirect
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
    loadScript(`${BASE}/logic/zip-targeting.js`),
    loadScript(`${BASE}/logic/zip-dropdown.js`)
  ])
    .then(() => {
      initEmailForm();
    })
    .catch((err) => {
      console.error("[email form] Failed to load dependencies:", err);
    });
})();
