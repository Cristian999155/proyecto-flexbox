// IMPORTANTE: este archivo debe cargarse con <script type="module" src="script.js"></script>

// ===============================
// 1. Configuración Firebase
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Pega aquí tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA7hFnFDG776EzCxws2sRFOK6FHZwms6Fs",
  authDomain: "database-flexbox.firebaseapp.com",
  projectId: "database-flexbox",
  storageBucket: "database-flexbox.firebasestorage.app",
  messagingSenderId: "1004724093374",
  appId: "1:1004724093374:web:aa8ce2b9e74b93541179ef"

};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===============================
// 2. Toggle menú móvil
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open");
  });
});

// ===============================
// 3. Wizard de cotización personalizada + Firestore
// ===============================
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
  const submitBtn = form.querySelector('button[type="submit"]');

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

  // Envío final (paso 3 -> guarda en Firestore y pasa al 4)
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!validateStep(3)) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
    }

    try {
      // Obtener valores finales de los campos
      const productName = fields[1].productName.value.trim();
      const productLinksRaw = fields[1].productLinks.value.trim();

      const firstName = fields[2].firstName.value.trim();
      const lastName = fields[2].lastName.value.trim();
      const email = fields[2].email.value.trim();
      const phone = fields[2].phone.value.trim();
      const department = fields[2].department.value.trim();
      const city = fields[2].city.value.trim();
      const comments = fields[3].comments.value.trim();

      // Procesar enlaces a array (separar por saltos de línea o comas)
      const productLinksList = productLinksRaw
        .split(/[\n,]+/)
        .map((link) => link.trim())
        .filter((link) => link.length > 0);

      // Objeto para Firestore
      const quoteData = {
        // Paso 1
        productName,
        productLinksRaw,
        productLinksList,

        // Paso 2
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        department,
        city,

        // Paso 3
        comments: comments || null,

        // Metadatos
        status: "pendiente",
        createdAt: serverTimestamp(),
        sourcePage: window.location.pathname,
        userAgent: navigator.userAgent,
      };

      // Guardar en colección "cotizacionesPersonalizadas"
      const docRef = await addDoc(
        collection(db, "cotizacionesPersonalizadas"),
        quoteData
      );
      console.log("Cotización guardada con ID:", docRef.id);

      // Ir al paso 4 de confirmación
      currentStep = 4;
      showStep(currentStep);
    } catch (error) {
      console.error("Error al guardar la cotización:", error);
      if (globalError) {
        globalError.textContent =
          "Hubo un error al enviar tu solicitud. Por favor intenta nuevamente."
          + (error && error.message ? ` Detalle: ${error.message}` : "");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar solicitud";
      }
    }
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
