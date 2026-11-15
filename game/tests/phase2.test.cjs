const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const babel = require('../game-source/node_modules/@babel/core');
const root = path.resolve(__dirname, '../game-source');
const cache = new Map();

// Load the actual application modules with their existing Babel dependency.
// No DOM or browser is needed for these data and animation checks.
function loadSource(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = {exports: {}};
    cache.set(filename, mod);
    const source = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        configFile: false, babelrc: false,
        plugins: [require.resolve('../game-source/node_modules/@babel/plugin-transform-modules-commonjs')],
    }).code;
    const nativeRequire = createRequire(filename);
    function localRequire(request) {
        if (!request.startsWith('.') && !request.startsWith('~/')) return nativeRequire(request);
        let resolved = request.startsWith('~/') ? path.join(root, request.slice(2)) : path.resolve(path.dirname(filename), request);
        if (resolved.endsWith('.json')) return nativeRequire(resolved);
        if (!path.extname(resolved)) resolved += '.js';
        return loadSource(path.relative(root, resolved));
    }
    vm.runInThisContext('(function(require, module, exports) {' + source + '\n})', {filename})(localRequire, mod, mod.exports);
    return mod.exports;
}

test('pause preserves waiting scanner tweens and delayed callbacks across repeated cycles', () => {
    const TweenMax = require('../game-source/node_modules/gsap');
    const {createAnimationPauseController} = loadSource('public/game/controllers/game/animationPause.js');
    const controller = createAnimationPauseController(TweenMax);
    const active = TweenMax.to({x: 0}, 30, {x: 1});
    const waitingScanner = TweenMax.to({x: 0}, 30, {x: 1, paused: true});
    const delayed = TweenMax.delayedCall(30, () => assert.fail('callback ran early'));
    try {
        for (let cycle = 0; cycle < 3; cycle++) {
            controller.pause();
            controller.pause();
            assert.equal(active.paused(), true);
            assert.equal(delayed.paused(), true);
            assert.equal(waitingScanner.paused(), true);
            controller.resume();
            controller.resume();
            assert.equal(active.paused(), false);
            assert.equal(delayed.paused(), false);
            assert.equal(waitingScanner.paused(), true);
        }
    } finally {
        active.kill(); waitingScanner.kill(); delayed.kill(); TweenMax.ticker.sleep();
    }
});

test('every imported applicant has the same city in the CV, sprite, and model input', () => {
    const {cvCollection} = loadSource('public/game/assets/text/cvCollection.js');
    const {normalizeCandidates} = loadSource('public/game/controllers/common/candidateData.js');
    const {candidateView} = loadSource('public/game/controllers/common/candidateView.js');
    const {preprocResumes, predictPreprocResume} = loadSource('public/game/controllers/machine-learning/modelTraining.js');
    const pools = [cvCollection.cvData, cvCollection.cvDataEqual, [cvCollection.specialCandidate]];
    for (const name of ['badCvTestData', 'goodCvTestData', 'equalCvTestData']) {
        pools.push(normalizeCandidates(require('../game-source/public/game/assets/text/' + name + '.json').candidates));
    }
    for (const pool of pools) {
        const [trainingRows] = preprocResumes(pool, [0, 1, 2, 3]);
        pool.forEach((person, i) => {
            const expected = person.color === 'orange' ? {id: 1, name: 'Bengaluru'} : {id: 0, name: 'Chennai'};
            assert.equal(person.city, expected.id);
            assert.equal(person.cityName, expected.name);
            assert.equal(candidateView(person).city, expected.name);
            assert.equal(trainingRows[i][4], expected.id);
            assert.deepEqual(predictPreprocResume([person], [0, 1, 2, 3])[0], trainingRows[i]);
        });
    }
});

test('CV exposes the exact four qualification values read by the retained model', () => {
    const {candidateView, fillCandidateCard} = loadSource('public/game/controllers/common/candidateView.js');
    const {preprocResumes} = loadSource('public/game/controllers/machine-learning/modelTraining.js');
    const person = {name: 'Example', color: 'orange', city: 1, empl: 1, qualifications: [8.1, 4.2, 6.3, 7.4]};
    const view = candidateView(person);
    const [rows] = preprocResumes([person]);
    assert.deepEqual([view.skill, view.school, view.experience, view.ambition], rows[0].slice(0, 4));
    assert.equal(view.academy, undefined);
    const elements = new Map();
    function element() { return {style: {}, querySelector: select, setAttribute(key, value) { this[key] = value; }}; }
    function select(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); }
    fillCandidateCard({querySelector: select}, person);
    assert.equal(select('.Resume__details').hidden, false);
    assert.equal(select('.Resume__city').textContent, 'Bengaluru');
    assert.match(fs.readFileSync(path.join(root, 'public/game/components/interface/ui-resume/ui-resume.pug'), 'utf8'), /cvScore\('ambition'/);
});

test('city adaptation keeps source data intact and rejects unknown sprite identities', () => {
    const {normalizeCandidates} = loadSource('public/game/controllers/common/candidateData.js');
    const source = {color: 'blue', city: 1, qualifications: [1, 2, 3, 4]};
    const [adapted] = normalizeCandidates([source]);
    assert.equal(adapted.city, 0);
    assert.equal(source.city, 1);
    assert.throws(() => normalizeCandidates([{color: 'purple'}]), /unknown city/);
});
