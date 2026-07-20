import React, { useState } from "react";
import { FaSearch, FaArrowLeft, FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";
const formatMoney = (n) => `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const AccountOrders = ({ orders, loading, user }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const downloadOrderAsPDF = (order, client) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 0;

      const addHeader = () => {
        doc.addImage(logo, "PNG", margin, 12, 50, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text("Nota de Pedido", pageWidth - margin, 20, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(
          `Pedido N°: ${order.id.substring(0, 7).toUpperCase()}`,
          pageWidth - margin,
          26,
          { align: "right" }
        );
        doc.text(
          `Fecha: ${new Date(order.createdAt).toLocaleDateString("es-AR")}`,
          pageWidth - margin,
          31,
          { align: "right" }
        );
        currentY = 40;
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;
      };

      const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
          doc.text(
            "KOKOS Argentina - De Argimpex S.A.",
            margin,
            pageHeight - 10
          );
        }
      };

      addHeader();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text("Cliente:", margin, currentY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(client.razonSocial || client.nombre, margin + 20, currentY);
      currentY += 5;
      doc.text(client.email, margin + 20, currentY);
      currentY += 5;
      doc.text(`CUIT: ${client.cuit || "N/A"}`, margin + 20, currentY);
      currentY += 10;

      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      const tableColumn = ["CÓDIGO", "DESCRIPCIÓN", "CANT.", "PRECIO", "TOTAL"];
      const tableRows = order.items.map((item) => [
        item.code || "N/A",
        item.name || "Producto sin nombre",
        item.qty || 0,
        `$${formatMoney(item.price || 0)}`,
        `$${formatMoney((item.price || 0) * (item.qty || 0))}`,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: "striped",
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });

      let finalY = doc.lastAutoTable.finalY;

      const total = order.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.qty || 0),
        0
      );
      currentY = finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40);
      doc.text("TOTAL:", pageWidth - margin - 40, currentY, { align: "left" });
      doc.text(`$${formatMoney(total)}`, pageWidth - margin, currentY, {
        align: "right",
      });
      currentY += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Forma de Pago: Cheque a 30 días", margin, currentY);

      addFooter();
      doc.save(`pedido-${order.id.substring(0, 7)}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert(
        "Hubo un error al generar el PDF. Por favor, revisa la consola del desarrollador (F12)."
      );
    }
  };

  const filteredAndSortedOrders = [...orders]
    .filter((order) => {
      const orderId = order.id.toUpperCase();
      const term = searchTerm.toUpperCase();
      return orderId.includes(term);
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return (
      <div className="my-account-widget">
        <h3 className="my-account-widget-title">Mis Pedidos</h3>
        <div className="my-account-loading-section">Cargando pedidos...</div>
      </div>
    );
  }

  if (selectedOrder) {
    const total = selectedOrder.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    );
    return (
      <div className="my-account-widget">
        <button
          onClick={() => setSelectedOrder(null)}
          className="my-account-back-button"
        >
          <FaArrowLeft /> Volver a Mis Pedidos
        </button>
        <div>
          <h3 className="my-account-widget-title" style={{ marginTop: "20px" }}>
            Detalle del Pedido #{selectedOrder.id.substring(0, 7).toUpperCase()}
          </h3>
          <div className="my-account-order-detail-meta">
            <div>
              <span>Fecha:</span>
              <strong>
                {new Date(selectedOrder.createdAt).toLocaleDateString("es-AR")}
              </strong>
            </div>
            <div>
              <span>Estado:</span>
              <strong
                className={`my-account-order-status my-account-order-status-${selectedOrder.status}`}
              >
                {selectedOrder.status.replace("_", " ")}
              </strong>
            </div>
            <div>
              <span>Total:</span> <strong>{formatMoney(total)}</strong>
            </div>
          </div>
          <div className="my-account-order-detail-items">
            {selectedOrder.items.map((item) => (
              <div key={item.id} className="my-account-order-detail-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="my-account-order-item-image"
                />
                <div className="my-account-order-item-info">
                  <span className="my-account-order-item-name">
                    {item.name}
                  </span>
                  <span className="my-account-order-item-qty">
                    {item.qty} x {formatMoney(item.price)}
                  </span>
                </div>
                <span className="my-account-order-item-subtotal">
                  {formatMoney(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="my-account-form-actions">
          <button
            onClick={() => downloadOrderAsPDF(selectedOrder, user)}
            className="my-account-button"
          >
            <FaFilePdf /> Descargar PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-account-widget">
      <h3 className="my-account-widget-title">Mis Pedidos</h3>
      
      <div className="my-account-orders-controls">
        <div className="my-account-search-wrapper">
          <FaSearch className="my-account-search-icon" />
          <input
            type="text"
            placeholder="Buscar por N° de pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="my-account-search-input"
          />
        </div>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="my-account-sort-select"
        >
          <option value="desc">Más recientes</option>
          <option value="asc">Más antiguos</option>
        </select>
      </div>

      {filteredAndSortedOrders.length === 0 ? (
        <p className="my-account-empty-section">
          {searchTerm ? "No se encontraron pedidos con ese criterio." : "Aún no has realizado ningún pedido."}
        </p>
      ) : (
        <div className="my-account-orders-list">
          {filteredAndSortedOrders.map((order) => {
            const total = order.items.reduce(
              (sum, item) => sum + (item.price || 0) * (item.qty || 0),
              0
            );
            return (
              <div
                key={order.id}
                className="my-account-order-card"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="my-account-order-info">
                  <span className="my-account-order-id">
                    Pedido #{order.id.substring(0, 7).toUpperCase()}
                  </span>
                  <span className="my-account-order-date">
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="my-account-order-status-total">
                  <span
                    className={`my-account-order-status my-account-order-status-${order.status}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                  <span className="my-account-order-total">
                    ${formatMoney(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccountOrders;
