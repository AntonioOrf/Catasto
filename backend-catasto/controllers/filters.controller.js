const pool = require("../config/db");

exports.getFilters = async (req, res) => {
  try {
    const promisePool = pool.promise();

    const [bestiame] = await promisePool.query(
      "SELECT ID_Bestiame as id, Bestiame as label FROM bestiame",
    );
    const [rapporto] = await promisePool.query(
      "SELECT ID_Rapporto as id, RapportoLavoro as label FROM rapporto_mestiere",
    );
    const [immigrazione] = await promisePool.query(
      "SELECT Id as id, Immigrazione as label FROM immigrazione",
    );

    res.json({
      bestiame,
      rapporto,
      immigrazione,
    });
  } catch (err) {
    console.error("Error fetching filters:", err);
    res.status(500).json({ error: err.message });
  }
};
