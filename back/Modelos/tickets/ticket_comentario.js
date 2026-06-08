import { DataTypes } from "sequelize";
import db from "../../db/db.js";
import Usuario from "../usuario/usuario.js";
import Ticket from "./tickets.js";

const ticket_comentarios = db.define(
  "ticket_comentarios",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    autorUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    autorTipo: {
      type: DataTypes.ENUM("TECNICO", "SOLICITANTE", "SISTEMA"),
      allowNull: false,
    },

    comentario: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    archivoUrl: {
  type: DataTypes.STRING(500),
  allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE(3),
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "ticket_comentarios",
    timestamps: false,
    updatedAt: false,
  }
);


export default ticket_comentarios;