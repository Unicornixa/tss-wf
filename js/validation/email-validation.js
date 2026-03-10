Webflow.push(function() {
  const form = document.querySelector('[data-form="multistep"]');
  const emailInput = document.querySelector('input[type="email"]');

  if (emailInput && form) {
    const emailWrapper = emailInput.closest(".form_field-wrapper") || emailInput.closest('[data-form="step"]');
    const errorWrapper = emailWrapper?.querySelector('[error-msg="email"]') || emailWrapper?.querySelector('[data-text="error-message"]');
    const errorTextElement = errorWrapper?.querySelector('[data-error-text]') || errorWrapper?.querySelector('div:last-child');

    function validateEmailDetailed(email) {
      if (!email) return false;

      email = email.trim();

      if (!email.includes("@")) return "missing-at";
      if (email.indexOf("@") !== email.lastIndexOf("@")) return "multiple-at";
      if (email.startsWith("@")) return "starts-with-at";
      if (email.endsWith("@")) return "ends-with-at";

      const [localPart, domainPart] = email.split("@");

      if (!localPart) return "empty-local";
      if (localPart.length > 64) return "local-too-long";
      if (localPart.startsWith(".")) return "starts-with-dot";
      if (localPart.endsWith(".")) return "ends-with-dot";
      if (localPart.includes("..")) return "consecutive-dots";

      if (/[^\x20-\x7E]/.test(localPart)) return "invalid-characters";

      if (!domainPart) return "empty-domain";
      if (!domainPart.includes(".")) return "missing-dot";
      if (domainPart.startsWith(".")) return "domain-starts-with-dot";
      if (domainPart.endsWith(".")) return "domain-ends-with-dot";
      if (domainPart.includes("..")) return "consecutive-dots";

      if (/[^a-zA-Z0-9.-]/.test(domainPart)) return "invalid-domain-characters";

      const tld = domainPart.split(".").pop();
      if (!tld) return "invalid-tld";
      if (tld.length < 2) return "tld-too-short";
      if (tld.length > 64) return "tld-too-long";
      if (/[^a-zA-Z]/.test(tld)) return "invalid-tld-characters";

      if (!emailInput.checkValidity()) return "invalid-format";

      return true;
    }

    function getEmailErrorMessage(errorType) {
      const messages = {
        "missing-at": "L'adresse doit contenir un @",
        "multiple-at": "L'adresse ne peut contenir qu'un seul @",
        "starts-with-at": "L'adresse doit commencer par un nom",
        "empty-local": "L'adresse doit commencer par un nom",
        "ends-with-at": "Le domaine est manquant après @",
        "empty-domain": "Le domaine est manquant après @",
        "missing-dot": "Le domaine doit avoir un format valide",
        "domain-starts-with-dot": "Le domaine doit avoir un format valide",
        "domain-ends-with-dot": "Le domaine doit avoir un format valide",
        "consecutive-dots": "L'adresse ne peut pas contenir deux points consécutifs",
        "local-too-long": "La partie avant @ est trop longue",
        "starts-with-dot": "L'adresse ne peut pas commencer ou finir par un point",
        "ends-with-dot": "L'adresse ne peut pas commencer ou finir par un point",
        "invalid-characters": "L'adresse contient des caractères non autorisés",
        "invalid-domain-characters": "L'adresse contient des caractères non autorisés",
        "invalid-tld": "L'extension du domaine n'est pas valide",
        "tld-too-short": "L'extension du domaine n'est pas valide",
        "tld-too-long": "L'extension du domaine n'est pas valide",
        "invalid-tld-characters": "L'extension du domaine n'est pas valide",
        "empty": "Veuillez saisir votre adresse e-mail"
      };

      return messages[errorType] || "Cette adresse e-mail n'est pas valide";
    }

    function showEmailError(message) {
      if (errorWrapper && errorTextElement) {
        errorTextElement.textContent = message;
        errorWrapper.style.display = 'flex';
      }
    }

    function hideEmailError() {
      if (errorWrapper) {
        errorWrapper.style.display = 'none';
      }
    }

    window.emailValidation = function(value) {
      const emailValue = emailInput.value;
      const validationResult = validateEmailDetailed(emailValue);

      if (validationResult !== true) {
        let errorMessage;

        if (!emailValue || emailValue.trim() === '') {
          errorMessage = "Veuillez saisir votre adresse e-mail";
        } else {
          errorMessage = getEmailErrorMessage(validationResult);
        }

        showEmailError(errorMessage);

        if (window.unfilledArr) {
          window.unfilledArr = window.unfilledArr.filter(item => item.input !== emailInput.name);
          window.unfilledArr.push({
            input: emailInput.name,
            customError: errorMessage
          });
        }

        return false;
      }

      hideEmailError();

      if (window.unfilledArr) {
        window.unfilledArr = window.unfilledArr.filter(item => item.input !== emailInput.name);
      }

      return true;
    };

    emailInput.addEventListener('input', function() {
      if (this.value.length > 0 || form.dataset.submitAttempted) {
        window.emailValidation(this.value);
      }
    });

    emailInput.addEventListener('blur', function() {
      window.emailValidation(this.value);
    });

    const emailStep = emailInput.closest('[data-form="step"]');
    const emailNextButton = emailStep?.querySelector('[data-form="next-btn"]');
    if (emailNextButton) {
      emailNextButton.addEventListener('click', function() {
        if (!window.emailValidation(emailInput.value)) {
          setTimeout(() => {
            window.emailValidation(emailInput.value);
          }, 0);
        }
      }, true);
    }

    document.addEventListener('formlyValidation', function() {
      if (emailInput.value) {
        window.emailValidation(emailInput.value);
      }
    });
  }
});
