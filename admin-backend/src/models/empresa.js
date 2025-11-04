const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Empresa extends Model {}
  Empresa.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: DataTypes.STRING(150),
    descripcion: DataTypes.TEXT,
    precio: DataTypes.DECIMAL(18,2),
    ultima_actualizacion: DataTypes.DATE,
    symbol: DataTypes.STRING(20),
  }, { sequelize, modelName: 'empresas' });
  return Empresa;
};
