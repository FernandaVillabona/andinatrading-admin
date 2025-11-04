const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Historial extends Model {}
  Historial.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: DataTypes.INTEGER,
    descripcion: DataTypes.TEXT,
    modulo: DataTypes.STRING(120),
    tipo_evento: DataTypes.STRING(80),
    fecha_evento: DataTypes.DATE,
  }, { sequelize, modelName: 'historial' });
  return Historial;
};
