const CompraRoutes = require("./Compra.routes.js");
const CorrelativoRoutes = require("./Correlativo.routes.js");
const CotizacionRoutes = require("./Cotizacion.routes.js");
const VentaRoutes = require("./Venta.routes.js");

const DocumentsRoutes = {
  CompraRoutes,
  CorrelativoRoutes,
  VentaRoutes,
  CotizacionRoutes,
};

module.exports = DocumentsRoutes;
