import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const app = express();

const allowed = (process.env.ALLOWED_ORIGIN ?? "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : "*", credentials: false }));

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/red_vial", async (_req, res) => {
  try {
    const sql = `
      SELECT
        id,
        nombre_car AS nombre,           -- campo de etiqueta
        ST_AsGeoJSON(ST_Transform(geom, 4326), 6)::json AS geometry
      FROM "Infraestructura"."red vial"
      WHERE geom IS NOT NULL
    `;
    const { rows } = await pool.query(sql);

    const fc = {
      type: "FeatureCollection",
      features: rows.map(r => ({
        type: "Feature",
        geometry: r.geometry,
        properties: {
          id: r.id,
          nombre: r.nombre
        }
      }))
    };
    res.json(fc);
  } catch (err) {
    console.error("Error /api/red_vial:", err);
    res.status(500).json({ error: "Error consultando PostGIS" });
  }
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API lista en http://localhost:${PORT}`);
});
