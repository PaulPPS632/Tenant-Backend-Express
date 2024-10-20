const { Model, DataTypes } = require("sequelize");

class ProductoSerie extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        sn: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        tenantId: {
          type: DataTypes.UUID,
        },
      }, // attributes
      {
        sequelize,
        timestamps: false,
        tableName: "ProductoSerie",
      }
    );

    return this;
  }
  static associate(models) {
    this.hasMany(models.DetalleCompra, {
      foreignKey: "ProductoSerieId",
      sourceKey: "id",
    });
    models.DetalleCompra.belongsTo(this, {
      foreignKey: "ProductoSerieId",
      sourceKey: "id",
    });
    /*
    this.hasMany(models.DetalleVenta, {
      foreignKey: "ProductoSerieId",
      sourceKey: "id",
    });
    models.DetalleVenta.belongsTo(this, {
      foreignKey: "ProductoSerieId",
      sourceKey: "id",
    });
*/
    // Relación hasMany hacia la tabla intermedia SeriesDetalle
    this.hasMany(models.SerieDetalle, {
      foreignKey: "ProductoSerieId",
      as: "seriesDetalles", // Alias para acceder a la relación
    });

    models.SerieDetalle.belongsTo(this, {
      foreignKey: "ProductoSerieId",
      as: "productoSerie",
    });
  }
}

module.exports = ProductoSerie;
