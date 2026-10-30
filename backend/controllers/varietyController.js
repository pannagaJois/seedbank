const pool = require('../db/connection');

exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seed_variety ORDER BY common_name');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM seed_variety WHERE variety_id = ?', [id]);
    const item = rows[0];
    if (!item) return res.status(404).json({ error: true, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = req.body;
    const [result] = await pool.query(
      'INSERT INTO seed_variety (common_name, scientific_name, crop_type, origin_region, genetic_traits, viability_days, optimal_temp_c, optimal_humidity_pct) VALUES (?,?,?,?,?,?,?,?)',
      [payload.common_name, payload.scientific_name, payload.crop_type, payload.origin_region, payload.genetic_traits, payload.viability_days, payload.optimal_temp_c, payload.optimal_humidity_pct]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Created' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    await pool.query('UPDATE seed_variety SET ? WHERE variety_id = ?', [payload, id]);
    res.json({ success: true, message: 'Updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM seed_variety WHERE variety_id = ?', [id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};
