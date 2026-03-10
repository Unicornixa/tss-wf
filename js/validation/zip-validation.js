Webflow.push(function () {
  const form = document.querySelector('[data-form="multistep"]');
  const zipInput = document.querySelector('[data-form-field="zip"]');

  if (!zipInput || !form) return;

  const ERROR_MESSAGE = "Sélectionnez un code postal français à 5 chiffres";

  function getZipStep() {
    return zipInput.closest('[data-form="step"]');
  }

  function getZipWrapper() {
    return zipInput.closest(".form_field-wrapper");
  }

  function getErrorWrapper() {
    const wrapper = getZipWrapper();
    return wrapper?.querySelector('[error-msg="zip"]') || null;
  }

  function getErrorTextElement() {
    const errorWrapper = getErrorWrapper();
    return errorWrapper?.querySelector('[data-error-text]') || errorWrapper?.querySelector("div:last-child") || null;
  }

  function getNextButton() {
    const step = getZipStep();
    return step?.querySelector('[data-form="next-btn"]') || null;
  }

  function setZipButtonState(isValid) {
    const btn = getNextButton();
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

  function showZipError(message) {
    const errorWrapper = getErrorWrapper();
    const errorTextElement = getErrorTextElement();

    if (errorWrapper && errorTextElement) {
      errorTextElement.textContent = message;
      errorWrapper.style.display = "flex";
    }
  }

  function hideZipError() {
    const errorWrapper = getErrorWrapper();
    if (errorWrapper) {
      errorWrapper.style.display = "none";
    }
  }

  function sanitizeZip(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 5);
  }

  function isValidZip(value) {
    return sanitizeZip(value).length === 5;
  }

  window.zipValidation = function () {
    const cleanValue = sanitizeZip(zipInput.value);

    if (zipInput.value !== cleanValue) {
      zipInput.value = cleanValue;
    }

    if (!isValidZip(cleanValue)) {
      showZipError(ERROR_MESSAGE);
      setZipButtonState(false);

      if (window.unfilledArr) {
        window.unfilledArr = window.unfilledArr.filter(
          item => item.input !== zipInput.name
        );
        window.unfilledArr.push({
          input: zipInput.name,
          customError: ERROR_MESSAGE
        });
      }

      return false;
    }

    hideZipError();
    setZipButtonState(true);

    if (window.unfilledArr) {
      window.unfilledArr = window.unfilledArr.filter(
        item => item.input !== zipInput.name
      );
    }

    return true;
  };

  zipInput.addEventListener("keydown", function (e) {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab"
    ];

    if (allowedKeys.includes(e.key)) return;

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  });

  zipInput.addEventListener("input", function () {
    zipInput.value = sanitizeZip(zipInput.value);
    window.zipValidation();
  });

  zipInput.addEventListener("blur", function () {
    window.zipValidation();
  });

  const zipNextButton = getNextButton();

  if (zipNextButton) {
    zipNextButton.addEventListener(
      "click",
      function (e) {
        const isValid = window.zipValidation();

        if (!isValid) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") {
            e.stopImmediatePropagation();
          }
        }
      },
      true
    );
  }

  document.addEventListener("formlyValidation", function () {
    window.zipValidation();
  });

  // Initial state
  if (!zipInput.value) {
    hideZipError();
    setZipButtonState(false);
  } else {
    window.zipValidation();
  }
});
