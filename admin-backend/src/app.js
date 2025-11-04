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

import { verifyMailer } from './utils/mailer.js';
import profileRoutes from "./routes/profileRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/admin', userRoutes);
app.use('/api/admin/usuarios', usersAdminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin/logs', logRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/admin/ordenes', ordenesRoutes);
app.use('/api/admin/analisis', analisisAdminRoutes);
app.use("/api/profile", profileRoutes);


verifyMailer();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
