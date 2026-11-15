import {INTERVENTIONS, exportSession} from '../../../learning/journey';
import {CITIES} from '../../../learning/candidates';
import {mountCanvas} from '../../../controllers/game/gameSetup';
import {gameClock} from '../../../controllers/game/gameClock';
import * as state from '../../../controllers/common/state';
import * as sound from '../../../controllers/game/sound';
import {SOUNDS} from '../../../controllers/constants';
import FirstShiftScene from '../../pixi/first-shift/first-shift-scene';

const percent = value => value === null ? 'Not available' : (value * 100).toFixed(1).replace(/\.0$/, '') + '%';
const values = p => p.city + ' · Skill ' + p.skill + '/100 · Experience ' + p.experience + ' years · ' + p.academy;
const names = {skill: 'Skill', experience: 'Experience', academy: 'Academy', city: 'City'};
function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
}
function table(container, headers, rows) {
    container.textContent = '';
    const el = node('table'), head = node('thead'), tr = node('tr'), body = node('tbody');
    headers.forEach(label => { const th = node('th', label); th.scope = 'col'; tr.appendChild(th); });
    head.appendChild(tr);
    rows.forEach(values => { const row = node('tr'); values.forEach(value => row.appendChild(node('td', value))); body.appendChild(row); });
    el.append(head, body); container.appendChild(el);
}
function reportTable(container, original, current = null) {
    const reports = current ? [original, current] : [original];
    const rows = [['Choices matching the job check', ...reports.map(r => {
        const m = r.overallMetrics; return (m.truePositive + m.trueNegative) + '/' + m.total + ' (' + percent(m.accuracy) + ')';
    })]];
    CITIES.forEach(city => rows.push([city + ': ready people shortlisted', ...reports.map(r => {
        const m = r.cityMetrics[city]; return m.truePositive + '/' + m.ready + ' (' + percent(m.qualifiedShortlistRate) + ')';
    })]));
    rows.push(['Gap between those city rates', ...reports.map(r => r.opportunityGap === null ? 'Not available' : (r.opportunityGap * 100).toFixed(1).replace(/\.0$/, '') + ' percentage points')]);
    table(container, current ? ['Job check', 'Original Scout', 'Your Scout'] : ['Job check', 'Original Scout'], rows);
}
export function renderTree(container, tree, prediction) {
    container.textContent = '';
    const path = new Map(prediction.decisionPath.map(step => [step.nodeId, step]));
    function branch(current, label) {
        const li = node('li'), box = node('div', undefined, 'LearnedNode');
        if (label) li.appendChild(node('span', label, 'BranchLabel'));
        const selected = path.has(current.id) || current.id === prediction.leafId;
        if (selected) { box.classList.add('OnPath'); box.setAttribute('aria-label', 'On this applicant\'s route'); }
        box.append(node('strong', current.kind === 'leaf' ? current.text : current.question),
            node('p', current.positiveLabels + ' of ' + current.support + ' training examples were shortlisted.'));
        const step = path.get(current.id);
        if (step) box.appendChild(node('p', 'This CV: ' + step.value + '. Follow ' + (step.branch === 'left' ? current.leftLabel : current.rightLabel) + '.', 'RouteValue'));
        li.appendChild(box);
        if (current.kind === 'question') {
            const children = node('ol', undefined, 'TreeChildren');
            children.append(branch(current.left, current.leftLabel), branch(current.right, current.rightLabel)); li.appendChild(children);
        }
        return li;
    }
    const root = node('ol', undefined, 'TreeRoot'); root.appendChild(branch(tree)); container.appendChild(root);
}

