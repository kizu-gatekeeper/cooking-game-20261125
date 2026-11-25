// Sizzle Station — make.fun entry program (Node 22, standard library only).
//
// The game lives in this repository as plain static files under game/ and
// its screenshots under screenshots/. This program hands them in: it copies
// both folders into the grader's output directory and writes dossier.json
// with the vendored make.fun dossier builder.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Directory holding this file; the game and screenshots sit beside it.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function freshDir(path) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

function copyTree(from, to) {
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

// The caps mirror the sealed scorer's limits so a run that passes here
// cannot fail the gate on size: at most 4 screenshots of 256 KiB, at most
// 993 entries / 48 MiB under game/, paths under 1000 bytes.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

freshDir(outputDir);
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, dossierOptions),
);
