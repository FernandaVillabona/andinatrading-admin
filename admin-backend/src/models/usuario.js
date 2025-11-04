const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Usuario extends Model {}
  Usuario.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_completo: DataTypes.STRING(150),
    correo: { type: DataTypes.STRING(120), unique: true },
    contrasena: DataTypes.STRING(200),
    tipo_usuario: DataTypes.STRING(50),
    estado: DataTypes.STRING(20),
    fecha_creacion: DataTypes.DATE,
    ultima_conexion: DataTypes.DATE,
  }, { sequelize, modelName: 'usuario' });
  return Usuario;
};
