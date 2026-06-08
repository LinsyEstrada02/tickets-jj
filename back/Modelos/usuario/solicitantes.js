// Modelos/Solicitante.js
import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const Solicitante = db.define(
  "Solicitante",
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

    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    nombre: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },

    oficina: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    departamentoSolicitanteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    extension: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },

    edificio: {
      type: DataTypes.ENUM("ANEXO", "CENTRAL"),
      allowNull: false,
    },
  },
  {
    tableName: "solicitantes",
    timestamps: false,
  }
);

export default Solicitante;
