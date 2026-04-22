// ==============================
// 🔌 CONFIGURACIÓN SUPABASE
// ==============================
const SUPABASE_URL = "https://mxtljwiyjbofnqcgsetu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dGxqd2l5amJvZm5xY2dzZXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTU5NTcsImV4cCI6MjA5MjI5MTk1N30.tiCaq6Qi7ZlnuMb2pk3W5etanyystdmy7OWuvtlup1E";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// 📌 SELECTORES
// ==============================
const form = document.getElementById("form");
const lista = document.getElementById("lista");
const preview = document.getElementById("preview");
const inputFoto = document.getElementById("foto");

// ==============================
// 🧠 UTILIDADES
// ==============================
function obtenerChecklist() {
  return [...document.querySelectorAll(".checklist input:checked")]
    .map(el => el.value);
}

// ==============================
// 📸 SUBIR IMAGEN
// ==============================
async function subirImagen(file) {
  if (!file) return null;

  const nombre = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("fotos")
    .upload(nombre, file);

  if (error) {
    console.error(error);
    return null;
  }

  const { data } = supabase.storage
    .from("fotos")
    .getPublicUrl(nombre);

  return data.publicUrl;
}

// ==============================
// 📥 GUARDAR REGISTRO
// ==============================
async function guardarRegistro(data) {
  const { error } = await supabase
    .from("registros")
    .insert([data]);

  if (error) {
    console.error(error);
    alert("Error guardando");
    return false;
  }

  return true;
}

// ==============================
// 📤 CARGAR REGISTROS
// ==============================
async function cargarRegistros() {
  lista.innerHTML = "";

  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(item => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${item.nombre}</strong> (${item.telefono || "Sin teléfono"})<br>
      <em>${item.tipo}</em><br>
      ${item.descripcion || ""}<br>
      <small>✔ ${item.checklist?.join(", ") || "Sin revisión"}</small><br>
      ${item.imagen_url ? `<img src="${item.imagen_url}" width="100">` : ""}
      <br>
      <small>📅 ${new Date(item.fecha).toLocaleString()}</small>
    `;

    lista.appendChild(li);
  });
}

// ==============================
// 📸 PREVIEW
// ==============================
inputFoto.addEventListener("change", () => {
  const file = inputFoto.files[0];

  if (!file) {
    preview.innerHTML = "<p class='small'>Sin imagen</p>";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}">`;
  };

  reader.readAsDataURL(file);
});

// ==============================
// 📥 SUBMIT
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = inputFoto.files[0];
  const imagen_url = await subirImagen(file);

  const data = {
    nombre: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    tipo: document.getElementById("tipo").value,
    descripcion: document.getElementById("descripcion").value.trim(),
    checklist: obtenerChecklist(),
    imagen_url
  };

  if (!data.nombre) {
    alert("El nombre es obligatorio");
    return;
  }

  const ok = await guardarRegistro(data);

  if (ok) {
    form.reset();
    preview.innerHTML = "<p class='small'>Sin imagen</p>";
    cargarRegistros();
  }
});

// ==============================
// 🚀 INICIO
// ==============================
document.addEventListener("DOMContentLoaded", cargarRegistros);