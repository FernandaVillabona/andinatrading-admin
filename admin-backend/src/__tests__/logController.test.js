// ESM + Jest 29.x
import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../db/connection.js', () => ({
  pool: { query: mockQuery },
}));

const { getLogs } = await import('../controllers/logController.js');

describe('logController.getLogs', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('devuelve los logs (200) cuando la consulta resuelve', async () => {
    const fakeRows = [
      { id: 1, usuario: 'Ada', accion: 'LOGIN', modulo: 'auth', fecha: '2025-01-01' },
    ];
    mockQuery.mockResolvedValue([fakeRows]);

    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getLogs(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('SELECT');
    expect(sql).toContain('FROM logs');
    expect(sql).toContain('LIMIT 100');

    // Respuesta OK
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeRows);
  });

it('retorna 500 y mensaje de error cuando la DB falla', async () => {
  const boom = new Error('DB down');
  mockQuery.mockRejectedValue(boom);

  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  const req = {};
  const res = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };

  await getLogs(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: 'Error al obtener logs',
      details: boom.message,
    })
  );

  errSpy.mockRestore();
}); });