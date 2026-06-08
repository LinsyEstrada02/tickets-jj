import { DataTypes } from "sequelize";
import db from "../../db/db.js";
import Usuario from "../usuario/usuario.js";

const confirmacion_correo_user_token = db.define(
  "confirmacion_correo_user_token",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    emailUsado: {
      type: DataTypes.STRING(191),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
    },
    usado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    usedAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
  },
  {
    tableName: "confirmacion_correo_user_token",
    timestamps: false,
  }
);

confirmacion_correo_user_token.belongsTo(Usuario, {
  foreignKey: "usuarioId",
});

export default confirmacion_correo_user_token;
