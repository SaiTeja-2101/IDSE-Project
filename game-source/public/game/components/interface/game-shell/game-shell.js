import {TweenMax} from 'gsap/TweenMax';
import * as PIXI from 'pixi.js';
import {pixiApp, stopTweenManager, startTweenManager} from '../../../controllers/game/gameSetup';
import {gameClock} from '../../../controllers/game/gameClock';
import * as sound from '../../../controllers/game/sound';
import {createAnimationPauseController} from '../../../controllers/game/animationPause';

const stageInfo = {
    title: [1, 'Your first hires', 'Waiting for your first hires'],
    'manual-small': [1, 'Your first hires', 'Watching your choices'],
    'manual-medium': [1, 'Your first hires', 'Collecting your choices'],
    'manual-large': [1, 'Your first hires', 'Learning what you look for'],
    transition: [2, 'Meet Scout', 'Ready to learn from past CVs'],
    training: [2, 'Meet Scout', 'Finding patterns in the records'],
    'ml-lab': [3, 'Look closer', 'Screening the next applicants'],
    'game-end': [6, 'What did you notice?', 'Time to look back'],
    'first-shift-briefing': [1, 'Your first day', 'Ready when you are'],
    'first-shift-manual': [1, 'The hiring desk', 'Your saved choices become examples'],
    'first-shift-round-break': [1, 'The hiring desk', 'The workload is growing'],
    'first-shift-ready': [2, 'Meet Scout', 'Start with your examples'],
    'first-shift-training': [2, 'Meet Scout', 'Learning questions from the selected examples'],
    'first-shift-screening': [2, 'Meet Scout', 'Trying the learned questions on new CVs'],
    'first-shift-personal-summary': [2, 'Meet Scout', 'What will the company archive add?'],
    'first-shift-summary': [2, 'Meet Scout', 'Compare the choices before and after'],
    'review-investigation': [3, 'Look closer', 'Check two different CVs'],
    'review-audit': [3, 'The audit', 'Check new examples'],
    'review-workshop': [4, 'Repair workshop', 'Try a change and measure it'],
    'review-final': [5, 'Recruitment day', 'Scout is locked for the final test'],
    'review-receipt': [6, 'Audit receipt', 'Look back at the evidence'],
};
export function updateShell(stage) {
    const [, title, status] = stageInfo[stage] || stageInfo.title;
    document.body.dataset.stage = stage;
    document.getElementById('chapter-name').textContent = title;
    document.getElementById('scout-status').textContent = status;
}
export function initShell() {
    const animations = createAnimationPauseController(TweenMax);
    const dialog = document.getElementById('pause-dialog');
    const resume = document.getElementById('resume-game');
    let previousFocus, tickerWasRunning, sharedWasRunning;
    function setPaused(paused) {
        if (paused === gameClock.paused) return;
        if (paused) {
            previousFocus = document.activeElement;
            tickerWasRunning = pixiApp.ticker.started;
            sharedWasRunning = PIXI.ticker.shared.started;
            pixiApp.ticker.stop();
            PIXI.ticker.shared.stop();
            stopTweenManager();
            animations.pause();
        }
        gameClock.setPaused(paused);
        sound.setGamePaused(paused);
        document.body.classList.toggle('game-paused', paused);
        for (const selector of ['#gameCanvas', '#first-shift', '#review-game', '#resume-panel', '.GameBar', '.ScoutPanel', '.js-titlepage', '.Overlay', '#js-resume', '.js-yes-no']) {
            document.querySelectorAll(selector).forEach(element => { element.inert = paused; });
        }
        dialog.hidden = !paused;
        if (paused) resume.focus();
        else {
            animations.resume();
            if (tickerWasRunning) pixiApp.ticker.start();
            if (sharedWasRunning) PIXI.ticker.shared.start();
            startTweenManager();
            if (previousFocus && previousFocus.isConnected) previousFocus.focus();
        }
    }
    document.getElementById('pause-game').addEventListener('click', () => setPaused(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
    resume.addEventListener('click', () => setPaused(false));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); setPaused(!gameClock.paused); }
        if (gameClock.paused && event.key === 'Tab') { event.preventDefault(); resume.focus(); }
        if (!gameClock.paused && ['Enter', ' '].includes(event.key) && event.target.matches('[role="button"]')) {
            event.preventDefault(); event.target.click();
        }
    });
    const mute = document.getElementById('sound-game');
    const refreshSound = () => {
        const status = sound.getStatus();
        mute.disabled = status.unavailable;
        mute.setAttribute('aria-pressed', String(status.muted));
        mute.textContent = status.unavailable ? 'No audio' : status.muted ? 'Sound off' : 'Sound on';
        mute.title = status.unavailable ? 'Audio could not load. You can still play.' : status.failed ? 'Some sounds could not load.' : 'Turn game sounds on or off';
    };
    window.addEventListener('hire-seek-audio', refreshSound);
    refreshSound();
    mute.addEventListener('click', () => {
        const muted = sound.toggleVolume();
        mute.setAttribute('aria-pressed', String(muted));
        mute.textContent = muted ? 'Sound off' : 'Sound on';
    });
    updateShell('first-shift-briefing');
    if (document.hidden) setPaused(true);
}
