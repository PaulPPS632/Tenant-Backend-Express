const { Router } = require("express");
const CategoriaController = require("../../controllers/inventory/CategoriaController");

const CategoriaRouter = Router();

CategoriaRouter.get("", CategoriaController.GetAll);
CategoriaRouter.get("/paged", CategoriaController.GetAllPaged);
CategoriaRouter.get("/:id", CategoriaController.GetById);
CategoriaRouter.post("", CategoriaController.Save);
CategoriaRouter.post("/saves", CategoriaController.SavesAll);
CategoriaRouter.get("/subs/:id", CategoriaController.SubCategoriaBelongs);
CategoriaRouter.put("/:id", CategoriaController.Update);
CategoriaRouter.delete("/:id", CategoriaController.Delete);

module.exports = CategoriaRouter;
