const ProductoSerie = require("../../models/inventory/ProductoSerie.js");
const Producto = require("../../models/inventory/Producto.js");
const SubCategoria = require("../../models/inventory/SubCategoria.js");
const CategoriaMarca = require("../../models/inventory/CategoriaMarca.js");
const Marca = require("../../models/inventory/Marca.js");
const Archivo = require("../../models/global/Archivo.js");
const Categoria = require("../../models/inventory/Categoria.js");

class ProductoSerieController {
  async getSeriesByProductoId(req, res) {
    const { id } = req.params;
    const { tenantid } = req.headers;
    console.log("tenantID: ", tenantid);
    const series = await ProductoSerie.findAll({
      where: {
        ProductoId: id,
        EstadoProductoId: 1,
        tenantId: tenantid,
      },
      attributes: ["sn"],
    });
    console.log(series);
    return res.json(series);
  }
  async getBelong(req, res) {
    const { sn } = req.params;
    const productoSerie = await ProductoSerie.findOne({
      where: {
        sn: sn,
      },
    });
    const producto = await Producto.findOne({
      where: { id: productoSerie.ProductoId },
      include: [
        {
          model: SubCategoria,
          required: true,
          foreignKey: "SubCategoriaId",
          include: {
            model: Categoria,
            required: true,
            foreignKey: "CategoriaId",
          },
        },

        {
          model: CategoriaMarca,
          required: true,
          foreignKey: "CategoriaMarcaId",
          include: {
            model: Marca,
            required: true,
            foreignKey: "MarcaId",
          },
        },
        {
          model: Archivo,
          as: "ArchivoPrincipal", // alias para el campo en el resultado JSON
          required: true,
          foreignKey: "ArchivoPrincipalId",
          attributes: ["url"],
        },
        {
          model: Archivo, // Incluir archivos relacionados (muchos a muchos)
          as: "ArchivosRelacionados",
          through: { attributes: [] }, // Omitir los atributos intermedios de la tabla "producto_archivo"
          attributes: ["url"], // Traer solo la url
        },
      ],
    });
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    const productoResponse = {
      id: producto.id,
      nombre: producto.nombre,
      pn: producto.pn,
      descripcion: producto.descripcion,
      stock: producto.stock,
      precio: producto.precio,
      subcategoria_nombre: producto.subcategoria_nombre,
      garantia_cliente: producto.garantia_cliente,
      garantia_total: producto.garantia_total,
      categoria_nombre: producto.categoria_nombre,
      imagen_principal: producto.ArchivoPrincipal.url,
      imageurl: producto.ArchivosRelacionados
        ? producto.ArchivosRelacionados.map((archivo) => archivo.url)
        : [],
    };
    return res.status(200).json(productoResponse);
  }
}

module.exports = new ProductoSerieController();
