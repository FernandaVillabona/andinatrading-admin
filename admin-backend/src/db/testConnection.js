import pool from "./connection.js";

async function test() {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    console.log("✅ Conexión OK. Test result:", rows[0].result);
    await pool.end();
  } catch (err) {
    console.error("❌ Error de conexión:", err.message);
    process.exit(1);
  }
}

test();
