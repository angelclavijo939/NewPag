// api/contact.js  ← debe estar en carpeta /api en la raíz del proyecto
// Vercel serverless function — reemplaza contact.php

import { Pool } from '@neondatabase/serverless';
import { Resend } from 'resend'; // opcional: para email. Si no usas Resend, se puede quitar.

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido.' });

  // ── Leer body ──────────────────────────────────────────────
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }

  const nombres   = (body.nombres   || '').trim().toUpperCase();
  const apellidos = (body.apellidos || '').trim().toUpperCase();
  const correo    = (body.correo    || '').trim();
  const telefono  = (body.telefono  || '').trim();
  const mensaje   = (body.mensaje   || '').trim();

  // ── Validaciones ───────────────────────────────────────────
  if (!nombres || !apellidos || !correo || !telefono || !mensaje)
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });

  if (!/\S+@\S+\.\S+/.test(correo))
    return res.status(400).json({ success: false, message: 'Correo electrónico inválido.' });

  if (!/^[0-9+\s\-]{7,20}$/.test(telefono))
    return res.status(400).json({ success: false, message: 'Teléfono inválido.' });

  // ── DB ─────────────────────────────────────────────────────
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Clientes_web (
        Id        SERIAL PRIMARY KEY,
        Nombres   VARCHAR(120) NOT NULL,
        Apellidos VARCHAR(120) NOT NULL,
        Correo    VARCHAR(200) NOT NULL,
        Telefono  VARCHAR(30)  NOT NULL UNIQUE,
        Mensaje   TEXT         NOT NULL,
        Fecha     TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // Verificar teléfono duplicado
    const dup = await pool.query('SELECT Id FROM Clientes_web WHERE Telefono = $1', [telefono]);
    if (dup.rowCount > 0)
      return res.status(409).json({ success: false, message: 'Ya existe un registro con ese número de teléfono.' });

    // Insertar
    await pool.query(
      'INSERT INTO Clientes_web (Nombres, Apellidos, Correo, Telefono, Mensaje) VALUES ($1,$2,$3,$4,$5)',
      [nombres, apellidos, correo, telefono, mensaje]
    );

    // ── Email (usando Resend — gratis hasta 3000/mes) ────────
    // Si no quieres usar Resend, borra este bloque.
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    'Nexus Tech <noreply@ac-consulting.cloud>',
        to:      'angel.clavijo@yahoo.es',
        subject: `Nuevo contacto: ${nombres} ${apellidos}`,
        html: `
          <div style="font-family:sans-serif;background:#0A0A0A;color:#fff;padding:32px;border-radius:12px">
            <h2 style="color:#CC5500;margin-bottom:24px">🚀 Nuevo Lead — Nexus Tech</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px;color:#8899AA;width:120px">Nombres</td>  <td style="padding:10px">${nombres}</td></tr>
              <tr><td style="padding:10px;color:#8899AA">Apellidos</td><td style="padding:10px">${apellidos}</td></tr>
              <tr><td style="padding:10px;color:#8899AA">Correo</td>   <td style="padding:10px">${correo}</td></tr>
              <tr><td style="padding:10px;color:#8899AA">Teléfono</td> <td style="padding:10px">${telefono}</td></tr>
              <tr><td style="padding:10px;color:#8899AA">Mensaje</td>  <td style="padding:10px">${mensaje}</td></tr>
            </table>
          </div>
        `
      });
    }

    return res.status(200).json({ success: true, message: '¡Mensaje enviado exitosamente!' });

  } catch (err) {
    console.error('DB Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error interno. Inténtalo de nuevo.' });
  } finally {
    await pool.end();
  }
}

