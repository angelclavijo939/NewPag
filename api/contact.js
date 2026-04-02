// Usando import desde CDN de esm.sh — funciona en Edge sin npm install
import { neon } from 'https://esm.sh/@neondatabase/serverless@0.9.5';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ success: false, message: 'Método no permitido.' }), { status: 405, headers });

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ success: false, message: 'Body inválido.' }), { status: 400, headers }); }

  const nombres   = String(body.nombres   || '').trim().toUpperCase();
  const apellidos = String(body.apellidos || '').trim().toUpperCase();
  const correo    = String(body.correo    || '').trim();
  const telefono  = String(body.telefono  || '').trim();
  const mensaje   = String(body.mensaje   || '').trim();

  if (!nombres || !apellidos || !correo || !telefono || !mensaje)
    return new Response(JSON.stringify({ success: false, message: 'Todos los campos son obligatorios.' }), { status: 400, headers });

  if (!/\S+@\S+\.\S+/.test(correo))
    return new Response(JSON.stringify({ success: false, message: 'Correo inválido.' }), { status: 400, headers });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl)
    return new Response(JSON.stringify({ success: false, message: 'DATABASE_URL no configurada.' }), { status: 500, headers });

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
      return new Response(JSON.stringify({ success: false, message: 'Ya existe un registro con ese teléfono.' }), { status: 409, headers });

    await sql`
      INSERT INTO Clientes_web (Nombres, Apellidos, Correo, Telefono, Mensaje)
      VALUES (${nombres}, ${apellidos}, ${correo}, ${telefono}, ${mensaje})
    `;

    return new Response(JSON.stringify({ success: true, message: '¡Mensaje enviado exitosamente!' }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Error DB: ' + err.message }), { status: 500, headers });
  }
}
