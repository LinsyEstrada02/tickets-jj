import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const prioridad_ticket = db.define(
  "prioridad_ticket",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    nombre: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },

    nombreVerboso: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
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
    },
  },
  {
    tableName: "prioridad_ticket",
    timestamps: false,
  }
);

export default prioridad_ticket;