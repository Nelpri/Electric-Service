// ===== SELECTORES =====
const form = document.getElementById("form");
const lista = document.getElementById("lista");

const nombre = document.getElementById("nombre");
const telefono = document.getElementById("telefono");
const vehiculo = document.getElementById("vehiculo");
const servicio = document.getElementById("servicio");
const estado = document.getElementById("estado");
const obs = document.getElementById("obs");
const fotoInput = document.getElementById("foto");

const previewContainer = document.getElementById("previewContainer");
const preview = document.getElementById("preview");
const removePhoto = document.getElementById("removePhoto");

const clearAll = document.getElementById("clearAll");

// ===== VARIABLES =====
let registros = JSON.parse(localStorage.getItem("registros")) || [];
let fotoBase64 = "";

// ===== FOTO PREVIEW =====
fotoInput.addEventListener("change", () => {
  const file = fotoInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    fotoBase64 = reader.result;
    preview.src = fotoBase64;
    previewContainer.hidden = false;
  };
  reader.readAsDataURL(file);
});

removePhoto.addEventListener("click", () => {
  fotoBase64 = "";
  fotoInput.value = "";
  previewContainer.hidden = true;
});

// ===== GUARDAR =====
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const checklist = [...document.querySelectorAll(".checklist input:checked")]
    .map(el => el.value);

  const registro = {
    id: Date.now(),
    nombre: nombre.value,
    telefono: telefono.value,
    vehiculo: vehiculo.value,
    servicioTexto: servicio.options[servicio.selectedIndex].text,
    precio: servicio.value,
    estado: estado.value,
    obs: obs.value,
    checklist,
    foto: fotoBase64,
    fecha: new Date().toLocaleString()
  };

  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));

  form.reset();
  fotoBase64 = "";
  previewContainer.hidden = true;

  render();
});

// ===== RENDER =====
function render() {
  lista.innerHTML = "";

  if (registros.length === 0) {
    lista.innerHTML = "<p class='empty'>Sin registros</p>";
    return;
  }

  registros.forEach(reg => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${reg.nombre}</strong> (${reg.vehiculo})<br>
      <span class="price">${reg.servicioTexto}</span><br>
      Estado: ${reg.estado}<br>
      <div class="small-info">${reg.fecha}</div>
      <div class="small-info">Checklist: ${reg.checklist.join(", ") || "N/A"}</div>

      ${reg.foto ? `<img src="${reg.foto}" style="max-width:100px;margin-top:5px;">` : ""}

      <div class="entry-actions">
        <button onclick="enviarWhats(${reg.id})">WhatsApp</button>
        <button onclick="eliminar(${reg.id})">Eliminar</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

// ===== ELIMINAR =====
function eliminar(id) {
  registros = registros.filter(r => r.id !== id);
  localStorage.setItem("registros", JSON.stringify(registros));
  render();
}

// ===== WHATSAPP =====
function enviarWhats(id) {
  const reg = registros.find(r => r.id === id);

  const mensaje = `
Hola ${reg.nombre}, tu ${reg.vehiculo} ha sido recibido.

Servicio: ${reg.servicioTexto}
Estado: ${reg.estado}
${reg.precio > 0 ? `Valor estimado: $${reg.precio}` : "Valor: por revisar"}

Te avisaremos cuando esté listo.
`;

  const url = `https://wa.me/57${reg.telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// ===== LIMPIAR TODO =====
clearAll.addEventListener("click", () => {
  if (confirm("¿Seguro que quieres borrar todos los registros?")) {
    localStorage.removeItem("registros");
    registros = [];
    render();
  }
});

// ===== INIT =====
render();