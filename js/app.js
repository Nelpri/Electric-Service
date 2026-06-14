// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
const SUPABASE_URL = "https://mxtljwiyjbofnqcgsetu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGxqd2l5amJvZm5xY2dzZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTU5NTcsImV4cCI6MjA5MjI5MTk1N30.tiCaq6Qi7ZlnuMb2pk3W5etanyystdmy7OWuvtlup1E";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// 📌 ELEMENTOS DOM
// ==============================
const authSection      = document.getElementById("authSection");
const appSection       = document.getElementById("appSection");
const loginForm        = document.getElementById("loginForm");
const registerForm     = document.getElementById("registerForm");
const userEmailSpan    = document.getElementById("userEmail");
const btnLogout        = document.getElementById("btnLogout");

const form             = document.getElementById("form");
const lista            = document.getElementById("lista");
const preview          = document.getElementById("preview");
const btnGuardar       = document.getElementById("btnGuardar");
const fotoInput        = document.getElementById("foto");
const selectServicio   = document.getElementById("tipo");
const precioVista      = document.getElementById("precioVista");
const selectVehiculo   = document.getElementById("vehiculo");
const otroContainer    = document.getElementById("vehiculoOtroContainer");
const otroInput        = document.getElementById("vehiculoOtro");
const fechaIngreso     = document.getElementById("fechaIngreso");
const fechaEntrega     = document.getElementById("fechaEntrega");
const whatsappContainer= document.getElementById("whatsappBtnContainer");

// ==============================
// 🧠 UTILIDADES
// ==============================
function obtenerChecklist() {
  return [...document.querySelectorAll(".checklist-grid input:checked")].map(el => el.value);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, m => m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;");
}

