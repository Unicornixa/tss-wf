(function () {
  const BASE = "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@main/js";

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

  async function initJobForm() {
    const form = document.querySelector('[form-name="job"]');
    if (!form) {
      console.warn("[job form] Form not found");
      return;
    }

    console.log("[job form] Form found:", form);

    let formRedirectUrl = "/complete";

    let targetGeoField = form.querySelector('[name="Target Geo"]');
    if (!targetGeoField) {
      targetGeoField = document.createElement("input");
      targetGeoField.type = "hidden";
      targetGeoField.name = "Target Geo";
      form.appendChild(targetGeoField);
    }

    function getTargetGeoValue() {
      const existingValue =
        form.querySelector('[name="Target Geo"]')?.value ||
        targetGeoField?.value ||
        "";

      if (
        existingValue === "TRUE" ||
        existingValue === "FALSE" ||
        existingValue === "UNKNOWN"
      ) {
        return existingValue;
      }

      return "UNKNOWN";
    }

    $(form).on("submit", function () {
      console.log("[job form] Form submitted");

      const $form = $(this);

      const email = $form.find('input[type="email"]').val();
      const phoneFull = $form.find("#FullPhone").val();
      const firstName =
        $form.find('input[name="Prénom"]').val() ||
        $form.find('input[name="Prenom"]').val() ||
        $form.find('input[name="Pr-nom"]').val();
      const lastName = $form.find('input[name="Nom"]').val();

      const targetGeo = getTargetGeoValue();
      targetGeoField.value = targetGeo;

      console.log("[job form] Target Geo:", targetGeo);

      if (targetGeo === "FALSE") {
        formRedirectUrl = "/p2-application";
        console.log("[job form] Non-target geo redirect applied");
      } else {
        formRedirectUrl = "/complete";
        console.log("[job form] Default redirect applied");
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

      let finalRedirect = formRedirectUrl;

      try {
        sessionStorage.setItem("storage_test", "1");
        sessionStorage.removeItem("storage_test");
        console.log("[job form] sessionStorage working normally");
      } catch (error) {
        if (email) {
          finalRedirect += `?email=${encodeURIComponent(email)}`;
          console.log(
            "[job form] sessionStorage blocked, adding email to URL:",
            finalRedirect
          );
        }
      }

      $form.attr("redirect", finalRedirect);
      $form.attr("data-redirect", finalRedirect);
      $form.data("redirect", finalRedirect);

      console.log("[job form] Setting timeout for redirect to:", finalRedirect);
      setTimeout(function () {
        console.log("[job form] Executing redirect to:", finalRedirect);
        window.location.href = finalRedirect;
      }, 1000);
    });

    console.log("[job form] Initialization complete");
  }

  Promise.all([
    loadScript(`${BASE}/validation/phone-validation.js`),
    loadScript(`${BASE}/validation/email-validation.js`),
    loadScript(`https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@58b3eeb/js/validation/zip-validation.js`),
    loadScript(`${BASE}/validation/dob-validation.js`),
    loadScript(`https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@027cadf/js/logic/zip-targeting.js`),
    loadScript(`https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@98203cd/js/logic/zip-dropdown.js`)
  ])
    .then(() => {
      initJobForm();
    })
    .catch((err) => {
      console.error("[job form] Failed to load dependencies:", err);
    });
})();
