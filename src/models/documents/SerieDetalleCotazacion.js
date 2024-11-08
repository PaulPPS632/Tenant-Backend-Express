const { Model, DataTypes } = require("sequelize");

class SerieDetalleCotizacion extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        DetalleVentaId: {
          type: DataTypes.UUID,
          references: {
            model: "DetalleCotizacion", // Nombre de la tabla
            key: "id",
          },
        },
        ProductoSerieId: {
          type: DataTypes.UUID,
          references: {
            model: "ProductoSerie", // Nombre de la tabla
            key: "id",
          },
        },
        tenantId: {
          type: DataTypes.UUID,
        },
      },
      {
        sequelize,
        timestamps: false,
        tableName: "SeriesDetalleCotizacion",
      }
    );

    return this;
  }
}

module.exports = SerieDetalleCotizacion;
