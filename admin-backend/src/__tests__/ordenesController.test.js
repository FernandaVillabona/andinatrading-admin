// src/__tests__/ordenesController.test.js
import { jest } from '@jest/globals';

// 1) Mockear la conexión a DB antes de importar el controlador
const mockQuery = jest.fn();

jest.unstable_mockModule('../db/connection.js', () => ({
  pool: { query: mockQuery },
}));

// 2) Importar el controlador DESPUÉS de registrar el mock
const { getOrdenesDetalle } = await import('../controllers/ordenesController.js');

describe('ordenesController.getOrdenesDetalle', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('devuelve total y data con las órdenes (200)', async () => {
    const fakeRows = [
      {
        id_orden: 10,
        tipo_orden: 'COMPRA',
        estado: 'APROBADA',
        valor_orden: 1000,
        valor_comision: 50,
        fecha_creacion: '2025-01-01',
        fecha_aprobacion: '2025-01-02',
        fecha_ejecucion: '2025-01-03',
        fecha_rechazo: null,
        id_comisionista: 5,
        nombre_comisionista: 'Comi Uno',
        correo_comisionista: 'comi@ex.com',
        usuario_comisionista: 'comi1',
        id_inversionista: 7,
        nombre_inversionista: 'Ada Lovelace',
        correo_inversionista: 'ada@ex.com',
        telefono_inversionista: '555-123',
        ciudad_inversionista: 'Bogotá',
        pais_inversionista: 'Colombia',
      },
      {
        id_orden: 11,
        tipo_orden: 'VENTA',
        estado: 'PENDIENTE',
        valor_orden: 2000,
        valor_comision: 80,
        fecha_creacion: '2025-01-04',
        fecha_aprobacion: null,
        fecha_ejecucion: null,
        fecha_rechazo: null,
        id_comisionista: 6,
        nombre_comisionista: 'Comi Dos',
        correo_comisionista: 'comi2@ex.com',
        usuario_comisionista: 'comi2',
        id_inversionista: 9,
        nombre_inversionista: 'Grace Hopper',
        correo_inversionista: 'grace@ex.com',
        telefono_inversionista: '555-456',
        ciudad_inversionista: 'Medellín',
        pais_inversionista: 'Colombia',
      },
    ];

    // La query de mysql2 retorna [rows, fields]; tu código hace [rows] = await pool.query(...)
    mockQuery.mockResolvedValue([fakeRows]);

    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getOrdenesDetalle(req, res);

    // Se ejecutó la consulta con el SQL esperado (chequeos básicos)
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toContain('FROM orden o');
    expect(sql).toContain('LEFT JOIN comisionista c');
    expect(sql).toContain('LEFT JOIN inversionista i');
    expect(sql).toContain('ORDER BY o.fecha_creacion DESC');

    // Respuesta OK con total y data
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      total: fakeRows.length,
      data: fakeRows,
    });
  });

  it('retorna 500 y mensaje de error cuando la DB falla', async () => {
    const boom = new Error('DB down');
    mockQuery.mockRejectedValue(boom);

    // silenciar el console.error de la ruta SOLO en este test
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getOrdenesDetalle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Error al obtener órdenes',
        details: boom.message,
      })
    );

    errSpy.mockRestore();
  });
});
