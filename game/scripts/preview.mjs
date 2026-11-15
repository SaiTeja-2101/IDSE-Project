import http from 'node:http';
import fs from 'node:fs';
import {stat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.map': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf'};

export function createPreviewServer() {
    return http.createServer(async (request, response) => {
        try {
            if (!['GET', 'HEAD'].includes(request.method)) {
                response.writeHead(405, {Allow: 'GET, HEAD'}).end('Method not allowed');
                return;
            }
            const url = new URL(request.url, 'http://127.0.0.1');
            const pathname = decodeURIComponent(url.pathname);
            if (pathname.includes('\0')) throw new URIError('Invalid path');
            let target = path.resolve(root, '.' + pathname);
            if (target !== root && !target.startsWith(root + path.sep)) {
                response.writeHead(403).end('Forbidden'); return;
            }
            let info;
            try { info = await stat(target); } catch {
                target += '.html';
                info = await stat(target);
            }
            if (info.isDirectory()) {
                if (!pathname.endsWith('/')) {
                    response.writeHead(302, {Location: url.pathname + '/' + url.search}).end(); return;
                }
                target = path.join(target, 'index.html');
                info = await stat(target);
            }
            const actual = await realpath(target);
            if (!actual.startsWith(root + path.sep) || !info.isFile()) {
                response.writeHead(403).end('Forbidden'); return;
            }
            response.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
            if (request.method === 'HEAD') response.end();
            else fs.createReadStream(actual).on('error', () => response.destroy()).pipe(response);
        } catch (error) {
            response.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
        }
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.PORT || 4000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
    const server = createPreviewServer();
    server.on('error', error => {
        console.error(error.code === 'EADDRINUSE' ? `Port ${port} is occupied. Stop the other server or set PORT to another number.` : error.message);
        process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/game/`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