function mostrarPreview(file) {
  if (!file) {
    preview.innerHTML = '<p class="small">Sin imagen</p>';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("❌ La imagen no puede superar 5MB. Por favor, elige una más pequeña.");
    fotoInput.value = "";
    preview.innerHTML = '<p class="small">Sin imagen</p>';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

function toggleOtroVehiculo() {
  if (selectVehiculo.value === "otro") {
    otroContainer.style.display = "block";
    otroInput.required = true;
  } else {
    otroContainer.style.display = "none";
    otroInput.value = "";
    otroInput.required = false;
  }
}

function actualizarPrecio() {
  const val = selectServicio.value;
  if (val === "30000")       precioVista.textContent = "$30.000";
  else if (val === "60000")  precioVista.textContent = "$60.000";
  else if (val === "120000") precioVista.textContent = "$120.000";
  else                       precioVista.textContent = "A convenir";
}

function resetearFormulario() {
  form.reset();
  preview.innerHTML = '<p class="small">Sin imagen</p>';
  toggleOtroVehiculo();
  actualizarPrecio();
  if (fechaIngreso) {
    fechaIngreso.value = new Date().toISOString().split('T')[0];
  }
  whatsappContainer.innerHTML = "";
}

// ==============================
// 📤 WHATSAPP
// ==============================
function generarMensajeWhatsApp(registro, orden) {
  let msg = `📋 *ORDEN DE SERVICIO #${orden}*\n\n`;
  msg += `👤 *Cliente:* ${registro.nombre}\n`;
  if (registro.telefono) msg += `📞 *Teléfono:* ${registro.telefono}\n`;
  msg += `🚗 *Vehículo:* ${registro.vehiculo}\n`;
  if (registro.id_vehiculo) msg += `🔢 *ID/Placa:* ${registro.id_vehiculo}\n`;
  msg += `🔧 *Servicio:* ${registro.servicio}\n`;
  if (registro.precio) msg += `💰 *Precio:* $${registro.precio.toLocaleString()}\n`;
  msg += `📌 *Estado:* ${registro.estado}\n`;
  if (registro.fecha_ingreso) msg += `📅 *Ingreso:* ${registro.fecha_ingreso}\n`;
  if (registro.fecha_entrega) msg += `📅 *Entrega estimada:* ${registro.fecha_entrega}\n`;
  if (registro.checklist?.length) msg += `✅ *Checklist:* ${registro.checklist.join(", ")}\n`;
  if (registro.obs) msg += `📝 *Observaciones:* ${registro.obs}\n`;
  msg += `\n_Scorpion Electric — Servicio Técnico_`;
  return encodeURIComponent(msg);
}

function agregarBotonWhatsApp(orden, registro) {
  const numero = (registro.telefono || "").replace(/\D/g, "");
  const msg    = generarMensajeWhatsApp(registro, orden);
  const link   = numero
    ? `https://wa.me/57${numero}?text=${msg}`
    : `https://wa.me/?text=${msg}`;

  whatsappContainer.innerHTML = `
    <div style="
      background: #e7fbe9;
      border: 1px solid #a5d6a7;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin: 1rem 0;
      text-align: center;
    ">
      <p style="margin:0 0 .75rem;font-size:.875rem;color:#2e7d32;font-weight:600;">
        ✅ Orden #${orden} guardada — Notificar al cliente:
      </p>
      <a href="${link}" target="_blank" rel="noopener" style="
        display: inline-flex;
        align-items: center;
        gap: .5rem;
        background: #25D366;
        color: #fff;
        padding: .65rem 1.5rem;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 700;
        font-size: .9375rem;
        box-shadow: 0 4px 14px rgba(37,211,102,.4);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Enviar resumen por WhatsApp
      </a>
      ${!numero ? '<p style="margin:.5rem 0 0;font-size:.75rem;color:#888;">⚠️ Sin número registrado — el enlace abrirá WhatsApp sin destinatario</p>' : ""}
    </div>
  `;
}

// ==============================
// 🗑️ ELIMINAR REGISTRO
// ==============================
async function eliminarRegistro(id, nombreCliente) {
  const confirmar = confirm(`¿Eliminar la orden de "${nombreCliente}"?\n\nEsta acción no se puede deshacer.`);
  if (!confirmar) return;

  try {
    const { error } = await supabaseClient
      .from("registros")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Feedback visual rápido sin alert
    const li = document.querySelector(`[data-registro-id="${id}"]`);
    if (li) {
      li.style.transition = "opacity .3s, transform .3s";
      li.style.opacity = "0";
      li.style.transform = "translateX(20px)";
      setTimeout(() => li.remove(), 300);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error al eliminar: " + err.message);
  }
}

// ==============================
// 📋 CARGAR REGISTROS
// ==============================
async function cargarRegistros() {
  try {
    const { data, error } = await supabaseClient
      .from("registros")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(30);

    if (error) throw error;

    if (!data || data.length === 0) {
      lista.innerHTML = '<li class="small" style="padding:.75rem;opacity:.6">No hay registros aún</li>';
      return;
    }

    lista.innerHTML = "";

    data.forEach(item => {
      const li = document.createElement("li");
      li.dataset.registroId = item.id;

      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem">
          <div>
            <strong style="font-size:.9375rem">Orden #${item.orden || "?"} — ${escapeHtml(item.nombre) || "Anónimo"}</strong><br>
            <span style="font-size:.8125rem;color:var(--color-text-muted)">
              📞 ${escapeHtml(item.telefono) || "—"} &nbsp;·&nbsp;
              🚗 ${escapeHtml(item.vehiculo) || "—"}
            </span>
          </div>
          <span style="
            font-size:.75rem;font-weight:600;padding:.2rem .65rem;border-radius:20px;white-space:nowrap;
            background:${item.estado === 'Finalizado' ? '#e8f5e9' : item.estado === 'En proceso' ? '#e3f2fd' : '#fff8e1'};
            color:${item.estado === 'Finalizado' ? '#2e7d32' : item.estado === 'En proceso' ? '#1565c0' : '#f57f17'};
            border:1px solid ${item.estado === 'Finalizado' ? '#a5d6a7' : item.estado === 'En proceso' ? '#90caf9' : '#ffe082'};
          ">${escapeHtml(item.estado)}</span>
        </div>

        <div style="font-size:.8125rem;color:var(--color-text-muted);line-height:1.8">
          🔧 ${escapeHtml(item.servicio) || "—"} &nbsp;·&nbsp;
          💰 ${item.precio ? "$" + item.precio.toLocaleString() : "A convenir"}<br>
          📅 Ingreso: ${escapeHtml(item.fecha_ingreso) || "—"} &nbsp;·&nbsp;
          📅 Entrega: ${escapeHtml(item.fecha_entrega) || "—"}<br>
          ${item.checklist?.length ? `✅ ${item.checklist.join(", ")}<br>` : ""}
          ${item.obs ? `📝 ${escapeHtml(item.obs)}<br>` : ""}
        </div>

        ${item.foto_url ? `
          <div style="margin-top:.6rem">
            <img src="${item.foto_url}" alt="Foto orden"
              style="max-height:100px;border-radius:8px;object-fit:cover;cursor:pointer"
              onclick="window.open('${item.foto_url}','_blank')">
          </div>` : ""}

        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem;padding-top:.65rem;border-top:1px solid var(--color-border)">
          <a href="https://wa.me/57${(item.telefono || "").replace(/\D/g,"")}?text=${generarMensajeWhatsApp(item, item.orden)}"
            target="_blank" rel="noopener"
            style="
              display:inline-flex;align-items:center;gap:.35rem;
              background:#25D366;color:#fff;
              padding:.4rem .9rem;border-radius:20px;
              text-decoration:none;font-size:.8rem;font-weight:600;
            ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>

          <button
            onclick="eliminarRegistro('${item.id}', '${escapeHtml(item.nombre || "este cliente")}')"
            style="
              display:inline-flex;align-items:center;gap:.35rem;
              background:rgba(217,122,122,.12);color:var(--color-danger);
              border:1px solid rgba(217,122,122,.35);
              padding:.4rem .9rem;border-radius:20px;
              font-size:.8rem;font-weight:600;cursor:pointer;
            ">
            🗑️ Eliminar
          </button>
        </div>
      `;

      lista.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    lista.innerHTML = '<li class="small">Error al cargar registros</li>';
  }
}

// ==============================
// 🔐 AUTENTICACIÓN
// ==============================
async function handleLogin(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function handleRegister(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  mostrarLogin();
}

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) mostrarApp(session.user.email);
  else          mostrarLogin();
}

function mostrarLogin() {
  authSection.style.display = "block";
  appSection.style.display  = "none";
  loginForm.style.display   = "block";
  registerForm.style.display= "none";
}

function mostrarApp(email) {
  authSection.style.display = "none";
  appSection.style.display  = "block";
  userEmailSpan.textContent = email;
  cargarRegistros();
  if (fechaIngreso && !fechaIngreso.value) {
    fechaIngreso.value = new Date().toISOString().split('T')[0];
  }
}

// ==============================
// 🔌 SUPABASE — OPERACIONES
// ==============================
async function obtenerProximoOrden() {
  const { data, error } = await supabaseClient
    .from("registros")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1);
  if (error) throw new Error("Error al obtener orden: " + error.message);
  if (!data || data.length === 0) return 1;
  return data[0].orden + 1;
}

async function subirImagen(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error("La imagen supera 5MB");
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const { error: uploadError } = await supabaseClient.storage
    .from("FOTOS")
    .upload(fileName, file);
  if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);
  const { data: urlData } = supabaseClient.storage.from("FOTOS").getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function guardarRegistroDB(registro) {
  const { error } = await supabaseClient.from("registros").insert([registro]);
  if (error) throw new Error(error.message);
}

// ==============================
// 💾 SUBMIT
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) { alert("El nombre del cliente es obligatorio"); return; }

  if (fechaIngreso.value && fechaEntrega.value && fechaEntrega.value < fechaIngreso.value) {
    alert("La fecha de entrega no puede ser anterior a la fecha de ingreso");
    return;
  }

  const file = fotoInput.files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    alert("La imagen no puede superar 5MB.");
    return;
  }

  btnGuardar.disabled     = true;
  btnGuardar.textContent  = "Guardando...";

  try {
    const orden    = await obtenerProximoOrden();
    let   foto_url = null;
    if (file) foto_url = await subirImagen(file);

    const servicioTexto = selectServicio.options[selectServicio.selectedIndex]?.text || "";
    const precioRaw     = selectServicio.value;
    let   precio        = null;
    if      (precioRaw === "30000")  precio = 30000;
    else if (precioRaw === "60000")  precio = 60000;
    else if (precioRaw === "120000") precio = 120000;

    const vehiculoFinal = selectVehiculo.value === "otro"
      ? otroInput.value.trim()
      : selectVehiculo.value;

    const registro = {
      orden,
      nombre,
      cedula:        document.getElementById("cedula").value.trim(),
      telefono:      document.getElementById("telefono").value.trim(),
      vehiculo:      vehiculoFinal,
      id_vehiculo:   document.getElementById("idVehiculo").value.trim(),
      servicio:      servicioTexto,
      precio,
      estado:        document.getElementById("estado").value,
      checklist:     obtenerChecklist(),
      obs:           document.getElementById("descripcion").value.trim(),
      foto_url,
      fecha_ingreso: fechaIngreso.value || null,
      fecha_entrega: fechaEntrega.value || null,
    };

    await guardarRegistroDB(registro);

    // Mostrar botón WhatsApp prominente tras guardar
    agregarBotonWhatsApp(orden, registro);

    resetearFormulario();
    await cargarRegistros();

  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar: " + err.message);
  } finally {
    btnGuardar.disabled    = false;
    btnGuardar.textContent = "Guardar orden";
  }
});

// ==============================
// 🧹 RESET MANUAL
// ==============================
document.getElementById("btnLimpiar").addEventListener("click", (e) => {
  e.preventDefault();
  resetearFormulario();
});

// ==============================
// 📸 PREVIEW FOTO
// ==============================
fotoInput.addEventListener("change", (e) => mostrarPreview(e.target.files[0]));

// ==============================
// 🚗 OTRO VEHÍCULO / PRECIO
// ==============================
selectVehiculo.addEventListener("change", toggleOtroVehiculo);
selectServicio.addEventListener("change", actualizarPrecio);

// ==============================
// 🔐 EVENTOS AUTH
// ==============================
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return alert("Email y contraseña requeridos");
  try {
    await handleLogin(email, password);
    checkSession();
  } catch (err) {
    alert("Error al iniciar sesión: " + err.message);
  }
});

document.getElementById("btnShowRegister").addEventListener("click", () => {
  loginForm.style.display    = "none";
  registerForm.style.display = "block";
});

document.getElementById("btnShowLogin").addEventListener("click", () => {
  loginForm.style.display    = "block";
  registerForm.style.display = "none";
});

document.getElementById("btnRegister").addEventListener("click", async () => {
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!email || !password) return alert("Email y contraseña requeridos");
  if (password.length < 6)  return alert("La contraseña debe tener al menos 6 caracteres");
  try {
    await handleRegister(email, password);
    alert("Registro exitoso. Ahora inicia sesión.");
    loginForm.style.display    = "block";
    registerForm.style.display = "none";
  } catch (err) {
    alert("Error al registrar: " + err.message);
  }
});

btnLogout.addEventListener("click", async () => {
  await handleLogout();
});

// ==============================
// 🚀 INICIO
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  checkSession();
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) mostrarApp(session.user.email);
    else if (event === "SIGNED_OUT")      mostrarLogin();
  });
});