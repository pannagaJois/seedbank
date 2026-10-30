const pool = require('../db/connection');

exports.list = async (req, res, next) => {
  try { const [rows] = await pool.query('SELECT * FROM contributor ORDER BY contributor_name'); res.json({ success: true, data: rows }); } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try { const id = req.params.id; const [rows] = await pool.query('SELECT * FROM contributor WHERE contributor_id = ?', [id]); if (!rows[0]) return res.status(404).json({ error: true, message: 'Not found' }); res.json({ success: true, data: rows[0] }); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try { const p = req.body; const [r] = await pool.query('INSERT INTO contributor (contributor_name, contributor_type, contact_phone, contact_email, address, region) VALUES (?,?,?,?,?,?)', [p.contributor_name, p.contributor_type, p.contact_phone, p.contact_email, p.address, p.region]); res.status(201).json({ success: true, data: { id: r.insertId } }); } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { const id = req.params.id; await pool.query('UPDATE contributor SET ? WHERE contributor_id = ?', [req.body, id]); res.json({ success: true, message: 'Updated' }); } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try { const id = req.params.id; await pool.query('DELETE FROM contributor WHERE contributor_id = ?', [id]); res.json({ success: true, message: 'Deleted' }); } catch (err) { next(err); }
};
