const pool = require('../db/connection');

exports.list = async (req, res, next) => { try { const [rows] = await pool.query('SELECT * FROM viability_check ORDER BY check_date DESC'); res.json({ success: true, data: rows }); } catch (err) { next(err); } };

exports.get = async (req, res, next) => { try { const id = req.params.id; const [rows] = await pool.query('SELECT * FROM viability_check WHERE check_id = ?', [id]); if (!rows[0]) return res.status(404).json({ error: true, message: 'Not found' }); res.json({ success: true, data: rows[0] }); } catch (err) { next(err); } };

exports.create = async (req, res, next) => {
  try {
    const p = req.body;
    const [r] = await pool.query('INSERT INTO viability_check (batch_id, check_date, germination_rate_pct, moisture_content_pct, checked_by, result, action_taken) VALUES (?,?,?,?,?,?,?)', [p.batch_id, p.check_date, p.germination_rate_pct, p.moisture_content_pct, p.checked_by, p.result, p.action_taken]);
    res.status(201).json({ success: true, data: { id: r.insertId }, message: 'Viability check recorded' });
  } catch (err) { next(err); }
};
