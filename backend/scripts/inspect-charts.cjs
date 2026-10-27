const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function inspectWorkbook() {
  const filePath = path.resolve(__dirname, '../../Development_QA_Accuracy_Tracker_Automated_UPDATED (4) (6) (1).xlsx');
  console.log('Reading file:', filePath);
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);

  const files = Object.keys(zip.files);
  const chartFiles = files.filter(f => f.includes('chart') && f.endsWith('.xml'));
  const drawingFiles = files.filter(f => f.includes('drawing') && f.endsWith('.xml'));
  const drawingRels = files.filter(f => f.includes('drawing') && f.endsWith('.rels'));
  const sheetRels = files.filter(f => f.includes('sheet') && f.endsWith('.rels'));

  console.log('=== Total charts found:', chartFiles.length);
  console.log('=== Chart files:', chartFiles);
  console.log('=== Drawing files:', drawingFiles);

  // Map sheet to drawings
  for (const sr of sheetRels) {
    const content = await zip.files[sr].async('string');
    if (content.includes('drawing')) {
      console.log(`Sheet rel ${sr} has drawings`);
    }
  }

  // Parse each chart XML to get chart title, chart type, and data reference
  for (const cf of chartFiles) {
    const xml = await zip.files[cf].async('string');
    console.log(`\n--- CHART: ${cf} ---`);
    // Extract title
    const titleMatch = xml.match(/<c:tx>[\s\S]*?<c:v>(.*?)<\/c:v>[\s\S]*?<\/c:tx>/) || xml.match(/<c:title>[\s\S]*?<a:t>(.*?)<\/a:t>[\s\S]*?<\/c:title>/);
    console.log('Title:', titleMatch ? titleMatch[1] : '(No title / extracted from cell)');

    // Extract chart types: barChart, pieChart, doughnutChart, lineChart, areaChart, etc.
    const chartTypeMatches = Array.from(xml.matchAll(/<c:(barChart|pieChart|doughnutChart|lineChart|areaChart|radarChart|scatterChart)>/g)).map(m => m[1]);
    console.log('Chart Types:', chartTypeMatches);

    // Extract formulas / data ranges referenced
    const formulaMatches = Array.from(xml.matchAll(/<c:f>(.*?)<\/c:f>/g)).map(m => m[1]);
    console.log('Formula references:', formulaMatches);
  }
}

inspectWorkbook().catch(err => {
  console.error(err);
});
