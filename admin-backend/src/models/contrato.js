const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Contrato extends Model {}
  Contrato.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    duracion_meses: DataTypes.INTEGER,
    porcentaje_comision: DataTypes.DECIMAL(5,2),
    inversionista_id: DataTypes.INTEGER,
  }, { sequelize, modelName: 'contrato' });
  return Contrato;
};
