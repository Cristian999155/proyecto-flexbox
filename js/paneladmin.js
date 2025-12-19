// paneladmin.js
// IMPORTANTE: este archivo debe cargarse con:
// <script type="module" src="/js/paneladmin.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  getDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔹 Firebase Auth
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// ===============================
// 1. Configuración Firebase
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyA7hFnFDG776EzCxws2sRFOK6FHZwms6Fs",
  authDomain: "database-flexbox.firebaseapp.com",
  projectId: "database-flexbox",
  storageBucket: "database-flexbox.firebasestorage.app",
  messagingSenderId: "1004724093374",
  appId: "1:1004724093374:web:aa8ce2b9e74b93541179ef",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// URL del login (ajusta la ruta si está en otra carpeta)
const LOGIN_URL = "login.html";

// 🔴 PARA DESARROLLO LOCAL
const BACKEND_BASE_URL = "http://localhost:3000";
// 👉 Cuando despliegues a Render, cambia a:
// const BACKEND_BASE_URL = "https://flexboxco-email-service.onrender.com";

// Clave admin que debe coincidir con process.env.ADMIN_KEY del backend
const ADMIN_KEY_FRONTEND = "F1exB0xco_2025_SUPER-SECRET-KEY_93kLs!zP7"; // <-- cámbiala por tu clave real

