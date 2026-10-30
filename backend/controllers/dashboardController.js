const pool = require('../db/connection');

exports.summary = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_dashboard_summary');
    res.json({ success: true, data: rows[0] || {}, message: 'Dashboard summary' });
  } catch (err) {
    next(err);
  }
};
