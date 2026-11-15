import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir) {
    const entries = await fs.readdir(dir, {withFileTypes: true});
    const groups = await Promise.all(entries.map(entry => entry.isDirectory()
        ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
    return groups.flat();
}

export async function inspectAtlas(file) {
    const atlas = JSON.parse(await fs.readFile(file, 'utf8'));
    if (!atlas.meta?.image || !atlas.frames) return [];
    const errors = [];
    const image = path.resolve(path.dirname(file), atlas.meta.image);
    try { await fs.access(image); } catch { errors.push(`Missing atlas image: ${image}`); }
    for (const [animation, frames] of Object.entries(atlas.animations || {})) {
        for (const frame of frames) if (!atlas.frames[frame]) errors.push(`Unknown frame ${frame} in ${animation}: ${file}`);
    }
    return errors;
}

export async function checkAssets(root = project) {
    const assets = path.join(root, 'dist/game/assets');
    const files = await walk(assets);
    const errors = [];
    const atlases = files.filter(file => file.includes(`${path.sep}spritesheets${path.sep}`) && file.endsWith('.json'));
    for (const file of atlases) errors.push(...await inspectAtlas(file));
    for (const file of ['fonts/vt323-regular.woff', 'js/local-events.js', 'text/textTemplate.js', 'sound/button-click.mp3']) {
        try { await fs.access(path.join(assets, file)); } catch { errors.push(`Missing game resource: ${file}`); }
    }
    for (const relative of ['dist/index.html', 'dist/game/index.html', 'dist/game/js/bundle-game.js', 'dist/game/css/styles-game.min.css']) {
        try {
            const stat = await fs.stat(path.join(root, relative));
            if (!stat.size) errors.push(`Empty build output: ${relative}`);
        } catch { errors.push(`Missing build output: ${relative}`); }
    }
    const html = await fs.readFile(path.join(root, 'dist/game/index.html'), 'utf8');
    const sounds = await fs.readFile(path.join(root, 'game-source/public/game/controllers/constants/sounds.js'), 'utf8');
    for (const [, name] of sounds.matchAll(/^[\s]*[A-Z_]+: '([a-z-]+)'/gm)) {
        try { await fs.access(path.join(assets, 'sound', name + '.mp3')); }
        catch { errors.push(`Missing sound: ${name}`); }
    }
    for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        if (/^(?:https?:|#|data:)/.test(target)) continue;
        try { await fs.access(path.resolve(root, 'dist/game', target)); } catch { errors.push(`Broken game HTML resource: ${target}`); }
    }
    for (const relative of ['dist/index.html', 'dist/game/index.html']) {
        const text = await fs.readFile(path.join(root, relative), 'utf8');
        if (/googletagmanager\.com|cloudflareinsights\.com|connect\.facebook\.net/.test(text)) errors.push(`External tracking remains in ${relative}`);
    }
    return {assetCount: files.length, atlasCount: atlases.length, errors};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const result = await checkAssets();
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
}
