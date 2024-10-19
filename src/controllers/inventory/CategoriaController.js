const Categoria = require("../../models/inventory/Categoria.js");
const SubCategoria = require("../../models/inventory/SubCategoria.js");
class CategoriaController {
  async GetAll(req, res) {
    try {
      const { tenantid } = req.headers;
      if (!tenantid) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      const categorias = await Categoria.findAll({
        include: {
          model: SubCategoria,
        },
        where: { tenantId: tenantid },
      });
      const categoriasModificadas = categorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        subcategorias: categoria.SubCategoria,
      }));
      return res.status(200).json(categoriasModificadas);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener las categorías", error });
    }
  }

  async GetAllPaged(req, res) {
    res.send("funciona");
  }

  async GetById(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findByPk(id, {
        include: {
          model: SubCategoria,
        },
      });
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      return res.status(200).json(categoria);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener la categoría", error });
    }
  }
  
  async Save(req, res) {
    try {
      const { nombre, descripcion, subcategorias } = req.body;
      const { tenantid } = req.headers;
      if (!tenantid) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ message: "Nombre de la categoría es requerido" });
      }
  
      // Crear la nueva categoría
      const nuevaCategoria = await Categoria.create({ nombre, descripcion, tenantId: tenantid });
  
      // Crear las subcategorías asociadas a la nueva categoría
      if (subcategorias && subcategorias.length > 0) {
        const subcategoriasCreadas = await Promise.all(
          subcategorias.map(async (subcategoria) => {
            return await SubCategoria.create({
              nombre: subcategoria.nombre,
              descripcion: subcategoria.descripcion,
              tenantId: tenantid,
              CategoriaId: nuevaCategoria.id,
            });
          })
        );
        nuevaCategoria.subcategorias = subcategoriasCreadas;
      } else {
        nuevaCategoria.subcategorias = [];
      }
  
      return res.status(201).json(nuevaCategoria);
    } catch (error) {
      return res.status(500).json({ message: "Error al crear la categoría y subcategorías", error });
    }
  }  

  async SavesAll(req, res) {
    try {
      const { categorias } = req.body;
      const nuevasCategorias = await Categoria.bulkCreate(categorias);
      return res.status(201).json(nuevasCategorias);
    } catch (error) {
      return res.status(500).json({ message: "Error al crear las categorías", error });
    }
  }

  async SubCategoriaBelongs(req, res) {
    try {
      const { id } = req.params;
      const subcategorias = await SubCategoria.findAll({
        where: { CategoriaId: id },
      });
      return res.status(200).json(subcategorias);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener las subcategorías", error });
    }
  }

  async Update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, subcategorias } = req.body;
      const { tenantid } = req.headers;
      if (!tenantid) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ message: "Nombre de la categoría es requerido" });
      }

      const categoria = await Categoria.findByPk(id, {
        include: {
          model: SubCategoria,
        },
      });
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }

      // Actualizar la categoría
      categoria.nombre = nombre;
      categoria.descripcion = descripcion;
      await categoria.save();

      // Actualizar las subcategorías asociadas a la categoría
      if (subcategorias && subcategorias.length > 0) {
        const subcategoriasExistentes = await SubCategoria.findAll({
          where: { CategoriaId: id },
        });

        // Crear un mapa de subcategorías existentes por ID
        const subcategoriasExistentesMap = subcategoriasExistentes.reduce((map, subcategoria) => {
          map[subcategoria.id] = subcategoria;
          return map;
        }, {});

        const subcategoriasActualizadas = await Promise.all(
          subcategorias.map(async (subcategoria) => {
            if (subcategoria.id && subcategoriasExistentesMap[subcategoria.id]) {
              // Actualizar subcategoría existente
              const subcategoriaExistente = subcategoriasExistentesMap[subcategoria.id];
              subcategoriaExistente.nombre = subcategoria.nombre;
              subcategoriaExistente.descripcion = subcategoria.descripcion;
              await subcategoriaExistente.save();
              return subcategoriaExistente;
            } else {
              // Ignorar subcategorías sin ID
              return null;
            }
          })
        );

        // Filtrar subcategorías actualizadas válidas
        categoria.subcategorias = subcategoriasActualizadas.filter(subcategoria => subcategoria !== null);
      } else {
        categoria.subcategorias = [];
      }

      return res.status(200).json(categoria);
    } catch (error) {
      return res.status(500).json({ message: "Error al actualizar la categoría y subcategorías", error });
    }
  }

  async Delete(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      await categoria.destroy();
      return res.status(200).json({ message: "Categoría eliminada" });
    } catch (error) {
      return res.status(500).json({ message: "Error al eliminar la categoría", error });
    }
  }

}
module.exports = new CategoriaController();
