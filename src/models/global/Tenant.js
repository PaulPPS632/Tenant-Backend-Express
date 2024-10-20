const { Model, DataTypes } = require("sequelize");

class Tenant extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING,
        },
        tiponegocio: {
          type: DataTypes.STRING,
        },
        ruc: {
          type: DataTypes.STRING,
        },
        clavesol: {
          type: DataTypes.STRING,
        },
        paleta: {
          type: DataTypes.STRING,
        },
        adicionales: {
          type: DataTypes.JSON,
        },
        ubigeo: {
          type: DataTypes.STRING,
        },
        claveCertificado: {
          type: DataTypes.STRING,
        },
      }, // attributes
      {
        sequelize,
        timestamps: false,
        tableName: "Tenant",
      }
    );

    return this;
  }
  static associate(models) {
    //realacion uno a muchos con producto, la foreign key en la tabla Producto es ArchivoPrincipalId
  }
}

module.exports = Tenant;
