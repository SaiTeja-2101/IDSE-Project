import * as PIXI from 'pixi.js';
import * as tweenManager from 'pixi-tween';
const debounce = require('debounce');
import EVENTS from '../constants/events';
import {gameClock} from './gameClock';

// make fullscreen app
const pixiApp = new PIXI.Application(
    window.innerWidth,
    window.innerHeight,
    {backgroundColor: 0xe2f1ec}
);
pixiApp.renderer.autoResize = true;
// pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
// pixiApp.renderer.antialias = true;


// TODO - should these be pre-defined here?
const officeStageContainer = new PIXI.Container();
const mlLabStageContainer = new PIXI.Container();
const mlTrainingStageContainer = new PIXI.Container();
const timerContainer = new PIXI.Container();
const beltContainer = new PIXI.Container();

pixiApp.stage.addChild(officeStageContainer);
pixiApp.stage.addChild(timerContainer);
pixiApp.stage.addChild(beltContainer);
pixiApp.stage.addChild(mlLabStageContainer);
pixiApp.stage.addChild(mlTrainingStageContainer);

// shared eventEmitter across components
const eventEmitter = new PIXI.utils.EventEmitter();
PIXI.settings.PRECISION_FRAGMENT = 'highp';

// console.log(PIXI.Ticker);
const ticker = pixiApp.ticker;
ticker.autoStart = false;
let canvasHost = null;
let hostObserver = null;

export function mountCanvas(host) {
    if (hostObserver) hostObserver.disconnect();
    canvasHost = host;
    const canvas = document.getElementById('gameCanvas');
    canvas.hidden = !host;
    if (!host) return;
    host.appendChild(canvas);
    resize();
    hostObserver = new ResizeObserver(resize);
    hostObserver.observe(host);
}

// setup for the pixi-tween manager  CALLED AT THE END OF MAIN.JS
let raf;
let previousFrame = performance.now();
let startTweenManager = function() {
    if (raf) return;
    renderFrame();
};
function renderFrame() {
    raf = window.requestAnimationFrame(renderFrame);
    const now = performance.now();
    if (!gameClock.paused) {
        pixiApp.renderer.render(pixiApp.stage);
        PIXI.tweenManager.update(Math.min((now - previousFrame) / 1000, 0.1));
    }
    previousFrame = now;
}
let stopTweenManager = function() {
    window.cancelAnimationFrame(raf);
    raf = null;
};
startTweenManager = startTweenManager.bind(this);
stopTweenManager = stopTweenManager.bind(this);

window.addEventListener('resize', debounce(resize, 200));
window.addEventListener('orientationchange', resize);

function resize() {
    if (!canvasHost) return;
    const bounds = canvasHost.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pixiApp.renderer.resize(Math.round(bounds.width), Math.round(bounds.height));
    pixiApp.renderer.render(pixiApp.stage);
    eventEmitter.emit(EVENTS.RESIZE, {});
}

export {pixiApp, beltContainer, officeStageContainer, mlTrainingStageContainer, mlLabStageContainer, timerContainer, eventEmitter, startTweenManager, stopTweenManager, ticker};
