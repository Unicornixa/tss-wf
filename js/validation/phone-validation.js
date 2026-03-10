Webflow.push(function() {
  const form = document.querySelector('[data-form="multistep"]');
  const input = document.querySelector("#Phone");

  if (input) {
    const iti = window.intlTelInput(input, {
      loadUtilsOnInit: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.7.0/build/js/utils.js",
      initialCountry: "fr",
      nationalMode: true,
      separateDialCode: false,
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.7.0/build/js/utils.js"
    });

    function detectFakeNumber(number) {
      const cleanNumber = number.replace(/\s/g, '');

      const fakePatterns = [
        /^(\d)\1{9}$/,
        /^0123456789$/,
        /^1234567890$/,
        /^0987654321$/,
        /^9876543210$/,
        /^(01){5}$/,
        /^(012){3}3$/,
        /^(0123){2}01$/,
        /^0600000000$/,
        /^0700000000$/,
        /^0800000000$/,
        /^0900000000$/,
        /^06(00|11|22|33|44|55|66|77|88|99)000000$/,
        /^07(00|11|22|33|44|55|66|77|88|99)000000$/,
      ];

      for (const pattern of fakePatterns) {
        if (pattern.test(cleanNumber)) {
          return 'fake-pattern';
        }
      }

      if (/(\d)\1{4,}/.test(cleanNumber)) {
        return 'too-many-repeats';
      }

      if (cleanNumber.startsWith('06') || cleanNumber.startsWith('07')) {
        const lastEightDigits = cleanNumber.slice(2);

        if (/^(\d)\1{7}$/.test(lastEightDigits)) {
          return 'fake-mobile';
        }

        if (/^(01234567|12345678|23456789|87654321|76543210|65432109)$/.test(lastEightDigits)) {
          return 'fake-sequence';
        }
      }

      return true;
    }

    function isValidFrenchNumber() {
      const numberWithoutSpaces = input.value.replace(/\s/g, '');
      if (numberWithoutSpaces === '') return false;

      if (!/^\d+$/.test(numberWithoutSpaces)) return 'invalid';
      if (!numberWithoutSpaces.startsWith('0')) return 'start';
      if (numberWithoutSpaces.length !== 10) return 'length';

      const fakeNumberResult = detectFakeNumber(numberWithoutSpaces);
      if (fakeNumberResult !== true) return fakeNumberResult;

      if (!iti.isValidNumber()) return 'format';

      return true;
    }

    function showPhoneError(message) {
      const errorWrapper = input.closest('[data-form="step"]').querySelector('[error-msg="phone"]');
      const errorTextElement = errorWrapper?.querySelector('[data-error-text]');

      if (errorWrapper && errorTextElement) {
        errorTextElement.textContent = message;
        errorWrapper.style.display = 'flex';
      }
    }

    function hidePhoneError() {
      const errorWrapper = input.closest('[data-form="step"]').querySelector('[error-msg="phone"]');
      if (errorWrapper) {
        errorWrapper.style.display = 'none';
      }
    }

    window.phoneValidation = function(value, length, minChar) {
      const numberWithoutSpaces = input.value.replace(/\s/g, '');
      const validationResult = isValidFrenchNumber();

      if (validationResult !== true) {
        let errorMessage;

        if (numberWithoutSpaces === '') {
          errorMessage = "Hum... ce numéro de téléphone est invalide.";
        } else if (validationResult === 'invalid') {
          errorMessage = "Ce numéro n'est pas valide.";
        } else if (validationResult === 'start') {
          errorMessage = "Le numéro doit commencer par 0.";
        } else if (
          validationResult === 'length'
        ) {
          errorMessage = "Le numéro doit contenir 10 chiffres.";
        } else if (
          validationResult === 'fake-pattern' ||
          validationResult === 'too-many-repeats' ||
          validationResult === 'fake-mobile' ||
          validationResult === 'fake-sequence'
        ) {
          errorMessage = "Veuillez saisir un numéro de téléphone valide.";
        } else {
          errorMessage = "Ce numéro n'est pas valide.";
        }

        showPhoneError(errorMessage);

        if (window.unfilledArr) {
          window.unfilledArr = window.unfilledArr.filter(item => item.input !== input.name);
          window.unfilledArr.push({
            input: input.name,
            customError: errorMessage
          });
        }

        return false;
      }

      const fullPhone = iti.getNumber();
      const fullPhoneInput = document.querySelector('#FullPhone');
      if (fullPhoneInput) {
        fullPhoneInput.setAttribute('value', fullPhone);
        console.log("[Phone] Full number set in hidden input:", fullPhone);
      }

      hidePhoneError();

      if (window.unfilledArr) {
        window.unfilledArr = window.unfilledArr.filter(item => item.input !== input.name);
      }

      return true;
    };

    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/[^\d\s]/g, '');
      if (value !== e.target.value) {
        e.target.value = value;
      }

      if (value.length > 0) {
        value = value.replace(/\D/g, '');
        value = value.match(/.{1,2}/g)?.join(' ') || value;
        e.target.value = value;
      }

      if (isValidFrenchNumber() === true) {
        hidePhoneError();
      } else {
        window.phoneValidation(input.value);
      }
    });

    input.addEventListener('blur', function() {
      if (isValidFrenchNumber() === true) {
        let number = input.value.replace(/\D/g, '');
        input.value = number.match(/.{1,2}/g)?.join(' ') || number;
        hidePhoneError();
      } else {
        window.phoneValidation(input.value);
      }
    });

    const nextButton = input.closest('[data-form="step"]').querySelector('[data-form="next-btn"]');
    if (nextButton) {
      nextButton.addEventListener('click', function() {
        if (isValidFrenchNumber() !== true) {
          setTimeout(() => {
            window.phoneValidation(input.value);
          }, 0);
        }
      }, true);
    }

    document.addEventListener('formlyValidation', function() {
      if (isValidFrenchNumber() !== true) {
        window.phoneValidation(input.value);
      }
    });

    if (form) {
      form.addEventListener('submit', function() {
        console.log('Form submit event triggered');
        if (input && iti && isValidFrenchNumber() === true) {
          console.log('Creating hidden field for phone');
          let hiddenFull = form.querySelector('input[name="Phone_Full"]');
          if (!hiddenFull) {
            hiddenFull = document.createElement('input');
            hiddenFull.type = 'hidden';
            hiddenFull.name = 'Phone_Full';
            form.appendChild(hiddenFull);
          }
          const fullNumber = iti.getNumber();
          hiddenFull.value = fullNumber;
          console.log('Phone_Full hidden field set to:', fullNumber);
        }
      }, true);

      form.addEventListener('submit', function() {
        if (input && iti && isValidFrenchNumber() === true) {
          let hiddenFull = form.querySelector('input[name="Phone_Full"]');
          if (!hiddenFull) {
            hiddenFull = document.createElement('input');
            hiddenFull.type = 'hidden';
            hiddenFull.name = 'Phone_Full';
            form.appendChild(hiddenFull);
          }
          hiddenFull.value = iti.getNumber();
        }
      });
    }

    document.addEventListener('formlyValidation', function() {
      if (input && iti && isValidFrenchNumber() === true && form) {
        let hiddenFull = form.querySelector('input[name="Phone_Full"]');
        if (!hiddenFull) {
          hiddenFull = document.createElement('input');
          hiddenFull.type = 'hidden';
          hiddenFull.name = 'Phone_Full';
          form.appendChild(hiddenFull);
        }
        hiddenFull.value = iti.getNumber();
      }
    });
  }
});
