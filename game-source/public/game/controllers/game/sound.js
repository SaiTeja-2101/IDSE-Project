import {Howl, Howler} from 'howler';
import {SOUND_MANIFEST} from '../constants';
import {gameClock} from './gameClock';

let soundMuted = false, gamePaused = false;
const jobs = new Map();
const find = name => SOUND_MANIFEST.find(sound => sound.name === name);
const unlockEvents = ['pointerdown', 'keydown', 'click'];

export function getStatus() {
    return {muted: soundMuted, loaded: SOUND_MANIFEST.filter(s => s.player).length,
        failed: SOUND_MANIFEST.filter(s => s.failed).length,
        unavailable: SOUND_MANIFEST.every(s => s.failed)};
}
function notify() { window.dispatchEvent(new CustomEvent('hire-seek-audio')); }
function unlock() {
    const ctx = Howler.ctx;
    if (!ctx) return;
    const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
    Promise.resolve(resumed).then(() => {
        if (ctx.state === 'running') unlockEvents.forEach(event => window.removeEventListener(event, unlock, true));
    }).catch(() => {}); // Keep the listeners so the next gesture can try again.
}
export function init() { unlockEvents.forEach(event => window.addEventListener(event, unlock, true)); }
export const load = () => Promise.all(SOUND_MANIFEST.map(sound => loadSound(sound.name)));
export function toggleVolume() {
    soundMuted = !soundMuted;
    Howler.mute(soundMuted);
    unlock(); notify();
    return soundMuted;
}
export function setGamePaused(paused) {
    if (paused === gamePaused) return;
    gamePaused = paused;
    SOUND_MANIFEST.forEach(sound => {
        if (!sound.player) return;
        if (paused) {
            sound.resumeAfterPause = Boolean(sound.playerID != null && sound.player.playing(sound.playerID));
            if (sound.resumeAfterPause) sound.player.pause(sound.playerID);
        } else if (sound.resumeAfterPause) {
            sound.resumeAfterPause = false;
            sound.player.play(sound.playerID);
        }
    });
}
export function stop(name) {
    gameClock.cancel(jobs.get(name)); jobs.delete(name);
    const sound = find(name);
    if (!sound) return;
    sound.resumeAfterPause = false;
    if (sound.player && sound.playerID != null) sound.player.stop(sound.playerID);
}
export function schedule(name, waitForSeconds) {
    gameClock.cancel(jobs.get(name));
    jobs.set(name, gameClock.schedule(() => { jobs.delete(name); play(name); }, waitForSeconds * 1000));
}
export function fadeOut(name, resetPlayback = true) {
    const sound = find(name);
    if (!sound || !sound.player || !sound.player.playing(sound.playerID)) return;
    gameClock.cancel(jobs.get(name));
    const id = sound.playerID;
    sound.player.fade(sound.volume, 0, 1000, id);
    jobs.set(name, gameClock.schedule(() => {
        jobs.delete(name);
        if (resetPlayback) sound.player.stop(id); else sound.player.pause(id);
        sound.player.volume(sound.volume, id);
    }, 1000));
}
export function play(name) {
    if (gamePaused) return;
    const sound = find(name);
    if (sound && sound.player && !sound.player.playing(sound.playerID)) sound.playerID = sound.player.play();
}
export function loadSound(name) {
    const sound = find(name);
    if (!sound) return Promise.reject(new Error('Unknown sound: ' + name));
    return new Promise(resolve => {
        const player = new Howl({src: [sound.path], loop: sound.loop,
            volume: sound.volume === undefined ? 1 : sound.volume});
        player.once('load', () => { sound.player = player; sound.failed = false; notify(); resolve(); });
        player.once('loaderror', () => {
            sound.player = null; sound.failed = true; player.unload(); notify(); resolve();
        });
        player.on('playerror', id => {
            player.once('unlock', () => {
                if (!gamePaused && !soundMuted && sound.player === player) sound.playerID = player.play(id);
            });
        });
    });
}
