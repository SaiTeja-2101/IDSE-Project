import {spawn, spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const cache = path.join(root, '.cache/npm');
const folders = ['website-source', 'game-source'];
const mode = process.argv[2];

function run(folder, args) {
    console.log(`\n[${folder}] npm ${args.join(' ')}`);
    const result = spawnSync(process.execPath, [npmCli, ...args], {
        cwd: path.join(root, folder), stdio: 'inherit',
        env: {...process.env, npm_config_cache: cache},
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}

if (mode === 'setup' || mode === 'bootstrap') {
    for (const folder of folders) {
        const lock = path.join(root, folder, 'package-lock.json');
        if (mode === 'setup' && !existsSync(lock)) throw new Error(`Missing lockfile: ${lock}`);
        run(folder, [mode === 'setup' ? 'ci' : 'install', '--include=dev', '--no-audit', '--no-fund']);
    }
} else if (mode === 'build') {
    for (const folder of folders) run(folder, ['run', 'build']);
} else if (mode === 'dev') {
    run('website-source', ['run', 'build']);
    const child = spawn(process.execPath, [npmCli, 'start'], {
        cwd: path.join(root, 'game-source'), stdio: 'inherit',
    });
    child.on('error', error => {console.error(error); process.exitCode = 1;});
    child.on('exit', code => {process.exitCode = code || 0;});
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
} else {
    throw new Error('Expected setup, bootstrap, build, or dev');
}
