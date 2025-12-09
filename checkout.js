// ...existing code...
/*
  checkout.js — versão melhorada
  - validação de campos
  - bloqueio de botões durante processamento
  - geração de QR Pix (via API pública de QR)
  - grava pedido com status: "pending" (pix) / "paid" (card)
  - permite marcar pedido como pago e atualizar o registro
*/
(() => {
  const CART_KEY = "levenuts_cart_v1";
  const ORDERS_KEY = "levenuts_orders";

  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  const cartSummary = qs("#cartSummary");
  const orderTotalEl = qs("#orderTotal");
  const checkoutForm = qs("#checkoutForm");
  const pixBox = qs("#pixBox");
  const cardBox = qs("#cardBox");
  const pixKeyEl = qs("#pixKey");
  const msgEl = qs("#msg");
  const thankSection = qs("#thankYou");
  const thankMsg = qs("#thankMsg");
  const simulatePaidBtn = qs("#simulatePaid");
  const payBtn = qs("#payBtn");
  const pixQrImg = qs("#pixQr");
  const pixCopyArea = qs("#pixCopyArea");

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }
  function saveOrder(order) {
    const arr = (() => {
      try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; }
    })();
    arr.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(arr));
  }
  function updateOrderStatus(orderId, status) {
    try {
      const arr = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      const idx = arr.findIndex(o => o.id === orderId);
      if (idx >= 0) { arr[idx].status = status; localStorage.setItem(ORDERS_KEY, JSON.stringify(arr)); return true; }
    } catch {}
    return false;
  }
  function clearCart() { localStorage.removeItem(CART_KEY); }

  function formatPrice(v) {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace("R$", "R$ ");
  }

  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function generateOrderId() {
    return "o" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }

  function renderCart() {
    const cart = loadCart();
    if (!cart.length) {
      cartSummary.innerHTML = '<div class="small">Seu carrinho está vazio. <a href="index.html">Voltar à loja</a></div>';
      orderTotalEl.textContent = formatPrice(0);
      // redirect to shop after short delay to avoid dead end
      setTimeout(() => { if (!cart.length) location.href = "index.html"; }, 2200);
      return;
    }
    const html = cart.map(it => {
      const qty = Number(it.quantity || 1);
      return `<div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid #f3f1ef;">
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(it.name)}</div>
          <div class="small" style="color:var(--muted)">${formatPrice(it.price)} × ${qty}</div>
        </div>
        <div style="font-weight:800">${formatPrice((it.price||0) * qty)}</div>
      </div>`;
    }).join("");
    cartSummary.innerHTML = html;
    const total = cart.reduce((s,i)=>s + (Number(i.price||0) * (Number(i.quantity||1))), 0);
    orderTotalEl.textContent = formatPrice(total);

    // generate pix qr with amount and key (basic payload string)
    generatePixQr(total);
  }

  function generatePixPayload(key, amount, merchant='Levenuts') {
    // Basic, non-complete EMV payload for demo only — used to create QR image
    const payload = `PAY:${key}|AMT:${amount.toFixed(2)}|MSG:${merchant}`;
    return payload;
  }

  function generatePixQr(amount) {
    try {
      const key = pixKeyEl.textContent.trim();
      const payload = generatePixPayload(key, amount, 'Levenuts');
      const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(payload);
      pixQrImg.src = qrSrc;
      pixCopyArea.innerHTML = `<div class="small">Chave: <strong>${escapeHtml(key)}</strong><br>Valor: <strong>${formatPrice(amount)}</strong></div>`;
    } catch (e) { /* ignore */ }
  }

  function getFormData() {
    return {
      name: qs("#buyerName").value.trim(),
      email: qs("#buyerEmail").value.trim(),
      phone: qs("#buyerPhone").value.trim(),
      address: qs("#buyerAddress").value.trim(),
      payment: (() => { const el = document.querySelector('input[name="payment"]:checked'); return el ? el.value : 'pix'; })()
    };
  }

  function validate(data, cart) {
    if (!cart.length) return "Carrinho vazio.";
    if (!data.name) return "Informe o nome completo.";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Informe um email válido.";
    return null;
  }

  function simulateCardProcess() {
    const num = qs("#cardNumber").value.replace(/\s+/g,'');
    const exp = qs("#cardExp").value.trim();
    const cvc = qs("#cardCvc").value.trim();
    if (!/^\d{12,19}$/.test(num)) return "Número de cartão inválido (use apenas dígitos).";
    if (!/^\d{3,4}$/.test(cvc)) return "CVC inválido.";
    if (!/^\d{2}\/\d{2}$/.test(exp)) return "Data inválida (MM/AA).";
    return null;
  }

  function createOrder(data, cart, total, method, status='pending') {
    return {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      buyer: data,
      cart,
      total,
      paymentMethod: method,
      status
    };
  }

  function setProcessing(on=true, text) {
    if (on) {
      payBtn.disabled = true;
      payBtn.classList.add('loading');
      payBtn.textContent = text || 'Processando...';
    } else {
      payBtn.disabled = false;
      payBtn.classList.remove('loading');
      payBtn.textContent = 'Pagar agora';
    }
  }

  // events
  qsa('input[name="payment"]').forEach(r => r.addEventListener("change", (e) => {
    const v = e.target.value;
    pixBox.style.display = v === "pix" ? "" : "none";
    cardBox.style.display = v === "card" ? "" : "none";
  }));

  simulatePaidBtn.addEventListener("click", () => {
    const cart = loadCart();
    const data = getFormData();
    const err = validate(data, cart);
    if (err) { msgEl.textContent = err; return; }
    const total = cart.reduce((s,i)=>s + (Number(i.price||0) * (Number(i.quantity||1))), 0);
    const order = createOrder(data, cart, total, 'pix', 'paid');
    saveOrder(order);
    clearCart();
    renderCart();
    showThankYou(order);
  });

  checkoutForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    msgEl.textContent = "";
    const data = getFormData();
    const cart = loadCart();
    const err = validate(data, cart);
    if (err) { msgEl.textContent = err; return; }
    const total = cart.reduce((s,i)=>s + (Number(i.price||0) * (Number(i.quantity||1))), 0);

    if (data.payment === "card") {
      const cardErr = simulateCardProcess();
      if (cardErr) { msgEl.textContent = cardErr; return; }
      setProcessing(true, 'Processando cartão...');
      await new Promise(r => setTimeout(r, 1000)); // sim network
      const order = createOrder(data, cart, total, 'card', 'paid');
      saveOrder(order);
      clearCart();
      setProcessing(false);
      renderCart();
      showThankYou(order);
    } else {
      // Pix path: create order with pending status and show instructions
      setProcessing(true, 'Gerando instruções Pix...');
      await new Promise(r => setTimeout(r, 400));
      const order = createOrder(data, cart, total, 'pix', 'pending');
      saveOrder(order);
      setProcessing(false);
      msgEl.style.color = '';
      msgEl.textContent = "Pedido criado. Use o QR ou a chave Pix exibida. Quando receber o pagamento clique em 'Marcar como pago (teste)'.