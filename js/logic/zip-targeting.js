(async function () {
  const ZIP_DATA_URL =
    "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@main/data/fr-zip-target-map.json";

  const zipInput = document.querySelector('[data-form-field="zip"]');
  if (!zipInput) return;

  const form = zipInput.closest("form");
  if (!form) return;

  let targetGeoField = form.querySelector('[name="Target Geo"]');

  if (!targetGeoField) {
    targetGeoField = document.createElement("input");
    targetGeoField.type = "hidden";
    targetGeoField.name = "Target Geo";
    form.appendChild(targetGeoField);
  }

  let zipMap = {};

  try {
    const res = await fetch(ZIP_DATA_URL);
    zipMap = await res.json();
  } catch (e) {
    console.error("ZIP map failed to load", e);
  }

  function sanitizeZip(value) {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 5);
  }

  function getZipStatus(zip) {
    if (!zip || zip.length !== 5) {
      return "UNKNOWN";
    }

    if (zipMap[zip] === "TRUE") {
      return "TRUE";
    }

    if (zipMap[zip] === "FALSE") {
      return "FALSE";
    }

    return "UNKNOWN";
  }

  function updateTargetGeo() {
    const cleanZip = sanitizeZip(zipInput.value);

    if (zipInput.value !== cleanZip) {
      zipInput.value = cleanZip;
    }

    const status = getZipStatus(cleanZip);

    targetGeoField.value = status;

    targetGeoField.dispatchEvent(new Event("input", { bubbles: true }));
    targetGeoField.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("[zip]", cleanZip, "→ Target Geo:", status);
  }

  zipInput.addEventListener("input", updateTargetGeo);

  form.addEventListener(
    "submit",
    function () {
      updateTargetGeo();
    },
    true
  );
})();
