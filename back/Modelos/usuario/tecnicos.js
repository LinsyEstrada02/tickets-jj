// Modelos/Tecnico.js
import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const Tecnico = db.define(
  "Tecnico",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    nombre: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },

    supervisor: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "tecnicos",
    timestamps: false,
  }
);

export default Tecnico;
