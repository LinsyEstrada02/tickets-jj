import { DataTypes } from "sequelize";
import db from "../../db/db.js";

import Usuario from "../usuario/usuario.js";

const CatalogoServicio = db.define(
  "catalogo_servicio",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    servicio: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

    updatedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "catalogo_servicios",
    freezeTableName: true,
  }
);

/* ===========================
   Asociaciones (Auditoría)
   =========================== */

// Un servicio "pertenece a" un usuario que lo creó
CatalogoServicio.belongsTo(Usuario, {
  foreignKey: "createdByUserId",
  as: "creadoPor",
});

// Un servicio "pertenece a" un usuario que lo actualizó
CatalogoServicio.belongsTo(Usuario, {
  foreignKey: "updatedByUserId",
  as: "actualizadoPor",
});

export default CatalogoServicio;