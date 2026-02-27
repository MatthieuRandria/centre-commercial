const dashboardService = require('../services/dashborad.service');

const ok  = (res, data)    => res.json({ success: true, data });
const err = (res, e, code = 500) =>
  res.status(code).json({ success: false, message: e.message ?? e });

exports.getKpis = async (req, res) => {
  try {
    ok(res, await dashboardService.getKpis());
  } catch (e) { err(res, e); }
};

exports.getCaEvolution = async (req, res) => {
  try {
    const periode = ['6m', '12m'].includes(req.query.periode)
      ? req.query.periode : '12m';
    ok(res, await dashboardService.getCaEvolution(periode));
  } catch (e) { err(res, e); }
};

exports.getTopBoutiques = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    ok(res, await dashboardService.getTopBoutiques(limit));
  } catch (e) { err(res, e); }
};


exports.getTopProduits = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    ok(res, await dashboardService.getTopProduits(limit));
  } catch (e) { err(res, e); }
};

exports.getRecentCommandes = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    ok(res, await dashboardService.getRecentCommandes(limit));
  } catch (e) { err(res, e); }
};

exports.getCommandesBadge = async (req, res) => {
  try {
    ok(res, await dashboardService.getCommandesBadge());
  } catch (e) { err(res, e); }
};