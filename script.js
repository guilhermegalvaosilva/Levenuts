(function () {
  const STORAGE_KEY = "levenuts_cart_v1";
  const cartButton = document.querySelector(".cart-button");
  const cartCountEl = document.querySelector(".cart-count");
  const cartOverlay = document.querySelector(".cart-overlay");
  const cartSidebar = document.querySelector(".cart-sidebar");
  const cartClose = document.querySelector(".cart-close");
  const cartItemsEl = document.querySelector(".cart-items");
  const cartTotalValue = document.querySelector(".cart-total-value");
  const checkoutBtn = document.querySelector(".checkout-btn");

  let cart = loadCart();

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function updateCartCount() {
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    cartCountEl.textContent = totalQty;
  }

  function calculateTotal() {
    return cart.reduce((s, i) => s + i.quantity * Number(i.price), 0);
  }

  function renderCart() {
    cartItemsEl.innerHTML = "";
    if (cart.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Seu carrinho está vazio.";
      cartItemsEl.appendChild(p);
    } else {
      cart.forEach((item) => {
        const wrapper = document.createElement("div");
        wrapper.className = "cart-item";
        wrapper.innerHTML = `
          <img src="${item.img}" alt="${escapeHtml(item.name)}" />
          <div class="cart-item-info">
            <div><strong>${escapeHtml(item.name)}</strong></div>
            <div class="cart-item-price">R$ ${formatPrice(item.price)}</div>
          </div>
          <div class="cart-item-controls" data-id="${item.id}">
            <button class="btn qty-decrease" aria-label="Diminuir quantidade">−</button>
            <span class="qty" aria-live="polite">${item.quantity}</span>
            <button class="btn qty-increase" aria-label="Aumentar quantidade">+</button>
            <button class="btn remove-item" aria-label="Remover item">Remover</button>
          </div>
        `;
        cartItemsEl.appendChild(wrapper);
      });
    }
    cartTotalValue.textContent = formatPrice(calculateTotal());
    updateCartCount();
  }

  function escapeHtml(text) {
    return String(text).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }

  function addToCart(product) {
    const exist = cart.find((i) => i.id === product.id);
    if (exist) {
      exist.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    renderCart();
    openCart();
  }

  function changeQuantity(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    cart = cart.filter((i) => i.quantity > 0);
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  }

  function openCart() {
    cartOverlay.classList.add("visible");
    cartOverlay.hidden = false;
    cartSidebar.setAttribute("aria-hidden", "false");
    cartButton.setAttribute("aria-expanded", "true");
    // trap focus basic
    cartSidebar.focus();
  }

  function closeCart() {
    cartOverlay.classList.remove("visible");
    cartOverlay.hidden = true;
    cartSidebar.setAttribute("aria-hidden", "true");
    cartButton.setAttribute("aria-expanded", "false");
  }

  // wire add buttons (product cards)
  document.querySelectorAll(".product-card").forEach((card) => {
    const btn = card.querySelector(".buy-btn, .btn.buy-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const product = {
        id: String(
          card.dataset.id ||
            card.getAttribute("id") ||
            card.querySelector(".product-name")?.textContent ||
            Math.random().toString(36).slice(2)
        ),
        name:
          card.dataset.name ||
          card.querySelector(".product-name")?.textContent?.trim() ||
          "Produto",
        price:
          parseFloat(
            (
              card.dataset.price ||
              card.querySelector(".price")?.textContent ||
              "0"
            )
              .toString()
              .replace(/[^\d,.-]/g, "")
              .replace(",", ".")
          ) || 0,
        img: card.dataset.img || card.querySelector("img")?.src || "",
      };
      addToCart(product);
    });
  });

  // open/close handlers
  cartButton?.addEventListener("click", () => {
    renderCart();
    openCart();
  });
  cartClose?.addEventListener("click", closeCart);
  cartOverlay?.addEventListener("click", closeCart);

  // keyboard: Esc closes cart
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      cartSidebar.getAttribute("aria-hidden") === "false"
    )
      closeCart();
  });

  // delegate cart item buttons
  cartItemsEl.addEventListener("click", (e) => {
    const target = e.target;
    const controls = target.closest(".cart-item-controls");
    if (!controls) return;
    const id = controls.dataset.id;
    if (target.classList.contains("qty-decrease")) changeQuantity(id, -1);
    if (target.classList.contains("qty-increase")) changeQuantity(id, +1);
    if (target.classList.contains("remove-item")) removeItem(id);
  });

  // checkout (redirect to real checkout page)
  checkoutBtn?.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }
    // navigate to checkout page where user fills dados e finaliza
    window.location.href = "checkout.html";
  });

  // initial render
  renderCart();
})();
