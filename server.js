const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

app.get("/health", (req, res) => res.send("ok"));

app.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM notes ORDER BY id DESC");
  const items = rows
    .map((n) => `<li>${escapeHtml(n.text)} <small>(${n.created_at.toISOString()})</small></li>`)
    .join("");
  res.send(`
    <h1>My first Coolify app</h1>
    <form method="POST" action="/add">
      <input name="text" placeholder="Write a note here" required>
      <button>Save</button>
    </form>
    <ul>${items}</ul>
  `);
});

app.post("/add", async (req, res) => {
  await pool.query("INSERT INTO notes (text) VALUES ($1)", [req.body.text]);
  res.redirect("/");
});

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  const port = process.env.PORT || 3000;
  app.listen(port, "0.0.0.0", () => console.log("Running on port " + port));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