export default class ReviewUI {
    constructor({flow, session, onSave = () => true, onNew = () => {}, storageStatus = () => true}) {
        this.root = document.getElementById('review-game'); this.flow = flow; this.session = session;
        this.onSave = onSave; this.onNew = onNew; this.storageStatus = storageStatus;
        this.view = null; this.disposed = false; this.busy = false; this.generation = 0;
        this.click = this.click.bind(this); this.change = this.change.bind(this); this.input = this.input.bind(this);
        this.root.addEventListener('click', this.click); this.root.addEventListener('change', this.change); this.root.addEventListener('input', this.input);
        for (const selector of ['#case-applicant', '#workshop-applicant']) {
            const select = this.find(selector);
            flow.getState().applicants.forEach(p => { const option = node('option', p.name + ' · ' + p.city); option.value = p.id; select.appendChild(option); });
        }
        this.root.hidden = false; this.render(); this.save();
    }
    find(selector) { return this.root.querySelector(selector); }
    put(selector, text) { this.find(selector).textContent = text; }
    available() { return !this.disposed && !this.busy && !gameClock.paused; }
    save() { this.onSave(this.flow.checkpoint()); }
    render() {
        const s = this.flow.getState();
        const changedView = s.phase !== this.view;
        if (s.phase !== this.view) {
            this.generation++;
            if (this.scene) { this.scene.destroy(); this.scene = null; }
            this.view = s.phase;
            this.root.querySelectorAll('[data-review-view]').forEach(section => { section.hidden = section.dataset.reviewView !== s.phase; });
            state.set('stage', 'review-' + s.phase);
            mountCanvas(s.phase === 'final' ? this.find('[data-review-canvas="final"]') : null);
            if (s.phase === 'final') this.scene = new FirstShiftScene({mode: 'demo'});
            sound.play(s.phase === 'receipt' ? SOUNDS.STAGE_SUCCEEDED : SOUNDS.NEW_MESSAGE);
        }
        const titles = {investigation: ['03 / LOOK CLOSER', 'What did Scout learn?', 'Follow a CV through the learned questions. Then check the evidence.'],
            audit: ['03 / THE AUDIT', 'Check more than one CV.', 'A good-looking total can hide different results for different groups.'],
            workshop: ['04 / REPAIR WORKSHOP', 'Give Scout a better chance.', 'Try a change and see what happens on the same 80 audit CVs.'],
            final: ['05 / RECRUITMENT DAY', 'New CVs. Same Scout.', 'Your choices are locked. Let us see how they work on fresh examples.'],
            receipt: ['06 / YOUR AUDIT RECEIPT', 'The results are in.', 'Every count below comes from the final batch.']};
        const [chapter, title, intro] = titles[s.phase];
        this.put('#review-chapter', chapter); this.put('#review-title', title); this.put('#review-intro', intro);
        if (changedView) this.find('#review-title').focus();
        this.put('#review-budget', s.phase === 'receipt' ? s.credits + ' credits left' : s.credits + ' / 8 credits left');
        this.root.querySelectorAll('button').forEach(button => { button.disabled = this.busy; });
        if (s.phase === 'investigation') this.renderEvidence(s);
        if (s.phase === 'audit') {
            reportTable(this.find('#initial-audit'), s.originalAudit);
            const m = s.originalAudit.overallMetrics;
            this.put('#initial-findings', m.falseNegative + ' ready applicants were passed over. ' + m.falsePositive + ' applicants who did not meet the rule were shortlisted.');
            this.put('#archive-association', CITIES.map(city => {
                const group = this.session.pools.historical.filter(p => p.city === city);
                return city + ': ' + group.filter(p => p.academy === 'Central Academy').length + ' of ' + group.length + ' old CVs list Central Academy';
            }).join('. ') + '. This link was built into this fictional archive. Academy is not part of the job check.');
        }
        if (s.phase === 'workshop') this.renderWorkshop(s);
        if (s.phase === 'final') {
            this.put('#final-progress', s.finalIndex + ' of 12 scans shown');
            const p = s.finalApplicant;
            this.put('#final-person', p.name); this.put('#final-values', values(p));
            this.put('#final-last-choice', s.finalPrediction ? 'Last CV: ' + (s.finalPrediction.decision ? 'Shortlist' : 'Pass') + '.' : 'Scout is ready for the first CV.');
            this.scene.setApplicants([p], p.id);
        }
        if (s.phase === 'receipt') this.renderReceipt(s.receipt);
    }
    renderEvidence(s) {
        const e = s.evidence;
        this.put('#case-message', s.complaintId ? 'A ready applicant was passed over. Check the CV and trace Scout\'s choice before deciding what to change.' : 'Let us do a routine check. This model has no missed ready applicant in the audit batch. We will still inspect how it makes choices.');
        this.find('#case-applicant').value = s.selectedId;
        this.put('#case-name', e.applicant.name); this.put('#case-values', values(e.applicant));
        this.put('#case-decision', 'Scout: ' + (e.prediction.decision ? 'Shortlist' : 'Pass'));
        this.put('#case-assessment', e.assessment === null ? 'Independent job check: not opened yet.' : 'Independent job check: ' + (e.assessment ? 'meets the rule.' : 'does not meet the rule.'));
        const inspect = this.find('[data-review-action="inspect"]');
        inspect.disabled = e.assessment !== null || s.credits < 1;
        inspect.textContent = e.assessment !== null ? 'Already checked · no extra charge' : 'Check this applicant · 1 credit';
        this.put('#inspection-progress', s.inspectedIds.length + ' different CVs checked. Check at least 2 to open the audit.');
        this.find('[data-review-action="open-audit"]').disabled = s.inspectedIds.length < 2;
        this.put('#comparison-person', e.comparison.name); this.put('#comparison-values', values(e.comparison));
        this.put('#comparison-decision', 'Scout: ' + (e.comparisonPrediction.decision ? 'Shortlist' : 'Pass') + '. Open this CV if you want to check it.');
        table(this.find('#training-evidence'), ['Example', 'Source', 'Label'], e.examples.map(p => [p.name + ' · ' + values(p), p.source, p.label ? 'Shortlist' : 'Pass']));
        this.put('#case-source', 'Learned from ' + s.original.trainingIds.length + ' examples: ' + s.original.labelSource + '.');
        renderTree(this.find('#case-tree'), s.tree, e.prediction);
    }
    renderWorkshop(s) {
        const cards = this.find('#repair-cards'); cards.textContent = '';
        INTERVENTIONS.forEach(item => {
            const selected = s.interventions.includes(item.id), card = node('article', undefined, 'RepairCard' + (selected ? ' IsSelected' : ''));
            card.append(node('span', item.cost + (item.cost === 1 ? ' CREDIT' : ' CREDITS'), 'SmallLabel'), node('h3', item.name), node('p', item.description));
            const button = node('button', selected ? 'Undo purchase · refund ' + item.cost : 'Try this · ' + item.cost, selected ? 'ShiftSecondary' : 'ShiftPrimary');
            button.type = 'button'; button.dataset.repair = item.id; button.setAttribute('aria-pressed', String(selected));
            button.disabled = !selected && item.cost > s.credits; card.appendChild(button); cards.appendChild(card);
        });
        this.find('#strictness').value = Math.round(s.threshold * 100); this.put('#strictness-value', Math.round(s.threshold * 100) + '%');
        reportTable(this.find('#workshop-audit'), s.originalAudit, s.audit);
        const last = s.experiments[s.experiments.length - 1];
        this.put('#experiment-feedback', last ? last.changedChoices + ' of 80 choices changed in your last experiment. Job-check match: ' + percent(last.comparedWithPrevious.overallMetrics.accuracy) + ' → ' + percent(last.results.overallMetrics.accuracy) + '.' : 'Start with the original Scout. Choose a change to test.');
        this.put('#workshop-source', s.current.trainingIds.length + ' training examples · ' + s.current.labelSource + ' · Inputs: ' + s.current.configuration.features.map(f => names[f]).join(', ') + '.');
        this.find('[data-review-action="undo"]').disabled = !s.canUndo;
        this.log('#experiment-log', s.experiments);
        this.find('#workshop-applicant').value = s.selectedId;
        this.put('#workshop-path-summary', s.evidence.applicant.name + ': ' + values(s.evidence.applicant) + '. Scout: ' + (s.evidence.prediction.decision ? 'Shortlist' : 'Pass') + '.');
        renderTree(this.find('#workshop-tree'), s.tree, s.evidence.prediction);
    }
    log(selector, experiments) {
        const list = this.find(selector); list.textContent = '';
        experiments.forEach(item => list.appendChild(node('li', item.number + '. ' + item.action + ' · ' + item.changedChoices + ' choices changed · job-check match ' + percent(item.results.overallMetrics.accuracy) + ' · ' + item.credits + ' credits left')));
        if (!experiments.length) list.appendChild(node('li', 'No workshop changes were made.'));
    }
    renderReceipt(receipt) {
        this.put('#receipt-ending', receipt.score.ending); this.put('#receipt-stars', '★'.repeat(receipt.score.stars) + '☆'.repeat(3 - receipt.score.stars) + ' · ' + receipt.score.stars + ' of 3 checks passed');
        const messages = {'Trust Earned': 'Scout met all three checks on this fresh batch.', 'A Problem Beneath the Numbers': 'Scout matched the job check often, but too many ready applicants in at least one city missed out.', 'The Unchecked Shortlist': 'Ready applicants were reached across both cities, but too many decisions missed the job check.', 'Recruitment Recalled': 'Scout needs more work on both screening and reaching ready applicants.'};
        this.put('#receipt-message', messages[receipt.score.ending]);
        const scores = this.find('#score-cards'); scores.textContent = '';
        [['Screening', receipt.score.quality, 'At least 85% of choices match the job check.'], ['Ready people reached', receipt.score.reach, 'At least 75% of ready people in each city are shortlisted.'], ['City gap', receipt.score.gap, 'The two rates differ by no more than 15 percentage points.']].forEach(([name, pass, detail]) => {
            const card = node('article', undefined, 'ScoreCard ' + (pass ? 'CheckPassed' : 'CheckMissed'));
            card.append(node('span', pass ? 'PASSED' : 'NOT YET', 'SmallLabel'), node('h3', name), node('p', detail)); scores.appendChild(card);
        });
        reportTable(this.find('#final-report'), receipt.original, receipt.current);
        const m = receipt.current.overallMetrics;
        this.put('#final-counts', m.shortlisted + ' shortlisted. ' + m.falseNegative + ' ready applicants passed over. ' + m.falsePositive + ' applicants below the job rule shortlisted.');
        this.put('#receipt-configuration', receipt.trainingCount + ' training examples · ' + receipt.labelSource + ' · Inputs: ' + receipt.features.map(f => names[f]).join(', ') + ' · Cutoff ' + Math.round(receipt.threshold * 100) + '%.');
        this.put('#receipt-spending', 'Credits: ' + receipt.inspectionCost + ' on CV checks, ' + receipt.workshopCost + ' on current repairs, ' + receipt.creditsRemaining + ' left.');
        this.put('#receipt-lesson', receipt.labelSource === 'independent assessments' ? 'You changed what the training answers meant. Scout learned from job checks instead of imitating past hiring choices.' : 'Scout still learned from past choices. Compare its job-check results with its earlier agreement with old decisions. Those are different measures.');
        this.log('#receipt-experiments', receipt.experiments);
        this.find('#reflection-pattern').value = receipt.reflections.pattern; this.find('#reflection-transfer').value = receipt.reflections.transfer;
        this.put('#reflection-pattern-print', receipt.reflections.pattern || 'No note added.'); this.put('#reflection-transfer-print', receipt.reflections.transfer || 'No note added.');
        this.put('#receipt-save-status', this.storageStatus() ? 'Saved on this browser. Your downloaded report has no account details.' : 'Browser storage is unavailable. Download your report before closing this page.');
    }
    reflect() {
        const pattern = this.find('#reflection-pattern').value, transfer = this.find('#reflection-transfer').value;
        this.flow.reflect({pattern, transfer});
        this.put('#reflection-pattern-print', pattern || 'No note added.'); this.put('#reflection-transfer-print', transfer || 'No note added.');
        this.save();
    }
    change(event) {
        if (!this.available()) return;
        try {
            if (event.target.id === 'case-applicant' || event.target.id === 'workshop-applicant') this.flow.select(event.target.value);
            if (event.target.id === 'strictness') this.flow.setThreshold(Number(event.target.value) / 100);
            if (event.target.id.startsWith('reflection-')) { this.reflect(); return; }
            this.save(); this.render();
        } catch (error) { this.error(error); }
    }
    input(event) {
        if (!this.available()) return;
        if (event.target.id === 'strictness') this.put('#strictness-value', event.target.value + '%');
        if (event.target.id.startsWith('reflection-')) { try { this.reflect(); } catch (error) { this.error(error); } }
    }
    click(event) {
        const button = event.target.closest('button');
        if (!button || !this.available()) return;
        sound.play(SOUNDS.BUTTON_CLICK); this.find('#review-error').hidden = true;
        try {
            const action = button.dataset.reviewAction;
            if (button.dataset.repair) this.flow.toggle(button.dataset.repair);
            if (action === 'inspect') this.flow.inspect();
            if (action === 'compare') this.flow.select(this.flow.getState().evidence.comparison.id);
            if (action === 'open-audit') this.flow.openAudit();
            if (action === 'workshop') this.flow.openWorkshop();
            if (action === 'undo') this.flow.undo();
            if (action === 'deploy') this.flow.deploy();
            if (action === 'next-final') { this.animateFinal().catch(error => this.error(error)); return; }
            if (action === 'skip-final') this.flow.skipFinal();
            if (action === 'replay-final') this.flow.replayFinal();
            if (action === 'export') { this.reflect(); this.download(); return; }
            if (action === 'print') { this.reflect(); window.print(); return; }
            if (action === 'new-game') { this.onNew(); return; }
            this.save(); this.render();
            if (button.dataset.repair) this.find('[data-repair="' + button.dataset.repair + '"]').focus();
            if (action === 'inspect') this.find('#case-assessment').focus();
            if (action === 'compare') this.find('#case-name').focus();
        } catch (error) { this.error(error); }
    }
    async animateFinal() {
        if (!this.available()) return;
        this.busy = true; this.root.querySelectorAll('button').forEach(button => { button.disabled = true; });
        const generation = this.generation, result = this.flow.nextFinal(); this.save();
        this.scene.setApplicants([result.applicant], result.applicant.id);
        await this.scene.animateDecision(result.applicant.id, result.prediction.decision, true);
        if (this.disposed || generation !== this.generation) return;
        sound.play(result.prediction.decision ? SOUNDS.PERSON_ACCEPTED : SOUNDS.BUTTON_CLICK);
        this.busy = false; this.render();
        if (this.flow.getState().phase === 'final') this.find('[data-review-action="next-final"]').focus();
        this.put('#review-live', result.applicant.name + ': ' + (result.prediction.decision ? 'Shortlist.' : 'Pass.'));
    }
    download() {
        const url = URL.createObjectURL(new Blob([exportSession(this.flow)], {type: 'application/json'}));
        const link = node('a'); link.href = url; link.download = 'hire-and-seek-audit.json'; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    error(error) { this.busy = false; this.find('#review-error').hidden = false; this.put('#review-error', error.message); this.render(); }
    destroy() {
        this.save(); this.disposed = true; this.generation++;
        this.root.removeEventListener('click', this.click); this.root.removeEventListener('change', this.change); this.root.removeEventListener('input', this.input);
        if (this.scene) this.scene.destroy(); mountCanvas(null); this.root.hidden = true;
    }
}
