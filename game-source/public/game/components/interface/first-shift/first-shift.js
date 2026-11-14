import {createFirstShift, seedForNewShift} from '../../../learning/firstShift';
import {setLearningSession} from '../../../controllers/game/learningSession';
import {gameClock} from '../../../controllers/game/gameClock';
import {mountCanvas} from '../../../controllers/game/gameSetup';
import * as state from '../../../controllers/common/state';
import * as sound from '../../../controllers/game/sound';
import {SOUNDS} from '../../../controllers/constants';
import FirstShiftScene from '../../pixi/first-shift/first-shift-scene';

export default class FirstShiftUI {
    constructor(options = {}) {
        this.options = options;
        this.root = document.getElementById('first-shift');
        this.flow = options.flow || createFirstShift(seedForNewShift(window.location.search, window.crypto), {now: () => gameClock.now()});
        this.jobs = new Set(); this.busy = false; this.disposed = false; this.view = null;
        this.roundTickJob = null; this.generation = 0;
        this.cvOpen = false;
        this.soundedRound = -1; this.soundedReport = -1;
        this.click = this.click.bind(this); this.keydown = this.keydown.bind(this);
        this.root.addEventListener('click', this.click); document.addEventListener('keydown', this.keydown);
        this.root.hidden = false; this.sync(); this.render();
    }
    find(selector) { return this.root.querySelector(selector); }
    put(selector, text) { this.find(selector).textContent = text; }
    available() { return !this.disposed && !this.busy && !gameClock.paused; }
    announce(text) { this.put('#shift-status', text); }
    sync() { setLearningSession(this.flow.getState().session); if (this.options && this.options.onSave) this.options.onSave(this.flow.checkpoint()); }
    decided(s, id) { return Object.prototype.hasOwnProperty.call(s.session.playerDecisions, id); }
    reviewed(s) { return s.allManual.filter(person => this.decided(s, person.id)); }

    setView(view) {
        if (view === this.view) return;
        this.generation++;
        this.setBusy(false);
        if (this.scene) { this.scene.destroy(); this.scene = null; }
        if (this.roundTickJob) { gameClock.cancel(this.roundTickJob); this.jobs.delete(this.roundTickJob); this.roundTickJob = null; }
        this.view = view;
        this.root.querySelectorAll('[data-view]').forEach(section => { section.hidden = section.dataset.view !== view; });
        state.set('stage', 'first-shift-' + view);
        mountCanvas(this.find('[data-canvas-host="' + view + '"]'));
        sound.stop(SOUNDS.MANUAL_AMBIENT); sound.stop(SOUNDS.TIME_RUNNING_OUT);
        if (view === 'manual') this.scene = new FirstShiftScene({mode: 'manual', onSelect: id => this.select(id)});
        if (view === 'briefing') sound.play(SOUNDS.NEW_MESSAGE);
        if (view === 'round-break' || view === 'ready') {
            const s = this.flow.getState(), last = s.roundReports[s.roundReports.length - 1];
            if (last && this.soundedReport !== last.roundIndex) {
                this.soundedReport = last.roundIndex;
                sound.play(last.goalMet ? SOUNDS.STAGE_SUCCEEDED : SOUNDS.STAGE_FAILED);
            }
        }
        const heading = this.find('[data-view="' + view + '"] h1[tabindex]');
        if (heading) heading.focus();
    }

    updateClock() {
        const s = this.flow.getState();
        this.put('#round-clock', s.remainingMs === null ? 'No timer' : Math.ceil(s.remainingMs / 1000) + 's left');
        this.find('#round-clock').classList.toggle('is-urgent', s.remainingMs !== null && s.remainingMs <= 10000);
        if (s.phase === 'manual' && s.remainingMs !== null && s.remainingMs > 0 && s.remainingMs <= 10000) sound.play(SOUNDS.TIME_RUNNING_OUT);
    }
    ensureRoundClock() {
        this.updateClock();
        if (this.roundTickJob || this.flow.getState().remainingMs === null) return;
        const job = gameClock.schedule(() => {
            this.jobs.delete(job); this.roundTickJob = null;
            if (this.disposed || this.flow.getState().phase !== 'manual') return;
            if (!this.lastSaveAt || gameClock.now() - this.lastSaveAt >= 1000) { this.sync(); this.lastSaveAt = gameClock.now(); }
            if (this.flow.tick()) { this.sync(); this.render(); this.announce('Time is up. Only your saved choices become training examples.'); }
            else this.ensureRoundClock();
        }, 100);
        this.roundTickJob = job; this.jobs.add(job);
    }

