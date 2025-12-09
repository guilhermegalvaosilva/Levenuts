// ...new file...
/*
  admin.js
  - Login/Setup logic (client-side)
  - session stored in sessionStorage key: levenuts_admin_session (simple token)
  - admin password hash stored in localStorage key: levenuts_admin_hash (SHA-256 hex)
  NOTE: client-side auth is only obfuscation. Para produção use backend.
*/

(async () => {
  const HASH_KEY = "levenuts_admin_hash";
  const SESSION_KEY = "levenuts_admin_session";

  // helpers
  async function sha256Hex(text) {
    const enc = new TextEncoder().encode(String(text));
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function setSession() {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, token);
  }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }
  function isAuthenticated() { return !!sessionStorage.getItem(SESSION_KEY); }

  // page-specific behavior
  const path = location.pathname.split("/").pop();

  if (path === "admin-login.html") {
    const form = document.getElementById("admin-form");
    const setupFields = document.getElementById("setupFields");
    const loginFields = document.getElementById("loginFields");
    const modeInfo = document.getElementById("modeInfo");
    const err = document.getElementById("err");
    const backBtn = document.getElementById("backBtn");
    const submitBtn = document.getElementById("submitBtn");

    backBtn.addEventListener("click", () => { history.back(); });

    const storedHash = localStorage.getItem(HASH_KEY);
    if (!storedHash) {
      // first-time: setup mode
      setupFields.style.display = "block";
      loginFields.style.display = "none";
      modeInfo.textContent = "Nenhuma senha configurada. Crie uma senha de administrador.";
      submitBtn.textContent = "Criar senha";
    } else {
      setupFields.style.display = "none";
      loginFields.style.display = "block";
      modeInfo.textContent = "Insira a senha de administrador para entrar.";
      submitBtn.textContent = "Entrar";
    }

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      err.textContent = "";
      if (!storedHash) {
        // create
        const p1 = document.getElementById("newPass").value;
        const p2 = document.getElementById("newPass2").value;
        if (!p1 || p1.length < 6) return err.textContent = "Senha mínima 6 caracteres.";
        if (p1 !== p2) return err.textContent = "Senhas não coincidem.";
        const h = await sha256Hex(p1);
        localStorage.setItem(HASH_KEY, h);
        setSession();
        location.href = "admin.html";
      } else {
        const p = document.getElementById("pass").value;
        if (!p) return err.textContent = "Informe a senha.";
        const h = await sha256Hex(p);
        if (h === storedHash) {
          setSession();
          location.href = "admin.html";
        } else {
          err.textContent = "Senha incorreta.";
        }
      }
    });

    // if already authenticated go straight to admin
    if (isAuthenticated()) location.href = "admin.html";
    return;
  }

  if (path === "admin.html") {
    // protect page
    if (!isAuthenticated()) {
      location.href = "admin-login.html";
      return;
    }

    // logout and reset actions
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      clearSession();
      location.href = "admin-login.html";
    });

    document.getElementById("resetHash")?.addEventListener("click", () => {
      if (!confirm("Remover a senha de administrador? Depois será necessário criar uma nova ao acessar o login.")) return;
      localStorage.removeItem(HASH_KEY);
      clearSession();
      alert("Senha removida. Você será redirecionado para a página de login.");
      location.href = "admin-login.html";
    });

    // load orders from localStorage (common keys)
    const ordersEl = document.getElementById("ordersList");
    const ordersCandidates = ["levenuts_orders", "orders", "orders_v1"];
    let orders = [];
    for (const k of ordersCandidates) {
      try {
        const v = JSON.parse(localStorage.getItem(k) || "null");
        if (Array.isArray(v) && v.length) { orders = v; break; }
      } catch {}
    }
    if (!orders.length) {
      ordersEl.innerHTML = "<div class='small'>Nenhum pedido encontrado no localStorage.</div>";
    } else {
      const html = orders.map(o => {
        const id = o.id || o.orderId || ("o"+(Math.random()*1e6|0));
        const date = o.createdAt || o.date || "";
        const total = (o.total != null) ? o.total : (Array.isArray(o.cart) ? o.cart.reduce((s,i)=>s+(i.price||0)*(i.quantity||1),0) : 0);
        return `<div style="margin-bottom:12px;border-bottom:1px solid #f3f1ef;padding-bottom:10px;">
          <div style="font-weight:700">ID: ${id} ${date ? "• "+date : ""}</div>
          <div class="small">Total: R$ ${Number(total).toLocaleString("pt-BR")}</div>
        </div>`;
      }).join("");
      ordersEl.innerHTML = html;
    }
    return;
  }

})();