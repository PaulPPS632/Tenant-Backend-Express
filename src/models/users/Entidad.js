const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
class Entidad extends Model {
  static init(sequelize) {
    super.init(
      {
        // attributes
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING,
        },
        apellido: {
          type: DataTypes.STRING,
        },
        documento: {
          type: DataTypes.STRING,
        },
        direccion: {
          type: DataTypes.STRING,
        },
        telefono: {
          type: DataTypes.STRING,
        },
        email: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        verifiedWebsite: {
          type: DataTypes.BOOLEAN,
        },
        tenantId: {
          type: DataTypes.UUID,
        },
      },
      {
        sequelize,
        timestamps: false,
        tableName: "Entidad",
        hooks: {
          beforeCreate: async (Entidad, options) => {
            if (Entidad.password != null) {
              const salt = await bcrypt.genSalt(10);
              Entidad.password = await bcrypt.hash(Entidad.password, salt);
            }
          },
          beforeUpdate: async (Entidad, options) => {
            if (Entidad.changed("password") && Entidad.password != null) {
              const salt = await bcrypt.genSalt(10);
              Entidad.password = await bcrypt.hash(Entidad.password, salt);
            }
          },
        },
      }
    );

    return this;
  }
  static associate(models) {
    this.hasMany(models.Compra, {
      foreignKey: {
        name: "EntidadId",
        type: DataTypes.UUID,
      },
      sourceKey: "id",
      as: "entidadClienteCompra",
    });
    models.Compra.belongsTo(this, {
      foreignKey: {
        name: "EntidadId",
        type: DataTypes.UUID,
      },
      targetKey: "id",
      as: "entidadClienteCompra",
    });
    this.hasMany(models.Compra, {
      foreignKey: {
        name: "EntidadNegocioId",
        type: DataTypes.UUID,
      },
      sourceKey: "id",
      as: "entidadNegocioCompra",
    });
    models.Compra.belongsTo(this, {
      foreignKey: {
        name: "EntidadNegocioId",
        type: DataTypes.UUID,
      },
      targetKey: "id",
      as: "entidadNegocioCompra",
    });

    //Doble conexion con Venta
    //1. para indicar el cliente o proveedor
    //2. para indicar el usuario que creo ese documento
    this.hasMany(models.Venta, {
      foreignKey: {
        name: "EntidadId",
        type: DataTypes.UUID,
      },
      sourceKey: "id",
      as: "entidadClienteVenta",
    });
    models.Venta.belongsTo(this, {
      foreignKey: {
        name: "EntidadId",
        type: DataTypes.UUID,
      },
      targetKey: "id",
      as: "entidadClienteVenta",
    });
    this.hasMany(models.Venta, {
      foreignKey: {
        name: "EntidadNegocioId",
        type: DataTypes.UUID,
      },
      sourceKey: "id",
      as: "entidadNegocioVenta",
    });
    models.Venta.belongsTo(this, {
      foreignKey: {
        name: "EntidadNegocioId",
        type: DataTypes.UUID,
      },
      targetKey: "id",
      as: "entidadNegocioVenta",
    });

    // conexion con Pedidos
    this.hasMany(models.Pedidos, {
      foreignKey: {
        name: "EntidadId",
        type: DataTypes.UUID,
      },
      sourceKey: "id",
      as: "entidadPedidos",
    });
    models.Pedidos.belongsTo(this, {
      foreignKey: {
        name: "EntidadId",
        type: DataTypes.UUID,
      },
      targetKey: "id",
      as: "entidadPedidos",
    });
  }
  static async comparePassword(password, hashPassword) {
    return await bcrypt.compare(password, hashPassword);
  }
}

module.exports = Entidad;
