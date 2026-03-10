(async function () {

  const ZIP_DATA_URL =
  "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@latest/data/fr-zip-target-map.json";

  const zipInput = document.querySelector('[data-form-field="zip"]');
  if (!zipInput) return;

  let zipMap = {};

  try {
    const res = await fetch(ZIP_DATA_URL);
    zipMap = await res.json();
  } catch (e) {
    console.error("ZIP map failed to load", e);
  }

  const zipList = Object.keys(zipMap);

  const dropdown = document.createElement("div");
  dropdown.style.position = "absolute";
  dropdown.style.background = "#fff";
  dropdown.style.border = "1px solid #ddd";
  dropdown.style.width = "100%";
  dropdown.style.maxHeight = "200px";
  dropdown.style.overflowY = "auto";
  dropdown.style.zIndex = "1000";
  dropdown.style.display = "none";

  zipInput.parentNode.style.position = "relative";
  zipInput.parentNode.appendChild(dropdown);

  function showDropdown(matches) {

    dropdown.innerHTML = "";

    matches.slice(0, 10).forEach(zip => {

      const item = document.createElement("div");

      item.textContent = zip;
      item.style.padding = "8px 10px";
      item.style.cursor = "pointer";

      item.addEventListener("mouseover", function () {
        item.style.background = "#f2f2f2";
      });

      item.addEventListener("mouseout", function () {
        item.style.background = "#fff";
      });

      item.addEventListener("click", function () {
        zipInput.value = zip;
        dropdown.style.display = "none";

        zipInput.dispatchEvent(new Event("input", { bubbles: true }));
      });

      dropdown.appendChild(item);

    });

    dropdown.style.display = matches.length ? "block" : "none";

  }

  zipInput.addEventListener("input", function () {

    const value = zipInput.value.replace(/\D/g, "");

    if (value.length < 2) {
      dropdown.style.display = "none";
      return;
    }

    const matches = zipList.filter(zip => zip.startsWith(value));

    showDropdown(matches);

  });

  document.addEventListener("click", function (e) {

    if (!zipInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }

  });

})();
