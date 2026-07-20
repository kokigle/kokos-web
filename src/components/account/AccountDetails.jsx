import React, { useState, useEffect } from "react";
import { FaUserEdit, FaTimes, FaSave } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

const AccountDetails = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    razonSocial: "",
    cuit: "",
    posicionFiscal: "",
    domicilioFiscal: "",
    email: "",
    telefonoMovil: "",
    domicilioEntrega: "",
    provincia: "",
    ciudad: "",
    codigoPostal: "",
  });

  const provincias = [
    "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
    "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        razonSocial: user.razonSocial || "",
        cuit: user.cuit || "",
        posicionFiscal: user.posicionFiscal || "",
        domicilioFiscal: user.domicilioFiscal || "",
        email: user.email || "",
        telefonoMovil: user.telefonoMovil || "",
        domicilioEntrega: user.domicilioEntrega || "",
        provincia: user.provincia || "",
        ciudad: user.ciudad || "",
        codigoPostal: user.codigoPostal || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const userRef = doc(db, "clients", user.id);
      
      const dataToUpdate = { ...formData };
      delete dataToUpdate.cuit;
      delete dataToUpdate.razonSocial;
      delete dataToUpdate.email;

      await updateDoc(userRef, dataToUpdate);

      setMsg({ type: "success", text: "Datos actualizados correctamente." });
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
      setMsg({ type: "error", text: "Error al guardar los cambios." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        razonSocial: user.razonSocial || "",
        cuit: user.cuit || "",
        posicionFiscal: user.posicionFiscal || "",
        domicilioFiscal: user.domicilioFiscal || "",
        email: user.email || "",
        telefonoMovil: user.telefonoMovil || "",
        domicilioEntrega: user.domicilioEntrega || "",
        provincia: user.provincia || "",
        ciudad: user.ciudad || "",
        codigoPostal: user.codigoPostal || "",
      });
    }
    setIsEditing(false);
    setMsg(null);
  };

  return (
    <div className="my-account-widget">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827" }}>Datos de la Cuenta</h3>
        {!isEditing && (
          <button 
            type="button" 
            className="my-account-button" 
            onClick={() => setIsEditing(true)}
          >
            <FaUserEdit /> Editar Datos
          </button>
        )}
      </div>

      <form className="my-account-form" onSubmit={handleSave}>
        <div className="my-account-form-grid">
          <div className="my-account-form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
            />
          </div>
          <div className="my-account-form-group">
            <label>Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
            />
          </div>

          <div className="my-account-form-group my-account-form-group-full">
            <label>Razón Social (No editable)</label>
            <input
              type="text"
              value={formData.razonSocial}
              readOnly
              disabled
              className="my-account-input"
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>
          <div className="my-account-form-group">
            <label>CUIT (No editable)</label>
            <input
              type="text"
              value={formData.cuit}
              readOnly
              disabled
              className="my-account-input"
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>
          <div className="my-account-form-group">
            <label>Posición Fiscal</label>
             {isEditing ? (
                <select 
                    name="posicionFiscal"
                    value={formData.posicionFiscal}
                    onChange={handleChange}
                    className="my-account-input"
                >
                     <option value="Consumidor Final">Consumidor Final</option>
                     <option value="Monotributista">Monotributista</option>
                     <option value="Responsable Exento">Responsable Exento</option>
                     <option value="Responsable Inscripto">Responsable Inscripto</option>
                </select>
             ) : (
                <input
                    type="text"
                    value={formData.posicionFiscal}
                    readOnly
                    className="my-account-input"
                />
             )}
          </div>
          
          <div className="my-account-form-group my-account-form-group-full">
            <label>Domicilio Fiscal</label>
            <input
              type="text"
              name="domicilioFiscal"
              value={formData.domicilioFiscal}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
              placeholder="Calle, Número, Localidad..."
            />
          </div>

          <div className="my-account-form-group">
            <label>Email (No editable)</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              disabled
              className="my-account-input"
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>
          <div className="my-account-form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefonoMovil"
              value={formData.telefonoMovil}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
            />
          </div>

          <div className="my-account-form-group my-account-form-group-full">
            <label>Domicilio de Entrega</label>
            <input
              type="text"
              name="domicilioEntrega"
              value={formData.domicilioEntrega}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
              placeholder="Calle, Número, Piso, Dpto..."
            />
          </div>

          <div className="my-account-form-group">
            <label>Provincia</label>
            {isEditing ? (
                <select
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  className="my-account-input"
                >
                  <option value="">Seleccionar...</option>
                  {provincias.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
            ) : (
                <input
                    type="text"
                    value={formData.provincia}
                    readOnly
                    className="my-account-input"
                />
            )}
          </div>
          <div className="my-account-form-group">
            <label>Ciudad</label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
            />
          </div>
          <div className="my-account-form-group">
            <label>Código Postal</label>
            <input
              type="text"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleChange}
              readOnly={!isEditing}
              className="my-account-input"
            />
          </div>
        </div>

        {msg && (
          <div className={msg.type === "success" ? "my-account-form-success" : "my-account-form-error"}>
            {msg.text}
          </div>
        )}

        {isEditing && (
          <div className="my-account-form-actions">
            <button 
                type="button" 
                onClick={handleCancel} 
                className="my-account-button" 
                style={{ backgroundColor: "#ef4444", marginRight: "10px" }}
                disabled={loading}
            >
              <FaTimes /> Cancelar
            </button>
            <button 
                type="submit" 
                className="my-account-button"
                disabled={loading}
            >
              {loading ? "Guardando..." : <><FaSave /> Guardar Cambios</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AccountDetails;
