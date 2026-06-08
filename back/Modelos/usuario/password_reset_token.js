// Modelos/PasswordResetToken.js
import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const PasswordResetToken = db.define(
  "PasswordResetToken",
  {
    id: {
      type: DataTypes.STRING(191),
      primaryKey: true,
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },

    usuarioId: {
      type: DataTypes.INTEGER,
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

    usado: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },

    usedAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
  },
  {
    tableName: "password_reset_token",
    timestamps: false,
  }
);

export default PasswordResetToken;
