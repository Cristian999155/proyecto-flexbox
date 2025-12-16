// script.js
// IMPORTANTE: este archivo debe cargarse con:
// <script type="module" src="script.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// TODO: reemplaza estos valores con tu configuración real de Firebase
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

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("quotes-tbody");
  const searchInput = document.getElementById("search-input");
  const dateFromInput = document.getElementById("date-from");
  const dateToInput = document.getElementById("date-to");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const quotesCountEl = document.getElementById("quotes-count");

  const modalOverlay = document.getElementById("quote-modal-overlay");
  const modalCloseBtn = document.getElementById("quote-modal-close");
  const modalCloseSecondary = document.getElementById(
    "quote-modal-close-secondary"
  );
  const modalContent = document.getElementById("quote-modal-content");
  const modalTitle = document.getElementById("quote-modal-title");

  let allQuotes = [];
  let lastFocusedBeforeModal = null;

  // ------- Utilidades -------

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

  // ------- Carga de cotizaciones desde Firestore -------

  async function loadQuotes() {
    setTableMessage("Cargando cotizaciones...");

    try {
      const q = query(
        collection(db, "cotizacionesPersonalizadas"), // nombre de la colección de tu proyecto
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      allQuotes = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        const createdAt =
          data.createdAt && typeof data.createdAt.toDate === "function"
            ? data.createdAt.toDate()
            : null;

        return {
          docId: doc.id,
          uiCode: `COT-${1000 + index + 1}`, // ID visual, luego puedes cambiarlo por doc.id
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

  // ------- Filtros y renderizado -------

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
      setTableMessage("No se encontraron cotizaciones con los filtros actuales.");
      return;
    }

    tbody.innerHTML = filtered
      .map((q, index) => {
        const { label: statusLabel, className: statusClass } = statusMeta(
          q.status
        );
        return `
          <tr class="table-row" data-index="${index}">
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

  // ------- Modal -------

  function openModal(quote) {
    if (!modalOverlay || !quote) return;

    lastFocusedBeforeModal = document.activeElement;

    if (modalTitle) {
      modalTitle.textContent = "Detalle de cotización";
    }

    if (modalContent) {
      modalContent.innerHTML = `
        <p><strong>ID:</strong> ${quote.uiCode}</p>
        <p><strong>Cliente:</strong> ${quote.fullName || "—"}</p>
        <p><strong>Producto:</strong> ${quote.productName || "—"}</p>
        <p><strong>Estado:</strong> ${quote.status || "pendiente"}</p>
        <p><strong>Fecha:</strong> ${formatDate(quote.createdAt)}</p>
        <p style="margin-top: 1rem; font-size: 0.9rem;">
          Contenido detallado pendiente. Más adelante aquí podrás ver todos los campos completos de la cotización.
        </p>
      `;
    }

    modalOverlay.classList.add("is-open");
    modalOverlay.setAttribute("aria-hidden", "false");

    const firstFocusable = modalOverlay.querySelector(
      "button, [href], input, select, textarea"
    );
    if (firstFocusable) firstFocusable.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("is-open");
    modalOverlay.setAttribute("aria-hidden", "true");
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") {
      lastFocusedBeforeModal.focus();
    }
  }

  // Click en filas de tabla -> abrir modal
  if (tbody) {
    tbody.addEventListener("click", (event) => {
      const row = event.target.closest("tr.table-row");
      if (!row) return;
      const index = Number(row.dataset.index);
      const quote = allQuotes[index];
      if (quote) openModal(quote);
    });
  }

  // Eventos modal
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

  // Eventos filtros
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

  // Cargar datos iniciales
  loadQuotes();
});
