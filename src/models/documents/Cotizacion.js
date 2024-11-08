const { Model, DataTypes } = require("sequelize");

class Cotizacion extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        numeracion: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        documento: {
          type: DataTypes.STRING,
        },
        fecha_emision: {
          type: DataTypes.DATE,
        },
        fecha_vencimiento: {
          type: DataTypes.DATE,
        },
        nota: {
          type: DataTypes.STRING,
        },
        gravada: {
          type: DataTypes.DOUBLE,
        },
        impuesto: {
          type: DataTypes.DOUBLE,
        },
        total: {
          type: DataTypes.DOUBLE,
        },
        url_pdf: {
          type: DataTypes.STRING,
        },
        tenantId: {
          type: DataTypes.UUID,
        },
      }, // attributes
      {
        sequelize,
        timestamps: true,
        tableName: "Cotizacion",
      }
    );

    return this;
  }
  static associate(models) {
    this.hasMany(models.DetalleCotizacion, {
      foreignKey: "CotizacionId",
      sourceKey: "id",
      as: "detallecotizacion",
    });
    models.DetalleCotizacion.belongsTo(this, {
      foreignKey: "CotizacionId",
      targetKey: "id",
      as: "detallecotizacion",
    });
  }
}

module.exports = Cotizacion;
