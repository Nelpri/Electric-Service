(function () {
  const form = document.getElementById("form");
  const foto = document.getElementById("foto");
  const previewContainer = document.getElementById("previewContainer");
  const preview = document.getElementById("preview");
  const removePhoto = document.getElementById("removePhoto");
  const clearAll = document.getElementById("clearAll");
  const lista = document.getElementById("lista");

  let previewUrl = null;

  function setPreview(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    if (!file) {
      previewContainer.hidden = true;
      preview.removeAttribute("src");
      return;
    }
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    previewContainer.hidden = false;
  }

  foto?.addEventListener("change", function () {
    const file = this.files && this.files[0];
    setPreview(file || null);
  });

  removePhoto?.addEventListener("click", function () {
    if (foto) foto.value = "";
    setPreview(null);
  });

  clearAll?.addEventListener("click", function () {
    form?.reset();
    setPreview(null);
  });

  form?.addEventListener("submit", function (e) {
    e.preventDefault();
    const nombre = document.getElementById("nombre")?.value?.trim() || "";
    const cedula = document.getElementById("cedula")?.value?.trim() || "";
    const idVehiculo = document.getElementById("idVehiculo")?.value?.trim() || "";
    const partes = [
      nombre || "Sin nombre",
      cedula ? `CC ${cedula}` : null,
      idVehiculo ? `Veh. ${idVehiculo}` : null,
    ].filter(Boolean);
    const li = document.createElement("li");
    li.textContent = partes.join(" · ");
    lista?.prepend(li);
    form.reset();
    setPreview(null);
  });
})();
