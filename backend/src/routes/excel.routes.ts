import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getAllBugs } from '../database/index.js';
import { excelService } from '../integrations/excel/excel-service.js';

export const excelRouter = Router();

excelRouter.post('/export', async (req, res, next) => {
  try {
    const allBugs = getAllBugs();
    if (allBugs.length === 0) {
      res.json({
        success: false,
        message: 'No bugs found in database to export. Please fetch bug IDs first.',
        excel_path: excelService.filePath,
      });
      return;
    }

    const [success, message] = await excelService.saveOrUpdateBugs(allBugs, allBugs);
    res.json({
      success,
      message,
      total_bugs: allBugs.length,
      excel_path: excelService.filePath,
    });
  } catch (err) {
    next(err);
  }
});

excelRouter.get('/download', async (req, res, next) => {
  try {
    if (!fs.existsSync(excelService.filePath)) {
      const allBugs = getAllBugs();
      if (allBugs.length > 0) {
        await excelService.saveOrUpdateBugs(allBugs, allBugs);
      } else {
        res.status(404).json({ detail: 'Excel workbook has not been generated yet.' });
        return;
      }
    }

    res.download(excelService.filePath, excelService.filename);
  } catch (err) {
    next(err);
  }
});

excelRouter.get('/status', (req, res, next) => {
  try {
    const exists = fs.existsSync(excelService.filePath);
    let sizeBytes = 0;
    let modTime = '';

    if (exists) {
      const stats = fs.statSync(excelService.filePath);
      sizeBytes = stats.size;
      modTime = new Date(stats.mtime).toISOString().replace('T', ' ').slice(0, 19);
    }

    res.json({
      exists,
      filename: excelService.filename,
      path: excelService.filePath,
      size_bytes: sizeBytes,
      last_modified: modTime,
    });
  } catch (err) {
    next(err);
  }
});
