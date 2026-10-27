const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function parseAllCharts() {
  const filePath = path.resolve(__dirname, '../../Development_QA_Accuracy_Tracker_Automated_UPDATED (4) (6) (1).xlsx');
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);

  // Map drawing1.xml.rels
  const relsXml = await zip.files['xl/drawings/_rels/drawing1.xml.rels'].async('string');
  const relMatches = Array.from(relsXml.matchAll(/Id="(.*?)"[\s\S]*?Target="(.*?)"/g));
  const relMap = {};
  for (const m of relMatches) {
    let target = m[2].replace(/^\//, '').replace('../', '');
    if (!target.startsWith('xl/')) target = 'xl/' + target;
    relMap[m[1]] = target;
  }

  const drawingXml = await zip.files['xl/drawings/drawing1.xml'].async('string');
  const anchors = drawingXml.split('</twoCellAnchor>');

  const chartsSummary = [];

  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const fromCol = a.match(/<from>[\s\S]*?<col>(\d+)<\/col>[\s\S]*?<row>(\d+)<\/row>/);
    const toCol = a.match(/<to>[\s\S]*?<col>(\d+)<\/col>[\s\S]*?<row>(\d+)<\/row>/);
    const rIdMatch = a.match(/r:id="(rId\d+)"/);

    const rId = rIdMatch ? rIdMatch[1] : '';
    const chartPath = relMap[rId] || '';

    if (!chartPath || !zip.files[chartPath]) {
      console.log('Not found:', rId, chartPath);
      continue;
    }

    const xml = await zip.files[chartPath].async('string');

    // Title
    const titleMatch = xml.match(/<title>[\s\S]*?<a:t>([\s\S]*?)<\/a:t>/);
    const title = titleMatch ? titleMatch[1] : 'Untitled';

    // Chart Type
    const typeMatch = xml.match(/<(pieChart|pie3DChart|barChart|lineChart|doughnutChart|areaChart|radarChart|scatterChart)/);
    const chartType = typeMatch ? typeMatch[1] : 'unknown';

    // Bar direction (col = vertical column bar, bar = horizontal bar)
    const barDirMatch = xml.match(/<barDir val="(.*?)"/);
    const barDir = barDirMatch ? barDirMatch[1] : '';

    // Grouping (stacked, percentStacked, standard, clustered)
    const groupingMatch = xml.match(/<grouping val="(.*?)"/);
    const grouping = groupingMatch ? groupingMatch[1] : '';

    // Categories reference
    const catFMatch = xml.match(/<cat>[\s\S]*?<f>([\s\S]*?)<\/f>/);
    const catF = catFMatch ? catFMatch[1] : '';

    // Values reference
    const valFMatch = Array.from(xml.matchAll(/<val>[\s\S]*?<f>([\s\S]*?)<\/f>/g)).map(m => m[1]);

    // Series Names
    const serNames = Array.from(xml.matchAll(/<ser>[\s\S]*?<tx>[\s\S]*?<v>([\s\S]*?)<\/v>/g)).map(m => m[1]);
    const serF = Array.from(xml.matchAll(/<ser>[\s\S]*?<tx>[\s\S]*?<f>([\s\S]*?)<\/f>/g)).map(m => m[1]);

    chartsSummary.push({
      chartIndex: i + 1,
      rId,
      chartPath,
      title,
      chartType: barDir ? `${chartType} (${barDir}, ${grouping || 'standard'})` : chartType,
      position: {
        from: fromCol ? { col: parseInt(fromCol[1]), row: parseInt(fromCol[2]) } : null,
        to: toCol ? { col: parseInt(toCol[1]), row: parseInt(toCol[2]) } : null
      },
      categoriesFormula: catF,
      valuesFormulas: valFMatch,
      seriesNames: serNames.length ? serNames : serF
    });
  }

  console.log(JSON.stringify(chartsSummary, null, 2));
}

parseAllCharts().catch(console.error);
