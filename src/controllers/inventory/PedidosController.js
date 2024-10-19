const Pedidos = require("../../models/inventory/Pedidos.js");

class PedidosController {
  async register(req, res) {
    try {
      const { userId, productos, datospago, estado } = req.body;
      const nuevoPedido = await Pedidos.create({
        fecha: new Date(),
        productos,
        datospago,
        estado,
        EntidadId: userId,
      });
      return res.status(201).json(nuevoPedido);
    } catch (error) {
      return res.status(500).json({ message: "Error al registrar el pedido", error });
    }
  }

  async getPedidos(req, res) {
    try {
      const { tenantid } = req.headers;
      if (!tenantid) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      console.log("TENANTID: ", req.headers);
      const { userId } = req;
      const pedidos = await Pedidos.findAll({
        where: {
          EntidadId: userId,
          tenantId: tenantid,
        },
      });
      return res.status(200).json(pedidos);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener los pedidos", error });
    }
  }
}

module.exports = new PedidosController();
