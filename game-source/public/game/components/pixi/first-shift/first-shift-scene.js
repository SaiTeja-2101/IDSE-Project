import * as PIXI from 'pixi.js';
import {TweenMax} from 'gsap/TweenMax';
import {officeStageContainer, mlLabStageContainer, eventEmitter, pixiApp} from '../../../controllers/game/gameSetup';
import {createPersonSprite, getAnimationByName} from '../../../controllers/common/utils';
import {SPRITES} from '../../../controllers/common/textures';
import {EVENTS, ANIM} from '../../../controllers/constants';
import Floor from '../manual-stage/floor';
import Door from '../manual-stage/door';
import Machine from '../ml-stage/machine';
import ConveyorBelt from '../ml-stage/conveyor-belt';

export default class FirstShiftScene {
    constructor({mode = 'manual', onSelect = () => {}} = {}) {
        this.mode = mode;
        this.onSelect = onSelect;
        this.sprites = new Map();
        this.effects = [];
        this.root = new PIXI.Container();
        (mode === 'manual' ? officeStageContainer : mlLabStageContainer).addChild(this.root);
        this.floor = new Floor({type: 'first_floor'}).addToPixi(this.root);
        this.doors = [
            new Door({type: 'doorAccepted', floor: 'first_floor', floorParent: this.floor, xAnchorUV: 0.85, scaleName: 'DOOR'}).addToPixi(this.root),
            new Door({type: 'doorRejected', floor: 'first_floor', floorParent: this.floor, xAnchorUV: 0.06, scaleName: 'DOOR'}).addToPixi(this.root),
        ];
        if (mode === 'demo') {
            this.belt = new ConveyorBelt();
            this.root.addChild(this.belt.beltContainer);
            this.machine = new Machine();
            this.root.addChild(this.machine.machine);
            this.ray = new PIXI.extras.AnimatedSprite(SPRITES.rayAnim.textures);
            this.ray.visible = false;
            this.root.addChild(this.ray);
        }
        this.people = new PIXI.Container();
        this.root.addChild(this.people);
        this.selection = new PIXI.Graphics();
        this.root.addChildAt(this.selection, this.root.children.length - 1);
        this.resize = this.resize.bind(this);
        eventEmitter.on(EVENTS.RESIZE, this.resize);
        this.resize();
    }

    get reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

    setApplicants(records, selectedId) {
        this.finishAnimation();
        this.sprites.forEach(sprite => sprite.destroy());
        this.sprites.clear();
        records.forEach(record => {
            const sprite = createPersonSprite(record.spriteGroup);
            sprite.anchor.set(0.5, 1);
            sprite.record = record;
            sprite.interactive = this.mode === 'manual';
            sprite.buttonMode = this.mode === 'manual';
            sprite.on('pointertap', () => this.onSelect(record.id));
            this.people.addChild(sprite);
            this.sprites.set(record.id, sprite);
        });
        this.selectedId = selectedId;
        this.resize();
    }

    select(id) {
        this.selectedId = id;
        this.selection.clear();
        this.sprites.forEach((sprite, key) => {
            sprite.alpha = key === id || this.mode === 'demo' ? 1 : 0.65;
            sprite.stop();
            if (key === id && this.mode === 'manual') {
                this.selection.beginFill(0xf0b84b, 0.65);
                this.selection.drawEllipse(sprite.x, sprite.y - 3, Math.max(14, sprite.width * 0.65), 6);
                this.selection.endFill();
                sprite.textures = getAnimationByName({color: sprite.record.spriteGroup, animName: 'idle'});
                if (!this.reducedMotion) { sprite.animationSpeed = 0.25; sprite.play(); }
            }
        });
    }

    resize() {
        this.finishAnimation();
        const {width, height} = pixiApp.screen;
        const floorY = height * 0.82;
        this.floor.surface.y = floorY;
        this.floor.surface.height = height - floorY;
        this.floor.side.y = floorY + 12;
        this.floor.side.height = 12;
        this.doors.forEach((door, i) => {
            door.sprite.scale.set(1);
            door.sprite.scale.set(Math.min(height * 0.57 / door.sprite.height, width * 0.12 / door.sprite.width));
            door.sprite.position.set(width * (i === 0 ? 0.85 : 0.03), floorY - door.sprite.height);
        });
        let index = 0;
        this.sprites.forEach(sprite => {
            sprite.scale.set(1);
            const factor = Math.min(150, height * 0.45, width * 0.12 * 2) / sprite.height;
            sprite.scale.set(factor);
            const count = this.sprites.size;
            sprite.x = this.mode === 'manual' ? width * (0.22 + index * (count > 1 ? 0.54 / (count - 1) : 0)) : width * 0.22;
            sprite.y = floorY;
            index++;
        });
        if (this.machine) {
            this.machine.draw();
            const machine = this.machine.machine;
            machine.scale.set(1);
            this.machine.scale = Math.min(height * 0.6 / machine.height, width * 0.25 / machine.width);
            machine.scale.set(this.machine.scale);
            machine.position.set(width * 0.48, floorY - machine.height);
            this.belt.beltContainer.y = floorY - 12;
            const dimensions = this.machine.getMachineDimensions();
            this.ray.scale.set(dimensions.scale);
            this.ray.position.set(dimensions.x, dimensions.y);
        }
        this.select(this.selectedId);
    }

    animateDecision(id, decision, scan = false) {
        const sprite = this.sprites.get(id);
        if (!sprite) return Promise.resolve();
        this.selection.clear();
        return new Promise(resolve => {
            this.animationDone = resolve;
            const walk = () => {
                if (this.ray) { this.ray.stop(); this.ray.visible = false; }
                const door = this.doors[decision ? 0 : 1];
                if (!this.reducedMotion) door.playAnimation({direction: 'forward'});
                sprite.textures = getAnimationByName({color: sprite.record.spriteGroup, animName: ANIM.WALK_NEUTRAL});
                if (!this.reducedMotion) { sprite.animationSpeed = 0.6; sprite.play(); }
                this.effects.push(TweenMax.to(sprite, this.reducedMotion ? 0 : 0.45, {
                    x: door.sprite.x + door.sprite.width / 2, alpha: 0,
                    onComplete: () => { door.sprite.gotoAndStop(0); this.finishAnimation(); },
                }));
            };
            if (scan && !this.reducedMotion) {
                const dimensions = this.machine.getMachineDimensions();
                this.effects.push(TweenMax.to(sprite, 0.35, {x: dimensions.x + dimensions.width / 2,
                    onComplete: () => {
                        this.ray.visible = true; this.ray.animationSpeed = 0.8; this.ray.play();
                        this.effects.push(TweenMax.delayedCall(0.5, walk));
                    }}));
            } else walk();
        });
    }

    finishAnimation() {
        const done = this.animationDone;
        this.animationDone = null;
        this.effects.forEach(effect => effect.kill());
        this.effects = [];
        if (this.ray) { this.ray.stop(); this.ray.visible = false; }
        if (done) done();
    }

    destroy() {
        this.finishAnimation();
        eventEmitter.off(EVENTS.RESIZE, this.resize);
        this.doors.forEach(door => door.destroy());
        if (this.belt) this.belt.destroy();
        if (this.machine) this.machine.destroy();
        this.floor.destroy();
        this.root.destroy({children: true});
        this.sprites.clear();
    }
}
