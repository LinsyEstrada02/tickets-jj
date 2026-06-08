import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const departamento_solicitante = db.define(
  "departamento_solicitante",
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
      unique: true,
    },
    abreviatura: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "departamento_solicitante",
    freezeTableName: true,
    timestamps: false,
  }
);

export default departamento_solicitante;