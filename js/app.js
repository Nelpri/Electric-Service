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
const fotoInput = document.getElementById("foto");   // unificado con capture
const selectServicio = document.getElementById("tipo");
const precioVista = document.getElementById("precioVista");
const selectVehiculo = document.getElementById("vehiculo");
const otroContainer = document.getElementById("vehiculoOtroContainer");
const otroInput = document.getElementById("vehiculoOtro");

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
  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}

// Mostrar/ocultar campo "Otro vehículo"
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
}

// ==============================
// 🔌 SUPABASE OPERACIONES
// ==============================
async function obtenerProximoOrden() {
  const { data, error } = await supabase
    .from("registros")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1);
  if (error) throw new Error("Error al obtener orden: " + error.message);
  if (!data || data.length === 0) return 1;
  return data[0].orden + 1;
}

async function subirImagen(file) {
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("fotos").upload(fileName, file);
  if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);
  const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function guardarRegistro(registro) {
  const { error } = await supabase.from("registros").insert([registro]);
  if (error) throw new Error(error.message);
}

async function cargarRegistros() {
  try {
    const { data, error } = await supabase
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
// 📸 EVENTOS
// ==============================
fotoInput.addEventListener("change", (e) => mostrarPreview(e.target.files[0]));

selectVehiculo.addEventListener("change", toggleOtroVehiculo);
selectServicio.addEventListener("change", actualizarPrecio);

document.getElementById("btnLimpiar").addEventListener("click", (e) => {
  e.preventDefault();
  resetearFormulario();
});

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

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    const orden = await obtenerProximoOrden();

    const file = fotoInput.files[0];
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
      foto_url
    };

    await guardarRegistro(registro);
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
// 🚀 INICIO
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  actualizarPrecio();
  toggleOtroVehiculo();
  cargarRegistros();
});