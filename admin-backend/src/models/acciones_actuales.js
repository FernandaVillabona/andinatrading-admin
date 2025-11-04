const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class AccionActual extends Model {}
  AccionActual.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    inversionista_id: DataTypes.INTEGER,      // aparece en tu DER
    empresas_id: DataTypes.INTEGER,
    acciones: DataTypes.INTEGER,
  }, { sequelize, modelName: 'acciones_actuales' });
  return AccionActual;
};
