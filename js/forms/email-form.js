(function () {

  const form = document.querySelector('[data-form="form"]');
  if (!form) return;

  let formRedirectUrl = "/demande-de-tarifs/merci";

  /* -------------------------
     PROFILE REDIRECT LOGIC
  ------------------------- */

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
  }

  const profileInputs = form.querySelectorAll('[name="Profil"]');

  profileInputs.forEach(input => {
    input.addEventListener("change", function () {
      const value = form.querySelector('[name="Profil"]:checked')?.value || "";
      setRedirectByProfile(value);
    });
  });

  const queryParam = /[Pp]rofil=([^&]*)/.exec(window.location.search);
  if (queryParam) {
    setRedirectByProfile(queryParam[1]);
  }

  /* -------------------------
     EXCLUSION LOGIC
  ------------------------- */

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

    excludeField.value = level === "Supérieur"
      ? "Supérieur"
      : "";
  }

  const levelInputs = form.querySelectorAll('[name="Niveau"]');

  levelInputs.forEach(input => {
    input.addEventListener("change", updateExcludeReason);
  });

  /* -------------------------
     FORM SUBMIT
  ------------------------- */

  form.addEventListener("submit", function () {

    const targetGeo = form.querySelector('[name="Target Geo"]')?.value || "";

    updateExcludeReason();

    /* Save fields */

    const email = form.querySelector('input[type="email"]')?.value;
    const phoneFull = form.querySelector("#FullPhone")?.value;
    const firstName = form.querySelector('input[name="Pr-nom"]')?.value;
    const lastName = form.querySelector('input[name="Nom"]')?.value;

    if (email) sessionStorage.setItem("email", email);
    if (phoneFull) sessionStorage.setItem("fullPhone", phoneFull);
    if (firstName) sessionStorage.setItem("firstName", firstName);
    if (lastName) sessionStorage.setItem("lastName", lastName);

    /* EXCLUSION RULES */

    if (targetGeo === "FALSE" || excludeField.value) {

      formRedirectUrl = "/demande-de-tarifs/nsq";

      console.log("[email form] NSQ redirect applied");

    }

    /* FINAL REDIRECT */

    setTimeout(function () {

      window.location.href = formRedirectUrl;

    }, 900);

  });

})();
