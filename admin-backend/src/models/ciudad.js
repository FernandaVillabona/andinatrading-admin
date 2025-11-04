const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Ciudad extends Model {}
  Ciudad.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pais_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre: DataTypes.STRING(120),
    situacion_economica: DataTypes.STRING(120),
  }, { sequelize, modelName: 'ciudad' });
  return Ciudad;
};
