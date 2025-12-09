// ...new file...
/*
  Carrinho de compras básico — adiciona, remove, altera quantidade, persiste em localStorage
  Uso: inclui no index.html (já referenciado). Revise/ajuste seletores conforme seu HTML.
*/

(() => {
  const STORAGE_KEY = "levenuts_cart_v1";

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Elements
  const cartButton = qs(".cart-button");
  const cartCountEl = qs(".cart-count");
  const cartOverlay = qs(".cart-overlay");
  const cartSidebar = qs(".cart-sidebar");
  const cartItemsEl = qs(".cart-items");
  const cartClose = qs(".cart-close");
  const checkoutBtn = qs(".checkout-btn");

  // Utils
  const formatPrice = (v) => {
    return Number(v)
      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      .replace("R$", "R$ ");
  };
  const escapeHtml = (str = "") =>
    String(str).replace(
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

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCartCount(cart);
  }

  function findProductDataFromButton(btn) {
    const card = btn.closest(".product-card");
    if (!card) return null;
    const id = card.dataset.id || (card.getAttribute("data-id") || "").trim();
    const name =
      card.dataset.name ||
      card.getAttribute("data-name") ||
      qs(".product-name", card)?.textContent?.trim() ||
      "";
    const price = Number(
      card.dataset.price || card.getAttribute("data-price") || 0
    );
    const img =
      card.dataset.img ||
      card.getAttribute("data-img") ||
      qs("img", card)?.src ||
      "";
    return { id, name, price, img };
  }

  function addToCart(item) {
    if (!item?.id) return;
    const cart = loadCart();
    const idx = cart.findIndex((c) => c.id === item.id);
    if (idx >= 0) {
      cart[idx].quantity = (cart[idx].quantity || 0) + 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        img: item.img || "",
        quantity: 1,
      });
    }
    saveCart(cart);
    renderCart();
    openCart();
  }

  function removeFromCart(id) {
    const cart = loadCart().filter((i) => i.id !== id);
    saveCart(cart);
    renderCart();
  }

  function updateQty(id, qty) {
    const cart = loadCart();
    const idx = cart.findIndex((c) => c.id === id);
    if (idx < 0) return;
    cart[idx].quantity = Math.max(0, Math.floor(qty));
    if (cart[idx].quantity === 0) cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
  }

  function cartTotals(cart) {
    return cart.reduce(
      (acc, it) => {
        acc.qty += it.quantity || 0;
        acc.sub += (it.price || 0) * (it.quantity || 0);
        return acc;
      },
      { qty: 0, sub: 0 }
    );
  }

  // Renderers
  function renderCartCount(cart = loadCart()) {
    const totals = cartTotals(cart);
    cartCountEl && (cartCountEl.textContent = totals.qty || 0);
  }

  function renderCart() {
    const cart = loadCart();
    renderCartCount(cart);

    if (!cartItemsEl) return;
    if (cart.length === 0) {
      cartItemsEl.innerHTML =
        '<div class="center small" style="padding:20px;">Seu carrinho está vazio.</div>';
      qs(".cart-total-value") &&
        (qs(".cart-total-value").textContent = formatPrice(0));
      return;
    }

    const html = cart
      .map((it) => {
        return `
        <div class="cart-item" data-id="${escapeHtml(
          it.id
        )}" style="display:flex;gap:12px;padding:12px;border-bottom:1px solid #f2f2f2;align-items:center;">
          <img src="${escapeHtml(
            it.img || "img/032dba229d3c6c574579f03161850357.jpg"
          )}" alt="${escapeHtml(
          it.name
        )}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;">
          <div style="flex:1;">
            <div style="font-weight:700;">${escapeHtml(it.name)}</div>
            <div class="small" style="color:#666;margin-top:6px;">${formatPrice(
              it.price
            )} <span style="opacity:.9;">× ${it.quantity}</span></div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
              <button class="btn qty-minus" data-id="${escapeHtml(
                it.id
              )}" aria-label="Diminuir quantidade">−</button>
              <input type="number" class="cart-qty-input" data-id="${escapeHtml(
                it.id
              )}" value="${
          it.quantity
        }" min="1" style="width:56px;padding:6px;border-radius:6px;border:1px solid #eee;text-align:center;">
              <button class="btn qty-plus" data-id="${escapeHtml(
                it.id
              )}" aria-label="Aumentar quantidade">+</button>
              <button class="btn remove-item" data-id="${escapeHtml(
                it.id
              )}" style="background:transparent;color:#a00;border:1px solid rgba(0,0,0,0.06);margin-left:8px;">Remover</button>
            </div>
          </div>
          <div style="min-width:86px;text-align:right;font-weight:800;">${formatPrice(
            it.price * it.quantity
          )}</div>
        </div>
      `;
      })
      .join("");

    cartItemsEl.innerHTML = html;

    // update totals
    const totals = cartTotals(cart);
    qs(".cart-total-value") &&
      (qs(".cart-total-value").textContent = formatPrice(totals.sub));
  }

  // Open/Close cart
  function openCart() {
    if (!cartSidebar || !cartOverlay) return;
    cartOverlay.hidden = false;
    cartOverlay.classList.add("visible");
    cartSidebar.setAttribute("aria-hidden", "false");
    cartSidebar.style.transform = ""; // allow CSS to handle open state
    cartButton && cartButton.setAttribute("aria-expanded", "true");
  }
  function closeCart() {
    if (!cartSidebar || !cartOverlay) return;
    cartOverlay.classList.remove("visible");
    cartOverlay.hidden = true;
    cartSidebar.setAttribute("aria-hidden", "true");
    cartButton && cartButton.setAttribute("aria-expanded", "false");
  }

  // Init events
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".buy-btn");
    if (btn) {
      const pd = findProductDataFromButton(btn);
      if (pd) addToCart(pd);
      return;
    }

    // cart toggle
    if (e.target.closest(".cart-button")) {
      const isOpen =
        cartSidebar && cartSidebar.getAttribute("aria-hidden") === "false";
      if (isOpen) closeCart();
      else {
        renderCart();
        openCart();
      }
      return;
    }

    // overlay or close button
    if (e.target === cartOverlay || e.target.closest(".cart-close")) {
      closeCart();
      return;
    }

    // qty +/- and remove forwarded from render
    const plus = e.target.closest(".qty-plus");
    if (plus) {
      const id = plus.dataset.id;
      const cart = loadCart();
      const item = cart.find((c) => c.id === id);
      if (item) updateQty(id, (item.quantity || 0) + 1);
      return;
    }
    const minus = e.target.closest(".qty-minus");
    if (minus) {
      const id = minus.dataset.id;
      const cart = loadCart();
      const item = cart.find((c) => c.id === id);
      if (item) updateQty(id, Math.max(0, (item.quantity || 0) - 1));
      return;
    }
    const rem = e.target.closest(".remove-item");
    if (rem) {
      removeFromCart(rem.dataset.id);
      return;
    }
  });

  // delegate input change for quantity inputs
  document.addEventListener("input", (e) => {
    const inp = e.target;
    if (inp.classList && inp.classList.contains("cart-qty-input")) {
      const id = inp.dataset.id;
      const val = parseInt(inp.value || "0", 10);
      if (!Number.isFinite(val) || val < 1) return;
      updateQty(id, val);
    }
  });

  // checkout
  checkoutBtn &&
    checkoutBtn.addEventListener("click", (e) => {
      const cart = loadCart();
      if (!cart.length) {
        alert("Seu carrinho está vazio.");
        return;
      }
      // redirect to checkout page if exists, else show summary
      if (
        location.pathname.endsWith("checkout.html") ||
        location.pathname.endsWith("checkout.htm")
      ) {
        // already on checkout
        return;
      }
      if (
        document.querySelector(
          "a[href='checkout.html'], a[href='./checkout.html']"
        )
      ) {
        location.href = "checkout.html";
      } else {
        // quick summary modal (fallback)
        const totals = cartTotals(cart);
        if (
          confirm(
            `Total: ${formatPrice(
              totals.sub
            )}\n\nDeseja prosseguir para o checkout?`
          )
        ) {
          // try navigate to checkout.html anyway
          location.href = "checkout.html";
        }
      }
    });

  // initialize
  document.addEventListener("DOMContentLoaded", () => {
    renderCartCount();
    // ensure cartSidebar aria-hidden exists
    if (cartSidebar && !cartSidebar.hasAttribute("aria-hidden"))
      cartSidebar.setAttribute("aria-hidden", "true");
    // render once if sidebar open
    if (cartSidebar && cartSidebar.getAttribute("aria-hidden") === "false")
      renderCart();
  });
})();
