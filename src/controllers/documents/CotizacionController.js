const DetalleCotizacion = require("../../models/documents/DetalleCotizacion");
const Cotizacion = require("../../models/documents/Cotizacion");
const pdf = require("../../services/GeneratePDF");
const GeneratePDF = require("../../services/GeneratePDF");
const Entidad = require("../../models/users/Entidad");
class CotizacionController {
  async register(req, res) {
    const {
      cliente,
      usuario_id,
      fecha_emision,
      fecha_vencimiento,
      nota,
      gravada,
      impuesto,
      total,
      detalles,
    } = req.body;
    const { tenantid } = req.headers;
    if (tenantid === null || tenantid === undefined)
      return res.status(400).json({ message: "El tenantid es requerido" });
    if (!cliente)
      return res.status(400).json({ message: "El cliente es requerido" });
    if (detalles.length === 0)
      return res.status(400).json({ message: "No hay productos en la venta" });
    try {
      const gravadaRound = Math.round(gravada * 100) / 100;
      const impuestoRound = Math.round(impuesto * 100) / 100;
      const totalRound = Math.round(total * 100) / 100;
      const regist = await Cotizacion.create({
        EntidadId: cliente.id,
        EntidadNegocioId: usuario_id,
        fecha_emision: new Date(fecha_emision),
        fecha_vencimiento: new Date(fecha_vencimiento),
        nota,
        gravada: gravadaRound,
        impuesto: impuestoRound,
        total: totalRound,
        tenantId: tenantid,
      });
      const datos = {
        id: regist.id,
        cliente,
        fecha_emision,
        fecha_vencimiento,
        nota,
        gravada: gravadaRound,
        impuesto: impuestoRound,
        total: totalRound,
        detalles: [],
      };
      await Promise.all(
        detalles.map(async (detalle) => {
          const precio_bruto =
            Math.round((detalle.precio_unitario / 1.18) * 100) / 100;
          const precio_neto = Math.round(detalle.precio_unitario * 100) / 100;
          const total = Math.round(detalle.precio_total * 100) / 100;
          datos.detalles.push({
            cantidad: detalle.cantidad,
            nombre: detalle.nombre,
            precio_bruto,
            precio_neto,
            total,
          });
          const detallecotizacion = await DetalleCotizacion.create({
            CotizacionId: regist.id,
            series: detalle.series, // Guardar el array de series aquí
            precio_bruto,
            precio_neto,
            nombre: detalle.nombre,
            impuesto: Math.round(detalle.precio_total * 18) / 100,
            gravada: Math.round((detalle.precio_total / 1.18) * 100) / 100,
            total,
            cantidad: detalle.cantidad,
          });
        })
      );
      const ruta = GeneratePDF.createPdf(datos);
      await Cotizacion.update(
        { url_pdf: ruta }, // Actualizar el campo url_pdf
        { where: { id: regist.id } } // Filtrar por el id de la cotización recién creada
      );

      res.status(200).json({
        message: "Cotizacion Registrada Exitosamente",
        ruta: ruta,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
    return res.json();
  }
  async register2(req, res) {
    const {
      cliente,
      usuario_id,
      fecha_emision,
      fecha_vencimiento,
      nota,
      gravada,
      impuesto,
      total,
      detalles,
    } = req.body;
    const { tenantid } = req.headers;

    if (!tenantid)
      return res.status(400).json({ message: "El tenantid es requerido" });
    if (!cliente)
      return res.status(400).json({ message: "El cliente es requerido" });
    if (detalles.length === 0)
      return res.status(400).json({ message: "No hay productos en la venta" });

    try {
      // Obtener el último valor de numeración para el tenant
      const lastCotizacion = await Cotizacion.findOne({
        where: { tenantId: tenantid },
        order: [["numeracion", "DESC"]],
      });

      // Calcular la siguiente numeración
      const nextNumeracion = lastCotizacion ? lastCotizacion.numeracion + 1 : 1;

      // Redondear valores
      const gravadaRound = Math.round(gravada * 100) / 100;
      const impuestoRound = Math.round(impuesto * 100) / 100;
      const totalRound = Math.round(total * 100) / 100;

      // Crear la cotización con el valor de numeración
      const regist = await Cotizacion.create({
        EntidadId: cliente.id,
        EntidadNegocioId: usuario_id,
        fecha_emision: new Date(fecha_emision),
        fecha_vencimiento: new Date(fecha_vencimiento),
        nota,
        gravada: gravadaRound,
        impuesto: impuestoRound,
        total: totalRound,
        tenantId: tenantid,
        numeracion: nextNumeracion,
      });

      const datos = {
        id: regist.id,
        cliente,
        fecha_emision,
        fecha_vencimiento,
        nota,
        gravada: gravadaRound,
        impuesto: impuestoRound,
        total: totalRound,
        detalles: [],
      };

      await Promise.all(
        detalles.map(async (detalle) => {
          const precio_bruto =
            Math.round((detalle.precio_unitario / 1.18) * 100) / 100;
          const precio_neto = Math.round(detalle.precio_unitario * 100) / 100;
          const total = Math.round(detalle.precio_total * 100) / 100;
          datos.detalles.push({
            cantidad: detalle.cantidad,
            nombre: detalle.nombre,
            precio_bruto,
            precio_neto,
            total,
          });
          await DetalleCotizacion.create({
            CotizacionId: regist.id,
            series: detalle.series,
            precio_bruto,
            precio_neto,
            nombre: detalle.nombre,
            impuesto: Math.round(detalle.precio_total * 18) / 100,
            gravada: Math.round((detalle.precio_total / 1.18) * 100) / 100,
            total,
            cantidad: detalle.cantidad,
            tenantId: tenantid,
          });
        })
      );

      // Generar el PDF y actualizar la URL en la cotización
      const ruta = GeneratePDF.createPdf(datos);
      await Cotizacion.update({ url_pdf: ruta }, { where: { id: regist.id } });

      res.status(200).json({
        message: "Cotización registrada exitosamente",
        ruta: ruta,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async getPaged(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;
    const offset = (page - 1) * size; // Calcular el offset (cuántos registros saltar)
    const limit = size; // Número de registros por página
    const { tenantid } = req.headers;
    console.log("TENANTID :", tenantid);
    // Realiza la consulta con paginación
    const { rows: cotizaciones, count: total } =
      await Cotizacion.findAndCountAll({
        include: [
          {
            model: Entidad,
            required: true,
            as: "entidadNegocioCotizacion",
          },
        ],
        where: { tenantId: tenantid },
        limit,
        offset,
        order: [["createdAt", "DESC"]], // Ordenar por la columna correcta
      });

    // Devuelve los resultados paginados y el total de registros
    res.status(200).json({
      cotizaciones,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit), // Calcular el total de páginas
    });
  }
  async getById(req, res) {
    const { id } = req.params;
    const { tenantid } = req.headers;
    try {
      const cotizacion = await Cotizacion.findOne({
        where: {
          id,
          tenantId: tenantid,
        },
      });
      if (!cotizacion) {
        // Solo envía una respuesta si la cotización no se encuentra
        return res.status(404).json({ message: "Cotizacion no encontrada" });
      }
      res.status(200).json(cotizacion);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new CotizacionController();
