import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const tickets = db.define(
  "tickets",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    noSolicitud: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    solicitanteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    oficina: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    extension: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    fechaSolicitud: {
      type: DataTypes.DATE(3),
      allowNull: false,
    },
    tipoTicketId: {
      type: DataTypes.INTEGER,
      allowNull: true, // ← cambiado a true para permitir tipo personalizado
    },
    tipoPersonalizado: {
      type: DataTypes.STRING(100),
      allowNull: true, // ← nuevo campo
    },
    estadoTicketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    departamentoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subDepartamento_SolicitanteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "subDepartamentoSolicitanteId",
    },
    edificioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "id_edificio",
    },
    nivelId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "id_nivel",
    },
    tecnicoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    prioridadTicketId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    anulado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    anuladoAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
    anulatedBySolicitante: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "anulatedBySolicitante",
    },
    fechaAsignacion: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
    fechaResolucion: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE(3),
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE(3),
      defaultValue: DataTypes.NOW,
    },
    fueReabierto: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},
  },
  {
    tableName: "tickets",
    timestamps: false,
  }
);

export default tickets;