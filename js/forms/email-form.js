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
    if (!form) return;

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

      return "";
    }

    function updateExcludeReason() {
      const level = getLevel();
      excludeField.value = level === "Supérieur" ? "Supérieur" : "";
    }

    const levelInputs = form.querySelectorAll('[name="Niveau"]');
    levelInputs.forEach((input) => {
      input.addEventListener("change", updateExcludeReason);
    });

    form.addEventListener(
      "submit",
      function () {
        const targetGeo =
          form.querySelector('[name="Target Geo"]')?.value || "";

        updateExcludeReason();

        const email = form.querySelector('input[type="email"]')?.value;
        const phoneFull = form.querySelector("#FullPhone")?.value;
        const firstName = form.querySelector('input[name="Pr-nom"]')?.value;
        const lastName = form.querySelector('input[name="Nom"]')?.value;

        if (email) sessionStorage.setItem("email", email);
        if (phoneFull) sessionStorage.setItem("fullPhone", phoneFull);
        if (firstName) sessionStorage.setItem("firstName", firstName);
        if (lastName) sessionStorage.setItem("lastName", lastName);

        if (targetGeo === "FALSE" || excludeField.value) {
          formRedirectUrl = "/demande-de-tarifs/nsq";
          console.log("[email form] NSQ override applied");
        }

        setTimeout(function () {
          console.log("[email form] redirecting to:", formRedirectUrl);
          window.location.href = formRedirectUrl;
        }, 900);
      },
      true
    );
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
