require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const app = require("./app");
const PORT = process.env.PORT || 5000;

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const migrationsDir = path.join(__dirname, "../migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith(".sql")) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      try {
        await pool.query(sql);
        console.log(`✅ ${file} done`);
      } catch (err) {
        console.log(`⚠️ ${file} skipped: ${err.message}`);
      }
    }
  }
  await pool.end();
}

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
