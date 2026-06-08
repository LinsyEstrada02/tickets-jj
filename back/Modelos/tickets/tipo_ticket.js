import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const tipo_ticket = db.define(
  "tipo_ticket",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nombre: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
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
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
    },
  },
  {
    tableName: "tipo_ticket",
    timestamps: false,
  }
);

export default tipo_ticket;
