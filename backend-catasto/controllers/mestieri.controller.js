const pool = require("../config/db");

exports.getMestieri = async (req, res) => {
  try {
    const promisePool = pool.promise();

    // Select all fields from the mestieri table
    // It will fetch 'id', 'Mestiere', and eventually 'descrizione' when added by the user
    const [mestieri] = await promisePool.query(
      "SELECT * FROM mestieri ORDER BY Mestiere ASC",
    );

    res.json(mestieri);
  } catch (err) {
    console.error("Error fetching mestieri:", err);
    res.status(500).json({ error: err.message });
  }
};
