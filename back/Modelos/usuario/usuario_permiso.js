import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const UsuarioPermiso = db.define(
  "UsuarioPermiso",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "usuarioId",
    },
    permisoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "permisoId",
    },
    otorgadoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "otorgadoPor",
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaFin: {
      type: DataTypes.DATE,
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
    tableName: "usuario_permiso",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["usuarioId", "permisoId"],
        name: "uk_usuario_permiso",
      },
    ],
  }
);

export default UsuarioPermiso;