import { DataTypes } from "sequelize";
import db from "../../db/db.js";
import Usuario from "../usuario/usuario.js";

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
  allowNull: false,
  defaultValue: DataTypes.NOW,
},

updatedAt: {
  type: DataTypes.DATE(3),
  allowNull: false,
  defaultValue: DataTypes.NOW,
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
      allowNull: true,
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

// SOLO ESTA RELACIÓN
ticket_seguimiento.belongsTo(Usuario, {
  foreignKey: "createdByUserId",
  as: "usuario",
});

export default ticket_seguimiento;