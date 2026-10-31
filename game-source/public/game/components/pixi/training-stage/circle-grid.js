import * as PIXI from 'pixi.js';
import {uv2px} from '~/public/game/controllers/common/utils.js';
import {mlTrainingStageContainer, eventEmitter, pixiApp, ticker} from '~/public/game/controllers/game/gameSetup.js';
import {EVENTS} from '~/public/game/controllers/constants';
import {gameClock} from '../../../controllers/game/gameClock';

export default class {
    constructor() {
        this.jobs = new Set();
        this.destroyed = false;
        this.flickering = false;
        this.processingHandler = this.processingHandler.bind(this);
        this.resizeHandler = this._resizeHandler.bind(this);
        this.minMargin = 12;
        this.surface = null;
        this.side = null;
        this.elapsedTime = 0;
        this.gridUpdate = 200;
        this.gridOffset = 50;
        this.cols = undefined;
        this.rows = undefined;
        this.marginX = undefined;
        this.marginY = undefined;
        // this.rowsLitUp = this.rows;
        this.rowsLitUp = 0;
        this.addToPixi();
        eventEmitter.on(EVENTS.RESIZE, this.resizeHandler);
    }

    addToPixi() {
        this.ctx = new PIXI.Graphics();
        this.getGridDimensions();
        mlTrainingStageContainer.addChild(this.ctx);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.rowsLitUp = this.rows;
            this._draw({mode: 'lightUp'});
        } else this.lightUp();
    }

    lightUp() {
        this._draw({mode: 'lightUp'});
        this.rowsLitUp++;
        this.schedule(() => {
            // console.log(`rows lit up: ${this.rowsLitUp} / total rows: ${this.rows}`);
            if (this.rowsLitUp < this.rows) {
                console.log('light up another row!');
                this.lightUp();
            } else {
                console.log('start processing!');
                this.startFlickering();
            }
        }, 100);
    }

    lightDown() {
        this._draw({mode: 'lightDown'});
        this.rowsLitUp--;
        this.schedule(() => {
            if (this.rowsLitUp >= 0) {
                console.log('light down another row!');
                this.lightDown();
            } else {
                this.ctx.clear();
                console.log('stop processing!');
            }
        }, 100);
    }

    startFlickering() {
        if (this.destroyed || this.flickering) return;
        this.flickering = true;
        ticker.add(this.processingHandler);
    }

    stopFlickering() {
        this.flickering = false;
        ticker.remove(this.processingHandler);
    }

    processingHandler() {
        this.elapsedTime += ticker.elapsedMS;
        if (this.elapsedTime > this.gridUpdate) {
            this._draw({mode: 'random'});
            this.elapsedTime = 0;
        };
    }

    getGridDimensions() {
        const {width, height} = pixiApp.screen;
        this.cols = Math.floor((width - 2*this.minMargin)/this.gridOffset);
        this.rows = Math.floor((height - 2*this.minMargin)/this.gridOffset);
        this.marginX = Math.round((width - (this.cols*this.gridOffset))/2);
        this.marginY = Math.round((height - (this.rows*this.gridOffset))/2);
    }

    _draw({mode = undefined}) {
        if (this.destroyed) return;
        this.ctx.clear();

        let drawFilter;
        switch (mode) {
        case 'lightUp':
        case 'lightDown':
            drawFilter = (x, y, row, col) => {
                if (row <= this.rowsLitUp) {
                    const x = this.marginX + (col*this.gridOffset);
                    const y = this.marginY + (row*this.gridOffset);
                    this.ctx.beginFill(0x438d7b);
                    this.ctx.drawCircle(x, y, 5);
                    this.ctx.endFill();
                }
            };
            break;
        case 'random':
            drawFilter = (x, y, row, col) => {
                if (Math.random() > 0.5) {
                    this.ctx.beginFill(0x438d7b);
                    this.ctx.drawCircle(x, y, 5);
                    this.ctx.endFill();
                }
            };
            break;
        default:
            console.warn(`mode ${mode} is invalid for drawing circles`);
        }

        for (let col = 0; col <= this.cols; col++) {
            for (let row = 0; row <= this.rows; row++) {
                // console.log('row');
                const x = this.marginX + (col*this.gridOffset);
                const y = this.marginY + (row*this.gridOffset);
                drawFilter(x, y, row, col);
            }
        }
    }


    // resize function

    _resizeHandler() {
        this.getGridDimensions();
        this._draw({mode: 'random'});
    }

    // add event listeners

    _addEventListeners() {
        eventEmitter.on(EVENTS.RESIZE, this._resizeHandler.bind(this));
    }

    // remove event listeners

    _removeEventListeners() {
        eventEmitter.off(EVENTS.RESIZE, this._resizeHandler.bind(this));
    }

    destroy() {
        this.destroyed = true;
        this.stopFlickering();
        this.jobs.forEach(job => gameClock.cancel(job));
        this.jobs.clear();
        eventEmitter.off(EVENTS.RESIZE, this.resizeHandler);
        this.ctx.destroy();
    }

    schedule(callback, delay) {
        const job = gameClock.schedule(() => {
            this.jobs.delete(job);
            if (!this.destroyed) callback();
        }, delay);
        this.jobs.add(job);
    }
}
