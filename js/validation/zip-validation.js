Webflow.push(function () {
  const form = document.querySelector('[data-form="multistep"]');
  const zipInput = document.querySelector('[data-form-field="zip"]');
  if (!zipInput || !form) return;

  const ERROR_MESSAGE = "Sélectionnez un code postal français à 5 chiffres";

  const zipWrapper =
    zipInput.closest(".form_field-wrapper") ||
    zipInput.closest('[data-form="step"]');

  const errorWrapper =
    zipWrapper?.querySelector('[error-msg="zip"]') ||
    zipWrapper?.querySelector('[data-text="error-message"]');

  const errorTextElement =
    errorWrapper?.querySelector('[data-error-text]') ||
    errorWrapper?.querySelector('div:last-child');

  function showZipError(message) {
    if (errorWrapper && errorTextElement) {
      errorTextElement.textContent = message;
      errorWrapper.style.display = "flex";
    }
  }

  function hideZipError() {
    if (errorWrapper) {
      errorWrapper.style.display = "none";
    }
  }

  function isValidZip(value) {
    const clean = (value || "").replace(/\D/g, "");
    return clean.length === 5;
  }

  window.zipValidation = function () {
    const zipValue = zipInput.value || "";

    if (!isValidZip(zipValue)) {
      showZipError(ERROR_MESSAGE);

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

    if (window.unfilledArr) {
      window.unfilledArr = window.unfilledArr.filter(
        item => item.input !== zipInput.name
      );
    }

    return true;
  };

  zipInput.addEventListener("input", function () {
    // keep only numbers
    this.value = this.value.replace(/\D/g, "").slice(0, 5);

    if (this.value.length > 0 || form.dataset.submitAttempted) {
      window.zipValidation();
    }
  });

  zipInput.addEventListener("blur", function () {
    window.zipValidation();
  });

  const zipStep = zipInput.closest('[data-form="step"]');
  const zipNextButton = zipStep?.querySelector('[data-form="next-btn"]');

  if (zipNextButton) {
    zipNextButton.addEventListener(
      "click",
      function () {
        if (!window.zipValidation()) {
          setTimeout(() => {
            window.zipValidation();
          }, 0);
        }
      },
      true
    );
  }

  document.addEventListener("formlyValidation", function () {
    if (zipInput.value || form.dataset.submitAttempted) {
      window.zipValidation();
    }
  });
});
