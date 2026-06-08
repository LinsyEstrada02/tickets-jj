// Modelo/Session.js
import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const Session = db.define(
  "Session",
  {
    id: {
      type: DataTypes.STRING(191),
      primaryKey: true,
      allowNull: false,
    },

    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    data: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    expiresAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
    },
  },
  {
    tableName: "session",
    timestamps: false,
  }
);

export default Session;
