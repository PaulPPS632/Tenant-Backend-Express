const fs = require("fs");
const path = require("path");
const numeroALetras = require("./numeroALetras");
const PDFDocument = require("pdfkit-table");
class GeneratePDF {
  constructor() {}
  createPdf(invoiceData) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    const dir = path.resolve(__dirname, `../../public/documents/cotizaciones`);

    // Crear la carpeta si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Crea la carpeta y sus padres si no existen
    }
    this.generateHeader(doc, invoiceData);
    this.generateCustomerInformation(doc, invoiceData);
    this.generateTable(doc, invoiceData);
    this.generateImporteLetras(doc, invoiceData);
    this.generateCuentaBancaria(doc);
    //cambiar para despliegue
    const ruta = `http://${process.env.DB_HOST}:3000/api/cotizaciones/COTIZACION_${invoiceData.id}.pdf`;
    doc.end();
    doc.pipe(
      fs.createWriteStream(
        path.resolve(dir, `COTIZACION_${invoiceData.id}.pdf`)
      )
    );
    return ruta;
  }
  generateHeader(doc, invoice) {
    doc
      .image(
        path.resolve(__dirname, `../../public/uploads/logo_grande.png`),
        30,
        20,
        { width: 80 }
      )
      .fillColor("#444444")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("Technet S.A.C.", 40, 100, { align: "left" })
      .font("Helvetica")
      .text("20600249071", 40, 110, { align: "left" })
      .text("PJ. VELARDE NRO. 164 INT. 109 LIMA - LIMA - LIMA", 40, 120, {
        align: "left",
        width: 150,
      })
      .moveDown();
    doc
      .fillColor("#000")
      .fontSize(12)
      .font("Helvetica-Bold", 20)
      .text("COTIZACION", 350, 60, { align: "center" })
      .moveDown()
      .font("Helvetica-Bold", 16)
      .text(invoice.id.toString().padStart(6, "0"), 350, 90, {
        align: "center",
      });
    this.roundedRect(doc, 350, 30, 200, 100, 10);
  }
  generateCustomerInformation(doc, invoice) {
    const customerInformationTop = 172;
    const customerInformationleft = 45;
    //formatDate(new Date())
    doc
      .fontSize(8)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text("CLIENTE", customerInformationleft, customerInformationTop - 12)
      .text("RUC", customerInformationleft, customerInformationTop)
      .font("Helvetica")
      .text(
        ": " + invoice.cliente.documento,
        customerInformationleft + 75,
        customerInformationTop
      )
      .font("Helvetica-Bold")
      .text(
        "DENOMINACION",
        customerInformationleft,
        customerInformationTop + 12
      )
      .font("Helvetica")
      .text(
        ": " + invoice.cliente.nombre,
        customerInformationleft + 75,
        customerInformationTop + 12
      )
      .font("Helvetica-Bold")
      .text("DIRECCION", customerInformationleft, customerInformationTop + 25)
      .font("Helvetica")
      .text(": ", customerInformationleft + 75, customerInformationTop + 25)
      .text(
        invoice.cliente.direccion,
        customerInformationleft + 79,
        customerInformationTop + 25,
        {
          width: 200, // Anchura máxima del texto (ajústala a lo que necesites)
          // Alineación del texto dentro de esa anchura
        }
      );
    doc
      .fontSize(8)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text("FECHA", customerInformationleft + 370, customerInformationTop - 12)
      .text(
        "FECHA EMISION",
        customerInformationleft + 370,
        customerInformationTop
      )
      .font("Helvetica")
      .text(
        ": " + invoice.fecha_emision.split("T")[0],
        customerInformationleft + 445,
        customerInformationTop
      )
      .font("Helvetica-Bold")
      .text(
        "FECHA DE VENC.",
        customerInformationleft + 370,
        customerInformationTop + 12
      )
      .font("Helvetica")
      .text(
        ": " + invoice.fecha_vencimiento.split("T")[0],
        customerInformationleft + 445,
        customerInformationTop + 12
      );

    this.roundedRect(doc, customerInformationleft - 5, 150, 365, 100, 6);
    this.roundedRect(doc, customerInformationleft + 365, 150, 140, 100, 6);
  }
  generateTable(doc, invoice) {
    const rows = invoice.detalles.map((detalle) => {
      return [
        detalle.cantidad,
        "NIU",
        detalle.nombre || "Nombre del Producto", // Nombre del producto
        `${parseFloat(detalle.precio_bruto).toFixed(2)}`, // Total del detalle formateado
        `${parseFloat(detalle.precio_neto).toFixed(2)}`, // Otros precios (ajusta según sea necesario)
        `${parseFloat(detalle.total).toFixed(2)}`, // Otros precios (ajusta según sea necesario)
      ];
    });
    const table = {
      headers: [
        { label: "CANT.", width: 40, renderer: null },
        { label: "UM", width: 40, renderer: null },
        {
          label: "DESCRIPCION",
          width: 250,
          renderer: null,
        },
        {
          label: "V/U",
          width: 60,
          renderer: null,
          align: "right",
        },
        {
          label: "P/U",
          width: 60,
          renderer: null,
          align: "right",
        },
        {
          label: "IMPORTE",
          width: 60,
          renderer: null,
          align: "right",
        },
      ],
      rows: rows,
    };
    doc.moveDown();
    doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
      prepareRow: (row, indexColumn, indexRow, rectRow) =>
        doc.font("Helvetica").fontSize(10),
      x: 40,
      y: 270,
    }); // Espacio entre la etiqueta y el valor

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("GRAVADA:", 350, null, { continued: true }) // Ajusta el valor de X según necesites
      .font("Helvetica")
      .text("S/  " + parseFloat(invoice.gravada).toFixed(2), { align: "right" }) // Ajusta labelSpacing según sea necesario
      .moveDown() // Separar la siguiente línea
      .font("Helvetica-Bold")
      .text("IGV 18.00 %:", 350, null, { continued: true })
      .font("Helvetica")
      .text("S/  " + parseFloat(invoice.impuesto).toFixed(2), {
        align: "right",
      })
      .moveDown() // Separar la siguiente línea
      .font("Helvetica-Bold")
      .text("TOTAL:", 350, null, { continued: true })
      .font("Helvetica")
      .text("S/  " + parseFloat(invoice.total).toFixed(2), { align: "right" });
  }
  generateImporteLetras(doc, invoice) {
    doc.moveDown().moveDown().moveDown();
    doc
      .moveDown()
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("IMPORTE EN LETRAS: ", 40, null, { continued: true })
      .font("Helvetica")
      .text(
        numeroALetras(invoice.total, {
          plural: "SOLES",
          singular: "SOL",
          centPlural: "CENTIMOS",
          centSingular: "CENTIMO",
        })
      );
  }
  generateCuentaBancaria(doc) {
    doc
      .moveDown()
      .moveDown()
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("CUENTAS BANCARIAS: ", 40, null)
      .moveDown()
      .font("Helvetica")
      .text("INTERBANK CTA CTE (Soles): 488-3001952266")
      .text("CCI: 003-488-003001952266-40")
      .moveDown()
      .text("BBVA AHORROS (Soles): 0011-0135-0201300201")
      .text("CCI: 011-135-000201300201-15");
  }
  roundedRect(doc, x, y, width, height, radius) {
    doc
      .lineJoin("round")
      .strokeColor("#aaa")
      .moveTo(x + radius, y)
      .lineTo(x + width - radius, y)
      .quadraticCurveTo(x + width, y, x + width, y + radius)
      .lineTo(x + width, y + height - radius)
      .quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      .lineTo(x + radius, y + height)
      .quadraticCurveTo(x, y + height, x, y + height - radius)
      .lineTo(x, y + radius)
      .quadraticCurveTo(x, y, x + radius, y)
      .stroke();
  }
}
module.exports = new GeneratePDF();
