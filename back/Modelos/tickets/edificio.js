import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const Edificio = db.define(
  "Edificio",
  {
    id_edificio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  { tableName: "edificio", timestamps: false }
);

export default Edificio;