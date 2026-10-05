import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const scenePath = new URL('../src/components/ResearchScene.astro', import.meta.url);
const markPath = new URL('../src/components/ResearchMark.astro', import.meta.url);
const outputPath = new URL('../public/images/social-preview.png', import.meta.url);
const sceneSource = await readFile(scenePath, 'utf8');
const sceneMatch = sceneSource.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
const markSource = await readFile(markPath, 'utf8');
const markMatch = markSource.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);

if (!sceneMatch) {
  throw new Error('The research scene does not contain an SVG illustration.');
}

if (!markMatch) {
  throw new Error('The research mark does not contain an SVG symbol.');
}

const scene = sceneMatch[1]
  .replace(/<title[^>]*>[\s\S]*?<\/title>/g, '')
  .replace(/<desc[^>]*>[\s\S]*?<\/desc>/g, '');
const mark = markMatch[1].replace(/currentColor/g, '#45627d');

const artwork = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f6f0"/>
  <path d="M80 108H1120M80 507H1120" stroke="#d6dce2" stroke-width="1"/>
  <g fill="#45627d" font-family="Arial, sans-serif">
    <svg x="80" y="58" width="32" height="32" viewBox="0 0 32 32" fill="none">${mark}</svg>
    <text x="128" y="80" font-size="12" letter-spacing="2.7">RESEARCH &amp; EXPLORATION</text>
    <text x="1120" y="80" font-size="12" letter-spacing="1.6" text-anchor="end">PERCEPTION → ACTION</text>
  </g>
  <circle cx="916" cy="307" r="172" fill="#e4e9ef" opacity=".52"/>
  <svg x="655" y="129" width="490" height="372" viewBox="0 0 540 410">
    ${scene}
  </svg>
  <g fill="#2a2e35">
    <text x="78" y="258" font-family="Georgia, 'Times New Roman', serif" font-size="78" letter-spacing="-2.5">Yirong Qiang</text>
    <text x="82" y="313" font-family="Arial, sans-serif" font-size="27" letter-spacing="-.3" fill="#45627d">AI Researcher</text>
    <path d="M82 352H123" stroke="#9cacbc" stroke-width="2"/>
    <text x="82" y="393" font-family="Arial, sans-serif" font-size="18" fill="#657484">From perception to purposeful action.</text>
  </g>
  <text x="82" y="552" font-family="Arial, sans-serif" font-size="18" fill="#45627d">Embodied intelligence <tspan fill="#a0adba"> / </tspan> World models <tspan fill="#a0adba"> / </tspan> Agentic reasoning</text>
  <text x="82" y="584" font-family="Arial, sans-serif" font-size="12" letter-spacing=".35" fill="#74818e">Yingcai Honors College · University of Electronic Science and Technology of China</text>
</svg>
`;

await mkdir(new URL('../public/images/', import.meta.url), { recursive: true });
const result = await sharp(Buffer.from(artwork))
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(fileURLToPath(outputPath));

if (result.width !== 1200 || result.height !== 630) {
  throw new Error('Social preview dimensions must be 1200 × 630 pixels.');
}

console.log(`Created ${fileURLToPath(outputPath)} (${result.width} × ${result.height}, ${result.size} bytes).`);
