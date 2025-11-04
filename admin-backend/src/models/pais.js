const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Pais extends Model {}
  Pais.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: DataTypes.STRING(100),
  }, { sequelize, modelName: 'pais' });
  return Pais;
};
