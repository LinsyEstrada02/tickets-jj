// Modelos/encuesta/encuesta_satisfaccion.js
import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const encuesta_satisfaccion = db.define(
  "encuesta_satisfaccion",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    calificacion: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondidoAt: {
      type: DataTypes.DATE(3),
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
    tableName: "encuesta_satisfaccion",
    freezeTableName: true,
    timestamps: false,
  }
);

export default encuesta_satisfaccion;