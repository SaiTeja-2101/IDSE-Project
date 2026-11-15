const test = require('node:test');
const assert = require('node:assert/strict');
const {parseHTML} = require('../game-source/node_modules/linkedom');
const {default: Walkthrough, copyFinding, resultFinding} = require('./helpers/load-source.cjs')()(
    'public/game/components/interface/scout-story/run-walkthrough.js');

test('walkthrough facts distinguish copy outcomes and can describe a worse repair', () => {
    assert.equal(copyFinding({field: 'city', outcome: 'decision'})[0], 'The decision changed');
    assert.match(copyFinding({field: 'city', outcome: 'decision'})[1], /work test result stayed the same/);
    assert.match(copyFinding({field: 'academy', outcome: 'path'})[1], /same decision/);
    assert.match(copyFinding({field: 'city', outcome: 'same'})[1], /One CV/);
    assert.equal(resultFinding(3, 2, 'missed'), 'Repaired Scout missed 1 fewer qualified person.');
    assert.equal(resultFinding(3, 3, 'missed'), 'Both versions missed 3 qualified people.');
    assert.equal(resultFinding(1, 3, 'mistaken'), 'Repaired Scout made 2 more mistaken shortlists.');
});

test('a tree with no questions shows both leaf decisions and hiding city changes only inputs', t => {
    const previous = global.document;
    t.after(() => { global.document = previous; });
    global.document = parseHTML('<html></html>').document;
    const ui = new Walkthrough();
    const leaf = {decisionPath: [], decision: false, positiveLabels: 1, leafSupport: 4};
    const state = {experiment: {before: leaf, after: leaf, field: 'city', from: 'Chennai', to: 'Bengaluru',
        original: {name: 'Test CV'}, splitIndex: -1, outcome: 'same'}, repair: {id: 'hide-city'}};
    ui.act('run-step', 'next', state);
    let content = ui.render(state);
    assert.equal(content.querySelector('[data-value="next"][data-story-action="run-branch"]').disabled, true);
    assert.deepEqual([...content.querySelectorAll('.RunStamp')].map(n => n.textContent), ['Pass', 'Pass']);
    ui.act('run-step', 'next', state);
    ui.act('run-model', 'repaired', state);
    content = ui.render(state);
    assert.match(content.querySelector('.RunCard--changed').textContent, /City removed/);
    assert.match(content.textContent, /Your hiring choices and past Shortlist or Pass decisions/);
});
