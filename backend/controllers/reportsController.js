const pool = require('../db/connection');

exports.inventoryByCrop = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT crop_type, SUM(total_remaining_kg) AS remaining_kg FROM vw_inventory GROUP BY crop_type');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.distributionTrends = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT DATE_FORMAT(distribution_date, '%Y-%m') AS month, SUM(quantity_kg) AS total_kg FROM distribution GROUP BY month ORDER BY month");
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.topRecipients = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT r.recipient_name, SUM(d.quantity_kg) AS total_kg FROM distribution d JOIN recipient r ON d.recipient_id = r.recipient_id GROUP BY r.recipient_id ORDER BY total_kg DESC LIMIT 10');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
