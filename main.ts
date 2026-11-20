// Neon Coast Cover Studio — submission entrypoint (Node 22, stdlib only).
//
// Stages the finished app for the make.fun grader: it copies app/ and
// screenshots/ from beside this file into the output directory, then writes
// dossier.json, the summary the judge reads, with the vendored library.
// The output directory is /output inside the grader; outside it, set
// MAKEFUN_OUTPUT_DIR to a scratch directory instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Nothing here builds the app — the cover studio in app/ is already done.
// This file only hands it in, checking the payload on the way so a broken
// entry fails loudly here instead of silently at grading time.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's caps (reference/gate.json). Only text_max_bytes shapes the
// dossier bytes; the rest refuse an entry the scorer would refuse anyway:
// at most 4 screenshots, each at most 256 KiB; at most 993 files in app/,
// 48 MiB of app files in total, and no app/ path over 1000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const MIN_SCREENSHOTS = 3;
const EXPECTED_SCREENSHOTS = 4;

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function logStep(step: string, detail = ''): void {
  console.log(`[submit] ${step}${detail ? ` — ${detail}` : ''}`);
}

// The app must at least have its entry page, or the grader would receive
// an empty shell. A missing screenshots/ folder is fatal too.
function checkInputs(): void {
  const index = join(root, 'app', 'index.html');
  if (!existsSync(index)) fail(`app/index.html not found at ${index}`);
  if (!statSync(index).isFile()) fail(`app/index.html is not a file`);
  if (!existsSync(join(root, 'screenshots'))) fail('screenshots/ folder missing');
  logStep('inputs ok', 'app/index.html present');
}

// Every screenshot must be a real file inside the 256 KiB cap, and there
// must be enough of them to show the studio (the first by name is the cover).
// Round 3 ships exactly four: two exported covers, the editor, one more cover.
function checkScreenshots(): string[] {
  const dir = join(root, 'screenshots');
  const names = readdirSync(dir).sort();
  if (names.length < MIN_SCREENSHOTS) {
    fail(`need at least ${MIN_SCREENSHOTS} screenshots, found ${names.length}`);
  }
  if (names.length > CAPS.screenshots.max) {
    fail(`too many screenshots: ${names.length} > ${CAPS.screenshots.max}`);
  }
  if (names.length !== EXPECTED_SCREENSHOTS) {
    fail(`round 3 ships ${EXPECTED_SCREENSHOTS} screenshots, found ${names.length}`);
  }
  for (const name of names) {
    const path = join(dir, name);
    const info = statSync(path);
    if (!info.isFile()) fail(`screenshot ${name} is not a file`);
    if (info.size > CAPS.screenshots.max_bytes) {
      fail(`screenshot ${name} is ${info.size} bytes, over the 262144 limit`);
    }
  }
  logStep('screenshots ok', `${names.length} files, all within 256 KiB`);
  return names;
}

function stagePayload(): void {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  // Confirm the copy actually landed before the dossier is built from it.
  if (!existsSync(join(outDir, 'app', 'index.html'))) fail('staging failed: app/index.html missing in output');
  if (!existsSync(join(outDir, 'screenshots', '1-cover.jpg'))) fail('staging failed: first screenshot missing in output');
  logStep('staged', `app/ + screenshots/ copied to ${outDir}`);
}

// Write the dossier, then read it back and confirm the fields the judge
// needs are actually there before declaring success.
function writeAndVerifyDossier(): void {
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, buildDossier(outDir, CAPS));
  const parsed = JSON.parse(readFileSync(dossierPath, 'utf8')) as Record<string, unknown>;
  for (const field of ['cover', 'images', 'schema', 'text']) {
    if (!(field in parsed)) fail(`dossier.json is missing its "${field}" field`);
  }
  const images = parsed.images;
  if (!Array.isArray(images) || images.length !== EXPECTED_SCREENSHOTS) {
    fail(`dossier.json lists ${Array.isArray(images) ? images.length : 'no'} images, expected ${EXPECTED_SCREENSHOTS}`);
  }
  if (typeof parsed.cover !== 'number' || parsed.cover < 0 || parsed.cover >= images.length) {
    fail(`dossier.json has an invalid cover index: ${String(parsed.cover)}`);
  }
  const size = statSync(dossierPath).size;
  logStep('dossier written', `${dossierPath} (${size} bytes)`);
}

try {
  checkInputs();
  checkScreenshots();
  stagePayload();
  writeAndVerifyDossier();
  logStep('done', 'entry ready for grading');
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}
