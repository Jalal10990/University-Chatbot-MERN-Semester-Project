
const pool = require("./db");

async function testDatabase() {
  try {
    // Test 1: Check the database connection.
    const connection = await pool.query(
      "SELECT current_database() AS database"
    );

    console.log("Database:", connection.rows[0].database);

    // Test 2: Create a test conversation.
    const conversation = await pool.query(
      `INSERT INTO conversations (title)
       VALUES ($1)
       RETURNING id, session_id, title, created_at`,
      ["Database Connection Test"]
    );

    console.log("Created conversation:", conversation.rows[0]);

    // Test 3: Read the saved conversation.
    const saved = await pool.query(
      `SELECT id, title, created_at
       FROM conversations
       WHERE id = $1`,
      [conversation.rows[0].id]
    );

    console.log("Retrieved conversation:", saved.rows[0]);
    console.log("Database read/write test passed!");
  } catch (error) {
    console.error("Database test failed:", error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
