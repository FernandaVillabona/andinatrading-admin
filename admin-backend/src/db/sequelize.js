const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres', // cambia a 'mysql' si aplica
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: false, // activa si tus tablas tienen created_at/updated_at
    },
  }
);

module.exports = { sequelize };
