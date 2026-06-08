import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const PermisoPorRol = db.define(
  "PermisoPorRol",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    rolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    permisoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "permisos",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "permiso_por_rol",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["rolId", "permisoId"],
      },
    ],
  }
);

export default PermisoPorRol;