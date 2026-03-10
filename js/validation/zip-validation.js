Webflow.push(function() {

  const zipInput = document.querySelector('[data-form-field="zip"]');
  if (!zipInput) return;

  const ERROR_MESSAGE = "Sélectionnez un code postal français à 5 chiffres";

  function getStep() {
    return zipInput.closest('[data-form="step"]');
  }

  function getErrorWrapper() {
    const step = getStep();
    return step?.querySelector('[error-msg="zip"]');
  }

  function getNextButton() {
    const step = getStep();
    return step?.querySelector('[data-form="next-btn"]');
  }

  function showError(message) {
    const wrapper = getErrorWrapper();
    const text = wrapper?.querySelector('[data-error-text]');

    if (wrapper && text) {
      text.textContent = message;
      wrapper.style.display = "flex";
    }
  }

  function hideError() {
    const wrapper = getErrorWrapper();
    if (wrapper) wrapper.style.display = "none";
  }

  function setButtonState(valid) {
    const btn = getNextButton();
    if (!btn) return;

    if (valid) {
      btn.classList.remove("disabled");
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
    } else {
      btn.classList.add("disabled");
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.4";
    }
  }

  function isValidZip() {
    const value = zipInput.value.replace(/\D/g, "");
    return value.length === 5;
  }

  window.zipValidation = function() {

    if (!isValidZip()) {

      showError(ERROR_MESSAGE);

      if (window.unfilledArr) {
        window.unfilledArr = window.unfilledArr.filter(
          item => item.input !== zipInput.name
        );

        window.unfilledArr.push({
          input: zipInput.name,
          customError: ERROR_MESSAGE
        });
      }

      setButtonState(false);

      return false;
    }

    hideError();

    if (window.unfilledArr) {
      window.unfilledArr = window.unfilledArr.filter(
        item => item.input !== zipInput.name
      );
    }

    setButtonState(true);

    return true;
  };

  zipInput.addEventListener("input", function() {
    if (zipInput.value.length >= 1) {
      window.zipValidation();
    }
  });

  zipInput.addEventListener("blur", function() {
    window.zipValidation();
  });

  document.addEventListener("formlyValidation", function() {
    window.zipValidation();
  });

});
