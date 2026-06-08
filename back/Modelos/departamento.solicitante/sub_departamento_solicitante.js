import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const sub_departamento_solicitante = db.define(
  "sub_departamento_solicitante",
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
    abreviatura: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    departamentoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: "sub_departamento_solicitante",
    freezeTableName: true,
    timestamps: false,
  }
);

export default sub_departamento_solicitante;