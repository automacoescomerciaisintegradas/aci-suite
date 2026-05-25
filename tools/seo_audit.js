// SEO Audit Script
// This script scans all HTML files in the project and generates an audit report
// with identified issues and severity levels. It is intended to be run every 3 hours via cron.

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..'); // project root
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'seo_audits');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Helper to read all .html files recursively
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(full));
    } else if (full.endsWith('.html')) {
      results.push(full);
    }
  });
  return results;
}

// Simple SEO rule checks
function checkSeo(content) {
  const issues = [];
  // Title tag
  if (!/<title[^>]*>.*<\/title>/i.test(content)) {
    issues.push({type: 'missing_title', severity: 'high', message: 'Título da página ausente'});
  }
  // Meta description
  if (!/<meta\s+name=["']description["'][^>]*>/i.test(content)) {
    issues.push({type: 'missing_meta_description', severity: 'medium', message: 'Meta descrição ausente'});
  }
  // H1 tag (single)
  const h1Matches = content.match(/<h1[^>]*>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push({type: 'missing_h1', severity: 'high', message: 'Tag H1 ausente'});
  } else if (h1Matches.length > 1) {
    issues.push({type: 'multiple_h1', severity: 'low', message: 'Múltiplas tags H1 encontradas'});
  }
  // Images without alt
  const imgRegex = /<img\b([^>]*?)>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const attrs = imgMatch[1];
    if (!/alt\s*=\s*"[^"]*"/i.test(attrs)) {
      issues.push({type: 'img_missing_alt', severity: 'medium', message: 'Imagem sem atributo alt'});
    }
  }
  // Link rel=canonical
  if (!/<link\s+rel=["']canonical["'][^>]*>/i.test(content)) {
    issues.push({type: 'missing_canonical', severity: 'low', message: 'Link canonical ausente'});
  }
  return issues;
}

function runAudit() {
  const htmlFiles = getHtmlFiles(PROJECT_ROOT);
  const report = [];
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const issues = checkSeo(content);
    if (issues.length > 0) {
      report.push({file: path.relative(PROJECT_ROOT, file), issues});
    }
  });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(OUTPUT_DIR, `audit-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify({generatedAt: new Date().toISOString(), report}, null, 2), 'utf8');
  console.log(`SEO audit concluído. Relatório salvo em ${outPath}`);
}

runAudit();
