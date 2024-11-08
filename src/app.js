const express = require("express");
const cors = require("cors");
const { Routes } = require("./routes/routes.js");
const path = require("path");
class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(cors());
    const uploadsDir = path.resolve(__dirname, "../public/uploads");
    const documentsDir = path.resolve(
      __dirname,
      "../public/documents/cotizaciones"
    );
    this.server.use("/api/uploads", express.static(uploadsDir));
    this.server.use("/api/cotizaciones", express.static(documentsDir));
  }

  routes() {
    //this.server.use(routes);
    //this.server.use("/api/auth", Routes.AuthRouter);
    //this.server.use("/api/cursos", Routes.CoursesRoutes);
    //this.server.use("/api/usuario", Routes.EntidadRoutes);
    //this.server.use("/api/categorias", Routes.CategoriasRoutes);
    //this.server.use("/api/payment", Routes.PaymentRoutes);
    this.server.use("/api/auth", Routes.AuthRouter);

    this.server.use("/api/inventory/entidad", Routes.UsersRouter.EntidadRouter);
    this.server.use(
      "/api/inventory/categoria",
      Routes.InventoryRouter.CategoriaRouter
    );
    this.server.use(
      "/api/inventory/categoriamarca",
      Routes.InventoryRouter.CategoriaMarcaRouter
    );
    this.server.use("/api/inventory/lote", Routes.InventoryRouter.LoteRouter);
    this.server.use("/api/inventory/marca", Routes.InventoryRouter.MarcaRouter);
    this.server.use(
      "/api/inventory/producto",
      Routes.InventoryRouter.ProductoRouter
    );
    this.server.use(
      "/api/inventory/compra",
      Routes.DocumentsRoutes.CompraRoutes
    );
    this.server.use("/api/inventory/venta", Routes.DocumentsRoutes.VentaRoutes);
    this.server.use(
      "/api/inventory/cotizacion",
      Routes.DocumentsRoutes.CotizacionRoutes
    );
    this.server.use(
      "/api/inventory/reportes",
      Routes.GlobalRoutes.ReportesRoutes
    );
    this.server.use(
      "/api/inventory/archivos",
      Routes.GlobalRoutes.ArchivoRoutes
    );
    this.server.use("/api/inventory/tipado", Routes.GlobalRoutes.TipadoRoutes);
    this.server.use("/api/payment", Routes.PaymentRoutes);
    this.server.use(
      "/api/inventory/pedidos",
      Routes.InventoryRouter.PedidoRoutes
    );
    this.server.use(
      "/api/inventory/productoserie",
      Routes.InventoryRouter.ProductoSerieRoutes
    );
  }
}
module.exports = new App().server;
