import * as machina from 'machina';
import FirstShiftUI from '../../components/interface/first-shift/first-shift';
import {stopTweenManager} from './gameSetup';
import {gameClock} from './gameClock';
import {createJourney, restoreJourney} from '../../learning/journey';
import {restoreFirstShift} from '../../learning/firstShift';
import {createProgressStore} from '../../learning/persistence';
import ReviewUI from '../../components/interface/review/review';

let storage;
try { storage = window.localStorage; } catch (error) { storage = null; }
const progress = createProgressStore(storage);
let active, firstCheckpoint, firstSession, restoredFirst, restoredReview, invalidSave = false, skipSaving = false;
function save(review = null) {
    if (skipSaving) return;
    const saved = progress.write({first: firstCheckpoint, review});
    document.getElementById('storage-note').hidden = saved;
}
function fresh() {
    skipSaving = true; progress.clear();
    window.location.assign(window.location.pathname);
}
const continueSave = () => gameFSM.transition(restoredReview ? 'review' : 'firstShift');
const freshSave = () => { progress.clear(); restoredFirst = null; restoredReview = null; gameFSM.transition('firstShift'); };
function hideResume() {
    document.getElementById('resume-panel').hidden = true;
    document.getElementById('continue-save').removeEventListener('click', continueSave);
    document.getElementById('fresh-save').removeEventListener('click', freshSave);
}
const gameFSM = new machina.Fsm({
    namespace: 'hire-and-seek',
    states: {
        uninitialized: {startGame() {
            const saved = progress.read();
            if (saved.kind === 'empty') { this.transition('firstShift'); return; }
            try {
                if (saved.kind !== 'saved') throw new Error('Invalid save.');
                restoredFirst = restoreFirstShift(saved.value.first, {now: () => gameClock.now()});
                firstCheckpoint = restoredFirst.checkpoint(); firstSession = restoredFirst.getState().session;
                if (saved.value.review) {
                    if (restoredFirst.getState().phase !== 'summary') throw new Error('The saved shift is incomplete.');
                    restoredReview = restoreJourney(firstSession, saved.value.review);
                }
            } catch (error) { invalidSave = true; restoredFirst = null; restoredReview = null; }
            this.transition('resume');
        }},
        resume: {
            _onEnter() {
                document.getElementById('resume-panel').hidden = false;
                document.getElementById('resume-message').textContent = invalidSave ? 'This saved game could not be read. Start a fresh shift to play.' : 'Your progress is saved on this browser. Continue your shift or start a new one.';
                const button = document.getElementById('continue-save'); button.hidden = invalidSave;
                button.addEventListener('click', continueSave);
                document.getElementById('fresh-save').addEventListener('click', freshSave);
                (invalidSave ? document.getElementById('fresh-save') : button).focus();
            },
            _onExit() { hideResume(); },
        },
        firstShift: {
            _onEnter() { active = new FirstShiftUI({flow: restoredFirst,
                onSave(checkpoint) { firstCheckpoint = checkpoint; save(); },
                onContinue(session, checkpoint) { firstSession = session; firstCheckpoint = checkpoint; restoredReview = createJourney(session); gameFSM.transition('review'); },
            }); },
            _onExit() { if (active) { active.destroy(); active = null; } },
        },
        review: {
            _onEnter() { active = new ReviewUI({flow: restoredReview, session: firstSession,
                onSave(checkpoint) { save(checkpoint); }, onNew: fresh, storageStatus: () => progress.available()}); },
            _onExit() { if (active) { active.destroy(); active = null; } },
        },
    },
    startGame() { this.handle('startGame'); },
    nextStage() { this.handle('nextStage'); },
});

export function disposeGame() {
    if (active) { active.destroy(); active = null; }
    hideResume();
    stopTweenManager();
}
document.addEventListener('visibilitychange', () => { if (active && document.hidden) { if (active.sync) active.sync(); else active.save(); } });
export {gameFSM};
