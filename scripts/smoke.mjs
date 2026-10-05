import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, realpath, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distributionRoot = await realpath(path.join(projectRoot, 'dist'));
const resultsRoot = path.join(projectRoot, 'test-results');
const requestedBase = process.env.BASE_PATH || '/';
assert(!/[?#\\]/.test(requestedBase), 'BASE_PATH must be a URL path.');
const baseSegments = requestedBase.split('/').filter(Boolean);
assert(baseSegments.every((segment) => !['.', '..'].includes(decodeURIComponent(segment))), 'BASE_PATH cannot contain dot segments.');
const basePath = baseSegments.length ? `/${baseSegments.join('/')}/` : '/';
const screenshotRoot = path.join(resultsRoot, baseSegments.length ? baseSegments.join('-') : 'root');
const siteOrigin = new URL(process.env.SITE_URL || 'https://apromisedland.github.io').origin;
const sectionIds = ['research', 'experience', 'projects', 'about', 'contact'];
const mediaTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function isInsideDistribution(candidate) {
  const relative = path.relative(distributionRoot, candidate);
  return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

async function serveStatic(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (pathname.includes('\0') || pathname.includes('\\') || !pathname.startsWith(basePath)) {
    response.writeHead(404).end();
    return;
  }

  let candidate = path.resolve(distributionRoot, pathname.slice(basePath.length) || 'index.html');
  if (!isInsideDistribution(candidate)) {
    response.writeHead(403).end();
    return;
  }

  try {
    if ((await stat(candidate)).isDirectory()) candidate = path.join(candidate, 'index.html');
    candidate = await realpath(candidate);
    if (!isInsideDistribution(candidate)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(candidate);
    response.writeHead(200, {
      'Content-Type': mediaTypes[path.extname(candidate).toLowerCase()] || 'application/octet-stream',
      'Content-Length': content.byteLength,
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500).end();
  }
}

function readZipEntry(archive, entryName) {
  let directoryOffset = -1;
  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65557); offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      directoryOffset = archive.readUInt32LE(offset + 16);
      break;
    }
  }
  assert(directoryOffset >= 0, 'The local source CV is not a supported DOCX archive.');

  let offset = directoryOffset;
  while (offset + 46 <= archive.length && archive.readUInt32LE(offset) === 0x02014b50) {
    const compression = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const filenameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const filename = archive.subarray(offset + 46, offset + 46 + filenameLength).toString('utf8');
    if (filename === entryName) {
      assert.equal(archive.readUInt32LE(localOffset), 0x04034b50, 'Invalid DOCX entry header.');
      const contentOffset = localOffset + 30 + archive.readUInt16LE(localOffset + 26) + archive.readUInt16LE(localOffset + 28);
      const compressed = archive.subarray(contentOffset, contentOffset + compressedSize);
      assert([0, 8].includes(compression), 'Unsupported DOCX compression.');
      return (compression === 8 ? inflateRawSync(compressed) : compressed).toString('utf8');
    }
    offset += 46 + filenameLength + extraLength + commentLength;
  }
  throw new Error('The local source CV has no document text.');
}

function phonePattern() {
  return /(?<!\d)(?:\+?86[\s-]?)?1[3-9]\d(?:[\s-]?\d){8}(?!\d)/g;
}

async function sourcePhoneNumbers() {
  let archive;
  try {
    archive = await readFile(path.join(projectRoot, 'CV.docx'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.log('Local source CV absent: source-specific phone comparison skipped.');
    return [];
  }
  const text = readZipEntry(archive, 'word/document.xml')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
  const numbers = [...text.matchAll(phonePattern())].map((match) => match[0].replace(/\D/g, '').slice(-11));
  assert(numbers.length > 0, 'Could not extract a phone number from the local source CV for the privacy check.');
  return [...new Set(numbers)];
}

async function listDistributionFiles(directory = distributionRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listDistributionFiles(entryPath) : [entryPath];
  }));
  return files.flat();
}

async function checkPublishedPrivacy(phoneNumbers) {
  const textualExtensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.svg', '.map']);
  for (const filename of await listDistributionFiles()) {
    const relative = path.relative(distributionRoot, filename);
    assert(!/\.docx$/i.test(filename), `A private Word document is present in the published output: ${relative}`);
    if (!textualExtensions.has(path.extname(filename).toLowerCase())) continue;
    const content = await readFile(filename, 'utf8');
    const digits = content.replace(/\D/g, '');
    assert(phoneNumbers.every((number) => !digits.includes(number)), `A source CV phone number appears in published text: ${relative}`);
    if (['.html', '.json', '.txt'].includes(path.extname(filename).toLowerCase())) {
      const phoneSearchContent = path.extname(filename).toLowerCase() === '.html'
        ? content.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, (markup) => markup.replace(/<[^>]+>/g, ' '))
        : content;
      assert(!phonePattern().test(phoneSearchContent), `A mobile phone number appears in published text: ${relative}`);
    }
    assert(!/CV\.docx/i.test(content), `The published output refers to the private source CV: ${relative}`);
  }
}

