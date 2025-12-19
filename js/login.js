// login.js
// IMPORTANTE: este archivo debe cargarse con:
// <script type="module" src="login.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// 🔹 Pega aquí la configuración de tu proyecto Firebase
// Copia el objeto firebaseConfig desde Firebase Console:
// Configuración del proyecto → Tus apps (Web)
const firebaseConfig = {
  apiKey: "AIzaSyA7hFnFDG776EzCxws2sRFOK6FHZwms6Fs",
  authDomain: "database-flexbox.firebaseapp.com",
  projectId: "database-flexbox",
  storageBucket: "database-flexbox.firebasestorage.app",
  messagingSenderId: "1004724093374",
  appId: "1:1004724093374:web:aa8ce2b9e74b93541179ef",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Ruta a donde se redirige después de login
const DASHBOARD_URL = "paneladmin.html";

// Redirección al dashboard
function redirectToDashboard() {
  window.location.href = DASHBOARD_URL;
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.getElementById("password-toggle");
  const forgotPasswordBtn = document.getElementById("forgot-password-btn");
  const submitBtn = document.getElementById("login-submit");

  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const formError = document.getElementById("form-error");
  const formStatus = document.getElementById("form-status");

  let isSubmitting = false;

  // 🔹 Persistencia local (mantener sesión)
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn("No se pudo establecer persistence local:", e);
  }

  // 🔹 Si ya está logueado, redirigir directamente al panel
  onAuthStateChanged(auth, (user) => {
    if (user) {
      redirectToDashboard();
    }
  });

  // Limpiar mensajes
  function clearMessages() {
    if (emailError) {
      emailError.textContent = "";
    }
    if (passwordError) {
      passwordError.textContent = "";
    }
    if (formError) {
      formError.textContent = "";
      formError.classList.remove("is-visible");
    }
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.classList.remove("is-visible");
    }
    emailInput?.classList.remove("text-input--error");
    passwordInput?.classList.remove("text-input--error");
  }

  // Botón loading
  function setSubmittingState(active) {
    isSubmitting = active;
    if (!submitBtn) return;

    submitBtn.disabled = active;
    submitBtn.textContent = active ? "Ingresando..." : "Ingresar";
  }

  // Validar email
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Mostrar / ocultar contraseña
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
    });
  }

  // Submit de login
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      clearMessages();

      const email = (emailInput?.value || "").trim();
      const password = (passwordInput?.value || "").trim();

      let hasError = false;

      // Validación email
      if (!email) {
        hasError = true;
        if (emailError) {
          emailError.textContent = "Ingresa tu correo electrónico.";
        }
        emailInput?.classList.add("text-input--error");
      } else if (!isValidEmail(email)) {
        hasError = true;
        if (emailError) {
          emailError.textContent = "Ingresa un correo electrónico válido.";
        }
        emailInput?.classList.add("text-input--error");
      }

      // Validación contraseña
      if (!password) {
        hasError = true;
        if (passwordError) {
          passwordError.textContent = "Ingresa tu contraseña.";
        }
        passwordInput?.classList.add("text-input--error");
      }

      if (hasError) return;

      setSubmittingState(true);

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged hará la redirección
      } catch (error) {
        console.error("Error al iniciar sesión:", error);

        let message =
          "No fue posible iniciar sesión. Intenta nuevamente.";

        switch (error.code) {
          case "auth/invalid-email":
            message = "El correo electrónico no es válido.";
            if (emailError) {
              emailError.textContent = message;
              emailInput?.classList.add("text-input--error");
            }
            break;
          case "auth/user-disabled":
            message = "Esta cuenta ha sido deshabilitada.";
            break;
          case "auth/user-not-found":
          case "auth/invalid-credential":
          case "auth/wrong-password":
            message = "Correo o contraseña incorrectos.";
            if (passwordError) {
              passwordError.textContent = "Verifica tus credenciales.";
              passwordInput?.classList.add("text-input--error");
            }
            break;
          case "auth/too-many-requests":
            message =
              "Demasiados intentos fallidos. Inténtalo de nuevo más tarde.";
            break;
          default:
            message = "Ocurrió un error inesperado. Intenta nuevamente.";
        }

        if (formError) {
          formError.textContent = message;
          formError.classList.add("is-visible");
        }
      } finally {
        setSubmittingState(false);
      }
    });
  }

  // Recuperar contraseña
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      clearMessages();

      const email = (emailInput?.value || "").trim();

      if (!email) {
        if (emailError) {
          emailError.textContent =
            "Ingresa tu correo para enviarte un enlace de recuperación.";
        }
        emailInput?.classList.add("text-input--error");
        emailInput?.focus();
        return;
      }

      if (!isValidEmail(email)) {
        if (emailError) {
          emailError.textContent = "Ingresa un correo electrónico válido.";
        }
        emailInput?.classList.add("text-input--error");
        emailInput?.focus();
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);

        if (formStatus) {
          formStatus.textContent =
            "Te enviamos un enlace de recuperación a tu correo, si existe una cuenta asociada.";
          formStatus.classList.add("is-visible");
        }
      } catch (error) {
        console.error("Error al enviar enlace de recuperación:", error);

        let message =
          "No se pudo enviar el enlace de recuperación. Intenta más tarde.";
        if (error.code === "auth/too-many-requests") {
          message =
            "Demasiados intentos. Intenta nuevamente en unos minutos.";
        }

        if (formError) {
          formError.textContent = message;
          formError.classList.add("is-visible");
        }
      }
    });
  }
});
