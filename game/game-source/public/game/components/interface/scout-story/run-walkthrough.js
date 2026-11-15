import {ACADEMIES, CITIES} from '../../../learning/candidates';

const scenes = [
    ['Training example', 'Inside a training example', 'Open a detail on the CV, then switch between the two answers about the same person.'],
    ['Decision tree', 'One change, two routes', 'Follow the questions Scout asked about the original CV and its copy.'],
    ['Repair', 'What the repair changed', 'Switch between the two versions of Scout to see what changed during training.'],
    ['Final test', 'The fresh batch', 'Compare both versions of Scout on the same 200 new CVs.'],
];
const fields = {skill: 'Skill', experience: 'Experience', city: 'City', academy: 'Academy'};
const models = {original: 'Original Scout', repaired: 'Repaired Scout'};
const measures = {
    missed: ['Qualified people missed', 'A qualified person gets passed over. This is a false negative.'],
    mistaken: ['Mistaken shortlists', 'A person who did not qualify gets shortlisted. This is a false positive.'],
    city: ['By city', 'Out of the people who qualified in each city, how many did Scout shortlist?'],
};
const decision = value => value ? 'Shortlist' : 'Pass';
const fmt = (key, v) => key === 'skill' ? v + '/100' : key === 'experience' ? v + (v === 1 ? ' year' : ' years') : String(v);

function el(tag, name, value) {
    const item = document.createElement(tag);
    if (name) item.className = name;
    if (value !== undefined) item.textContent = value;
    return item;
}
function button(text, action, value, pressed) {
    const item = el('button', 'RunButton', text);
    item.type = 'button'; item.dataset.storyAction = action;
    if (value !== undefined) item.dataset.value = value;
    if (pressed !== undefined) item.setAttribute('aria-pressed', String(pressed));
    return item;
}
function group(name, ...children) {
    const item = el('div', 'RunControls');
    item.setAttribute('role', 'group'); item.setAttribute('aria-label', name);
    item.append(...children); return item;
}
function card(tag = 'section') { return el(tag, 'RunCard'); }
function note(title, message) {
    const item = el('aside', 'RunNote');
    item.append(el('strong', '', title), el('p', '', message));
    return item;
}

export function copyFinding(experiment) {
    const field = fields[experiment.field].toLowerCase();
    if (experiment.outcome === 'decision') return ['The decision changed',
        'Changing only ' + field + ' changed Scout’s decision for this CV. The work test result stayed the same. Scout used a shortcut here.'];
    if (experiment.outcome === 'path') return ['The route changed',
        'Changing ' + field + ' sent the CV down a different branch. Both routes still ended in the same decision.'];
    return ['Both CVs took the same route',
        'Changing ' + field + ' made no difference to Scout’s questions or decision in this test. One CV cannot tell us what happens to everyone.'];
}

function training(container, s, ui) {
    const cv = s.firstReviewed;
    const grid = el('div', 'RunGrid'), file = card(), answer = card();
    file.append(el('p', 'RunEyebrow', 'FIRST CV YOU REVIEWED'), el('h3', '', cv.name));
    const entries = el('div', 'RunFields');
    entries.setAttribute('role', 'group'); entries.setAttribute('aria-label', 'Pick a CV detail');
    for (const key of Object.keys(fields)) {
        const row = button('', 'run-feature', key, ui.feature === key);
        row.append(el('span', '', fields[key]), el('strong', '', fmt(key, cv[key])));
        entries.append(row);
    }
    file.append(entries);
    answer.append(el('p', 'RunEyebrow', 'WHAT SCOUT READS'),
        el('h3', '', fields[ui.feature] + ': ' + fmt(ui.feature, cv[ui.feature])),
        el('p', '', 'This is a feature: a detail Scout can use to make a decision.'),
        el('p', 'RunEyebrow RunAnswerTitle', 'TWO ANSWERS ABOUT THIS PERSON'),
        group('Answer to show', button('Your hiring choice', 'run-answer', 'hiring', ui.answer === 'hiring'),
            button('Work test result', 'run-answer', 'test', ui.answer === 'test')));
    const readout = el('div', 'RunReadout');
    readout.setAttribute('aria-live', 'polite');
    if (ui.answer === 'hiring') readout.append(el('strong', 'RunStamp', decision(cv.playerDecision)),
        el('p', '', 'This was the training label for this CV. A label is the answer Scout learns from.'));
    else readout.append(el('strong', 'RunStamp', cv.assessedReady ? 'Qualified' : 'Did not qualify'),
        el('p', '', 'In this game, the work test checks for at least 60/100 in skill and one year of experience.'));
    answer.append(readout);
    grid.append(file, answer); container.append(grid,
        note(cv.playerDecision === cv.assessedReady ? 'Two answers, two meanings' : 'The answers differed on this CV',
            'Your choice records what you decided. The work test records whether the person qualified in the game. Past decisions can teach Scout to repeat past mistakes.'));
}

