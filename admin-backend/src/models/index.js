const { sequelize } = require('../db/sequelize');
const Usuario = require('./usuario')(sequelize);
const Pais = require('./pais')(sequelize);
const Ciudad = require('./ciudad')(sequelize);
const Comisionista = require('./comisionista')(sequelize);
const Empresa = require('./empresa')(sequelize);
const AccionActual = require('./acciones_actuales')(sequelize);
const EmpresaFavorita = require('./empresa_favorita')(sequelize);
const Inversionista = require('./inversionista')(sequelize);
const Movimiento = require('./movimiento')(sequelize);
const Contrato = require('./contrato')(sequelize);
const Orden = require('./orden')(sequelize);
const ReservaTemporalVenta = require('./reserva_temporal_venta')(sequelize);
const Backup = require('./backups')(sequelize);
const Log = require('./logs')(sequelize);
const Historial = require('./historial')(sequelize);

// === ASOCIACIONES ===

// País 1--N Ciudad
Pais.hasMany(Ciudad, { foreignKey: 'pais_id' });
Ciudad.belongsTo(Pais, { foreignKey: 'pais_id' });

// País/Ciudad con Comisionista
Pais.hasMany(Comisionista, { foreignKey: 'pais_id' });
Comisionista.belongsTo(Pais, { foreignKey: 'pais_id' });
Ciudad.hasMany(Comisionista, { foreignKey: 'ciudad_id' });
Comisionista.belongsTo(Ciudad, { foreignKey: 'ciudad_id' });

// País/Ciudad con Inversionista
Pais.hasMany(Inversionista, { foreignKey: 'pais_id' });
Inversionista.belongsTo(Pais, { foreignKey: 'pais_id' });
Ciudad.hasMany(Inversionista, { foreignKey: 'ciudad_id' });
Inversionista.belongsTo(Ciudad, { foreignKey: 'ciudad_id' });

// Usuario 1--N Historial/Backups/Logs
Usuario.hasMany(Historial, { foreignKey: 'usuario_id' });
Historial.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Backup, { foreignKey: 'usuario_id' });
Backup.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Log, { foreignKey: 'usuario_id' });
Log.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Inversionista con Contrato/Movimiento/Acciones/Empresas favoritas
Inversionista.hasMany(Contrato, { foreignKey: 'inversionista_id' });
Contrato.belongsTo(Inversionista, { foreignKey: 'inversionista_id' });

Inversionista.hasMany(Movimiento, { foreignKey: 'inversionista_id' });
Movimiento.belongsTo(Inversionista, { foreignKey: 'inversionista_id' });

Inversionista.hasMany(AccionActual, { foreignKey: 'inversionista_id' });
AccionActual.belongsTo(Inversionista, { foreignKey: 'inversionista_id' });

Inversionista.hasMany(EmpresaFavorita, { foreignKey: 'inversionista_id' });
EmpresaFavorita.belongsTo(Inversionista, { foreignKey: 'inversionista_id' });

// Empresa con Acciones/Movimientos/Favoritas/Reservas
Empresa.hasMany(AccionActual, { foreignKey: 'empresas_id' });
AccionActual.belongsTo(Empresa, { foreignKey: 'empresas_id' });

Empresa.hasMany(Movimiento, { foreignKey: 'empresa_id' });
Movimiento.belongsTo(Empresa, { foreignKey: 'empresa_id' });

Empresa.hasMany(EmpresaFavorita, { foreignKey: 'empresas_id' });
EmpresaFavorita.belongsTo(Empresa, { foreignKey: 'empresas_id' });

Empresa.hasMany(ReservaTemporalVenta, { foreignKey: 'empresas_id' });
ReservaTemporalVenta.belongsTo(Empresa, { foreignKey: 'empresas_id' });

// Reserva temporal
Inversionista.hasMany(ReservaTemporalVenta, { foreignKey: 'inversionista_id' });
ReservaTemporalVenta.belongsTo(Inversionista, { foreignKey: 'inversionista_id' });

// Orden con Empresa / Inversionista / Comisionista
Empresa.hasMany(Orden, { foreignKey: 'empresas_id' });
Orden.belongsTo(Empresa, { foreignKey: 'empresas_id' });

Inversionista.hasMany(Orden, { foreignKey: 'inversionista_id' });
Orden.belongsTo(Inversionista, { foreignKey: 'inversionista_id' });

Comisionista.hasMany(Orden, { foreignKey: 'comisionista_id' });
Orden.belongsTo(Comisionista, { foreignKey: 'comisionista_id' });

module.exports = {
  sequelize,
  Usuario,
  Pais,
  Ciudad,
  Comisionista,
  Empresa,
  AccionActual,
  EmpresaFavorita,
  Inversionista,
  Movimiento,
  Contrato,
  Orden,
  ReservaTemporalVenta,
  Backup,
  Log,
  Historial,
};