async function localContext(browser, options, origin) {
  const context = await browser.newContext(options);
  await context.route('**/*', async (route) => {
    const requested = new URL(route.request().url());
    if (['http:', 'https:'].includes(requested.protocol) && requested.origin !== origin) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  return context;
}

async function checkInternalResources(page, origin) {
  const resourceUrls = await page.locator('[href], [src], [srcset]').evaluateAll((elements) => {
    return elements.flatMap((element) => {
      const values = ['href', 'src'].map((attribute) => element.getAttribute(attribute)).filter(Boolean);
      if (element.getAttribute('srcset')) {
        values.push(...element.getAttribute('srcset').split(',').map((candidate) => candidate.trim().split(/\s+/)[0]));
      }
      return values.flatMap((value) => {
        try { return [new URL(value, document.baseURI).href]; } catch { return []; }
      });
    });
  });
  const localUrls = [...new Set(resourceUrls.flatMap((value) => {
    const resource = new URL(value);
    if (resource.origin !== origin) return [];
    assert(resource.pathname.startsWith(basePath), `An internal resource escapes BASE_PATH: ${resource.pathname}`);
    resource.hash = '';
    return [resource.href];
  }))];
  for (const resourceUrl of localUrls) {
    const response = await fetch(resourceUrl, { method: 'HEAD', redirect: 'manual' });
    assert.equal(response.status, 200, `Internal resource is unavailable: ${new URL(resourceUrl).pathname}`);
  }
  const brokenAnchors = await page.locator('a[href]').evaluateAll((anchors) => anchors.flatMap((anchor) => {
    const target = new URL(anchor.href, document.baseURI);
    if (target.origin !== location.origin || target.pathname !== location.pathname || !target.hash) return [];
    return document.getElementById(decodeURIComponent(target.hash.slice(1))) ? [] : [target.hash];
  }));
  assert.deepEqual(brokenAnchors, [], 'Some on-page links have no destination.');
}

async function revealAndLoadPage(page) {
  for (const element of await page.locator('[data-reveal], img').all()) {
    await element.scrollIntoViewIfNeeded();
    if (await element.evaluate((target) => target.matches('[data-reveal].reveal-ready'))) {
      await element.waitFor({ state: 'visible' });
      await page.waitForFunction((target) => target.classList.contains('is-visible'), await element.elementHandle());
    }
  }
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    await document.fonts.ready;
  });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')].every((element) => {
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (Number.parseFloat(style.opacity) < 0.99 || style.visibility !== 'visible' || style.display === 'none') return false;
    }
    return true;
  }));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const imageFailures = await page.locator('img').evaluateAll((images) => images
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.getAttribute('src')));
  assert.deepEqual(imageFailures, [], 'Some images did not load.');
}

