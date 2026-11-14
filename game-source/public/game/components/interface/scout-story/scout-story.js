import {REPAIRS} from '../../../learning/scoutStory';
import {CITIES, ACADEMIES} from '../../../learning/candidates';
import {gameClock} from '../../../controllers/game/gameClock';
import {mountCanvas} from '../../../controllers/game/gameSetup';
import * as state from '../../../controllers/common/state';
import * as sound from '../../../controllers/game/sound';
import {SOUNDS} from '../../../controllers/constants';
import ScoutFactory from '../../pixi/scout-factory/scout-factory';
import CircleGrid from '../../pixi/training-stage/circle-grid';
import RunWalkthrough from './run-walkthrough';

const titles = {
    handoff: ['INBOX', 'An email from the engineer', 'We need to get through the queue faster. Send me the CVs you reviewed so Scout can learn from your choices.'],
    archives: ['HR LAPTOP', 'Choose a training archive', 'Scout will learn from your choices and the old hiring decisions in the file you choose.'],
    trained: ['TRAINING ROOM', 'Scout is ready', 'Scout learned questions from the answers in the training files. Let’s see what it does with new CVs.'],
    screening: ['SCOUT FACTORY', 'Scout takes the desk', 'Send CVs down the belt and watch where Scout files them.'],
    investor: ['INVESTOR MAIL', 'The scanner is running', 'Three CVs are through the scanner. Keep an eye on who gets an interview.'],
    mail: ['INBOX / MAYA', 'A message for the hiring team', 'Maya has forwarded a case for you to check.'],
    inspector: ['HR LAPTOP', 'Dataset Inspector', 'Find the named CV in the scanner records before replying.'],
    'city-report': ['NEWS FEED', 'Was this just one case?', 'Compare how many qualified applicants Scout shortlisted in each city. Twelve CVs give us an early clue.'],
    copy: ['CASE FILE', 'Test a copy', 'Change one detail. Scan both CVs and see what Scout does.'],
    repair: ['CASE FILE', 'Try a repair', 'Start from the original Scout each time. Change one thing, then compare the results on the same 80 practice CVs.'],
    final: ['FINAL TEST', 'A fresh batch', 'Your repair is locked. Both versions of Scout will screen the same 200 new CVs.'],
    debrief: ['TAKING A STEP BACK', 'What did you learn?', 'Use the choices and results from your own run.'],
    walkthrough: ['ORBIT WORKS / FIELD NOTES', 'What your run revealed', 'Open the case notes and see what your choices taught you about Scout.'],
    receipt: ['ORBIT WORKS', 'Your audit receipt', 'Here is what you tested, what you changed, and how Scout did.'],
};
const label = decision => decision ? 'Shortlist' : 'Pass';
const factoryViews = ['screening', 'investor', 'mail', 'final'];
const fields = {skill: 'Skill', experience: 'Experience', city: 'City', academy: 'Academy'};
function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
}
function card(container, title, className = '') {
    const el = node('section', undefined, 'StoryCard ' + className);
    if (title) el.append(node('h2', title));
    container.append(el); return el;
}
function button(parent, text, action, value, primary = true) {
    const el = node('button', text, primary ? 'ShiftPrimary' : 'ShiftSecondary');
    el.type = 'button'; el.dataset.storyAction = action;
    if (value !== undefined) el.dataset.value = value;
    parent.append(el); return el;
}
function file(parent, title, text, action, value) {
    const el = button(parent, '', action, value, false);
    el.classList.add('StoryFile');
    const icon = node('img'); icon.src = './assets/img/file-icon.png'; icon.alt = '';
    el.append(icon, node('strong', title), node('span', text));
    return el;
}
function cv(parent, p, heading, changed) {
    const el = card(parent, heading);
    el.append(node('strong', p.name, 'CvName'));
    const list = node('dl');
    for (const key of Object.keys(fields)) {
        const line = node('div', undefined, changed === key ? 'ChangedField' : '');
        line.append(node('dt', fields[key]), node('dd', key === 'skill' ? p[key] + '/100' : key === 'experience' ? p[key] + ' yr' : p[key]));
        list.append(line);
    }
    el.append(list); return el;
}
function rate(metrics) {
    return metrics.ready ? metrics.truePositive + ' of ' + metrics.ready + ' (' + Math.round(100 * metrics.qualifiedShortlistRate) + '%)' : 'Not available';
}
function table(container, original, repaired) {
    const wrap = node('div', undefined, 'StoryTable');
    const table = node('table'), head = node('thead'), body = node('tbody');
    const header = node('tr');
    (repaired ? ['Measure', 'Original Scout', 'Repaired Scout'] : ['City', 'Qualified people shortlisted']).forEach(v => {
        const column = node('th', v); column.scope = 'col'; header.append(column);
    });
    const rows = repaired ? [
        ['Qualified people missed', original.overallMetrics.falseNegative, repaired.overallMetrics.falseNegative],
        ['Shortlisted who failed the work test', original.overallMetrics.falsePositive, repaired.overallMetrics.falsePositive],
        ...CITIES.map(city => [city + ': qualified people reached', rate(original.cityMetrics[city]), rate(repaired.cityMetrics[city])]),
    ] : CITIES.map(city => [city, rate(original.cityMetrics[city])]);
    head.append(header);
    for (const values of rows) {
        const row = node('tr');
        values.forEach((v, i) => { const cell = node(i ? 'td' : 'th', String(v)); if (!i) cell.scope = 'row'; row.append(cell); });
        body.append(row);
    }
    table.append(head, body); wrap.append(table); container.append(wrap);
}
function compare(container, report) {
    table(container, report.original, report.repaired);
    const change = (name, field) => {
        const diff = report.repaired.overallMetrics[field] - report.original.overallMetrics[field];
        return name + (diff ? ': ' + Math.abs(diff) + (diff < 0 ? ' fewer.' : ' more.') : ': no change.');
    };
    container.append(node('p', change('Qualified people missed', 'falseNegative') + ' ' + change('Mistaken shortlists', 'falsePositive'), 'StoryNote'));
}
function path(el, prediction, split) {
    const steps = node('ol', undefined, 'StoryPath');
    prediction.decisionPath.forEach((step, i) => {
        const branch = node('li');
        let text = step.label + ': ' + step.value + ' → ' + (step.branch === 'left' ? 'below ' : 'at least ') + step.splitValue;
        if (step.feature === 'city' || step.feature === 'academy') {
            const value = step.feature === 'city' ? CITIES[0] : ACADEMIES[0];
            text = step.label + ': ' + value + '? ' + (step.branch === 'right' ? 'Yes' : 'No') + ' (' + step.value + ')';
        }
        branch.textContent = text;
        if (i === split) { branch.className = 'ChangedField'; branch.append(node('strong', ' Paths split here')); }
        steps.append(branch);
    });
    if (steps.childElementCount) el.append(steps);
    else el.append(node('p', 'The tree has no questions. It gives one answer to every CV.'));
    el.append(node('p', 'Scout: ' + label(prediction.decision), 'CaseDecision'),
        node('p', prediction.positiveLabels + ' of ' + prediction.leafSupport + ' training examples here were shortlisted.'));
}