function question(step) {
    const category = step.feature === 'city' ? CITIES[0] : step.feature === 'academy' ? ACADEMIES[0] : null;
    return category ? [step.label + ': ' + category + '?', step.branch === 'right' ? 'Yes' : 'No', step.value] :
        [step.label + ' below ' + fmt(step.feature, step.splitValue) + '?', step.branch === 'left' ? 'Yes' : 'No', fmt(step.feature, step.value)];
}

function route(title, value, field, prediction, ui, split) {
    const panel = card(), {decisionPath, leafSupport, positiveLabels} = prediction;
    panel.append(el('p', 'RunEyebrow', title), el('h3', 'RunChanged', fields[field] + ': ' + value));
    const list = el('ol', 'RunRoute');
    decisionPath.slice(0, ui.branch).forEach((step, i) => {
        const [ask, answer, actual] = question(step), fork = el('li', i === split ? 'RunFork RunFork--split' : 'RunFork');
        fork.append(el('strong', '', ask), el('span', '', actual + ' · ' + answer));
        if (i === split) fork.append(el('small', '', 'The routes split here'));
        list.append(fork);
    });
    if (list.childElementCount) panel.append(list);
    if (!decisionPath.length) panel.append(el('p', '', 'Scout’s tree has no questions. Every CV goes to the same answer.'));
    if (ui.branch >= decisionPath.length) panel.append(el('strong', 'RunStamp', decision(prediction.decision)),
        el('p', '', positiveLabels + ' of ' + leafSupport + ' training examples at this end of the tree were labelled Shortlist.'));
    else panel.append(el('p', 'RunQuiet', 'Follow the next branch to reveal more.'));
    return panel;
}

function paths(container, s, ui) {
    const e = s.experiment, total = Math.max(e.before.decisionPath.length, e.after.decisionPath.length);
    const grid = el('div', 'RunGrid');
    grid.append(route('ORIGINAL CV', e.from, e.field, e.before, ui, e.splitIndex),
        route('TEST COPY', e.to, e.field, e.after, ui, e.splitIndex));
    const step = button('Reveal next branch', 'run-branch', 'next');
    step.disabled = ui.branch >= total;
    const restart = button('Reset branches', 'run-branch', 'reset'); restart.disabled = !ui.branch;
    const depth = el('span', 'RunQuiet', total ? ui.branch + ' of ' + total + ' steps revealed' : 'No questions in this tree');
    depth.setAttribute('role', 'status');
    container.append(el('p', 'RunQuiet', e.original.name + ' · Only ' + fields[e.field].toLowerCase() + ' changed.'),
        group('Tree replay', step, restart, depth), grid);
    if (ui.branch >= total) container.append(note(...copyFinding(e)), note('One CV is one clue',
        'In this fictional data, academy is linked to city. A detail that hints at another detail is called a proxy. The copy test only tells you what happened to this CV.'));
    else container.append(note('Decision tree', 'Scout learned a series of questions from the training examples. The details on each CV determine which branches it follows.'));
}

function repair(container, s, ui) {
    const hideCity = s.repair.id === 'hide-city', repaired = ui.model === 'repaired';
    const graph = el('div', 'RunDiagram'), examples = el('div', 'RunInputs'), arrow = el('span', 'RunArrow');
    const inputs = card(), labels = card(), model = card();
    if (repaired) (hideCity ? inputs : labels).classList.add('RunCard--changed');
    inputs.append(el('p', 'RunEyebrow', 'FEATURES'), el('h3', '', 'What Scout reads'));
    const chips = el('ul', 'RunChips');
    for (const name of Object.values(fields)) {
        const removed = repaired && hideCity && name === 'City';
        chips.append(el('li', removed ? 'RunRemoved' : '', removed ? 'City removed' : name));
    }
    inputs.append(chips);
    labels.append(el('p', 'RunEyebrow', 'LABELS'), el('h3', '', 'What Scout learns from'), el('p', '',
        repaired && !hideCity ? 'Who passed the work test' : 'Your hiring choices and past Shortlist or Pass decisions'));
    model.append(el('p', 'RunEyebrow', 'DECISION TREE'), el('h3', '', models[ui.model]),
        el('p', '', repaired ? 'Trained again on the same CVs.' : 'Trained on your CVs and the archive you chose.'));
    examples.append(inputs, labels);
    arrow.setAttribute('aria-hidden', 'true');
    graph.append(examples, arrow, model);
    container.append(group('Model to inspect', ...Object.entries(models).map(([key, title]) => button(title, 'run-model', key, key === ui.model))), graph,
        note(hideCity ? 'Your repair: Hide city' : 'Your repair: Learn from work tests', hideCity ?
            'You removed city from what Scout can read and kept the same training answers. It can still see academy, which may hint at city.' :
            'You kept the same CV details and replaced the old hiring answers with the work test results. Scout learned from a different label.'));
}

export function resultFinding(original, repaired, measure) {
    const noun = count => measure === 'missed' ? 'qualified ' + (count === 1 ? 'person.' : 'people.') :
        (count === 1 ? 'mistaken shortlist.' : 'mistaken shortlists.');
    const verb = measure === 'missed' ? ' missed ' : ' made ';
    if (original === repaired) return 'Both versions' + verb + original + ' ' + noun(original);
    const delta = Math.abs(repaired - original);
    return 'Repaired Scout' + verb + delta + (repaired < original ? ' fewer ' : ' more ') + noun(delta);
}

