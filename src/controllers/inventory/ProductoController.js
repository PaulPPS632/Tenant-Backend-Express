const { Op } = require("sequelize");
const Database = require("../../databases/database.js");
const Producto = require("../../models/inventory/Producto.js");
const Categoria = require("../../models/inventory/Categoria.js");
const SubCategoria = require("../../models/inventory/SubCategoria.js");
const Marca = require("../../models/inventory/Marca.js");
const CategoriaMarca = require("../../models/inventory/CategoriaMarca.js");
const Archivo = require("../../models/global/Archivo.js");

class ProductoController {
  constructor() {}

  async getAll(req, res) {
    const { tenantid } = req.headers;
    console.log("tenantId: ", tenantid);
    const productos = await Producto.findAll({
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
      ],
      where: {
        tenantId: tenantid,
      },
    });
    const resp = productos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      pn: producto.pn,
      descripcion: producto.descripcion,
      stock: producto.stock,
      precio: producto.precio,
      CategoriaMarcaId: producto.CategoriaMarcaId,
      SubCategoriaId: producto.SubCategoriaId,
      MarcaId: producto.CategoriaMarca.Marca.id,
      CategoriaId: producto.SubCategorium.CategoriaId,

      marca: producto.CategoriaMarca.Marca.nombre,
      garantia_cliente: producto.garantia_cliente,
      garantia_total: producto.garantia_total,
    }));

    return res.status(200).json(resp);
  }
  
  async GetProductsFact(req, res) {
    const productos = await Producto.findAll({
      attributes: ["id", "nombre", "precio"],
    });
    return res.status(200).json(productos);
  }
  async getById(req, res) {
    const id = req.params.id;
    const producto = await Producto.findOne({
      where: { id },
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
  async GetCategoriaProducto(req, res) {
    const { limit } = req.query;
    const query = `CALL GetProductos(:limit)`;
    const results = await Database.connection.query(query, {
      replacements: { limit: limit }, // Pasar el parámetro al procedimiento
    });
    //const productosPorCategoria = {};
    const productosPorCategoria = {};
    results.forEach((row) => {
      const categoriaNombre = row.categoria_nombre;
      if (!productosPorCategoria[categoriaNombre]) {
        productosPorCategoria[categoriaNombre] = [];
      }

      const productoResponse = {
        id: row.id,
        nombre: row.nombre,
        pn: row.pn,
        descripcion: row.descripcion,
        stock: row.stock,
        precio: row.precio,
        subcategoria_nombre: row.subcategoria_nombre,
        garantia_cliente: row.garantia_cliente,
        garantia_total: row.garantia_total,
        categoria_nombre: row.categoria_nombre,
        imagen_principal: row.archivo_principal_url,
        imageurl: row.archivos_urls ? row.archivos_urls.split(",") : [],
      };

      productosPorCategoria[categoriaNombre].push(productoResponse);
    });
    return res.status(200).json(productosPorCategoria);
  }
  async GetPaged(req, res) {
    const { search, marca, categoria, subcategoria, page, size, sort } =
      req.query;
    try {
      const limit = size ? parseInt(size) : 10; // Si no hay size, se usa 10 como valor por defecto
      const offset = page ? parseInt(page) * limit : 0; // Si no hay page, empieza desde la primera página

      const { count: totalItems, rows: productos } =
        await Producto.findAndCountAll({
          where: {
            nombre: {
              [Op.like]: `%${search}%`,
            },
          },
          include: [
            {
              model: SubCategoria,
              required: true,
              foreignKey: "SubCategoriaId",
              ...(subcategoria?.length > 0 && {
                where: {
                  nombre: { [Op.in]: subcategoria.split(",") }, // Solo aplica si hay subcategorías
                },
              }),
              include: {
                model: Categoria,
                required: true,
                foreignKey: "CategoriaId",
                ...(categoria?.length > 0 && {
                  where: {
                    nombre: { [Op.in]: categoria.split(",") }, // Solo aplica si hay categorías
                  },
                }),
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
                ...(marca?.length > 0 && {
                  where: {
                    nombre: { [Op.in]: marca.split(",") }, // Solo aplica si hay marcas
                  },
                }),
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
          limit: limit,
          offset: offset,
          ...(sort && { order: [["precio", sort]] }),
        });
      //const totalPages = Math.ceil(totalItems / limit);

      const resp = productos.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        pn: producto.pn,
        descripcion: producto.descripcion,
        stock: producto.stock,
        precio: producto.precio,
        marca: producto.CategoriaMarca.Marca.nombre,
        categoriamarca: producto.CategoriaMarca.nombre,
        categoria: producto.SubCategorium.Categorium.nombre,
        subcategoria: producto.SubCategorium.nombre,
        garantia_cliente: producto.garantia_cliente,
        garantia_total: producto.garantia_total,
        imagen_principal: producto.ArchivoPrincipal
          ? producto.ArchivoPrincipal.url
          : "",
        imageurl: producto.ArchivosRelacionados
          ? producto.ArchivosRelacionados.map((img) => img.url)
          : [], // array de URLs
      }));

      // Resultado paginado
      return res.status(200).json(resp);
    } catch (error) {
      console.error("Error al obtener productos con paginación:", error);
      throw error;
    }

    //return res.status(200).json(resp);
  }
  
  async Create(req, res) {
    // Llamar a multer para procesar la subida de archivos
    const {
      id,
      nombre,
      pn,
      descripcion,
      stock,
      precio,
      MarcaId,
      CategoriaMarcaId,
      SubCategoriaId,
      CategoriaId,
      garantia_cliente,
      garantia_total,
      cantidad,
      imagen_principal,
      imageurl,
    } = JSON.parse(req.body.producto);
    if (req.files) {
      const filename = req.files.fileprincipal[0].filename.replace(/\s+/g, "");
      const prefijo = `https://${process.env.DB_HOST}/api/uploads`;
      const Archivo_principal = await Archivo.create({
        url: `${prefijo}/${filename}`,
        nombre,
        tipo_Archivo: "imagen_producto",
        ubicacion: req.files.fileprincipal[0].destination,
      });
      const producto = await Producto.create({
        nombre,
        pn,
        descripcion,
        stock,
        precio,
        CategoriaMarcaId,
        SubCategoriaId,
        garantia_cliente,
        garantia_total,
        cantidad,
        ArchivoPrincipalId: Archivo_principal.id,
      });
      const archivosSecundarios = await Promise.all(
        req.files.files.map(async (file) => {
          return await Archivo.create({
            url: `${prefijo}/${file.filename.replace(/\s+/g, "")}`,
            nombre,
            tipo_Archivo: "imagen_producto",
            ubicacion: file.destination,
          });
        })
      );
      await producto.addArchivosRelacionados(archivosSecundarios);
      return res
        .status(200)
        .json({ message: "Producto Registrado Exitosamente" });
    } else {
      const producto = await Producto.create({
        nombre,
        pn,
        descripcion,
        stock,
        precio,
        CategoriaMarcaId,
        SubCategoriaId,
        garantia_cliente,
        garantia_total,
        cantidad,
      });
      return res
        .status(200)
        .json({ message: "Producto Registrado Exitosamente" });
    }
  }

  async Update(req, res) {
    const {
      id,
      nombre,
      pn,
      descripcion,
      stock,
      precio,
      MarcaId,
      CategoriaMarcaId,
      SubCategoriaId,
      CategoriaId,
      garantia_cliente,
      garantia_total,
      cantidad,
      imagen_principal,
      imageurl,
    } = JSON.parse(req.body.producto);
    const product = await Producto.findOne({
      where: { id },
      include: [
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
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    const eliminadas = product.ArchivosRelacionados.map((img) => {
      if (!imageurl.includes(img.url)) {
        return img.url;
      }
    }).filter(Boolean);

    if (eliminadas.length > 0) {
      // Buscar los archivos a eliminar por sus URLs
      const archivosEliminados = await Archivo.findAll({
        where: { url: eliminadas },
      });

      // Eliminar la relación con el producto
      await product.removeArchivosRelacionados(archivosEliminados);

      // Eliminar los archivos de la tabla Archivo
      await Archivo.destroy({ where: { url: eliminadas } });
    }
    if (imagen_principal === "" && product.ArchivoPrincipal) {
      await Archivo.destroy({ where: { id: product.ArchivoPrincipal.url } });
      await product.update({ ArchivoPrincipalId: null });
    }
    const prefijo = `https://${process.env.DB_HOST}/api/uploads`;
    if (req.files) {
      let Archivo_principal;
      if (req.files.fileprincipal) {
        const filename = req.files.fileprincipal[0].filename.replace(
          /\s+/g,
          ""
        );
        Archivo_principal = await Archivo.create({
          url: `${prefijo}/${filename}`,
          nombre,
          tipo_Archivo: "imagen_producto",
          ubicacion: req.files.fileprincipal[0].destination,
        });
      }
      // Actualizar el producto, con o sin nuevo archivo principal
      const producto = await Producto.update(
        {
          nombre,
          pn,
          descripcion,
          stock,
          precio,
          CategoriaMarcaId,
          SubCategoriaId,
          garantia_cliente,
          garantia_total,
          cantidad,
          ArchivoPrincipalId: Archivo_principal
            ? Archivo_principal.id
            : product.ArchivoPrincipalId, // Mantener el id actual si no se cambia
        },
        { where: { id } }
      );
      //---------------------------------------
      if (req.files.files) {
        const archivosSecundarios = await Promise.all(
          req.files.files.map(async (file) => {
            return await Archivo.create({
              url: `${prefijo}/${file.filename.replace(/\s+/g, "")}`,
              nombre,
              tipo_Archivo: "imagen_producto",
              ubicacion: file.destination,
            });
          })
        );
        await product.addArchivosRelacionados(archivosSecundarios);
      }
      return res
        .status(200)
        .json({ message: "Producto Registrado Exitosamente" });
    }
  }
}

module.exports = new ProductoController();
