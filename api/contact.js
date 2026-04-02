const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Método no permitido.' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const nombres   = String(body.nombres   || '').trim().toUpperCase();
  const apellidos = String(body.apellidos || '').trim().toUpperCase();
  const correo    = String(body.correo    || '').trim();
  const telefono  = String(body.telefono  || '').trim();
  const mensaje   = String(body.mensaje   || '').trim();

  if (!nombres || !apellidos || !correo || !telefono || !mensaje)
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });

  if (!/\S+@\S+\.\S+/.test(correo))
    return res.status(400).json({ success: false, message: 'Correo inválido.' });

  // Lee MIANDB_URL que apunta a maindb
  const dbUrl = process.env.MAINDB_URL;
  if (!dbUrl)
    return res.status(500).json({ success: false, message: 'MIANDB_URL no configurada.' });

  try {
    const sql = neon(dbUrl);

    await sql`
      CREATE TABLE IF NOT EXISTS Clientes_web (
        Id        SERIAL PRIMARY KEY,
        Nombres   VARCHAR(120) NOT NULL,
        Apellidos VARCHAR(120) NOT NULL,
        Correo    VARCHAR(200) NOT NULL,
        Telefono  VARCHAR(30)  NOT NULL UNIQUE,
        Mensaje   TEXT         NOT NULL,
        Fecha     TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    const dup = await sql`SELECT Id FROM Clientes_web WHERE Telefono = ${telefono}`;
    if (dup.length > 0)
      return res.status(409).json({ success: false, message: 'Ya existe un registro con ese teléfono.' });

    await sql`
      INSERT INTO Clientes_web (Nombres, Apellidos, Correo, Telefono, Mensaje)
      VALUES (${nombres}, ${apellidos}, ${correo}, ${telefono}, ${mensaje})
    `;

    return res.status(200).json({ success: true, message: '¡Mensaje enviado exitosamente!' });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error DB: ' + err.message });
  }
};

