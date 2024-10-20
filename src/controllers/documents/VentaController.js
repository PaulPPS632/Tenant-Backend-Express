const Venta = require("../../models/documents/Venta.js");
const Producto = require("../../models/inventory/Producto.js");
const { Op, Sequelize } = require("sequelize");
const ProductoSerie = require("../../models/inventory/ProductoSerie.js");
const DetalleVenta = require("../../models/documents/DetalleVenta.js");
const Sunat = require("../../services/Sunat.js");
const SerieDetalle = require("../../models/documents/SerieDetalle.js");

class VentaController {
  async Register(req, res) {
    const {
      usuario_id,
      documento,
      documento_cliente,
      fecha_emision,
      fecha_vencimiento,
      fechapago,
      formapago,
      id_tipocondicion,
      id_tipomoneda,
      id_tipopago,
      tipo_cambio,
      nota,
      impuesto,
      gravada,
      total,
      detalles,
    } = req.body;
    const { tenantid } = req.headers;
    console.log("TENANTID :", tenantid);
    if (documento_cliente == null || documento_cliente == "")
      return res.status(400).json({ message: "El cliente es requerido" });
    if (detalles.length === 0)
      return res.status(400).json({ message: "No hay productos en la venta" });
    try {
      const CompraRegist = await Venta.create({
        EntidadNegocioId: usuario_id,
        documento,
        EntidadId: documento_cliente,
        fecha_emision: new Date(fecha_emision),
        fecha_vencimiento: new Date(fecha_vencimiento),
        fechapago: new Date(fechapago),
        formapago,
        TipoCondicionId: id_tipocondicion,
        TipoMonedaId: id_tipomoneda,
        TipoPagoId: id_tipopago,
        tipo_cambio,
        nota,
        impuesto,
        gravada,
        total,
        tenantId: tenantid,
      });
      console.log("DETALLES: ", detalles);
      const productosIds = detalles.map((detalle) => detalle.id_producto);
      const productos = await Producto.findAll({
        where: {
          id: {
            [Op.in]: productosIds,
          },
        },
      });
      await Promise.all(
        detalles.map(async (detalle) => {
          const producto = productos.find((p) => p.id === detalle.id_producto);
          if (producto) {
            await Promise.all(
              detalle.series.map(async (serie) => {
                const producto_serie = await ProductoSerie.update(
                  {
                    EstadoProductoId: 2, // Datos a actualizar
                  },
                  {
                    where: {
                      sn: serie, // Condición
                    },
                  }
                );
                const serieActualizada = await ProductoSerie.findOne({
                  where: { sn: serie },
                });
                await DetalleVenta.create({
                  VentaId: CompraRegist.id,
                  cantidad: detalle.cantidad,
                  ProductoSerieId: serieActualizada.id,
                  sn: serie,
                  precio_neto: detalle.precio_unitario,
                  tenantId: tenantid,
                });
              })
            );
          }
        })
      );
      for (const producto of productos) {
        // Encontrar el detalle correspondiente por ID
        const detalle = detalles.find((d) => d.id_producto === producto.id);

        // Aumentar el stock del producto
        producto.stock -= detalle.cantidad;

        // Guardar el producto actualizado
        await producto.save();
      }
      return res.json({ message: "Venta Registrada Exitosamente" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al registrar la compra", error });
    }
  }
  async register3(req, res) {
    const {
      usuario_id,
      documento,
      documento_cliente,
      fecha_emision,
      fecha_vencimiento,
      fechapago,
      formapago,
      id_tipocondicion,
      id_tipomoneda,
      id_tipopago,
      tipo_cambio,
      nota,
      impuesto,
      gravada,
      total,
      detalles,
    } = req.body;
    const { tenantid } = req.headers;
    console.log("TENANTID :", tenantid);
    if (documento_cliente == null || documento_cliente == "")
      return res.status(400).json({ message: "El cliente es requerido" });
    if (detalles.length === 0)
      return res.status(400).json({ message: "No hay productos en la venta" });
    try {
      const CompraRegist = await Venta.create({
        EntidadNegocioId: usuario_id,
        documento,
        EntidadId: documento_cliente,
        fecha_emision: new Date(fecha_emision),
        fecha_vencimiento: new Date(fecha_vencimiento),
        fechapago: new Date(fechapago),
        formapago,
        TipoCondicionId: id_tipocondicion,
        TipoMonedaId: id_tipomoneda,
        TipoPagoId: id_tipopago,
        tipo_cambio: Math.round(tipo_cambio * 100) / 100,
        nota,
        impuesto: Math.round(impuesto * 100) / 100,
        gravada: Math.round(gravada * 100) / 100,
        total: Math.round(total * 100) / 100,
        tenantId: tenantid,
      });
      console.log("DETALLES: ", detalles);

      await Promise.all(
        detalles.map(async (detalle) => {
          const detalleVenta = await DetalleVenta.create({
            VentaId: CompraRegist.id,
            series: detalle.series, // Guardar el array de series aquí
            precio_bruto:
              Math.round((detalle.precio_unitario / 1.18) * 100) / 100,
            precio_neto: Math.round(detalle.precio_unitario * 100) / 100,
            impuesto: Math.round(detalle.precio_total * 18) / 100,
            gravada: Math.round((detalle.precio_total / 1.18) * 100) / 100,
            total: Math.round(detalle.precio_total * 100) / 100,
            tenantId: tenantid,
            cantidad: detalle.cantidad,
          });

          await Promise.all(
            detalle.series.map(async (serie) => {
              await ProductoSerie.update(
                {
                  EstadoProductoId: 2, // Datos a actualizar
                },
                {
                  where: {
                    sn: serie, // Condición
                  },
                }
              );
              const serieActualizada = await ProductoSerie.findOne({
                where: { sn: serie },
              });
              await SerieDetalle.create({
                DetalleVentaId: detalleVenta.id,
                ProductoSerieId: serieActualizada.id, // Estado de producto actualizado
                tenantId: tenantid,
              });
            })
          );
          await Producto.update(
            { stock: Sequelize.literal(`stock - ${detalle.cantidad}`) }, // Restar la cantidad vendida del stock
            { where: { id: detalle.id_producto } }
          );
        })
      );
      return res.json({ message: "Venta Registrada Exitosamente" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al registrar la compra", error });
    }
  }

  async Register2(req, res) {
    const { ventaId, tenantId } = req.body;
    const sunat = new Sunat();
    await sunat.loadVenta(ventaId, tenantId); // Carga la venta
    const response = await sunat.proceso();
    return res.status(200).json({
      venta: sunat.getVenta(),
      tenant: sunat.getTenant(),
      respuestaSunat: response,
    });
    //   // Ejecuta el proceso de envío
  }
}

module.exports = new VentaController();
