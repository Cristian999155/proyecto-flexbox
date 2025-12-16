// Toggle menú móvil
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open");
  });
});


// Wizard de cotización personalizada
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("quote-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".form-step"));
  const stepIndicators = Array.from(
    document.querySelectorAll(".wizard-step")
  );
  const progressText = document.getElementById("wizard-progress-text");
  const globalError = document.getElementById("form-global-error");
  const resetBtn = document.getElementById("quote-reset");

  let currentStep = 1;
  const totalSteps = steps.length;

  // Inputs de cada paso
  const fields = {
    1: {
      productName: document.getElementById("product-name"),
      productLinks: document.getElementById("product-links"),
    },
    2: {
      firstName: document.getElementById("first-name"),
      lastName: document.getElementById("last-name"),
      email: document.getElementById("email"),
      phone: document.getElementById("phone"),
      department: document.getElementById("department"),
      city: document.getElementById("city"),
    },
    3: {
      comments: document.getElementById("comments"),
    },
  };

  // Limpia errores de todos los campos
  function clearFieldErrors() {
    const errors = form.querySelectorAll(".field-error");
    errors.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
    if (globalError) {
      globalError.textContent = "";
    }
  }

  // Asigna mensaje de error a un campo concreto
  function setFieldError(inputEl, message) {
    if (!inputEl) return;
    const field = inputEl.closest(".form-field");
    if (!field) return;
    const errorEl = field.querySelector(".field-error");
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = message ? "block" : "none";
  }

  // Muestra un paso y actualiza el encabezado
  function showStep(stepNumber) {
    steps.forEach((stepEl) => {
      const s = Number(stepEl.dataset.step);
      stepEl.classList.toggle("is-active", s === stepNumber);
    });

    stepIndicators.forEach((ind) => {
      const s = Number(ind.dataset.step);
      ind.classList.toggle("is-active", s === stepNumber);
      ind.classList.toggle("is-completed", s < stepNumber);
    });

    if (progressText) {
      progressText.textContent = `Paso ${stepNumber} de ${totalSteps}`;
    }

    // Llevar el foco al primer campo del paso actual
    const activeStep = steps.find(
      (s) => Number(s.dataset.step) === stepNumber
    );
    if (activeStep) {
      const focusable = activeStep.querySelector(
        "input, select, textarea, button"
      );
      if (focusable) focusable.focus();
    }

    clearFieldErrors();
  }

  // Validación por paso
  function validateStep(stepNumber) {
    clearFieldErrors();
    let isValid = true;

    if (stepNumber === 1) {
      const { productName, productLinks } = fields[1];

      if (!productName.value.trim()) {
        setFieldError(productName, "Ingresa el nombre del producto.");
        isValid = false;
      }

      if (!productLinks.value.trim()) {
        setFieldError(
          productLinks,
          "Agrega al menos un enlace del producto."
        );
        isValid = false;
      }
    }

    if (stepNumber === 2) {
      const { firstName, lastName, email, phone, department, city } =
        fields[2];

      if (!firstName.value.trim()) {
        setFieldError(firstName, "Ingresa tu nombre.");
        isValid = false;
      }
      if (!lastName.value.trim()) {
        setFieldError(lastName, "Ingresa tu apellido.");
        isValid = false;
      }

      const emailVal = email.value.trim();
      if (!emailVal) {
        setFieldError(email, "Ingresa tu correo electrónico.");
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        setFieldError(email, "Ingresa un correo electrónico válido.");
        isValid = false;
      }

      if (!phone.value.trim()) {
        setFieldError(phone, "Ingresa un número de teléfono.");
        isValid = false;
      }

      if (!department.value.trim()) {
        setFieldError(department, "Selecciona un departamento.");
        isValid = false;
      }

      if (!city.value.trim()) {
        setFieldError(city, "Ingresa tu ciudad.");
        isValid = false;
      }
    }

    if (!isValid && globalError) {
      globalError.textContent =
        "Revisa los campos marcados antes de continuar.";
    }

    return isValid;
  }

  // Manejo de botones siguiente / volver
  form.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    if (!action) return;

    if (action === "next") {
      if (!validateStep(currentStep)) return;
      if (currentStep < totalSteps) {
        currentStep += 1;
        showStep(currentStep);
      }
    }

    if (action === "prev") {
      if (currentStep > 1) {
        currentStep -= 1;
        showStep(currentStep);
      }
    }
  });

  // Envío final (paso 3 -> 4)
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validateStep(3)) return;

    currentStep = 4;
    showStep(currentStep);

    // Aquí podrías enviar los datos con fetch/AJAX si tuvieras backend
  });

  // Botón "Enviar otra solicitud"
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      currentStep = 1;
      showStep(currentStep);
    });
  }

  // Mostrar el primer paso al inicio
  showStep(currentStep);
});
