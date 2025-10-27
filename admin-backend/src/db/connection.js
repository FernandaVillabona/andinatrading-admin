import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "caboose.proxy.rlwy.net",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "JwLFficLXuLLjgQCgMBsTbdsBgLCVfDP",
  database: process.env.DB_NAME || "isw2_andina_trading",
  port: process.env.DB_PORT || 35506,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});