async function checkImagePresentation(page) {
  const figures = await page.locator('.figure-image img, .project-preview img').evaluateAll((images) => images.map((image) => {
    const style = getComputedStyle(image);
    const bounds = image.getBoundingClientRect();
    const clippedBy = [];
    for (let ancestor = image.parentElement; ancestor && !ancestor.matches('main'); ancestor = ancestor.parentElement) {
      const ancestorStyle = getComputedStyle(ancestor);
      const ancestorBounds = ancestor.getBoundingClientRect();
      const clipsHorizontally = ['hidden', 'clip'].includes(ancestorStyle.overflowX);
      const clipsVertically = ['hidden', 'clip'].includes(ancestorStyle.overflowY);
      if ((clipsHorizontally && (bounds.left < ancestorBounds.left - 1 || bounds.right > ancestorBounds.right + 1))
        || (clipsVertically && (bounds.top < ancestorBounds.top - 1 || bounds.bottom > ancestorBounds.bottom + 1))) {
        clippedBy.push(ancestor.className);
      }
    }
    return {
      source: image.getAttribute('src'),
      publication: Boolean(image.closest('[data-publication]')),
      objectFit: style.objectFit,
      displayedRatio: bounds.width / bounds.height,
      originalRatio: image.naturalWidth / image.naturalHeight,
      clippedBy,
    };
  }));
  assert.equal(figures.length, 5, 'Expected four paper figures and one project dashboard.');
  for (const figure of figures) {
    assert.deepEqual(figure.clippedBy, [], `An image is clipped by its container: ${figure.source}`);
    if (figure.publication) {
      assert.equal(figure.objectFit, 'contain', `A paper figure must preserve all labels with contain: ${figure.source}`);
    } else {
      assert(figure.originalRatio < 1, 'The project dashboard should remain the original portrait image.');
      assert(figure.objectFit === 'contain' || Math.abs(figure.displayedRatio - figure.originalRatio) < 0.01,
        'The full portrait project dashboard must retain its aspect ratio.');
    }
  }
  return figures;
}

async function checkMetadataAndDownloads(page, origin) {
  const canonical = new URL(basePath, siteOrigin).href;
  const socialImage = new URL(`${basePath}images/social-preview.png`, siteOrigin).href;
  assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'The public website should declare English.');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical, 'Canonical URL must respect SITE_URL and BASE_PATH.');
  for (const selector of ['meta[property="og:url"]']) {
    assert.equal(await page.locator(selector).getAttribute('content'), canonical, 'Sharing URL must match the canonical URL.');
  }
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    assert.equal(await page.locator(selector).getAttribute('content'), socialImage, 'Sharing image must respect BASE_PATH.');
  }
  const person = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  assert.equal(person.name, 'Yirong Qiang', 'Structured data must identify the researcher.');
  assert.equal(person.url, canonical, 'Structured data must respect BASE_PATH.');
  const socialResponse = await fetch(`${origin}${new URL(socialImage).pathname}`);
  assert.equal(socialResponse.status, 200, 'The sharing image is unavailable.');
  const socialBytes = Buffer.from(await socialResponse.arrayBuffer());
  assert.equal(socialBytes.subarray(1, 4).toString(), 'PNG', 'The sharing image should be a PNG.');
  assert.equal(socialBytes.readUInt32BE(16), 1200, 'The sharing image should be 1200px wide.');
  assert.equal(socialBytes.readUInt32BE(20), 630, 'The sharing image should be 630px high.');
  for (const font of ['newsreader', 'manrope']) {
    const licenseResponse = await fetch(`${origin}${basePath}fonts/licenses/${font}.txt`);
    assert.equal(licenseResponse.status, 200, `The local ${font} font license is unavailable.`);
    assert.match(await licenseResponse.text(), /SIL OPEN FONT LICENSE/i, `The ${font} license should contain the OFL text.`);
  }
  const loadedFonts = await page.evaluate(() => [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family.toLowerCase()));
  for (const font of ['newsreader', 'manrope']) {
    assert(loadedFonts.some((family) => family.includes(font)), `The local ${font} font did not load.`);
  }
  const cvLink = page.locator('a[href*="/cv/"]').first();
  assert(await cvLink.count(), 'A public PDF CV download is required.');
  const cvUrl = new URL(await cvLink.getAttribute('href'), `${origin}${basePath}`);
  assert.equal(cvUrl.origin, origin, 'The public CV should be included in the static site.');
  assert.equal(cvUrl.pathname, `${basePath}cv/CV_YirongQiang.pdf`, 'The CV URL must respect BASE_PATH.');
  const publicPdfPaths = await page.locator('a[href]').evaluateAll((anchors) => anchors.flatMap((anchor) => {
    const target = new URL(anchor.href, document.baseURI);
    return target.origin === location.origin && /\.pdf$/i.test(target.pathname) ? [target.pathname] : [];
  }));
  assert(publicPdfPaths.length > 0, 'The public CV must remain linked.');
  assert(publicPdfPaths.every((pathname) => pathname === `${basePath}cv/CV_YirongQiang.pdf`), 'All public PDF links must use CV_YirongQiang.pdf.');
  const cvResponse = await fetch(cvUrl);
  assert.equal(cvResponse.status, 200, 'The public PDF CV is unavailable.');
  const cvBytes = Buffer.from(await cvResponse.arrayBuffer());
  assert.equal(cvBytes.subarray(0, 5).toString(), '%PDF-', 'The CV download is not a PDF.');
  assert(!/\/EmbeddedFiles\b|\/EmbeddedFile\b|\/FileAttachment\b/.test(cvBytes.toString('latin1')), 'The public PDF must not embed private attachments.');
}

