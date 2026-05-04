// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
const SUPABASE_URL = "https://mxtljwiyjbofnqcgsetu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGxqd2l5amJvZm5xY2dzZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTU5NTcsImV4cCI6MjA5MjI5MTk1N30.tiCaq6Qi7ZlnuMb2pk3W5etanyystdmy7OWuvtlup1E";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// 📌 ELEMENTOS DOM
// ==============================
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const userEmailSpan = document.getElementById("userEmail");
const btnLogout = document.getElementById("btnLogout");

// Elementos del formulario
const form = document.getElementById("form");
const lista = document.getElementById("lista");
const preview = document.getElementById("preview");
const btnGuardar = document.getElementById("btnGuardar");
const fotoInput = document.getElementById("foto");
const selectServicio = document.getElementById("tipo");
const precioVista = document.getElementById("precioVista");
const selectVehiculo = document.getElementById("vehiculo");
const otroContainer = document.getElementById("vehiculoOtroContainer");
const otroInput = document.getElementById("vehiculoOtro");
const fechaIngreso = document.getElementById("fechaIngreso");
const fechaEntrega = document.getElementById("fechaEntrega");
const whatsappContainer = document.getElementById("whatsappBtnContainer");

let ultimaOrdenGuardada = null;  // para el botón de WhatsApp

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
  // VALIDAR TAMAÑO (5 MB)
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
  if (val === "30000") precioVista.textContent = "$30.000";
  else if (val === "60000") precioVista.textContent = "$60.000";
  else if (val === "120000") precioVista.textContent = "$120.000";
  else precioVista.textContent = "A convenir";
}

function resetearFormulario() {
  form.reset();
  preview.innerHTML = '<p class="small">Sin imagen</p>';
  toggleOtroVehiculo();
  actualizarPrecio();
  if (fechaIngreso) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaIngreso.value = hoy;
  }
  whatsappContainer.innerHTML = "";
  ultimaOrdenGuardada = null;
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
  if (session) {
    mostrarApp(session.user.email);
  } else {
    mostrarLogin();
  }
}

function mostrarLogin() {
  authSection.style.display = "block";
  appSection.style.display = "none";
  loginForm.style.display = "block";
  registerForm.style.display = "none";
}

function mostrarApp(email) {
  authSection.style.display = "none";
  appSection.style.display = "block";
  userEmailSpan.textContent = email;
  cargarRegistros();
  // precargar fecha de ingreso
  if (fechaIngreso && !fechaIngreso.value) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaIngreso.value = hoy;
  }
}

// ==============================
// 🔌 SUPABASE OPERACIONES (protegidas por RLS)
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
  const { error: uploadError } = await supabaseClient.storage.from("FOTOS").upload(fileName, file);
  if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);
  const { data: urlData } = supabaseClient.storage.from("FOTOS").getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function guardarRegistro(registro) {
  const { error } = await supabaseClient.from("registros").insert([registro]);
  if (error) throw new Error(error.message);
}

async function cargarRegistros() {
  try {
    const { data, error } = await supabaseClient
      .from("registros")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(20);
    if (error) throw error;
    if (!data || data.length === 0) {
      lista.innerHTML = '<li class="small">No hay registros aún</li>';
      return;
    }
    lista.innerHTML = "";
    data.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>Orden #${item.orden || "?"}</strong><br>
        <strong>${escapeHtml(item.nombre) || "Anónimo"}</strong><br>
        📞 ${escapeHtml(item.telefono) || "—"}<br>
        🚗 ${escapeHtml(item.vehiculo) || "—"}<br>
        🔧 ${escapeHtml(item.servicio) || "—"}<br>
        💰 ${item.precio ? "$" + item.precio.toLocaleString() : "A convenir"}<br>
        📌 Estado: ${escapeHtml(item.estado)}<br>
        📅 Ingreso: ${escapeHtml(item.fecha_ingreso) || "—"}<br>
        📅 Entrega: ${escapeHtml(item.fecha_entrega) || "—"}<br>
        ✔ ${item.checklist?.join(", ") || "Sin revisión"}<br>
        📝 ${escapeHtml(item.obs) || ""}<br>
        ${item.foto_url ? `<img src="${item.foto_url}" width="120" style="border-radius:8px; margin-top:6px;">` : ""}
        <hr>
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    lista.innerHTML = '<li class="small">Error al cargar registros</li>';
  }
}

