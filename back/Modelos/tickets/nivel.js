import { DataTypes } from "sequelize";
import db from "../../db/db.js";

const Nivel = db.define(
  "Nivel",
  {
    id_nivel: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    id_edificio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { tableName: "niveles", timestamps: false }
);

export default Nivel;