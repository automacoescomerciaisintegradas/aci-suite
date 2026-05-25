const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'index.css');
let css = fs.readFileSync(targetPath, 'utf8');

// Replace hex codes
css = css.replace(/#4f46e5/gi, '#10B981'); // Indigo -> Emerald 500
css = css.replace(/#7c3aed/gi, '#F59E0B'); // Violet -> Amber 500
css = css.replace(/#6366f1/gi, '#10B981'); // Indigo 500 -> Emerald 500
css = css.replace(/#8b5cf6/gi, '#059669'); // Violet 500 -> Emerald 600
css = css.replace(/#a855f7/gi, '#047857'); // Purple 500 -> Emerald 700

// Replace RGB components used in rgba()
css = css.replace(/139,\s*92,\s*246/g, '16, 185, 129'); // Violet RGB -> Emerald 500 RGB
css = css.replace(/99,\s*102,\s*241/g, '16, 185, 129'); // Indigo RGB -> Emerald 500 RGB

// Replace dark mode pure blacks with slate/emerald darks
css = css.replace(/#0A0A0A/gi, '#020617'); // Dark Bg -> Slate 950
css = css.replace(/#141414/gi, '#0F172A'); // Dark Card -> Slate 900

fs.writeFileSync(targetPath, css, 'utf8');
console.log("Cores substituídas com sucesso no index.css!");
