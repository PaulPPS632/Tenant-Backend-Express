const { Router } = require("express");
const Authorization = require("../../middlewares/Authorization.js");
const VentaController = require("../../controllers/documents/VentaController.js");

const VentaRoutes = Router();

VentaRoutes.post("/", Authorization, VentaController.Register);

module.exports = VentaRoutes;
