const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Orden extends Model {}
  Orden.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha_creacion: DataTypes.DATE,
    estado: DataTypes.STRING(30),
    numero_acciones: DataTypes.INTEGER,
    empresas_id: DataTypes.INTEGER,
    inversionista_id: DataTypes.INTEGER,
    comisionista_id: DataTypes.INTEGER,
    tipo_orden: DataTypes.STRING(30),
    valor_orden: DataTypes.DECIMAL(18,2),
    valor_comision: DataTypes.DECIMAL(18,2),
    fecha_aprobacion: DataTypes.DATE,
    fecha_ejecucion: DataTypes.DATE,
    fecha_rechazo: DataTypes.DATE,
  }, { sequelize, modelName: 'orden' });
  return Orden;
};
