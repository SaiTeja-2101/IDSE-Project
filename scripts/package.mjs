import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts/submission');
await fs.mkdir(output, {recursive: true});
const folder = await fs.mkdtemp(path.join(output, 'hire-and-seek-'));
const excluded = new Set(['node_modules', '.git', '.cache', '.env', '.DS_Store']);
const filter = source => !path.relative(root, source).split(path.sep).some(part => excluded.has(part) || part.startsWith('.env.'));
for (const name of ['game-source', 'website-source', 'scripts', 'tests', 'docs', 'dist', 'README.md', 'TODO.md', 'package.json', '.gitignore']) {
    await fs.cp(path.join(root, name), path.join(folder, name), {recursive: true, filter});
}
await fs.writeFile(path.join(folder, 'START-HERE.txt'), `HIRE & SEEK\nYou hire. It learns.\n\nRequires Node.js 22.\n\nTO PLAY WITHOUT INSTALLING DEPENDENCIES:\nOpen a terminal in this folder.\nRun: node scripts/preview.mjs\nOpen: http://127.0.0.1:4000/\nKeep the terminal open while playing.\n\nTO EDIT OR REBUILD:\nnpm run setup\nnpm run build\nnpm test\n\nRead docs/DELIVERY.md for current verification limits.\nPeer playtesting and final browser visual/audio checks must be real. They are not claimed as complete.\n`);
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
const zip = folder + '.zip';
const quote = value => "'" + value.replace(/'/g, "''") + "'";
const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    `Compress-Archive -LiteralPath ${quote(folder)} -DestinationPath ${quote(zip)} -CompressionLevel Optimal`], {stdio: 'inherit', windowsHide: true});
if (result.error || result.status !== 0) throw result.error || new Error('Could not create the submission ZIP. The unpacked folder is still available: ' + folder);
const digest = createHash('sha256').update(await fs.readFile(zip)).digest('hex');
await fs.writeFile(zip + '.sha256', digest + '  ' + path.basename(zip) + '\n');
console.log(JSON.stringify({folder, zip, sha256: digest, files: manifest.length}, null, 2));