// ==============================
// 📤 WHATSAPP (resumen automático)
// ==============================
function generarMensajeWhatsApp(registro, orden) {
  let mensaje = `📋 *ORDEN DE SERVICIO #${orden}*\n\n`;
  mensaje += `👤 *Cliente:* ${registro.nombre}\n`;
  if (registro.telefono) mensaje += `📞 *Teléfono:* ${registro.telefono}\n`;
  mensaje += `🚗 *Vehículo:* ${registro.vehiculo}\n`;
  if (registro.id_vehiculo) mensaje += `🔢 *ID/Placa:* ${registro.id_vehiculo}\n`;
  mensaje += `🔧 *Servicio:* ${registro.servicio}\n`;
  if (registro.precio) mensaje += `💰 *Precio:* $${registro.precio.toLocaleString()}\n`;
  mensaje += `📌 *Estado:* ${registro.estado}\n`;
  if (registro.fecha_ingreso) mensaje += `📅 *Ingreso:* ${registro.fecha_ingreso}\n`;
  if (registro.fecha_entrega) mensaje += `📅 *Entrega estimada:* ${registro.fecha_entrega}\n`;
  if (registro.checklist && registro.checklist.length) mensaje += `✅ *Checklist:* ${registro.checklist.join(", ")}\n`;
  if (registro.obs) mensaje += `📝 *Observaciones:* ${registro.obs}\n`;
  mensaje += `\n🔗 *Seguimiento:* ${window.location.href}`;
  return encodeURIComponent(mensaje);
}

function agregarBotonWhatsApp(orden, registro) {
  const numero = registro.telefono ? registro.telefono.replace(/\D/g, '') : '';
  const mensaje = generarMensajeWhatsApp(registro, orden);
  const link = `https://wa.me/${numero}?text=${mensaje}`;
  whatsappContainer.innerHTML = `
    <a href="${link}" target="_blank" class="whatsapp-btn" style="display:inline-block; background:#25D366; color:white; padding:10px 20px; border-radius:50px; text-decoration:none; font-weight:bold;">
      📱 Enviar resumen por WhatsApp al cliente
    </a>
  `;
}

// ==============================
// 💾 SUBMIT
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) {
    alert("El nombre del cliente es obligatorio");
    return;
  }

  if (fechaIngreso.value && fechaEntrega.value && fechaEntrega.value < fechaIngreso.value) {
    alert("La fecha de entrega no puede ser anterior a la fecha de ingreso");
    return;
  }

  const file = fotoInput.files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    alert("La imagen no puede superar 5MB. Por favor, elige una más pequeña.");
    return;
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    const orden = await obtenerProximoOrden();

    let foto_url = null;
    if (file) {
      foto_url = await subirImagen(file);
    }

    const servicioTexto = selectServicio.options[selectServicio.selectedIndex]?.text || "";
    const precioRaw = selectServicio.value;
    let precio = null;
    if (precioRaw === "30000") precio = 30000;
    else if (precioRaw === "60000") precio = 60000;
    else if (precioRaw === "120000") precio = 120000;

    const vehiculoSelect = selectVehiculo.value;
    const vehiculoOtro = otroInput.value.trim();
    const vehiculoFinal = vehiculoSelect === "otro" ? vehiculoOtro : vehiculoSelect;

    const registro = {
      orden,
      nombre,
      cedula: document.getElementById("cedula").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      vehiculo: vehiculoFinal,
      id_vehiculo: document.getElementById("idVehiculo").value.trim(),
      servicio: servicioTexto,
      precio,
      estado: document.getElementById("estado").value,
      checklist: obtenerChecklist(),
      obs: document.getElementById("descripcion").value.trim(),
      foto_url,
      fecha_ingreso: fechaIngreso.value || null,
      fecha_entrega: fechaEntrega.value || null
    };

    await guardarRegistro(registro);
    alert(`✅ Orden #${orden} guardada correctamente`);
    
    // Guardamos datos para el WhatsApp
    ultimaOrdenGuardada = { orden, registro };
    agregarBotonWhatsApp(orden, registro);
    
    resetearFormulario();
    await cargarRegistros();
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar: " + err.message);
  } finally {
    btnGuardar.disabled = false;
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
// 📸 PREVIEW DE FOTO
// ==============================
fotoInput.addEventListener("change", (e) => mostrarPreview(e.target.files[0]));

// ==============================
// 🚗 OTRO VEHÍCULO
// ==============================
selectVehiculo.addEventListener("change", toggleOtroVehiculo);
selectServicio.addEventListener("change", actualizarPrecio);

// ==============================
// 🔐 EVENTOS DE AUTENTICACIÓN
// ==============================
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
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
  loginForm.style.display = "none";
  registerForm.style.display = "block";
});

document.getElementById("btnShowLogin").addEventListener("click", () => {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
});

document.getElementById("btnRegister").addEventListener("click", async () => {
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!email || !password) return alert("Email y contraseña requeridos");
  if (password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");
  try {
    await handleRegister(email, password);
    alert("Registro exitoso. Ahora inicia sesión.");
    loginForm.style.display = "block";
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
  // suscripción a cambios de auth
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      mostrarApp(session.user.email);
    } else if (event === 'SIGNED_OUT') {
      mostrarLogin();
    }
  });
});