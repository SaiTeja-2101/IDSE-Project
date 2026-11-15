import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const combined = process.argv.includes('--combined');
const courseRoot = path.dirname(root);
const bite = path.join(courseRoot, 'resilientbite');
const submission = path.join(courseRoot, 'submission');
const output = path.join(combined ? courseRoot : root, 'artifacts/submission');
const reportName = 'Hire-and-Seek-Project-Report.pdf';
const sourceReport = path.join(root, 'report/hire-and-seek.pdf');
const report = await fs.access(sourceReport).then(() => sourceReport, () => path.join(root, reportName));
await fs.access(report).catch(error => {
    throw new Error('Build report/hire-and-seek.pdf before packaging. See report/README.md.', {cause: error});
});
if (combined) {
    for (const name of ['README.md', 'food_pred (1).ipynb', 'ResilientBite Phase Report.pdf', 'forecast_app/app.py']) {
        await fs.access(path.join(bite, name));
    }
    for (const name of ['README.md', 'Hire-and-Seek-Report.pdf', 'ResilientBite-Report.pdf', 'ResilientBite-Presentation.pptx']) {
        await fs.access(path.join(submission, name));
    }
}
await fs.mkdir(output, {recursive: true});
const bundleName = combined ? 'idse-course-project' : 'hire-and-seek';
const folder = await fs.mkdtemp(path.join(output, bundleName + '-'));
const gameFolder = combined ? path.join(folder, 'game') : folder;
const excluded = new Set(['node_modules', '.git', '.cache', '.env', '.DS_Store', '.venv', '__pycache__', '.ipynb_checkpoints']);
const filter = source => !path.relative(courseRoot, source).split(path.sep).some(part => excluded.has(part) || part.startsWith('.env.'));
await fs.mkdir(gameFolder, {recursive: true});
for (const name of ['game-source', 'website-source', 'scripts', 'tests', 'docs', 'dist', 'README.md', 'TODO.md', 'package.json', 'vercel.json', '.gitignore']) {
    await fs.cp(path.join(root, name), path.join(gameFolder, name), {recursive: true, filter});
}
await fs.copyFile(report, path.join(gameFolder, reportName));
await fs.writeFile(path.join(gameFolder, 'START-HERE.txt'), `HIRE & SEEK\nYou hire. It learns.\n\nIntroduction to Data Science for Engineers\nAkula Sai Teja (CS24I1054)\nKarthik Kavuri (CS24I1025)\nMuvvala Harsha Vardhan (EC24B1019)\n\nPLAY THE GAME\nInstall Node.js 22 if you do not already have it. No npm install is needed to play the included build.\nOpen a terminal in the folder containing this file.\nRun: node scripts/preview.mjs\nOpen: http://127.0.0.1:4000/game/\nKeep the terminal open while playing.\n\nASSIGNMENT DOCUMENTS\nHire-and-Seek-Project-Report.pdf: Project report, screenshots, results and verification.\nREADME.md: How to play and learning objectives.\ndocs/RUBRIC.md: Where to find each assignment requirement.\ndocs/PLAYTEST_EVIDENCE.md: Peer comments and changes made after feedback.\ndocs/DEMO.md: A repeatable classroom demo.\ndocs/DELIVERY.md: Verification record and deployment notes.\n\nTO EDIT OR REBUILD\nnpm run setup\nnpm run build\nnpm test\n`);
if (combined) {
    for (const name of ['README.md', 'package.json', 'vercel.json', '.gitignore']) {
        await fs.copyFile(path.join(courseRoot, name), path.join(folder, name));
    }
    await fs.cp(bite, path.join(folder, 'resilientbite'), {recursive: true, filter: source =>
        filter(source) && !/\.(apk|idsig)$/i.test(source) &&
        !path.relative(bite, source).split(path.sep).includes('build')});
    await fs.cp(submission, path.join(folder, 'submission'), {recursive: true, filter});
}
async function files(dir) {
    const entries = await fs.readdir(dir, {withFileTypes: true});
    const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
    return groups.flat();
}
const manifest = [];
for (const file of (await files(folder)).sort()) {
    const hash = createHash('sha256').update(await fs.readFile(file)).digest('hex');
    manifest.push(hash + '  ' + path.relative(folder, file).split(path.sep).join('/'));
}
await fs.writeFile(path.join(folder, 'MANIFEST.sha256'), manifest.join('\n') + '\n');
const stagedZip = folder + '.zip';
const zip = path.join(output, bundleName + '.zip');
const quote = value => "'" + value.replace(/'/g, "''") + "'";
const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    `Compress-Archive -LiteralPath ${quote(folder)} -DestinationPath ${quote(stagedZip)} -CompressionLevel Optimal`], {stdio: 'inherit', windowsHide: true});
if (result.error || result.status !== 0) throw result.error || new Error('Could not create the submission ZIP. The unpacked folder is still available: ' + folder);
const digest = createHash('sha256').update(await fs.readFile(stagedZip)).digest('hex');
await fs.copyFile(stagedZip, zip);
await fs.writeFile(zip + '.sha256', digest + '  ' + path.basename(zip) + '\n');
const stagingRelative = path.relative(path.resolve(output), path.resolve(folder));
if (!stagingRelative || stagingRelative.startsWith('..') || path.isAbsolute(stagingRelative) || !path.basename(folder).startsWith(bundleName + '-')) {
    throw new Error('Refusing to remove a staging folder outside the package output directory.');
}
await fs.rm(folder, {recursive: true, force: true});
await fs.rm(stagedZip);
console.log(JSON.stringify({zip, sha256: digest, files: manifest.length}, null, 2));
