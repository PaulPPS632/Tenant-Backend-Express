const InventoryRouter = require("./inventory/InventoryRoutes.js");
const GlobalRoutes = require("./global/GlobalRoutes.js");
const UsersRouter = require("./users/UsersRoutes.js");
const PaymentRoutes = require("./auth/Payment.routes.js");
const AuthRouter = require("./auth/Auth.routes.js");
const DocumentsRoutes = require("./documents/DocumentsRoutes.js");
const EntidadRouter = require("./users/Entidad.routes.js");
const LoteRouter = require("./inventory/Lote.routes.js");
const MarcaRouter = require("./inventory/Marca.routes.js");
const ProductoRouter = require("./inventory/Producto.routes.js");
const CategoriaRouter = require("./inventory/Categoria.routes.js");
const CategoriaMarcaRouter = require("./inventory/CategoriaMarca.routes.js");
const PedidoRoutes = require("./inventory/Pedido.routes.js");
const ProductoSerieRoutes = require("./inventory/ProductoSerie.routes.js");
const ArchivoRoutes = require("./global/Archivo.routes.js");
const TipadoRoutes = require("./global/Tipado.routes.js");
const ReportesRoutes = require("./global/Reportes.routes.js");

exports.Routes = {
  InventoryRouter: {
    LoteRouter,
    MarcaRouter,
    ProductoRouter,
    CategoriaRouter,
    CategoriaMarcaRouter,
    PedidoRoutes,
    ProductoSerieRoutes,
  },
  GlobalRoutes: {
    ArchivoRoutes,
    TipadoRoutes,
    ReportesRoutes,
  },
  UsersRouter: {
    EntidadRouter,
  },
  PaymentRoutes,
  AuthRouter,
  DocumentsRoutes,
};
