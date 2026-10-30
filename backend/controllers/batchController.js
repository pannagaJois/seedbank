const pool = require('../db/connection');

exports.list = async (req, res, next) => {
  try {
    const sql = `
      SELECT sb.*, sv.common_name, sv.crop_type, sf.facility_name
      FROM seed_batch sb
      LEFT JOIN seed_variety sv ON sb.variety_id = sv.variety_id
      LEFT JOIN storage_facility sf ON sb.facility_id = sf.facility_id
      ORDER BY sb.created_at DESC
    `;
    const [rows] = await pool.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    const sql = `
      SELECT sb.*, sv.common_name, sv.crop_type, sf.facility_name
      FROM seed_batch sb
      LEFT JOIN seed_variety sv ON sb.variety_id = sv.variety_id
      LEFT JOIN storage_facility sf ON sb.facility_id = sf.facility_id
      WHERE sb.batch_id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    if (!rows[0]) return res.status(404).json({ error: true, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const p = req.body;
    const [r] = await pool.query('INSERT INTO seed_batch (variety_id, contributor_id, facility_id, collection_date, quantity_kg, notes) VALUES (?,?,?,?,?,?)', [p.variety_id, p.contributor_id, p.facility_id, p.collection_date, p.quantity_kg, p.notes]);
    res.status(201).json({ success: true, data: { id: r.insertId }, message: 'Batch created' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { const id = req.params.id; await pool.query('UPDATE seed_batch SET ? WHERE batch_id = ?', [req.body, id]); res.json({ success: true, message: 'Updated' }); } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try { const id = req.params.id; await pool.query('DELETE FROM seed_batch WHERE batch_id = ?', [id]); res.json({ success: true, message: 'Deleted' }); } catch (err) { next(err); }
};
