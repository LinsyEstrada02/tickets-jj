import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const ticket_tecnicos_asignados_historial = db.define(
  "ticket_tecnicos_asignados_historial",
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

    tecnicoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    asignadoPorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    asignadoAt: {
      type: DataTypes.DATE(3),
      defaultValue: DataTypes.NOW,
    },

    desasignadoAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },

    motivoCambio: {
      type: DataTypes.STRING(255),
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
    tableName: "ticket_tecnicos_asignados_historial",
    timestamps: false,
  }
);

export default ticket_tecnicos_asignados_historial;
