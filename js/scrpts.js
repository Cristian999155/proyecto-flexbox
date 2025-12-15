document.addEventListener("DOMContentLoaded", function () {
  /* =========================
     Toggle menú móvil
  ========================== */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("is-open");
      navToggle.classList.toggle("is-open");
    });
  }

  /* =========================
     Calculadora de costos
  ========================== */
  const TRM = 3810.99; // TRM de hoy en COP por USD
  const SHIPPING_RATE_PER_LB = 25000; // COP por libra

  const form = document.getElementById("calculator-form");
  const productInput = document.getElementById("product-usd");
  const weightInput = document.getElementById("product-weight");

  const summaryProduct = document.getElementById("summary-product");
  const summaryWeight = document.getElementById("summary-weight");
  const summaryShipping = document.getElementById("summary-shipping");
  const summaryTaxes = document.getElementById("summary-taxes");
  const summaryTotal = document.getElementById("summary-total");

  const highValueMessage = document.getElementById("high-value-message");
  const validationMessage = document.getElementById("validation-message");
  const goToQuoteBtn = document.getElementById("go-to-quote");
  const contactAdvisorBtn = document.getElementById("contact-advisor");

  // Si no existe el formulario (por si este JS se carga en otra página), salimos de esta parte
  if (!form || !productInput || !weightInput) {
    return;
  }

  function formatCOP(value) {
    return value.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });
  }

  function resetMessages() {
    if (highValueMessage) {
      highValueMessage.hidden = true;
      highValueMessage.style.display = "none";
    }

    if (validationMessage) {
      validationMessage.hidden = true;
      validationMessage.style.display = "none";
    }

    if (contactAdvisorBtn) {
      contactAdvisorBtn.style.display = "none";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    resetMessages();

    const productUsd = parseFloat(productInput.value);
    const weightLbs = parseFloat(weightInput.value);

    if (!productUsd || productUsd <= 0 || !weightLbs || weightLbs <= 0) {
      if (validationMessage) {
        validationMessage.hidden = false;
        validationMessage.style.display = "block";
      }
      return;
    }

    if (productUsd > 200) {
      // Mostrar mensaje de cotización personalizada
      if (highValueMessage) {
        highValueMessage.hidden = false;
        highValueMessage.style.display = "block";
      }

      // Limpiar los valores del resumen
      if (summaryProduct) summaryProduct.textContent = "—";
      if (summaryWeight) summaryWeight.textContent = "—";
      if (summaryShipping) summaryShipping.textContent = "—";
      if (summaryTaxes) summaryTaxes.textContent = "$0";
      if (summaryTotal) summaryTotal.textContent = "—";

      if (contactAdvisorBtn) {
        contactAdvisorBtn.style.display = "none";
      }

      return;
    }

    // Cálculos
    const productCop = productUsd * TRM;
    const shippingCop = weightLbs * SHIPPING_RATE_PER_LB;
    const taxes = 0; // por ahora siempre 0
    const totalShipping = shippingCop + taxes;

    // Rellenar resumen
    if (summaryProduct) summaryProduct.textContent = formatCOP(productCop);
    if (summaryWeight) {
      summaryWeight.textContent =
        weightLbs.toLocaleString("es-CO", { maximumFractionDigits: 2 }) + " lb";
    }
    if (summaryShipping) summaryShipping.textContent = formatCOP(shippingCop);
    if (summaryTaxes) summaryTaxes.textContent = formatCOP(taxes);
    if (summaryTotal) summaryTotal.textContent = formatCOP(totalShipping);

    // Mostrar botón solo cuando el cálculo fue válido
    if (contactAdvisorBtn) {
      contactAdvisorBtn.style.display = "inline-flex";
    }
  });

  // Comportamiento de botones (puedes cambiar URLs reales)
  if (goToQuoteBtn) {
    goToQuoteBtn.addEventListener("click", function () {
      // Redirige a tu página de cotización personalizada
      window.location.href = "#"; // cambia por /cotizacion o la ruta que quieras
    });
  }

  if (contactAdvisorBtn) {
    contactAdvisorBtn.addEventListener("click", function () {
      // Redirige o abre sección de contacto
      window.location.href = "#contacto"; // ajusta al id/sección real
    });
  }
});