async function checkKeyboardNavigation(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.keyboard.press('Tab');
  const skipDestination = await page.locator(':focus').evaluate((element) => {
    if (!(element instanceof HTMLAnchorElement) || !element.hash) return null;
    const target = document.getElementById(decodeURIComponent(element.hash.slice(1)));
    const main = document.querySelector('main');
    const bounds = element.getBoundingClientRect();
    if (!target || !(main === target || main?.contains(target)) || bounds.width <= 0 || bounds.height <= 0 || bounds.bottom <= 0 || bounds.top >= innerHeight) return null;
    return target.id;
  });
  assert(skipDestination, 'The first Tab should reveal a skip link to the main content.');
  await page.keyboard.press('Enter');
  const focusReachedMain = await page.evaluate((destination) => {
    const target = document.getElementById(destination);
    return target === document.activeElement || target.contains(document.activeElement);
  }, skipDestination);
  assert(focusReachedMain, 'The skip link should move keyboard focus into the main content.');
  for (let step = 0; step < 10; step += 1) {
    await page.keyboard.press('Tab');
    let focusScrolledIntoView = true;
    await page.waitForFunction(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return false;
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.top >= 0 && bounds.bottom <= innerHeight + 1;
    }, undefined, { timeout: 5000 }).catch(() => { focusScrolledIntoView = false; });
    const focus = await page.locator(':focus').evaluate((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return {
        element: element.tagName.toLowerCase(),
        label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 80),
        bounds: { top: bounds.top, bottom: bounds.bottom, width: bounds.width, height: bounds.height },
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
        interactive: element.matches('a[href], button, input, select, textarea'),
        visible: bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight,
        indicated: (style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none',
      };
    });
    assert(focusScrolledIntoView && focus.interactive && focus.visible && focus.indicated,
      `Tab step ${step + 1} should reveal an interactive target with a focus indicator: ${JSON.stringify(focus)}`);
  }
}

async function checkPageContent(page, phoneNumbers) {
  assert.match(await page.title(), /Yirong\s+Qiang/i, 'The page title should contain the name.');
  assert.equal(await page.locator('article[data-publication]').count(), 4, 'Expected four publications.');
  for (const sectionId of ['top', ...sectionIds]) {
    assert.equal(await page.locator(`#${sectionId}`).count(), 1, `Missing or duplicate section: ${sectionId}`);
  }
  const visibleText = await page.locator('body').innerText();
  assert(!/\byq\s*\./i.test(visibleText), 'The retired yq. wordmark must not appear in readable page text.');
  assert.equal((await page.locator('#omniintents .paper-status').textContent()).trim(), 'Published', 'OmniIntents should be marked Published.');
  assert.equal((await page.locator('#vlcot .paper-status').textContent()).trim(), 'Accepted', 'VLCoT should remain marked Accepted.');
  assert(!phonePattern().test(visibleText), 'A mobile phone number is visible on the page.');
  const digits = visibleText.replace(/\D/g, '');
  assert(phoneNumbers.every((number) => !digits.includes(number)), 'A source CV phone number is visible on the page.');
  assert.equal(await page.locator('a[href*=".docx" i]').count(), 0, 'The private Word document must not be linked.');
}

