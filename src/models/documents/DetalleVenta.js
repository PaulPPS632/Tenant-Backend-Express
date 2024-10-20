const { Model, DataTypes } = require("sequelize");

class DetalleVenta extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        series: {
          type: DataTypes.JSON,
        },
        cantidad: {
          type: DataTypes.INTEGER,
        },
        precio_bruto: {
          //sin impuesto
          type: DataTypes.DOUBLE,
        },
        precio_neto: {
          //con impuesto
          type: DataTypes.DOUBLE,
        },
        impuesto: {
          //impuesto total
          type: DataTypes.DOUBLE,
        },
        gravada: {
          type: DataTypes.DOUBLE,
        },
        total: {
          type: DataTypes.DOUBLE,
        },
        tenantId: {
          type: DataTypes.UUID,
        },
      }, // attributes
      {
        sequelize,
        timestamps: false,
        tableName: "DetalleVenta",
      }
    );

    return this;
  }
  static associate(models) {
    // Relación hasMany hacia la tabla intermedia SeriesDetalle
    this.hasMany(models.SerieDetalle, {
      foreignKey: "DetalleVentaId",
      as: "seriesDetalles", // Alias para acceder a la relación
    });

    models.SerieDetalle.belongsTo(this, {
      foreignKey: "DetalleVentaId",
      as: "detalleVenta",
    });
  }
}

module.exports = DetalleVenta;