function bar(name, count, max, caption, style) {
    const row = el('div', 'RunBarRow ' + style), track = el('div', 'RunBarTrack'), fill = el('div', 'RunBarFill');
    track.setAttribute('aria-hidden', 'true');
    fill.style.setProperty('--run-fill', (max ? 100 * count / max : 0) + '%');
    track.append(fill); row.append(el('span', '', name), el('strong', '', caption), track); return row;
}

function results(container, s, ui) {
    const {original, repaired} = s.finalResult, metric = ui.metric, panel = card();
    const row = group('Final result to explore', ...Object.entries(measures).map(([key, item]) => button(item[0], 'run-metric', key, key === metric)));
    panel.append(el('p', 'RunEyebrow', original.overallMetrics.total + ' NEW CVS · SAME BATCH FOR BOTH MODELS'),
        el('h3', '', measures[metric][0]), el('p', '', measures[metric][1]));
    if (metric === 'city') {
        for (const city of CITIES) {
            const section = el('section', 'RunResultGroup'); section.append(el('h4', '', city));
            for (const [name, report] of Object.entries({original, repaired})) {
                const {truePositive, ready} = report.cityMetrics[city];
                section.append(bar(models[name], truePositive, ready, ready ? truePositive + ' of ' + ready + ' qualified people' : 'No qualified people in this batch', name));
            }
            panel.append(section);
        }
    } else {
        const key = metric === 'missed' ? 'falseNegative' : 'falsePositive';
        for (const [name, report] of Object.entries({original, repaired})) {
            const m = report.overallMetrics, max = metric === 'missed' ? m.ready : m.total - m.ready;
            panel.append(bar(models[name], m[key], max, String(m[key]), name));
        }
        panel.append(el('p', 'RunQuiet', 'Bar scale: 0 to ' + (metric === 'missed' ? original.overallMetrics.ready + ' qualified people.' :
            original.overallMetrics.total - original.overallMetrics.ready + ' people who did not qualify.')),
        el('p', 'RunResultLine', resultFinding(original.overallMetrics[key], repaired.overallMetrics[key], metric)));
    }
    container.append(row, panel, note('Why use new CVs?', 'Scout did not see these CVs in training or practice. Using the same fresh batch for both models lets you check whether the repair helped on new people.'));
}

export default class RunWalkthrough {
    constructor() { Object.assign(this, {index: 0, feature: 'skill', answer: 'hiring', branch: 0, model: 'original', metric: 'missed'}); }

    act(action, value, state) {
        if (action === 'run-step') this.index = Math.max(0, Math.min(scenes.length - 1, this.index + (value === 'next' ? 1 : -1)));
        if (action === 'run-feature' && Object.keys(fields).includes(value)) this.feature = value;
        if (action === 'run-answer' && ['hiring', 'test'].includes(value)) this.answer = value;
        if (action === 'run-branch') this.branch = value === 'reset' ? 0 : Math.min(this.branch + 1,
            Math.max(state.experiment.before.decisionPath.length, state.experiment.after.decisionPath.length));
        if (action === 'run-model' && Object.keys(models).includes(value)) this.model = value;
        if (action === 'run-metric' && Object.keys(measures).includes(value)) this.metric = value;
    }

    render(s) {
        const shell = el('div', 'RunDesk'), rail = el('ol', 'RunRail'), header = el('header', 'RunHead');
        rail.setAttribute('aria-label', 'Walkthrough progress');
        scenes.forEach(([title], i) => {
            const item = el('li', i < this.index ? 'RunDone' : '');
            if (i === this.index) item.setAttribute('aria-current', 'step');
            item.append(el('span', '', String(i + 1).padStart(2, '0')), el('strong', '', title)); rail.append(item);
        });
        const scene = el('section', 'RunScene');
        scene.setAttribute('aria-labelledby', 'run-scene-title');
        const title = el('h2', '', scenes[this.index][1]); title.id = 'run-scene-title'; title.tabIndex = -1;
        header.append(el('p', 'RunEyebrow', 'CASE NOTES / ' + (this.index + 1) + ' OF ' + scenes.length),
            title, el('p', '', scenes[this.index][2]));
        scene.append(header);
        [training, paths, repair, results][this.index](scene, s, this);
        const nav = el('div', 'RunNav');
        const back = button('Back', 'run-step', 'back'); back.disabled = this.index === 0;
        const atEnd = this.index === scenes.length - 1;
        if (!atEnd) nav.append(button('Skip to receipt', 'run-close'));
        const forward = atEnd ? button('Open audit receipt', 'run-close') : button('Next', 'run-step', 'next');
        forward.classList.add('RunButton--next');
        nav.append(group('Walkthrough navigation', back, forward));
        shell.append(rail, scene, nav);
        return shell;
    }
}
