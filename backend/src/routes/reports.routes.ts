import { Router } from 'express';
import { PageReportRequestSchema } from '../validators/schemas.js';
import { 
  buildReportSummary, 
  getDashboardExcelData,
  getPendingWithDeveloperData,
  getBugLifecycleData,
  getAzureImportData,
  getBugTrackerData,
  getReopenAnalysisData,
  getModuleQualityData,
  getBugAgingData,
  getModuleUiVsFunctionalData,
  getPageSummaryData
} from '../services/report-service.js';
import { getAllBugs } from '../database/index.js';
import { excelService } from '../integrations/excel/excel-service.js';

export const reportsRouter = Router();

reportsRouter.get('/reopen-analysis', (req, res, next) => {
  try {
    const data = getReopenAnalysisData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/module-quality', (req, res, next) => {
  try {
    const data = getModuleQualityData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/bug-aging', (req, res, next) => {
  try {
    const data = getBugAgingData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/module-ui-vs-functional', (req, res, next) => {
  try {
    const data = getModuleUiVsFunctionalData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/page-summary', (req, res, next) => {
  try {
    const data = getPageSummaryData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

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

reportsRouter.get('/pending-with-developer', (req, res, next) => {
  try {
    const data = getPendingWithDeveloperData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/bug-lifecycle', (req, res, next) => {
  try {
    const data = getBugLifecycleData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/azure-import', (req, res, next) => {
  try {
    const data = getAzureImportData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/bug-tracker', (req, res, next) => {
  try {
    const data = getBugTrackerData();
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
