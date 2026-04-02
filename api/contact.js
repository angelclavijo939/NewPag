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

  // Neon HTTP API — formato correcto
  // DATABASE_URL: postgres://user:pass@host.neon.tech/dbname?sslmode=require
  try {
    const url    = new URL(dbUrl.replace('postgres://', 'https://').replace('postgresql://', 'https://'));
    const host   = url.hostname;  // ep-xxx.us-east-2.aws.neon.tech
    const user   = url.username;
    const pass   = url.password;
    const dbname = url.pathname.replace('/', '').split('?')[0];

    const neonEndpoint = `https://${host}/sql`;

    async function query(sql, params = []) {
      const r = await fetch(neonEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${user}:${pass}`),
          'Neon-Connection-String': dbUrl,
        },
        body: JSON.stringify({ query: sql, params }),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text);
      return JSON.parse(text);
    }

    // Crear tabla
    await query(`CREATE TABLE IF NOT EXISTS Clientes_web (
      Id SERIAL PRIMARY KEY,
      Nombres VARCHAR(120) NOT NULL,
      Apellidos VARCHAR(120) NOT NULL,
      Correo VARCHAR(200) NOT NULL,
      Telefono VARCHAR(30) NOT NULL UNIQUE,
      Mensaje TEXT NOT NULL,
      Fecha TIMESTAMPTZ DEFAULT NOW()
    )`);

    // Verificar duplicado
    const dup = await query('SELECT Id FROM Clientes_web WHERE Telefono = $1', [telefono]);
    if (dup.rows?.length > 0)
      return new Response(JSON.stringify({ success: false, message: 'Ya existe un registro con ese teléfono.' }), { status: 409, headers });

    // Insertar
    await query(
      'INSERT INTO Clientes_web (Nombres,Apellidos,Correo,Telefono,Mensaje) VALUES ($1,$2,$3,$4,$5)',
      [nombres, apellidos, correo, telefono, mensaje]
    );

    return new Response(JSON.stringify({ success: true, message: '¡Mensaje enviado exitosamente!' }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Error DB: ' + err.message }), { status: 500, headers });
  }
}
