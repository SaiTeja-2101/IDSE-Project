const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const babel = require('../../game-source/node_modules/@babel/core');
const root = path.resolve(__dirname, '../../game-source');

module.exports = function sourceLoader(mocks = {}) {
    const cache = new Map();
    const replacements = new Map(Object.entries(mocks).map(([relative, value]) => [path.resolve(root, relative), value]));
    function load(relative) {
        const filename = path.resolve(root, relative);
        if (replacements.has(filename)) return replacements.get(filename);
        if (cache.has(filename)) return cache.get(filename).exports;
        const mod = {exports: {}};
        cache.set(filename, mod);
        const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
            configFile: false, babelrc: false,
            plugins: [require.resolve('../../game-source/node_modules/@babel/plugin-transform-modules-commonjs')],
        }).code;
        const nativeRequire = createRequire(filename);
        function localRequire(request) {
            if (Object.prototype.hasOwnProperty.call(mocks, request)) return mocks[request];
            if (!request.startsWith('.') && !request.startsWith('~/')) return nativeRequire(request);
            let target = request.startsWith('~/') ? path.join(root, request.slice(2)) : path.resolve(path.dirname(filename), request);
            if (target.endsWith('.json')) return nativeRequire(target);
            if (!path.extname(target)) target += '.js';
            return load(path.relative(root, target));
        }
        try {
            vm.runInThisContext('(function(require,module,exports){' + code + '\n})', {filename})(localRequire, mod, mod.exports);
        } catch (error) { cache.delete(filename); throw error; }
        return mod.exports;
    }
    return load;
};
