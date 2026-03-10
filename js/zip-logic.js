(async function () {

  const ZIP_DATA_URL =
    "https://cdn.jsdelivr.net/gh/unicornixa/tss-webflow@main/data/fr-zip-target-map.json";

  const zipInput = document.querySelector('input[name="Zip"]');
  const form = document.querySelector("form");

  if (!zipInput || !form) return;

  const zipMap = await fetch(ZIP_DATA_URL).then(r => r.json());

  const targetGeoInput = document.querySelector('[name="Target Geo"]');
  const excludeReasonInput = document.querySelector('[name="Exclude reason"]');
  const levelField = document.querySelector('[name="Level"]');

  zipInput.addEventListener("input", () => {
    zipInput.value = zipInput.value.replace(/\D/g, "").slice(0, 5);
  });

  form.addEventListener("submit", function (e) {

    const zip = zipInput.value;
    const target = zipMap[zip] || "UNKNOWN";

    if (targetGeoInput) targetGeoInput.value = target;

    let redirectUrl = "/demande-de-tarifs/merci";

    if (target === "FALSE") {
      redirectUrl = "/demande-de-tarifs/nsq";
    }

    if (levelField && levelField.value === "Supérieur") {
      if (excludeReasonInput) excludeReasonInput.value = "Supérieur";
      redirectUrl = "/demande-de-tarifs/nsq";
    }

    form.setAttribute("data-redirect", redirectUrl);

  });

})();
