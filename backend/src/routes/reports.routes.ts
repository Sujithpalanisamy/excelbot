import { Router } from 'express';
import { PageReportRequestSchema } from '../validators/schemas.js';
import { buildReportSummary, getDashboardExcelData } from '../services/report-service.js';
import { getAllBugs } from '../database/index.js';
import { excelService } from '../integrations/excel/excel-service.js';

export const reportsRouter = Router();

reportsRouter.get('/summary', (req, res, next) => {
  try {
    const summary = buildReportSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/dashboard-excel', (req, res, next) => {
  try {
    const data = getDashboardExcelData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.post('/page-wise', async (req, res, next) => {
  try {
    const parsed = PageReportRequestSchema.parse(req.body);
    const pageName = parsed.page_name.trim();

    const allBugs = getAllBugs();
    const pageBugs = allBugs.filter(b => (b.page_name || '').toLowerCase() === pageName.toLowerCase());

    const [ok, msg] = await excelService.exportSpecificPageReport(pageName, allBugs);

    const openCount = pageBugs.filter(b => ['new', 'active', 'in progress', 'to do'].includes((b.state || '').toLowerCase())).length;
    const closedCount = pageBugs.filter(b => ['closed', 'done', 'resolved'].includes((b.state || '').toLowerCase())).length;
    const criticalCount = pageBugs.filter(
      b => String(b.severity || '').includes('1') || String(b.severity || '').includes('2') || String(b.severity || '').toLowerCase().includes('critical') || String(b.severity || '').toLowerCase().includes('high')
    ).length;

    res.json({
      success: ok,
      message: msg,
      page_name: pageName,
      total_bugs: pageBugs.length,
      open_bugs: openCount,
      closed_bugs: closedCount,
      critical_bugs: criticalCount,
      bugs: pageBugs,
    });
  } catch (err) {
    next(err);
  }
});
