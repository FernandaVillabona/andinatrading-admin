const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Backup extends Model {}
  Backup.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_archivo: DataTypes.STRING(200),
    ruta_archivo: DataTypes.STRING(300),
    tipo_backup: DataTypes.STRING(50),
    fecha_creacion: DataTypes.DATE,
    usuario_id: DataTypes.INTEGER,
  }, { sequelize, modelName: 'backups' });
  return Backup;
};
