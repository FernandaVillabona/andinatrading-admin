const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Inversionista extends Model {}
  Inversionista.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario: DataTypes.STRING(100),
    contrasena: DataTypes.STRING(200),
    correo: DataTypes.STRING(120),
    ciudad_id: DataTypes.INTEGER,
    pais_id: DataTypes.INTEGER,
    telefono: DataTypes.STRING(40),
    porcentaje_comision: DataTypes.DECIMAL(5,2),
    saldo: DataTypes.DECIMAL(18,2),
    nombre: DataTypes.STRING(150),
    acciones_locked: DataTypes.INTEGER,
    apodo: DataTypes.STRING(100),
    documento_identidad: DataTypes.STRING(50),
    ultima_conexion: DataTypes.DATE,
    clave_comisionista: DataTypes.STRING(120),
  }, { sequelize, modelName: 'inversionista' });
  return Inversionista;
};
