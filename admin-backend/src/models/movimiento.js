const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Movimiento extends Model {}
  Movimiento.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    empresa_id: DataTypes.INTEGER, // en tu DER figura "empresa"
    fecha: DataTypes.DATE,
    monto: DataTypes.DECIMAL(18,2),
    tipo: DataTypes.STRING(30),
    inversionista_id: DataTypes.INTEGER,
  }, { sequelize, modelName: 'movimiento' });
  return Movimiento;
};
