const pool = require('../db/connection');

exports.list = async (req, res, next) => {
  try { const [rows] = await pool.query('SELECT * FROM storage_facility ORDER BY facility_name'); res.json({ success: true, data: rows }); } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try { const id = req.params.id; const [rows] = await pool.query('SELECT * FROM storage_facility WHERE facility_id = ?', [id]); if (!rows[0]) return res.status(404).json({ error: true, message: 'Not found' }); res.json({ success: true, data: rows[0] }); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try { const p = req.body; const [r] = await pool.query('INSERT INTO storage_facility (facility_name, location, capacity_kg, facility_type, current_temp_c, current_humidity_pct) VALUES (?,?,?,?,?,?)', [p.facility_name, p.location, p.capacity_kg, p.facility_type, p.current_temp_c, p.current_humidity_pct]); res.status(201).json({ success: true, data: { id: r.insertId } }); } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { const id = req.params.id; await pool.query('UPDATE storage_facility SET ? WHERE facility_id = ?', [req.body, id]); res.json({ success: true, message: 'Updated' }); } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try { const id = req.params.id; await pool.query('DELETE FROM storage_facility WHERE facility_id = ?', [id]); res.json({ success: true, message: 'Deleted' }); } catch (err) { next(err); }
};
