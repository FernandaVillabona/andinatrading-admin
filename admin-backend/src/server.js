// src/server.js
import app from './app.js';
import { verifyMailer } from './utils/mailer.js';

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  Promise.resolve(verifyMailer?.()).catch(e =>
    console.error('Mailer verification failed:', e)
  );

  app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
}

export default app;
