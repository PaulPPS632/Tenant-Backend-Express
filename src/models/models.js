const Correlativo = require("./correlative/Correlativo.js");
const NumeracionComprobante = require("./correlative/NumeracionComprobante.js");
const TipoComprobante = require("./correlative/TipoComprobante.js");

const Compra = require("./documents/Compra.js");
const DetalleCompra = require("./documents/DetalleCompra.js");
const Venta = require("./documents/Venta.js");
const DetalleVenta = require("./documents/DetalleVenta.js");

const Archivo = require("./global/Archivo.js");
const Tenant = require("./global/Tenant.js");
const TipoCondicion = require("./global/TipoCondicion.js");
const TipoMoneda = require("./global/TipoMoneda.js");
const TipoPago = require("./global/TipoPago.js");

const Entidad = require("./users/Entidad.js");
const TipoEntidad = require("./users/TipoEntidad.js");
const Rol = require("./users/Rol.js");
const Privilegio = require("./users/Privilegio.js");

const Categoria = require("./inventory/Categoria.js");
const CategoriaMarca = require("./inventory/CategoriaMarca.js");
const EstadoProducto = require("./inventory/EstadoProducto.js");
const Marca = require("./inventory/Marca.js");
const Pedidos = require("./inventory/Pedidos.js");
const Producto = require("./inventory/Producto.js");
const ProductoSerie = require("./inventory/ProductoSerie.js");
const SubCategoria = require("./inventory/SubCategoria.js");
const SerieDetalle = require("./documents/SerieDetalle.js");

const models = {
  Correlativo,
  NumeracionComprobante,
  TipoComprobante,
  SerieDetalle,
  Compra,
  DetalleCompra,
  Venta,
  DetalleVenta,
  Tenant,
  Archivo,
  Entidad,
  TipoCondicion,
  TipoEntidad,
  TipoMoneda,
  TipoPago,
  Categoria,
  CategoriaMarca,
  EstadoProducto,
  Marca,
  Pedidos,
  Producto,
  ProductoSerie,
  SubCategoria,
  Rol,
  Privilegio,
};

/*
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});*/

module.exports = { models };
