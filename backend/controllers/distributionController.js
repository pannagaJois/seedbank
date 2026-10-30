const pool = require('../db/connection');

exports.list = async (req, res, next) => {
  try { const [rows] = await pool.query('SELECT * FROM vw_distribution_history'); res.json({ success: true, data: rows }); } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try { const id = req.params.id; const [rows] = await pool.query('SELECT * FROM distribution WHERE distribution_id = ?', [id]); if (!rows[0]) return res.status(404).json({ error: true, message: 'Not found' }); res.json({ success: true, data: rows[0] }); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const p = req.body;
    const [r] = await pool.query('INSERT INTO distribution (batch_id, recipient_id, distributed_by, distribution_date, quantity_kg, purpose, remarks) VALUES (?,?,?,?,?,?,?)', [p.batch_id, p.recipient_id, p.distributed_by, p.distribution_date, p.quantity_kg, p.purpose, p.remarks]);
    res.status(201).json({ success: true, data: { id: r.insertId }, message: 'Distribution logged' });
  } catch (err) {
    // database trigger may SIGNAL on insufficient stock
    if (err && err.message) return res.status(400).json({ error: true, message: err.message });
    next(err);
  }
};