    fillCV(view, applicant, index, total) {
        const container = this.find('[data-view="' + view + '"] .ShiftCV');
        const put = (field, value) => { container.querySelector('[data-field="' + field + '"]').textContent = value; };
        put('name', applicant.name); put('city', applicant.city);
        put('number', String(index + 1).padStart(2, '0') + ' / ' + total);
        put('skill', applicant.skill + ' / 100');
        put('experience', applicant.experience + (applicant.experience === 1 ? ' year' : ' years'));
        put('academy', applicant.academy);
        container.querySelector('[data-field="skill-meter"]').value = applicant.skill;
        container.querySelector('[data-field="experience-meter"]').value = applicant.experience;
        container.querySelector('[data-field="city-dot"]').classList.toggle('CityDot--blue', applicant.city === 'Chennai');
    }
    ledger(target, people, decisionFor) {
        const list = this.find(target); list.textContent = '';
        people.forEach(person => {
            const item = document.createElement('li'), name = document.createElement('span'), decision = document.createElement('strong');
            name.textContent = person.name + ' · ' + person.city;
            const shortlisted = decisionFor(person);
            decision.textContent = shortlisted ? 'Shortlist' : 'Pass';
            decision.className = shortlisted ? 'DecisionTag is-shortlisted' : 'DecisionTag';
            item.append(name, decision); list.appendChild(item);
        });
    }
    render(override) {
        const s = this.flow.getState();
        const view = override || s.phase;
        this.setView(view);
        if (view === 'manual') {
            this.put('#round-label', 'ROUND ' + (s.roundIndex + 1) + ' / ' + s.rounds.length + ' · ' + s.round.name.toUpperCase());
            this.put('#desk-heading', s.roundIndex === 0 ? 'Take your time with each CV.' : s.roundIndex === 1 ? 'The queue is growing.' : 'Can you keep up?');
            this.put('#manual-count', s.roundDecisionCount + ' of ' + s.roundApplicants.length + ' reviewed · ' + s.decisionCount + ' choices saved overall');
            this.put('#round-goal', 'Shortlisted ' + s.roundShortlisted + ' of ' + s.round.goal);
            document.getElementById('chapter-name').textContent = 'Round ' + (s.roundIndex + 1) + ' of 3';
            this.find('[data-view="manual"] .ShiftCV').hidden = !this.cvOpen;
            this.find('#cv-closed').hidden = this.cvOpen;
            this.find('[data-view="manual"] .DecisionActions').hidden = !this.cvOpen;
            if (this.cvOpen) this.fillCV(view, s.currentApplicant, s.roundApplicants.indexOf(s.currentApplicant), s.roundApplicants.length);
            const pending = s.roundApplicants.filter(person => !this.decided(s, person.id));
            const start = Math.max(0, pending.findIndex(person => person.id === s.selectedId) - 2);
            this.scene.setApplicants(pending.slice(start, start + 6), this.cvOpen ? s.selectedId : null);
            this.ensureRoundClock();
            if (this.soundedRound !== s.roundIndex) {
                this.soundedRound = s.roundIndex;
                sound.play(SOUNDS.STAGE_BEGIN); sound.play(SOUNDS.MANUAL_AMBIENT);
            }
        }
        if (view === 'round-break') {
            const last = s.roundReports[s.roundReports.length - 1], next = s.rounds[s.roundIndex + 1];
            this.put('#round-finished-number', 'ROUND ' + (s.roundIndex + 1) + ' / ' + s.rounds.length);
            this.put('#round-outcome', last.goalMet ? 'SHORTLIST GOAL MET' : 'SOME ROLES ARE STILL OPEN');
            this.put('#round-break-heading', last.reason === 'time' ? 'The clock ran out.' : 'This round is done.');
            this.put('#round-report', last.reviewed + ' CVs reviewed. ' + last.shortlisted + ' shortlisted. ' + last.passed + ' passed.');
            this.put('#round-unreviewed', last.unreviewed ? last.unreviewed + ' CVs were not reviewed. They stay out of Scout\'s training examples.' : 'Every CV in this round has an explicit choice saved.');
            const timed = next.duration !== null;
            this.put('#next-round-message', next.name + ': shortlist ' + next.goal + ' from ' + s.session.pools[next.pool].length + ' CVs' + (timed ? ' in ' + next.duration / 1000 + ' seconds.' : '. Take your time.') + ' The clock starts when you open the round.');
        }
        if (view === 'ready') {
            const last = s.roundReports[s.roundReports.length - 1];
            this.put('#ready-heading', s.roundReports.some(r => r.reason === 'time' && r.unreviewed) ? 'The queue got ahead of us.' : 'Time to bring in Scout.');
            this.put('#saved-choice-count', s.decisionCount + ' SAVED CHOICES');
            this.put('#ready-message', 'You made ' + s.decisionCount + ' choices across ' + s.roundReports.length + ' rounds. Send the reviewed CVs to the engineer so Scout can learn from them.');
            this.put('#last-round-report', 'Last round: ' + last.shortlisted + ' shortlisted, with a goal of ' + last.goal + '. ' + last.unreviewed + ' CVs left unreviewed.');
            this.ledger('#choice-ledger', this.reviewed(s), p => s.session.playerDecisions[p.id]);
            const unseen = s.capacity - s.decisionCount;
            this.put('#ready-exclusions', (unseen ? unseen + ' unreviewed CVs are excluded. ' : '') + 'These labels say what you chose. They do not prove who can do the job.');
        }
        this.setBusy(this.busy);
    }
    setBusy(busy) {
        this.busy = busy; this.root.setAttribute('aria-busy', String(busy));
        for (const action of ['begin', 'next-round', 'shortlist', 'pass', 'handoff', 'open-cv', 'previous-applicant', 'next-applicant']) {
            const button = this.find('[data-action="' + action + '"]');
            if (button) button.disabled = busy;
        }
    }
    select(id) {
        if (!this.available() || this.flow.getState().phase !== 'manual') return;
        if (this.flow.select(id)) { this.cvOpen = true; this.sync(); this.render(); this.find('[data-view="manual"] h2').focus(); this.announce('CV opened for ' + this.flow.getState().currentApplicant.name + '.'); }
        else if (this.flow.getState().phase !== 'manual') { this.sync(); this.render(); }
    }
    async decide(decision) {
        if (!this.available() || this.flow.getState().phase !== 'manual') return;
        if (!this.cvOpen) { this.announce('Open a CV before deciding.'); return; }
        const before = this.flow.getState(); this.setBusy(true);
        const generation = this.generation;
        const saved = this.flow.decide(before.selectedId, decision); this.sync();
        if (!saved) { this.setBusy(false); this.render(); this.announce('Time is up. That choice was not recorded.'); return; }
        sound.play(decision ? SOUNDS.PERSON_ACCEPTED : SOUNDS.BUTTON_CLICK);
        if (this.flow.getState().phase !== 'manual') sound.stop(SOUNDS.TIME_RUNNING_OUT);
        await this.scene.animateDecision(before.selectedId, decision);
        if (this.disposed || this.generation !== generation) return;
        this.cvOpen = false; this.setBusy(false); this.render();
        this.announce(before.currentApplicant.name + ': ' + (decision ? 'Shortlist.' : 'Pass.') + ' ' + this.flow.getState().decisionCount + ' choices saved.');
        if (this.flow.getState().phase === 'manual') this.find('[data-action="open-cv"]').focus();
    }
    click(event) {
        const applicant = event.target.closest('[data-applicant]');
        if (applicant) { this.select(applicant.dataset.applicant); return; }
        const button = event.target.closest('button[data-action]');
        if (!button || !this.available()) return;
        const action = button.dataset.action;
        sound.play(SOUNDS.BUTTON_CLICK);
        try {
            if (action === 'begin') { this.flow.begin(); this.sync(); this.render(); this.find('[data-action="open-cv"]').focus(); }
            if (action === 'next-round') { this.flow.nextRound(); this.sync(); this.render(); this.find('[data-action="open-cv"]').focus(); }
            if (action === 'open-cv') this.select(this.flow.getState().selectedId);
            if (action === 'shortlist' || action === 'pass') this.decide(action === 'shortlist').catch(e => this.showError(e));
            if (action === 'previous-applicant' || action === 'next-applicant') this.navigate(action === 'next-applicant' ? 1 : -1);
            if (action === 'handoff' && this.flow.getState().phase === 'ready' && this.options.onContinue) {
                this.options.onContinue(this.flow.getState().session, this.flow.checkpoint());
            }
        } catch (error) { this.showError(error); }
    }
    keydown(event) {
        if (!this.available() || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]') || this.flow.getState().phase !== 'manual') return;
        const key = event.key.toLowerCase();
        if (key === 's' || key === 'p') { event.preventDefault(); this.decide(key === 's').catch(e => this.showError(e)); }
        if (key === 'arrowleft' || key === 'arrowright') {
            event.preventDefault(); this.navigate(key === 'arrowright' ? 1 : -1);
        }
    }
    navigate(direction) {
        if (!this.available() || this.flow.getState().phase !== 'manual') return;
        const s = this.flow.getState(), pending = s.roundApplicants.filter(person => !this.decided(s, person.id));
        const index = pending.findIndex(person => person.id === s.selectedId);
        if (pending.length) this.select(pending[(index + direction + pending.length) % pending.length].id);
    }
    showError(error) { this.setBusy(false); const message = this.find('#shift-error'); message.hidden = false; message.textContent = 'Something stopped this step. ' + error.message; }
    destroy() {
        this.sync();
        this.disposed = true; this.generation++; this.root.removeEventListener('click', this.click); document.removeEventListener('keydown', this.keydown);
        this.jobs.forEach(job => gameClock.cancel(job)); this.jobs.clear();
        if (this.scene) this.scene.destroy();
        sound.stop(SOUNDS.TRAIN_ALGORITHM); sound.stop(SOUNDS.MANUAL_AMBIENT); sound.stop(SOUNDS.TIME_RUNNING_OUT);
        mountCanvas(null); this.root.hidden = true;
    }
}
