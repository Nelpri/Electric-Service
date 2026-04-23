// ─── CONFIGURACIÓN SUPABASE ───────────────────────────────────────────────────
const SUPABASE_URL = "https://mxtljwiyjbofnqcgsetu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGxqd2l5amJvZm5xY2dzZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTU5NTcsImV4cCI6MjA5MjI5MTk1N30.tiCaq6Qi7ZlnuMb2pk3W5etanyystdmy7OWuvtlup1E";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// 📌 SELECTORES DOM
// ==============================
const form = document.getElementById("form");
const lista = document.getElementById("lista");
const preview = document.getElementById("preview");
const btnGuardar = document.getElementById("btnGuardar");

const inputFoto = document.getElementById("foto");
const inputCamara = document.getElementById("fotoCamara");

const selectServicio = document.getElementById("tipo");
const precioVista = document.getElementById("precioVista");

const selectVehiculo = document.getElementById("vehiculo");
const vehiculoOtroContainer = document.getElementById("vehiculoOtroContainer");
const vehiculoOtroInput = document.getElementById("vehiculoOtro");

// ==============================
// 🧠 UTILIDADES
// ==============================
function obtenerChecklist() {
  return [...document.querySelectorAll(".checklist-grid input:checked")].map(el => el.value);
}

// Mostrar/ocultar campo "Otro vehículo"
function toggleOtroVehiculo() {
  if (selectVehiculo.value === "otro") {
    vehiculoOtroContainer.style.display = "block";
    vehiculoOtroInput.required = true;
  } else {
    vehiculoOtroContainer.style.display = "none";
    vehiculoOtroInput.value = "";
    vehiculoOtroInput.required = false;
  }
}

// Obtener el próximo número de orden (consecutivo real desde BD)
async function obtenerProximoOrden() {
  const { data, error } = await supabase
    .from("registros")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error al obtener último orden:", error);
    // Fallback: usar timestamp si falla la consulta
    return Date.now();
  }

  if (!data || data.length === 0) return 1;
  return data[0].orden + 1;
}

// Actualizar precio mostrado según el servicio seleccionado
function actualizarPrecio() {
  const valor = selectServicio.value;
  let precio = 0;
  if (valor === "30000") precio = 30000;
  else if (valor === "60000") precio = 60000;
  else if (valor === "120000") precio = 120000;
  // "presupuesto" se queda en 0
  precioVista.textContent = precio ? "$" + precio.toLocaleString() : "A convenir";
}

// Mostrar preview de imagen
function mostrarPreview(file) {
  if (!file) {
    preview.innerHTML = '<p class="small">Sin imagen</p>';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

// Subir imagen a Supabase Storage y devolver URL pública
async function subirImagen(file) {
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("fotos")
    .upload(fileName, file);
  if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);
  const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(fileName);
  return urlData.publicUrl;
}

// Resetear completamente el formulario (incluyendo campos dinámicos)
function resetearFormulario() {
  form.reset();
  preview.innerHTML = '<p class="small">Sin imagen</p>';
  actualizarPrecio();
  // Ocultar campo "otro vehículo"
  vehiculoOtroContainer.style.display = "none";
  vehiculoOtroInput.value = "";
  vehiculoOtroInput.required = false;
  selectVehiculo.value = "";
}

// ==============================
// 📥 CARGAR REGISTROS (lista)
// ==============================
async function cargarRegistros() {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .order("creado_en", { ascending: false })
    .limit(20); // Mostrar solo los últimos 20

  if (error) {
    console.error(error);
    lista.innerHTML = '<li class="small">Error al cargar registros</li>';
    return;
  }

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
      ✔ ${item.checklist?.join(", ") || "Sin revisión"}<br>
      📝 ${escapeHtml(item.obs) || ""}<br>
      ${item.foto_url ? `<img src="${item.foto_url}" width="120" style="border-radius:8px; margin-top:6px;">` : ""}
      <hr>
    `;
    lista.appendChild(li);
  });
}

// Mini utilidad para evitar XSS
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// ==============================
// 💾 GUARDAR ORDEN (SUBMIT)
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validaciones básicas
  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) {
    alert("El nombre del cliente es obligatorio");
    return;
  }

  // Deshabilitar botón para evitar doble envío
  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    // 1. Obtener siguiente número de orden (consecutivo real)
    const orden = await obtenerProximoOrden();

    // 2. Subir foto si existe
    const file = inputFoto.files[0] || inputCamara.files[0];
    let foto_url = null;
    if (file) {
      foto_url = await subirImagen(file);
    }

    // 3. Preparar datos del servicio
    const servicioTexto = selectServicio.options[selectServicio.selectedIndex]?.text || "";
    const precioRaw = selectServicio.value;
    let precio = null;
    if (precioRaw === "30000") precio = 30000;
    else if (precioRaw === "60000") precio = 60000;
    else if (precioRaw === "120000") precio = 120000;

    // 4. Vehículo final (con "otro")
    const vehiculoSelect = selectVehiculo.value;
    const vehiculoOtro = vehiculoOtroInput.value.trim();
    const vehiculoFinal = vehiculoSelect === "otro" ? vehiculoOtro : vehiculoSelect;

    // 5. Construir objeto registro
    const registro = {
      orden: orden,
      nombre: nombre,
      cedula: document.getElementById("cedula").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      vehiculo: vehiculoFinal,
      id_vehiculo: document.getElementById("idVehiculo").value.trim(),
      servicio: servicioTexto,
      precio: precio,
      estado: document.getElementById("estado").value,
      checklist: obtenerChecklist(),
      obs: document.getElementById("descripcion").value.trim(),
      foto_url: foto_url
    };

    // 6. Insertar en Supabase
    const { error } = await supabase.from("registros").insert([registro]);
    if (error) throw new Error(error.message);

    alert(`✅ Orden #${orden} guardada correctamente`);
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
// 🧹 RESET MANUAL (botón limpiar)
// ==============================
document.getElementById("btnLimpiar").addEventListener("click", (e) => {
  e.preventDefault();
  resetearFormulario();
});

// ==============================
// 📸 EVENTOS DE PREVIEW DE FOTO
// ==============================
inputFoto.addEventListener("change", (e) => mostrarPreview(e.target.files[0]));
inputCamara.addEventListener("change", (e) => mostrarPreview(e.target.files[0]));

// ==============================
// 🚗 EVENTO PARA CAMPO "OTRO" VEHÍCULO
// ==============================
selectVehiculo.addEventListener("change", toggleOtroVehiculo);

// ==============================
// 💰 ACTUALIZAR PRECIO AL CAMBIAR SERVICIO
// ==============================
selectServicio.addEventListener("change", actualizarPrecio);

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  actualizarPrecio();
  toggleOtroVehiculo();     // Estado inicial del campo "otro"
  cargarRegistros();
});