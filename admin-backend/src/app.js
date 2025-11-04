// src/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import userRoutes from './routes/userRoutes.js';
import logRoutes from './routes/logRoutes.js';
import historialRoutes from './routes/historialRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import usersAdminRoutes from './routes/usersAdminRoutes.js';
import ordenesRoutes from './routes/ordenesRoutes.js';
import analisisAdminRoutes from './routes/analisisAdminRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/admin', userRoutes);
app.use('/api/admin/usuarios', usersAdminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin/logs', logRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/admin/ordenes', ordenesRoutes);
app.use('/api/admin/analisis', analisisAdminRoutes);
app.use('/api/profile', profileRoutes);


app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message ?? 'Internal Server Error' });
});

export default app;
