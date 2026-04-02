// api/admin.js  ← panel de administración como API JSON
// Accede desde: tudominio.com/admin.html (que consume este endpoint)

import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Auth simple por header o query param ──────────────────
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: 'No autorizado.' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const search = (req.query.s || '').trim();
    let result;

    if (search) {
      result = await pool.query(
        `SELECT * FROM Clientes_web
         WHERE Nombres ILIKE $1 OR Apellidos ILIKE $1 OR Correo ILIKE $1 OR Telefono ILIKE $1
         ORDER BY Id DESC`,
        [`%${search}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM Clientes_web ORDER BY Id DESC');
    }

    return res.status(200).json({ success: true, data: result.rows, total: result.rowCount });

  } catch (err) {
    console.error('Admin DB Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error de base de datos.' });
  } finally {
    await pool.end();
  }
}
