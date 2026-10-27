const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function parseAllCharts() {
  const filePath = path.resolve(__dirname, '../../Development_QA_Accuracy_Tracker_Automated_UPDATED (4) (6) (1).xlsx');
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);

  // Parse drawing1.xml.rels to link rId to chart file
  let drawingRelsMap = {};
  if (zip.files['xl/drawings/_rels/drawing1.xml.rels']) {
    const relsXml = await zip.files['xl/drawings/_rels/drawing1.xml.rels'].async('string');
    const matches = Array.from(relsXml.matchAll(/Id="(.*?)"[\s\S]*?Target="(.*?)"/g));
    for (const m of matches) {
      drawingRelsMap[m[1]] = m[2]; // e.g. rId1 -> ../charts/chart1.xml
    }
  }

  // Parse drawing1.xml to find chart positions (from row, col to row, col)
  const drawingXml = await zip.files['xl/drawings/drawing1.xml'].async('string');
  const twoCellAnchors = drawingXml.split('</xdr:twoCellAnchor>');
  
  console.log(`=== Total Anchors in Drawing 1: ${twoCellAnchors.length - 1} ===`);

  for (let i = 0; i < twoCellAnchors.length - 1; i++) {
    const anchor = twoCellAnchors[i];
    const fromCol = anchor.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
    const toCol = anchor.match(/<xdr:to>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
    const chartRel = anchor.match(/r:id="(rId\d+)"/);

    const rId = chartRel ? chartRel[1] : 'unknown';
    const chartTarget = drawingRelsMap[rId] || '';
    const chartFile = chartTarget.replace('../', 'xl/');

    console.log(`\n========================================`);
    console.log(`ANCHOR #${i + 1}: rId=${rId} -> ${chartFile}`);
    if (fromCol) console.log(`Position: Col ${fromCol[1]}, Row ${fromCol[2]} to Col ${toCol ? toCol[1] : '?'}, Row ${toCol ? toCol[2] : '?'}`);

    if (zip.files[chartFile]) {
      const chartXml = await zip.files[chartFile].async('string');
      
      // Find chart tag
      const plotAreaMatch = chartXml.match(/<c:plotArea>([\s\S]*?)<\/c:plotArea>/);
      const plotArea = plotAreaMatch ? plotAreaMatch[1] : chartXml;

      // Chart type tags
      const typeMatches = Array.from(plotArea.matchAll(/<c:([a-zA-Z]+Chart)>/g)).map(m => m[1]);
      console.log('Chart Type:', typeMatches.join(', '));

      // Titles or Series names
      const titleMatch = chartXml.match(/<c:title>[\s\S]*?<a:t>([\s\S]*?)<\/a:t>/);
      const serNames = Array.from(chartXml.matchAll(/<c:ser>[\s\S]*?<c:tx>[\s\S]*?<c:v>(.*?)<\/c:v>/g)).map(m => m[1]);
      const serFormula = Array.from(chartXml.matchAll(/<c:ser>[\s\S]*?<c:tx>[\s\S]*?<c:f>(.*?)<\/c:f>/g)).map(m => m[1]);
      const valFormulas = Array.from(chartXml.matchAll(/<c:val>[\s\S]*?<c:f>(.*?)<\/c:f>/g)).map(m => m[1]);
      const catFormulas = Array.from(chartXml.matchAll(/<c:cat>[\s\S]*?<c:f>(.*?)<\/c:f>/g)).map(m => m[1]);

      if (titleMatch) console.log('Chart Title:', titleMatch[1]);
      if (serNames.length) console.log('Series Names:', serNames);
      if (serFormula.length) console.log('Series Name Formulas:', serFormula);
      if (catFormulas.length) console.log('Categories Formulas (X-Axis):', catFormulas);
      if (valFormulas.length) console.log('Values Formulas (Y-Axis):', valFormulas);
    }
  }
}

parseAllCharts().catch(console.error);