const phoneNumbers = await sourcePhoneNumbers();
await checkPublishedPrivacy(phoneNumbers);
await mkdir(screenshotRoot, { recursive: true });
const server = createServer((request, response) => {
  void serveStatic(request, response).catch(() => response.writeHead(500).end());
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
const pageUrl = `${origin}${basePath}`;
let browser;

try {
  const traversalResponse = await fetch(`${origin}${basePath}..%2fCV.docx`);
  assert(traversalResponse.status >= 400, 'The preview server must reject traversal outside dist.');
  if (basePath !== '/') {
    assert.equal((await fetch(`${origin}/`)).status, 404, 'Project sites must not be served outside BASE_PATH.');
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });

  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
  ]) {
    const context = await localContext(browser, { viewport: { width: viewport.width, height: viewport.height } }, origin);
    try {
      const page = await context.newPage();
      const pageErrors = [];
      const failedResponses = [];
      const failedRequests = [];
      const externalRequests = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('request', (request) => {
        const resource = new URL(request.url());
        if (['http:', 'https:'].includes(resource.protocol) && resource.origin !== origin) externalRequests.push(resource.href);
      });
      page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === origin) failedRequests.push(new URL(request.url()).pathname);
      });
      page.on('response', (response) => {
        if (new URL(response.url()).origin === origin && response.status() >= 400) failedResponses.push(`${response.status()} ${new URL(response.url()).pathname}`);
      });
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      await checkPageContent(page, phoneNumbers);
      await revealAndLoadPage(page);
      const figures = await checkImagePresentation(page);
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      assert(dimensions.contentWidth <= dimensions.width + 1, `${viewport.name}: horizontal overflow (${dimensions.contentWidth}px > ${dimensions.width}px).`);
      await checkInternalResources(page, origin);
      await checkMetadataAndDownloads(page, origin);
      await page.screenshot({ path: path.join(screenshotRoot, `${viewport.name}.png`), fullPage: true, animations: 'disabled' });
      await page.screenshot({ path: path.join(screenshotRoot, `${viewport.name}-hero.png`), animations: 'disabled' });
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const severeViolations = accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
      await writeFile(path.join(screenshotRoot, `${viewport.name}.json`), JSON.stringify({
        viewport,
        basePath,
        dimensions,
        figures,
        accessibilityViolations: accessibility.violations,
      }, null, 2));
      assert.deepEqual(severeViolations.map((violation) => `${violation.id}: ${violation.help}`), [], `${viewport.name}: serious or critical accessibility violations.`);
      await checkKeyboardNavigation(page);
      assert.deepEqual(failedResponses, [], `${viewport.name}: failed local network responses.`);
      assert.deepEqual(failedRequests, [], `${viewport.name}: failed local network requests.`);
      assert.deepEqual(externalRequests, [], `${viewport.name}: rendering should use only local resources.`);
      assert.deepEqual(pageErrors, [], `${viewport.name}: browser errors.`);
      console.log(`PASS ${viewport.name}: layout, figures, fonts, assets, metadata, CV, keyboard, and accessibility (${accessibility.violations.length} axe violations).`);
    } finally {
      await context.close();
    }
  }

  const reducedContext = await localContext(browser, { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }, origin);
  try {
    const page = await reducedContext.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    const motionFailures = await page.evaluate(() => {
      const excessiveDuration = (duration) => duration.split(',').some((part) => {
        const value = part.trim();
        return Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000) > 10;
      });
      return [...document.querySelectorAll('*')].flatMap((element) => ['', '::before', '::after'].flatMap((pseudo) => {
        const style = getComputedStyle(element, pseudo || null);
        const animated = style.animationName !== 'none' && excessiveDuration(style.animationDuration);
        return animated || excessiveDuration(style.transitionDuration) || style.scrollBehavior === 'smooth' ? [element.tagName.toLowerCase() + pseudo] : [];
      }));
    });
    assert.deepEqual(motionFailures, [], 'Reduced-motion preference should disable significant CSS motion.');
    const hiddenReveals = await page.locator('[data-reveal]').evaluateAll((elements) => elements.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 0.99).length);
    assert.equal(hiddenReveals, 0, 'Reduced-motion readers should see every content block immediately.');
    await checkKeyboardNavigation(page);
    console.log('PASS reduced motion and keyboard skip link.');
  } finally {
    await reducedContext.close();
  }

  const noScriptContext = await localContext(browser, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } }, origin);
  try {
    const page = await noScriptContext.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    await checkPageContent(page, phoneNumbers);
    for (const sectionId of sectionIds) {
      const section = page.locator(`#${sectionId}`);
      assert(await section.isVisible(), `Without JavaScript, ${sectionId} must remain visible.`);
      assert((await section.innerText()).trim().length > 20, `Without JavaScript, ${sectionId} must remain readable.`);
    }
    await revealAndLoadPage(page);
    await checkImagePresentation(page);
    await checkInternalResources(page, origin);
    await page.screenshot({ path: path.join(screenshotRoot, 'no-script.png'), fullPage: true, animations: 'disabled' });
    console.log('PASS content remains readable without JavaScript.');
  } finally {
    await noScriptContext.close();
  }
  console.log(`All browser checks passed for BASE_PATH=${basePath}. Screenshots: ${path.relative(projectRoot, screenshotRoot)}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
