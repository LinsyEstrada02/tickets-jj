import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
const dbname = process.env.DB_NAME;
const dbuser = process.env.DB_USER;
const dbpassword = process.env.DB_PASSWORD;
const dbhost = process.env.DB_HOST;
const dbdialect = process.env.DB_DIALECT;
 const db = new Sequelize(dbname, dbuser, dbpassword, {
    host: dbhost,
    dialect: dbdialect,
 });
 export default db;