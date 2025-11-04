const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Comisionista extends Model {}
  Comisionista.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ciudad_id: DataTypes.INTEGER,
    pais_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    contrasena: DataTypes.STRING(200),
    usuario: DataTypes.STRING(100),
    correo: DataTypes.STRING(120),
    nombre_completo: DataTypes.STRING(150),
    nombre: DataTypes.STRING(120),
    ultima_conexion: DataTypes.DATE,
    estado: DataTypes.STRING(20),
  }, { sequelize, modelName: 'comisionista' });
  return Comisionista;
};
