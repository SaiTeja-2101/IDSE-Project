import * as PIXI from 'pixi.js';
import {mlLabStageContainer} from '~/public/game/controllers/game/gameSetup';
import {screenSizeDetector, uv2px} from '~/public/game/controllers/common/utils.js';
import {beltTexture} from '~/public/game/controllers/common/textures.js';
import {eventEmitter} from '~/public/game/controllers/game/gameSetup.js';
import {SCALES, EVENTS, ANCHORS} from '~/public/game/controllers/constants';

export default class {
    constructor() {
        this.resizeHandler = this._draw.bind(this);
        eventEmitter.on(EVENTS.RESIZE, this.resizeHandler);
        this.beltContainer = new PIXI.Container();
        mlLabStageContainer.addChild(this.beltContainer);
        this._draw();
    }

    _draw() {
        this._recomputeParams();

        for (let i = this.beltContainer.children.length - 1; i >= 0; i--) {
            if (this.beltContainer.children[i].type && this.beltContainer.children[i].type === 'belt') {
                this.beltContainer.children[i].destroy();
            }
        }

        // draw new belt pieces
        for (let j = 0; j<this.numOfPieces; j++) {
            const belt = new PIXI.Sprite(beltTexture);
            const palette = new PIXI.filters.ColorMatrixFilter();
            palette.matrix = [0.12,0.24,0.04,0,0.05, 0.22,0.45,0.08,0,0.06, 0.22,0.42,0.08,0,0.12, 0,0,0,1,0];
            belt.filters = [palette];
            belt.scale.set(this.scale);
            belt.x = belt.width * j;
            belt.type = 'belt';
            this.beltContainer.addChild(belt);
        }
    }

    _recomputeParams() {
        this.scale = SCALES.BELT[screenSizeDetector()];
        this.numOfPieces = Math.floor(uv2px(1, 'w') / (beltTexture.width * this.scale)) + 1;
        // position belt on the first floor
        this.beltContainer.y = uv2px(ANCHORS.FLOORS.FIRST_FLOOR.y, 'h') - this.scale*beltTexture.height*1.2;
    }

    // it is dangerous to not remove the event listener when destroying sprites
    destroy() {
        eventEmitter.off(EVENTS.RESIZE, this.resizeHandler);

        for (let i = this.beltContainer.children.length - 1; i >= 0; i--) {
            if (this.beltContainer.children[i].type && this.beltContainer.children[i].type === 'belt') {
                this.beltContainer.children[i].destroy();
            }
        }
        this.beltContainer.destroy({children: true});
    }
};