export default class ScoutStoryUI {
    constructor({flow, onSave, onNew}) {
        this.flow = flow; this.onSave = onSave; this.onNew = onNew;
        this.root = document.getElementById('scout-story');
        this.body = this.root.querySelector('#story-body'); this.canvas = this.root.querySelector('#story-canvas');
        this.factory = this.root.querySelector('#factory-board');
        this.factoryCanvas = this.factory.querySelector('#factory-canvas');
        this.field = flow.getState().experiment?.field || 'city';
        this.busy = false; this.disposed = false; this.view = null;
        this.click = this.click.bind(this); this.change = this.change.bind(this);
        this.root.addEventListener('click', this.click); this.root.addEventListener('change', this.change);
        this.root.hidden = false; this.render(); this.save();
    }
    save() { this.onSave(this.flow.checkpoint()); }
    feedback(text) {
        const el = this.root.querySelector('#story-feedback'); el.textContent = text; el.hidden = !text;
    }
    setBusy(busy) {
        this.busy = busy;
        this.body.inert = busy;
        this.root.setAttribute('aria-busy', String(busy));
        this.body.querySelectorAll('button').forEach(el => {
            if (busy) { el.dataset.wasDisabled = String(el.disabled); el.disabled = true; }
            else if (el.dataset.wasDisabled !== undefined) { el.disabled = el.dataset.wasDisabled === 'true'; delete el.dataset.wasDisabled; }
        });
    }
    factoryText(id, text) {
        const el = this.factory.querySelector('#factory-' + id);
        if (el.textContent !== text) el.textContent = text;
    }
    factoryFallback(error) {
        console.warn('Scout factory animation unavailable:', error);
        if (this.scene) { this.scene.destroy(); this.scene = null; }
        this.factoryCanvas.hidden = true;
        mountCanvas(null);
    }
    updateFactory(s, status) {
        const final = s.phase === 'final';
        const queue = final ? s.finalQueue : s.scanQueue;
        const done = final ? s.finalScreened : s.screened;
        const shortlisted = done.filter(item => item.prediction.decision).length;
        const last = done[done.length - 1];
        this.factoryText('model', final ? 'REPAIRED SCOUT' : 'ORIGINAL SCOUT');
        this.factoryText('progress', done.length + ' of ' + (final ? s.finalSampleSize + ' preview CVs' : s.scanTotal + ' CVs') + ' scanned');
        this.factoryText('shortlisted', String(shortlisted));
        this.factoryText('passed', String(done.length - shortlisted));
        this.factoryText('current', status || (last ? last.applicant.name + ': ' + (last.prediction.decision ? 'Shortlisted' : 'Passed over') : 'Ready to scan.'));
        this.factoryText('queue', queue.length ? queue.length + ' waiting · Next: ' + queue[0].name : 'Queue complete');
        if (this.scene) {
            try { this.scene.setQueue(queue); }
            catch (error) { this.factoryFallback(error); }
        }
    }
    setStageScene(view) {
        const factory = factoryViews.includes(view), wasFactory = factoryViews.includes(this.view);
        if (this.grid) { this.grid.destroy(); this.grid = null; }
        if (!factory && this.scene) { this.scene.destroy(); this.scene = null; }
        this.factory.hidden = !factory;
        this.canvas.hidden = view !== 'trained';
        if (factory && !wasFactory) {
            this.factoryCanvas.hidden = false;
            try { mountCanvas(this.factoryCanvas); this.scene = new ScoutFactory({onError: error => this.factoryFallback(error)}); }
            catch (error) { this.factoryFallback(error); }
        } else if (!factory) {
            mountCanvas(this.canvas.hidden ? null : this.canvas);
            if (view === 'trained') this.grid = new CircleGrid();
        }
        sound.stop(SOUNDS.ML_LAB_AMBIENT);
        if (view === 'screening' || view === 'final') sound.play(SOUNDS.ML_LAB_AMBIENT);
        if (['investor', 'mail', 'city-report'].includes(view)) sound.play(view === 'city-report' ? SOUNDS.BREAKING_NEWS : SOUNDS.NEW_MESSAGE);
    }
    render() {
        const s = this.flow.getState(), view = this.training ? 'trained' : s.phase;
        const changed = view !== this.view;
        if (changed) {
            this.setStageScene(view);
            this.view = view; state.set('stage', 'scout-' + view);
        }
        const [section, title, intro] = titles[view];
        const heading = this.root.querySelector('#story-title');
        this.root.querySelector('#story-section').textContent = section;
        heading.textContent = this.training ? 'Scout is learning' : title;
        this.root.querySelector('#story-intro').textContent = this.training ? 'Reading your choices and the selected archive.' :
            view === 'city-report' && s.case.kind === 'routine' ? 'Even when everyone who qualifies gets a shortlist, it is worth checking the results by city.' : intro;
        if (factoryViews.includes(view)) this.updateFactory(s);
        this.body.replaceChildren();
        if (this.training) return;
        const board = this.body;
        if (view === 'handoff') {
            const desk = card(board, 'HR Laptop #1', 'StoryDesktop');
            file(desk, 'reviewed-cvs.zip', s.reviewedCount + ' saved Shortlist or Pass decisions', 'send');
        } else if (view === 'archives') {
            const desk = card(board, 'Training files', 'StoryDesktop');
            const files = node('div', undefined, 'StoryFiles'); desk.append(files);
            s.archives.forEach(a => file(files, a.name, a.count + ' old records', 'train', a.id));
        } else if (view === 'trained') {
            const panel = card(board, 'Training complete');
            panel.append(node('p', s.original.trainingIds.length + ' examples: ' + s.reviewedCount + ' of your choices + ' + s.archive.count + ' old hiring decisions.'));
            button(panel, 'Start the scanner', 'start');
        } else if (view === 'screening') {
            const panel = card(board, 'Factory controls');
            button(panel, 'Run scanner', 'run'); button(panel, 'Scan one CV', 'one', undefined, false);
        } else if (view === 'investor') {
            button(card(board, 'Continue screening'), 'Back to the scanner', 'ack');
        } else if (view === 'mail') {
            const complaint = s.case.kind === 'complaint';
            const mail = card(board, complaint ? 'Re: Candidate complaint' : 'Routine check');
            mail.append(node('p', complaint ? s.case.applicant.name + ' writes: “I passed the work test. Why didn’t I get an interview?”' :
                'Scout didn’t miss anyone who passed the work test in this batch. Let’s still check ' + s.case.applicant.name + '’s CV.'));
            button(mail, 'Open the CV inspector', 'open');
        } else if (view === 'inspector') {
            board.append(node('p', 'Find ' + s.case.applicant.name + ' in the ' + (s.case.prediction.decision ? 'Shortlisted' : 'Passed over') + ' column.', 'StoryNote'));
            const columns = node('div', undefined, 'InspectorColumns'); board.append(columns);
            const accepted = card(columns, 'Shortlisted');
            const selected = s.screened.find(item => item.applicant.id === this.selectedId);
            const preview = selected ? cv(columns, selected.applicant, 'Open CV') : card(columns, 'Open a CV');
            if (selected) preview.append(node('p', 'Scout: ' + label(selected.prediction.decision)),
                node('p', 'Work test: ' + (selected.applicant.assessedReady ? 'Passed' : 'Did not pass')));
            const rejected = card(columns, 'Passed over');
            for (const [decision, column] of [[true, accepted], [false, rejected]]) {
                const applicants = s.screened.filter(p => p.prediction.decision === decision);
                if (!applicants.length) column.append(node('p', 'No CVs here yet.'));
                applicants.forEach(item => {
                    const open = file(column, item.applicant.name, item.applicant.city, 'select', item.applicant.id);
                    open.setAttribute('aria-pressed', String(this.selectedId === item.applicant.id));
                });
            }
            const reply = button(board, 'Reply to Maya', 'reply'); reply.disabled = this.selectedId !== s.case.applicant.id;
        } else if (view === 'city-report') {
            const panel = card(board, 'The first 12 scans');
            table(panel, s.cityReport); button(panel, 'Reopen the case file', 'reopen');
        } else if (view === 'copy') this.renderCopy(s);
        else if (view === 'repair') {
            const options = node('div', undefined, 'StoryPair'); board.append(options);
            REPAIRS.forEach(r => {
                const panel = card(options, r.name); panel.append(node('p', r.detail));
                const control = button(panel, 'Try ' + r.name.toLowerCase(), 'repair', r.id);
                control.setAttribute('aria-pressed', String(s.repair?.id === r.id));
            });
            if (s.repair) {
                const panel = card(board, 'Practice: ' + REPAIRS.find(r => r.id === s.repair.id).name);
                compare(panel, s.repair); button(panel, 'Use this repair on the final batch', 'lock');
            }
        } else if (view === 'final') {
            const panel = card(board, 'Final test controls');
            if (s.finalIndex < s.finalSampleSize) button(panel, 'Watch next CV', 'final-one');
            button(panel, 'See results for all 200 CVs', 'finish');
        } else if (view === 'debrief') this.renderLesson(s);
        else if (view === 'walkthrough') {
            if (!this.walkthrough) this.walkthrough = new RunWalkthrough();
            board.append(this.walkthrough.render(s));
        }
        else if (view === 'receipt') {
            const panel = card(board, REPAIRS.find(r => r.id === s.receipt.repair).name);
            panel.append(node('p', s.archive.name + ' · ' + s.receipt.trainingCount + ' training examples'),
                node('p', s.receipt.case.name + ': ' + fields[s.receipt.experiment.field] + ' changed from ' +
                    s.receipt.experiment.from + ' to ' + s.receipt.experiment.to + '. Scout: ' +
                    label(s.receipt.experiment.before.decision) + ' → ' + label(s.receipt.experiment.after.decision) + '.'));
            compare(panel, s.finalResult);
            panel.append(node('p', 'The final CVs stayed out of training and practice. The job rule and applicants are fictional.'));
            button(panel, 'Download receipt', 'download'); button(panel, 'Review what you learned', 'run-open', undefined, false);
            button(panel, 'Start a new shift', 'new', undefined, false);
        }
        if (changed) { heading.focus({preventScroll: true}); this.root.scrollIntoView?.({block: 'start'}); }
    }
    renderCopy(s) {
        const controls = card(this.body, 'Change one detail');
        const picker = node('select'); picker.id = 'copy-field';
        const caption = node('label', 'Detail to change: '); caption.htmlFor = picker.id;
        for (const key of ['city', 'academy']) {
            const option = node('option', fields[key]); option.value = key; option.selected = this.field === key; picker.append(option);
        }
        controls.append(caption, picker); button(controls, 'Scan both', 'copy');
        const original = s.case.applicant, values = this.field === 'city' ? CITIES : ACADEMIES;
        const copy = {...original, [this.field]: values.find(v => v !== original[this.field])};
        const pair = node('div', undefined, 'StoryPair'); this.body.append(pair);
        const left = cv(pair, original, 'Original CV'), right = cv(pair, copy, 'Test copy', this.field);
        const e = s.experiment;
        if (e?.field === this.field) {
            path(left, e.before, e.splitIndex); path(right, e.after, e.splitIndex);
            const feedback = {
                decision: 'Changing ' + e.field + ' changed Scout’s answer for this CV. That detail does not affect the work test.',
                path: 'The paths split, but the answers stayed the same.',
                same: 'Both CVs followed the same path. Try the other detail to see if it changes this prediction.',
            };
            this.body.append(node('p', feedback[e.outcome], 'StoryNote'));
        }
        button(this.body, 'Try a repair', 'repairs').disabled = e?.field !== this.field;
    }
    renderLesson(s) {
        const part = s.lesson.part;
        if (part === 'feature' || part === 'label') {
            const panel = cv(this.body, s.firstReviewed, '1 · Build a training example');
            panel.append(node('p', 'Your recorded choice: ' + label(s.firstReviewed.playerDecision)));
            if (part === 'feature') {
                panel.append(node('p', 'Pick one detail Scout could read.'));
                Object.entries(fields).forEach(([key, text]) => button(panel, text, 'answer', key, false));
            } else {
                panel.append(node('p', 'That CV detail is a feature. Which answer did Scout learn from for this CV?'));
                button(panel, 'Shortlist', 'answer', 'shortlist'); button(panel, 'Pass', 'answer', 'pass', false);
            }
        } else if (part.endsWith('-path')) {
            const panel = cv(this.body, part === 'original-path' ? s.experiment.original : s.experiment.copy,
                '2 · Follow Scout’s tree: ' + (part === 'original-path' ? 'original' : 'copy'));
            panel.append(node('p', 'Your saved answer is a label. Scout learned these questions from labelled examples.'));
            panel.append(node('p', s.lesson.question || 'No more questions. Scout’s answer: ' + label(s.lesson.decision), 'StoryNote'));
            s.lesson.choices.forEach(c => button(panel, c.label, 'answer', c.id, false));
        } else {
            const panel = card(this.body, '3 · Read the final result');
            panel.append(node('p', s.experiment.outcome === 'decision' ? 'The changed detail mattered for this CV even though it did not affect the work test. That is evidence of a shortcut.' :
                'This copy test did not change the final decision. One CV cannot tell us what happens to everyone.'));
            if (s.experiment.field === 'academy' && s.experiment.outcome !== 'same') {
                panel.append(node('p', 'Academy and city are linked in these fictional archives. A related detail can act as a proxy: an indirect clue about city.'));
            }
            compare(panel, s.finalResult);
            panel.append(node('p', 'Which version missed fewer qualified people?'));
            [['original', 'Original'], ['repaired', 'Repaired'], ['same', 'Same']].forEach(([key, text]) => button(panel, text, 'answer', key, false));
        }
    }
    async animate(sample) {
        const {applicant, prediction} = sample;
        this.factoryText('current', 'Scanning ' + applicant.name + '…');
        if (this.scene) {
            try {
                if (!this.scene.motion.matches) sound.play(SOUNDS.ML_DRONE);
                await this.scene.animate(sample);
            } catch (error) { if (!this.disposed) this.factoryFallback(error); }
            finally { sound.stop(SOUNDS.ML_DRONE); }
        }
        if (!this.disposed) {
            this.updateFactory(this.flow.getState());
            if (prediction.decision) sound.play(SOUNDS.PERSON_ACCEPTED);
        }
    }
    async scans(all) {
        do {
            const sample = this.flow.scan(); this.save(); await this.animate(sample);
        } while (all && !this.disposed && !gameClock.paused && this.flow.getState().phase === 'screening');
    }
    pauseForTraining() {
        return new Promise(resolve => {
            this.trainingDone = () => { this.trainingDone = null; this.trainingJob = null; resolve(); };
            this.trainingJob = gameClock.schedule(this.trainingDone, 650);
        });
    }
    async click(event) {
        const control = event.target.closest('button[data-story-action]');
        if (!control || control.disabled || this.busy || this.disposed || gameClock.paused) return;
        const {storyAction: action, value} = control.dataset;
        this.root.querySelector('#story-error').hidden = true;
        this.feedback('');
        sound.play(SOUNDS.BUTTON_CLICK);
        let focusTarget;
        try {
            this.setBusy(true);
            switch (action) {
            case 'send': this.flow.send(); break;
            case 'train':
                this.training = true; this.render(); sound.play(SOUNDS.TRAIN_ALGORITHM); await this.pauseForTraining();
                if (this.disposed) return;
                this.flow.train(value); this.training = false; sound.stop(SOUNDS.TRAIN_ALGORITHM); sound.play(SOUNDS.TRAINING_UPDATE);
                break;
            case 'start': this.flow.startScanner(); break;
            case 'run': case 'one': await this.scans(action === 'run'); break;
            case 'ack': this.flow.acknowledge(); break;
            case 'open': this.flow.openMail(); break;
            case 'select': this.selectedId = value; break;
            case 'reply': this.flow.reply(this.selectedId); break;
            case 'reopen': this.flow.reopen(); break;
            case 'copy': this.flow.copy(this.field); break;
            case 'repairs': this.flow.openRepairs(); break;
            case 'repair': this.flow.repair(value); break;
            case 'lock': this.flow.lock(); break;
            case 'final-one': { const sample = this.flow.scanFinal(); this.save(); await this.animate(sample); break; }
            case 'finish': this.flow.finishFinal(); break;
            case 'answer': {
                const answer = this.flow.answer(value);
                if (!answer.correct) { this.feedback(answer.hint); return; }
                if (this.view === 'debrief' && this.flow.getState().phase === 'receipt') this.flow.startWalkthrough();
                break;
            }
            case 'run-open': this.walkthrough = null; this.flow.startWalkthrough(); break;
            case 'run-close': this.walkthrough = null; this.flow.finishWalkthrough(); break;
            case 'run-step': case 'run-feature': case 'run-answer': case 'run-branch': case 'run-model': case 'run-metric':
                this.walkthrough.act(action, value, this.flow.getState()); break;
            case 'download': this.download(); return;
            case 'new': this.onNew(); return;
            }
            if (!this.disposed) {
                const oldView = this.view;
                if (this.view !== 'walkthrough' || action === 'run-close') this.save();
                this.render();
                if (oldView === this.view) {
                    focusTarget = [...this.body.querySelectorAll('button:not([disabled])')].find(el =>
                        el.dataset.storyAction === action && el.dataset.value === value);
                    if (action === 'run-step' || (action === 'run-branch' && !focusTarget)) focusTarget = this.body.querySelector('#run-scene-title');
                    if (action === 'answer' || !focusTarget) focusTarget = this.body.querySelector('button:not([disabled])');
                }
            }
        } catch (error) {
            this.training = false; sound.stop(SOUNDS.TRAIN_ALGORITHM);
            this.render();
            const message = this.root.querySelector('#story-error'); message.textContent = error.message; message.hidden = false;
        } finally {
            if (!this.disposed) {
                this.setBusy(false);
                focusTarget?.focus({preventScroll: true});
                if (action === 'run-step') this.root.scrollIntoView?.({block: 'start'});
            }
        }
    }
    change(event) {
        if (event.target.id !== 'copy-field' || this.busy || gameClock.paused) return;
        this.field = event.target.value; this.render(); this.body.querySelector('#copy-field').focus();
    }
    download() {
        const url = URL.createObjectURL(new Blob([JSON.stringify(this.flow.receipt(), null, 2)], {type: 'application/json'}));
        const link = node('a'); link.href = url; link.download = 'hire-and-seek-audit.json';
        this.root.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    destroy() {
        this.save(); this.disposed = true;
        if (this.trainingJob) gameClock.cancel(this.trainingJob);
        this.trainingDone?.();
        this.scene?.destroy(); this.grid?.destroy();
        sound.stop(SOUNDS.ML_DRONE); sound.stop(SOUNDS.ML_LAB_AMBIENT); sound.stop(SOUNDS.TRAIN_ALGORITHM);
        this.root.removeEventListener('click', this.click); this.root.removeEventListener('change', this.change);
        mountCanvas(null); this.root.hidden = true;
    }
}
