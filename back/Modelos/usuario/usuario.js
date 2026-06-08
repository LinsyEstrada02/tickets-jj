// Modelos/usuario/usuario.js
import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const Usuario = db.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    emailVerificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
     rolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    departamentoSolicitanteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subDepartamentoSolicitanteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "usuarios",
    freezeTableName: true,
    timestamps: false,
  }
);

export default Usuario;