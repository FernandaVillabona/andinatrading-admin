const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Log extends Model {}
  Log.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: DataTypes.INTEGER,
    accion: DataTypes.STRING(120),
    modulo: DataTypes.STRING(120),
    ip_origen: DataTypes.STRING(45),
    fecha: DataTypes.DATE,
  }, { sequelize, modelName: 'logs' });
  return Log;
};
