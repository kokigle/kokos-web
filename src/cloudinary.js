// cloudinary.js
export async function uploadImage(file) {
    const CLOUD_NAME = "ddkhfghfr"; 
    const UPLOAD_PRESET = "kokos_unsigned";
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Error al subir imagen");

    const data = await res.json();
    return data.secure_url; // esta es la URL final que guardaremos
}