// ===============================
// 2. Lógica principal
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // ----------- Referencias DOM generales ----------- //
  const tbody = document.getElementById("quotes-tbody");
  const searchInput = document.getElementById("search-input");
  const dateFromInput = document.getElementById("date-from");
  const dateToInput = document.getElementById("date-to");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const quotesCountEl = document.getElementById("quotes-count");

  // 🔹 Botón de cerrar sesión en el sidebar
  const logoutBtn = document.getElementById("logout-btn");

  // ----------- Referencias del modal ----------- //
  const modalOverlay = document.getElementById("quote-modal-overlay");
  const modalCloseBtn = document.getElementById("quote-modal-close");
  const modalCloseSecondary = document.getElementById(
    "quote-modal-close-secondary"
  );
  const modalTitle = document.getElementById("quote-modal-title");
  const modalQuoteCode = document.getElementById("modal-quote-code");
  const modalStatusBadge = document.getElementById("modal-status-badge");

  // Detalles (lado izquierdo)
  const detailFullName = document.getElementById("detail-fullName");
  const detailEmailText = document.getElementById("detail-email-text");
  const detailPhone = document.getElementById("detail-phone");
  const detailCreatedAt = document.getElementById("detail-createdAt");
  const detailLocation = document.getElementById("detail-location");
  const detailProductName = document.getElementById("detail-productName");
  const detailLinksBlock = document.getElementById("detail-links-block");
  const detailLinksList = document.getElementById("detail-links-list");
  const detailCommentsBlock = document.getElementById("detail-comments-block");
  const detailCommentsText = document.getElementById("detail-comments-text");

  // Formulario de respuesta (lado derecho)
  const replyForm = document.getElementById("quote-reply-form");
  const subjectInput = document.getElementById("reply-subject");
  const messageInput = document.getElementById("reply-message");
  const advancedToggle = document.getElementById("advanced-toggle");
  const advancedSection = document.getElementById("advanced-section");
  const replyToInput = document.getElementById("reply-to");
  const ccInput = document.getElementById("reply-cc");
  const bccInput = document.getElementById("reply-bcc");
  const pdfInput = document.getElementById("pdf-file");
  const pdfTrigger = document.getElementById("pdf-trigger");
  const fileSelected = document.getElementById("file-selected");
  const fileSelectedName = document.getElementById("file-selected-name");
  const fileRemoveBtn = document.getElementById("file-remove");

  const errorSubject = document.getElementById("error-subject");
  const errorMessage = document.getElementById("error-message");
  const errorPdf = document.getElementById("error-pdf");
  const modalFormStatus = document.getElementById("modal-form-status");
  const sendBtn = document.getElementById("quote-modal-send");

  let allQuotes = [];
  let lastFocusedBeforeModal = null;
  let currentQuote = null;
  let currentQuoteData = null;

  // ===============================
  // Utilidades
  // ===============================
  function setTableMessage(message) {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr class="table-message-row">
        <td colspan="5">${message}</td>
      </tr>
    `;
    if (quotesCountEl) {
      quotesCountEl.textContent = "";
    }
  }

  function formatDate(date) {
    if (!date) return "—";
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function statusMeta(status) {
    const normalized = (status || "").toLowerCase();
    switch (normalized) {
      case "enviada":
      case "sent":
        return { label: "Enviada", className: "status-approved" };

      case "aprobada":
      case "approved":
        return { label: "Aprobada", className: "status-approved" };

      case "rechazada":
      case "cancelada":
      case "cancelled":
        return { label: "Rechazada", className: "status-cancelled" };

      case "en_proceso":
      case "procesando":
        return { label: "En proceso", className: "status-processing" };

      default:
        return { label: "Pendiente", className: "status-pending" };
    }
  }

  function resetModalForm() {
    if (replyForm) replyForm.reset();

    if (advancedSection) {
      advancedSection.hidden = true;
    }

    if (fileSelected) {
      fileSelected.hidden = true;
    }
    if (fileSelectedName) {
      fileSelectedName.textContent = "";
    }

    if (pdfInput) {
      pdfInput.value = "";
    }

    if (modalFormStatus) {
      modalFormStatus.textContent = "";
      modalFormStatus.classList.remove(
        "modal-form-status--error",
        "modal-form-status--success"
      );
    }

    if (errorSubject) errorSubject.textContent = "";
    if (errorMessage) errorMessage.textContent = "";
    if (errorPdf) errorPdf.textContent = "";

    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = "Enviar";
    }
  }

  function fillStatusBadge(status) {
    if (!modalStatusBadge) return;
    const meta = statusMeta(status);
    modalStatusBadge.textContent = meta.label;
    modalStatusBadge.className = `status-badge ${meta.className}`;
  }

  // ===============================
  // Carga de cotizaciones
  // ===============================
  async function loadQuotes() {
    setTableMessage("Cargando cotizaciones...");

    try {
      const q = query(
        collection(db, "cotizacionesPersonalizadas"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      allQuotes = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt =
          data.createdAt && typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate()
            : null;

        return {
          docId: d.id,
          uiCode: data.quoteCode || d.id,
          fullName: data.fullName || "",
          productName: data.productName || "",
          status: data.status || "pendiente",
          createdAt,
          raw: data,
        };
      });

      applyFiltersAndRender();
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
      setTableMessage(
        "No fue posible cargar las cotizaciones. Intenta nuevamente más tarde."
      );
    }
  }

  // ===============================
  // Filtros y renderizado tabla
  // ===============================
  function applyFiltersAndRender() {
    if (!tbody) return;

    const term = (searchInput?.value || "").trim().toLowerCase();
    const fromVal = dateFromInput?.value || "";
    const toVal = dateToInput?.value || "";

    const fromDate = fromVal ? new Date(fromVal + "T00:00:00") : null;
    const toDate = toVal ? new Date(toVal + "T23:59:59") : null;

    const filtered = allQuotes.filter((q) => {
      if (term) {
        const haystack = `${q.uiCode} ${q.fullName} ${q.productName}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (fromDate || toDate) {
        if (!q.createdAt) return false;
        if (fromDate && q.createdAt < fromDate) return false;
        if (toDate && q.createdAt > toDate) return false;
      }

      return true;
    });

    if (!filtered.length) {
      setTableMessage(
        "No se encontraron cotizaciones con los filtros actuales."
      );
      return;
    }

    tbody.innerHTML = filtered
      .map((q) => {
        const { label: statusLabel, className: statusClass } = statusMeta(
          q.status
        );
        return `
          <tr class="table-row" data-doc-id="${q.docId}">
            <td class="cell-id">${q.uiCode}</td>
            <td>${q.fullName || "—"}</td>
            <td>${q.productName || "—"}</td>
            <td>${formatDate(q.createdAt)}</td>
            <td>
              <span class="status-badge ${statusClass}">
                ${statusLabel}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");

    if (quotesCountEl) {
      quotesCountEl.textContent = `${filtered.length} cotización(es)`;
    }
  }

  // ===============================
  // Carga de detalles al modal
  // ===============================
  async function loadQuoteDetails(quote) {
    currentQuote = quote;
    currentQuoteData = quote.raw || null;

    if (modalTitle) {
      modalTitle.textContent = "Responder cotización";
    }

    if (modalQuoteCode) {
      modalQuoteCode.textContent = quote.uiCode || "—";
    }

    fillStatusBadge(quote.status);

    // Placeholders iniciales
    if (detailFullName) detailFullName.textContent = "Cargando...";
    if (detailEmailText) detailEmailText.textContent = "Cargando...";
    if (detailPhone) detailPhone.textContent = "Cargando...";
    if (detailCreatedAt) {
      detailCreatedAt.textContent = quote.createdAt
        ? formatDate(quote.createdAt)
        : "—";
    }
    if (detailLocation) detailLocation.textContent = "Cargando...";
    if (detailProductName) detailProductName.textContent = "Cargando...";
    if (detailLinksBlock) detailLinksBlock.hidden = true;
    if (detailLinksList) detailLinksList.innerHTML = "";
    if (detailCommentsBlock) detailCommentsBlock.hidden = true;
    if (detailCommentsText) detailCommentsText.textContent = "";

    if (modalFormStatus) {
      modalFormStatus.textContent = "";
      modalFormStatus.classList.remove(
        "modal-form-status--error",
        "modal-form-status--success"
      );
    }

    try {
      const ref = doc(db, "cotizacionesPersonalizadas", quote.docId);
      const snap = await getDoc(ref);

      const data = snap.exists() ? snap.data() : quote.raw || {};
      currentQuoteData = data;

      const fullName = data.fullName || quote.fullName || "—";
      const email = data.email || "—";
      const phone = data.phone || "—";
      const productName = data.productName || quote.productName || "—";
      const department = data.department || "";
      const city = data.city || "";
      const comments = data.comments || "";
      const links = Array.isArray(data.productLinksList)
        ? data.productLinksList
        : [];

      let location = "—";
      if (department && city) {
        location = `${department}, ${city}`;
      } else if (department || city) {
        location = department || city;
      }

      if (detailFullName) detailFullName.textContent = fullName;
      if (detailEmailText) detailEmailText.textContent = email;
      if (detailPhone) detailPhone.textContent = phone;
      if (detailLocation) detailLocation.textContent = location;
      if (detailProductName) detailProductName.textContent = productName;

      if (links.length && detailLinksBlock && detailLinksList) {
        detailLinksBlock.hidden = false;
        detailLinksList.innerHTML = links
          .map(
            (link) => `
            <li>
              <a href="${link}" target="_blank" rel="noopener noreferrer">
                ${link}
              </a>
            </li>
          `
          )
          .join("");
      }

      if (comments && detailCommentsBlock && detailCommentsText) {
        detailCommentsBlock.hidden = false;
        detailCommentsText.textContent = comments;
      }

      // Prefill asunto y mensaje
      if (subjectInput) {
        subjectInput.value = `Tu cotización – ${productName}`;
      }

      if (messageInput) {
        const safeName = fullName || "cliente";
        messageInput.value = `Hola ${safeName},

Gracias por contactarte con FlexBoxco para cotizar tu producto. Adjuntamos en este correo el detalle de la cotización solicitada.

Si tienes alguna duda o quieres ajustar la cotización, no dudes en responder a este correo.

Saludos,
Equipo FlexBoxco`;
      }

      if (replyToInput && email !== "—") {
        replyToInput.placeholder = `Opcional, por defecto: ${email}`;
      }
    } catch (error) {
      console.error("Error cargando detalle de cotización:", error);
      if (modalFormStatus) {
        modalFormStatus.textContent =
          "No fue posible cargar todos los datos de la cotización.";
        modalFormStatus.classList.add("modal-form-status--error");
      }
    }
  }

  // ===============================
  // Modal: abrir / cerrar
  // ===============================
  function openModal(quote) {
    if (!modalOverlay || !quote) return;

    lastFocusedBeforeModal = document.activeElement;
    resetModalForm();

    modalOverlay.classList.add("is-open");
    modalOverlay.setAttribute("aria-hidden", "false");

    // Cargar datos del documento
    loadQuoteDetails(quote);

    const firstFocusable = modalOverlay.querySelector(
      "button, [href], input, select, textarea"
    );
    if (firstFocusable) firstFocusable.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("is-open");
    modalOverlay.setAttribute("aria-hidden", "true");

    if (
      lastFocusedBeforeModal &&
      typeof lastFocusedBeforeModal.focus === "function"
    ) {
      lastFocusedBeforeModal.focus();
    }
  }

  // Click en filas de tabla -> abrir modal
  if (tbody) {
    tbody.addEventListener("click", (event) => {
      const row = event.target.closest("tr.table-row");
      if (!row) return;
      const docId = row.dataset.docId;
      if (!docId) return;
      const quote = allQuotes.find((q) => q.docId === docId);
      if (quote) openModal(quote);
    });
  }

  // Eventos modal (cerrar)
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) {
        closeModal();
      }
    });
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }
  if (modalCloseSecondary) {
    modalCloseSecondary.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  // ===============================
  // Opciones avanzadas del formulario
  // ===============================
  if (advancedToggle && advancedSection) {
    advancedToggle.addEventListener("click", (event) => {
      event.preventDefault();
      advancedSection.hidden = !advancedSection.hidden;
    });
  }

  // ===============================
  // File input (PDF)
  // ===============================
  if (pdfTrigger && pdfInput) {
    pdfTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      pdfInput.click();
    });
  }

  if (pdfInput) {
    pdfInput.addEventListener("change", () => {
      if (!pdfInput.files || !pdfInput.files[0]) {
        if (fileSelected) fileSelected.hidden = true;
        if (fileSelectedName) fileSelectedName.textContent = "";
        if (errorPdf) errorPdf.textContent = "";
        return;
      }

      const file = pdfInput.files[0];
      if (errorPdf) errorPdf.textContent = "";

      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!isPdf) {
        pdfInput.value = "";
        if (fileSelected) fileSelected.hidden = true;
        if (fileSelectedName) fileSelectedName.textContent = "";
        if (errorPdf) errorPdf.textContent = "Solo se permiten archivos PDF.";
        return;
      }

      if (file.size > maxSize) {
        pdfInput.value = "";
        if (fileSelected) fileSelected.hidden = true;
        if (fileSelectedName) fileSelectedName.textContent = "";
        if (errorPdf)
          errorPdf.textContent =
            "El archivo supera el tamaño máximo de 10 MB.";
        return;
      }

      if (fileSelected && fileSelectedName) {
        fileSelected.hidden = false;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        fileSelectedName.textContent = `${file.name} (${sizeMb} MB)`;
      }
    });
  }

  if (fileRemoveBtn && pdfInput) {
    fileRemoveBtn.addEventListener("click", (event) => {
      event.preventDefault();
      pdfInput.value = "";
      if (fileSelected) fileSelected.hidden = true;
      if (fileSelectedName) fileSelectedName.textContent = "";
      if (errorPdf) errorPdf.textContent = "";
    });
  }

  // ===============================
  // Envío REAL del formulario (backend + actualizar status)
  // ===============================
  if (replyForm && sendBtn) {
    replyForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (errorSubject) errorSubject.textContent = "";
      if (errorMessage) errorMessage.textContent = "";
      if (errorPdf) errorPdf.textContent = "";
      if (modalFormStatus) {
        modalFormStatus.textContent = "";
        modalFormStatus.classList.remove(
          "modal-form-status--error",
          "modal-form-status--success"
        );
      }

      const subject = subjectInput?.value.trim() || "";
      const message = messageInput?.value.trim() || "";
      const file = pdfInput?.files && pdfInput.files[0];

      const toEmail =
        (currentQuoteData && currentQuoteData.email) ||
        (detailEmailText && detailEmailText.textContent.trim()) ||
        "";

      const fullName =
        (currentQuoteData && currentQuoteData.fullName) ||
        (detailFullName && detailFullName.textContent.trim()) ||
        "";

      let isValid = true;

      if (!toEmail) {
        isValid = false;
        if (modalFormStatus) {
          modalFormStatus.textContent =
            "No se encontró el correo del cliente. Revisa la cotización.";
          modalFormStatus.classList.add("modal-form-status--error");
        }
      }

      if (!subject) {
        if (errorSubject)
          errorSubject.textContent = "Ingresa un asunto para el correo.";
        isValid = false;
      }

      if (!message) {
        if (errorMessage)
          errorMessage.textContent = "Ingresa un mensaje para el correo.";
        isValid = false;
      }

      if (!file) {
        if (errorPdf)
          errorPdf.textContent = "Adjunta el PDF de la cotización.";
        isValid = false;
      }

      if (!isValid) return;

      const formData = new FormData();
      formData.append("toEmail", toEmail);
      formData.append("subject", subject);
      formData.append("message", message);
      if (fullName) formData.append("fullName", fullName);
      if (currentQuote && currentQuote.docId) {
        formData.append("quoteDocId", currentQuote.docId);
      }
      formData.append("pdf", file);

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Enviando...";
      }

      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/api/send-quote-email`,
          {
            method: "POST",
            headers: {
              "x-admin-key": ADMIN_KEY_FRONTEND,
            },
            body: formData,
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          console.error("Error en respuesta backend:", data);
          if (modalFormStatus) {
            modalFormStatus.textContent =
              data?.message ||
              "Ocurrió un error al enviar la cotización. Intenta nuevamente.";
            modalFormStatus.classList.add("modal-form-status--error");
          }
          return;
        }

        // ✅ Mostrar éxito en UI
        if (modalFormStatus) {
          modalFormStatus.textContent = "Cotización enviada correctamente.";
          modalFormStatus.classList.add("modal-form-status--success");
        }

        // ✅ Actualizar estado en Firestore a "enviada"
        if (currentQuote && currentQuote.docId) {
          try {
            await updateDoc(
              doc(db, "cotizacionesPersonalizadas", currentQuote.docId),
              { status: "enviada" }
            );

            // Actualizamos en memoria
            currentQuote.status = "enviada";
            if (currentQuoteData) {
              currentQuoteData.status = "enviada";
            }

            // Recargar la tabla para ver el badge verde
            await loadQuotes();
          } catch (err) {
            console.error("Error actualizando status en Firestore:", err);
          }
        }
      } catch (error) {
        console.error("Error llamando al backend:", error);
        if (modalFormStatus) {
          modalFormStatus.textContent =
            "No se pudo contactar el servidor. Revisa tu conexión o inténtalo más tarde.";
          modalFormStatus.classList.add("modal-form-status--error");
        }
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = "Enviar";
        }
      }
    });
  }

  // ===============================
  // Filtros
  // ===============================
  if (searchInput) {
    searchInput.addEventListener("input", applyFiltersAndRender);
  }
  if (dateFromInput) {
    dateFromInput.addEventListener("change", applyFiltersAndRender);
  }
  if (dateToInput) {
    dateToInput.addEventListener("change", applyFiltersAndRender);
  }
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (dateFromInput) dateFromInput.value = "";
      if (dateToInput) dateToInput.value = "";
      applyFiltersAndRender();
    });
  }

  // ===============================
  // Logout (Cerrar sesión)
  // ===============================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (event) => {
      event.preventDefault(); // para que no navegue como link
      try {
        await signOut(auth);
        window.location.href = LOGIN_URL;
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      }
    });
  }

  // ===============================
  // Protección de ruta con Auth
  // ===============================
  onAuthStateChanged(auth, (user) => {
    // Si NO hay usuario autenticado -> mandamos al login
    if (!user) {
      if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = LOGIN_URL;
      }
      return;
    }

    // ✅ Si hay usuario, cargamos las cotizaciones
    loadQuotes();
  });
});
