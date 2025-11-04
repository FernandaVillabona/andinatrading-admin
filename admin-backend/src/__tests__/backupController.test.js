// src/__tests__/backupController.test.js
import { jest } from '@jest/globals';

// ---- Mocks previos al import del controlador ----

// 1) Mock DB pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../db/connection.js', () => ({
  pool: { query: mockQuery },
}));

// 2) Mock fs (default): existsSync, mkdirSync, createWriteStream, unlinkSync
const writeSpy = jest.fn();
const endSpy = jest.fn();

const fsMockDefault = {
  existsSync: jest.fn(() => true), // BACKUP_DIR ya "existe" al importar el controlador
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    write: writeSpy,
    end: endSpy,
  })),
  unlinkSync: jest.fn(),
};
jest.unstable_mockModule('fs', () => ({
  __esModule: true,
  default: fsMockDefault, // compatible con "import fs from 'fs'"
}));

// (Usamos path real)
const path = await import('path');

// 3) Import del controlador DESPUÉS de registrar los mocks
const {
  getBackups,
  generarBackup,
  eliminarBackup,
  descargarBackup,
} = await import('../controllers/backupController.js');

describe('backupController', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    writeSpy.mockReset();
    endSpy.mockReset();
    fsMockDefault.existsSync.mockClear();
    fsMockDefault.mkdirSync.mockClear();
    fsMockDefault.createWriteStream.mockClear();
    fsMockDefault.unlinkSync.mockClear();
    jest.useRealTimers();
  });

  // ---------------- getBackups ----------------
  it('getBackups: retorna lista de backups (200)', async () => {
    const rows = [{ id: 1, nombre_archivo: 'a.sql' }];
    mockQuery.mockResolvedValueOnce([rows]);

    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getBackups(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  it('getBackups: maneja error (500)', async () => {
    const boom = new Error('DB fail');
    mockQuery.mockRejectedValueOnce(boom);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getBackups(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error al obtener backups', details: boom.message })
    );
    spy.mockRestore();
  });

  // ---------------- generarBackup ----------------
  it('generarBackup: genera archivo, inserta EXITOSO y responde OK', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:34:56.789Z'));

    // 1) SHOW TABLES
    const tables = [{ 'Tables_in_andina': 'usuario' }, { 'Tables_in_andina': 'orden' }];
    mockQuery
      .mockResolvedValueOnce([tables])                          // SHOW TABLES
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Ada' }]])      // SELECT * FROM `usuario`
      .mockResolvedValueOnce([[{ id: 10, estado: 'APROBADA' }]])// SELECT * FROM `orden`
      .mockResolvedValueOnce([{}]);                             // INSERT EXITOSO en backups

    const req = { user: { id: 42 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await generarBackup(req, res);

    expect(fsMockDefault.createWriteStream).toHaveBeenCalledTimes(1);
    expect(writeSpy).toHaveBeenCalled();
    expect(endSpy).toHaveBeenCalled();

    expect(mockQuery).toHaveBeenCalledTimes(4);

    const calledJson = res.json.mock.calls[0][0];
    expect(calledJson.message).toMatch(/Backup generado correctamente/);
    expect(calledJson.archivo).toMatch(/^backup_andinatrading_2025-01-01T12-34-56-789Z\.sql$/);

    // Tu controlador usa path.resolve("backups") para BACKUP_DIR
    const rutaEsperada = path.resolve('backups', calledJson.archivo);
    expect(fsMockDefault.createWriteStream.mock.calls[0][0]).toBe(rutaEsperada);
  });

  it('generarBackup: si falla, inserta FALLIDO y responde 500', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:34:56.789Z'));

    const boom = new Error('SHOW TABLES failed');
    mockQuery
      .mockRejectedValueOnce(boom) // SHOW TABLES falla
      .mockResolvedValueOnce([{}]); // INSERT FALLIDO en backups

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const req = { user: { id: 42 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await generarBackup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error al crear backup', details: boom.message })
    );
    expect(mockQuery).toHaveBeenCalledTimes(2); // intento de registrar FALLIDO
    spy.mockRestore();
  });

  // ---------------- eliminarBackup ----------------
  it('eliminarBackup: elimina archivo y borra registro (200)', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ ruta_archivo: 'backups/x.sql' }]]) // SELECT ruta_archivo
      .mockResolvedValueOnce([{}]);                                  // DELETE FROM backups

    fsMockDefault.existsSync.mockReturnValueOnce(true);

    const req = { params: { id: '7' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eliminarBackup(req, res);

    expect(fsMockDefault.unlinkSync).toHaveBeenCalledWith('backups/x.sql');
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: '🗑️ Backup eliminado correctamente' });
  });

  it('eliminarBackup: 404 si no existe el registro', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows

    const req = { params: { id: '99' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await eliminarBackup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Backup no encontrado' });
  });

  // ---------------- descargarBackup ----------------
  it('descargarBackup: descarga archivo existente (200)', async () => {
    mockQuery.mockResolvedValueOnce([[
      { nombre_archivo: 'y.sql', ruta_archivo: 'backups/y.sql' },
    ]]);

    fsMockDefault.existsSync.mockReturnValueOnce(true);

    const req = { params: { id: '4' } };
    const res = { download: jest.fn(), json: jest.fn(), status: jest.fn().mockReturnThis() };

    await descargarBackup(req, res);

    expect(res.download).toHaveBeenCalledWith('backups/y.sql', 'y.sql');
  });

  it('descargarBackup: 404 si no existe registro', async () => {
    mockQuery.mockResolvedValueOnce([[]]);

    const req = { params: { id: '4' } };
    const res = { download: jest.fn(), json: jest.fn(), status: jest.fn().mockReturnThis() };

    await descargarBackup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Backup no encontrado' });
  });

  it('descargarBackup: 404 si el archivo no está en disco', async () => {
    mockQuery.mockResolvedValueOnce([[
      { nombre_archivo: 'z.sql', ruta_archivo: 'backups/z.sql' },
    ]]);

    fsMockDefault.existsSync.mockReturnValueOnce(false);

    const req = { params: { id: '4' } };
    const res = { download: jest.fn(), json: jest.fn(), status: jest.fn().mockReturnThis() };

    await descargarBackup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Archivo no encontrado en servidor' });
  });
});
