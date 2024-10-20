const CategoriaMarca = require("../../models/inventory/CategoriaMarca.js");
const Marca = require("../../models/inventory/Marca.js");
class MarcaController {

  async GetAll(req, res) {
    try {
      const { tenantid } = req.headers;
      if (!tenantid) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      console.log("TENANTID: ", req.headers);
      const resp = await Marca.findAll({
        include: {
          model: CategoriaMarca,
        },
        where: { tenantId: tenantid },
      });
      return res.status(200).json(resp);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener las marcas", error });
    }
  }

  async GetAllPaged(req, res) {
    res.send("funciona");
  }

  async GetById(req, res) {
    try {
      const { id } = req.params;
      const marca = await Marca.findByPk(id, {
        include: {
          model: CategoriaMarca,
        },
      });
      if (!marca) {
        return res.status(404).json({ message: "Marca no encontrada" });
      }
      return res.status(200).json(marca);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener la marca", error });
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
        return res.status(400).json({ message: "Nombre de la marca es requerido" });
      }
  
      // Crear la nueva marca
      const nuevaMarca = await Marca.create({ nombre, descripcion, tenantId: tenantid });
  
      // Crear las subcategorías asociadas a la nueva marca
      if (subcategorias && subcategorias.length > 0) {
        const subcategoriasCreadas = await Promise.all(
          subcategorias.map(async (subcategoria) => {
            return await CategoriaMarca.create({
              nombre: subcategoria.nombre,
              descripcion: subcategoria.descripcion,
              tenantId: tenantid,
              MarcaId: nuevaMarca.id,
            });
          })
        );
        nuevaMarca.CategoriaMarcas = subcategoriasCreadas;
      } else {
        nuevaMarca.CategoriaMarcas = [];
      }
  
      return res.status(201).json(nuevaMarca);
    } catch (error) {
      return res.status(500).json({ message: "Error al crear la marca y subcategorías", error });
    }
  }
  

  async SavesAll(req, res) {
    try {
      const { marcas } = req.body;
      const nuevasMarcas = await Marca.bulkCreate(marcas);
      return res.status(201).json(nuevasMarcas);
    } catch (error) {
      return res.status(500).json({ message: "Error al crear las marcas", error });
    }
  }

  async Belongs(req, res) {
    try {
      const { id } = req.params;
      const categorias = await CategoriaMarca.findAll({
        where: { MarcaId: id },
      });
      return res.status(200).json(categorias);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener las categorías de la marca", error });
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
        return res.status(400).json({ message: "Nombre de la marca es requerido" });
      }
  
      const marca = await Marca.findByPk(id, {
        include: {
          model: CategoriaMarca,
        },
      });
      if (!marca) {
        return res.status(404).json({ message: "Marca no encontrada" });
      }
  
      // Actualizar la marca
      marca.nombre = nombre;
      marca.descripcion = descripcion;
      await marca.save();
  
      // Actualizar las subcategorías asociadas a la marca
      if (subcategorias && subcategorias.length > 0) {
        const subcategoriasExistentes = await CategoriaMarca.findAll({
          where: { MarcaId: id },
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
        marca.CategoriaMarcas = subcategoriasActualizadas.filter(subcategoria => subcategoria !== null);
      } else {
        marca.CategoriaMarcas = [];
      }
  
      return res.status(200).json(marca);
    } catch (error) {
      return res.status(500).json({ message: "Error al actualizar la marca y subcategorías", error });
    }
  }
  
  async Delete(req, res) {
    try {
      const { id } = req.params;
      const marca = await Marca.findByPk(id);
      if (!marca) {
        return res.status(404).json({ message: "Marca no encontrada" });
      }
      await marca.destroy();
      return res.status(200).json({ message: "Marca eliminada" });
    } catch (error) {
      return res.status(500).json({ message: "Error al eliminar la marca", error });
    }
  }

}

module.exports = new MarcaController();
