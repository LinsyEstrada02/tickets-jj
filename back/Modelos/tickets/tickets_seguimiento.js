import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const ticket_seguimiento = db.define(
  "ticket_seguimiento",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    automatico: {
      type: DataTypes.BOOLEAN,
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

    estadoTicketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    descripcionDeCambio: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    imagen: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },

    tecnicoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "ticket_seguimiento",
    timestamps: false,
  }
);

export default ticket_seguimiento;
