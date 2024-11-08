const { Model, DataTypes } = require("sequelize");

class DetalleCotizacion extends Model {
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
        nombre: {
          type: DataTypes.STRING,
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
        tableName: "DetalleCotizacion",
      }
    );

    return this;
  }
  static associate(models) {
    // Relación hasMany hacia la tabla intermedia SeriesDetalle
    this.hasMany(models.SerieDetalleCotizacion, {
      foreignKey: "DetalleCotizacionId",
      as: "seriesDetalles", // Alias para acceder a la relación
    });

    models.SerieDetalleCotizacion.belongsTo(this, {
      foreignKey: "DetalleCotizacionId",
      as: "detalleCotizacion",
    });
  }
}

module.exports = DetalleCotizacion;
