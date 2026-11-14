import * as PIXI from 'pixi.js';
import {TweenMax} from 'gsap/TweenMax';
import {mlLabStageContainer, eventEmitter, pixiApp} from '../../../controllers/game/gameSetup';
import {createPersonSprite, getAnimationByName} from '../../../controllers/common/utils';
import {SPRITES} from '../../../controllers/common/textures';
import {EVENTS, ANIM} from '../../../controllers/constants';

const SCAN_TIME = 1.5;
const mix = (a, b, t) => a + (b - a) * t;
const segment = (time, start, end) => Math.max(0, Math.min(1, (time - start) / (end - start)));
const textureFor = applicant => applicant.spriteGroup === 'blue' ? SPRITES.factoryCvBlue : SPRITES.factoryCvOrange;

export default class ScoutFactory {
    constructor({onError = () => {}} = {}) {
        this.root = new PIXI.Container();
        this.resize = () => {
            try { this.layout(); }
            catch (error) { if (this.active) this.complete(error); else onError(error); }
        };
        this.line = [];
        this.people = [];
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        try {
            this.floor = new PIXI.Graphics();
            this.conveyor = new PIXI.Graphics();
            this.belt = new PIXI.extras.TilingSprite(SPRITES.factoryBelt, 1, 1);
            this.belt.tint = 0x9ed4bd;
            this.accepted = this.cloneAnimation('dataServerAccepted');
            this.passed = this.cloneAnimation('dataServerRejected');
            this.machine = new PIXI.Sprite(SPRITES.machine.texture);
            this.machine.filters = SPRITES.machine.filters;
            this.ray = this.cloneAnimation('rayAnim');
            this.door = this.cloneAnimation('doorEntry');
            this.door.loop = false;
            this.ray.visible = false;
            this.documents = new PIXI.Container();
            this.queue = new PIXI.Container();
            this.root.addChild(this.floor, this.accepted, this.passed, this.belt, this.conveyor, this.machine, this.documents, this.ray, this.door, this.queue);
            mlLabStageContainer.addChild(this.root);
            eventEmitter.on(EVENTS.RESIZE, this.resize);
            this.layout();
        } catch (error) { this.destroy(); throw error; }
    }

    cloneAnimation(id) {
        const original = SPRITES[id];
        const sprite = new PIXI.extras.AnimatedSprite(original.textures);
        sprite.filters = original.filters;
        return sprite;
    }

    fit(sprite, width, height) {
        sprite.scale.set(Math.min(width / sprite.texture.orig.width, height / sprite.texture.orig.height));
    }

    setQueue(records) {
        this.line = records;
        this.layout();
    }

    layout() {
        const {width, height} = pixiApp.screen;
        if (!width || !height) return;
        const beltY = height * 0.48, floorY = height * 0.9;
        const beltScale = Math.min(height * 0.28 / SPRITES.factoryBelt.height, 0.55);
        this.belt.width = width;
        this.belt.height = SPRITES.factoryBelt.height * beltScale;
        this.belt.tileScale.set(beltScale);
        this.belt.position.set(0, beltY);
        const upperFloor = beltY + this.belt.height;
        this.floor.clear().beginFill(0xc2ded2).drawRect(0, floorY, width, height - floorY).endFill()
            .beginFill(0xb0cfc1).drawRect(0, upperFloor, width, 7).endFill()
            .beginFill(0x82aa9c).drawRect(0, floorY, width, 4).endFill();
        [[this.accepted, 0.18], [this.passed, 0.82]].forEach(([rack, x]) => {
            rack.anchor.set(0.5, 1);
            this.fit(rack, width * 0.24, height * 0.37);
            rack.position.set(width * x, beltY + this.belt.height * 0.29);
        });
        this.machine.anchor.set(0.5, 1);
        this.fit(this.machine, width * 0.55, height * 0.22);
        this.machine.position.set(width * 0.50, beltY - height * 0.13);
        this.floor.beginFill(0x7b9c90).drawRect(width * 0.18, this.machine.y - this.machine.height * 0.55, width * 0.64, 3).endFill();
        this.ray.anchor.set(0.5, 0);
        this.fit(this.ray, this.machine.width * 0.63, height * 0.18);
        this.ray.position.set(width * 0.50, this.machine.y);
        this.door.anchor.set(0.5, 1);
        this.fit(this.door, width * 0.17, height * 0.28);
        this.door.position.set(width * 0.12, floorY);
        this.geometry = {width, height, beltY, floorY, visible: width < 420 ? 4 : width < 680 ? 6 : 8};
        this.drawFrame();
    }

    drawFrame() {
        const {width, height, beltY, floorY, visible} = this.geometry;
        const count = Math.min(this.line.length, visible + 1);
        while (this.people.length > count) this.people.pop().sprite.destroy();
        const scan = this.active, time = scan ? scan.progress.value : 0;
        const step = segment(time, 0.18, 0.96);
        for (let i = 0; i < count; i++) {
            const person = this.line[i];
            if (this.people[i]?.id !== person.id) {
                this.people[i]?.sprite.destroy();
                const sprite = createPersonSprite(person.spriteGroup);
                sprite.anchor.set(0.5, 1);
                this.queue.addChild(sprite);
                this.people[i] = {id: person.id, sprite};
            }
            const {sprite} = this.people[i];
            this.fit(sprite, width * 0.48 / visible, height * 0.25);
            const slot = 0.31 + (i - (i > 0 ? step : 0)) * 0.58 / (visible - 1);
            sprite.position.set(width * (i === 0 ? mix(slot, 0.12, step) : slot), floorY);
            sprite.alpha = i === 0 ? 1 - step : Math.min(1, Math.max(0, (0.99 - slot) / 0.09));
        }
        this.conveyor.clear().beginFill(0x537e70, 0.48);
        const offset = width * 0.32 * time % 24;
        for (let x = offset - 24; x < width; x += 24) {
            const start = Math.max(0, x), end = Math.min(width, x + 11);
            if (end > start) this.conveyor.drawRect(start, beltY + 3, end - start, 2);
        }
        this.conveyor.endFill();
        if (!scan) return;
        const {doc, rack} = scan;
        this.fit(doc, width * 0.085, height * 0.11);
        const intake = segment(time, 0, 0.37), across = segment(time, 0.58, 0.80), deposit = segment(time, 0.80, 0.99);
        doc.position.set(width * mix(mix(0.04, 0.50, intake), rack === this.accepted ? 0.18 : 0.82, across),
            mix(beltY + height * 0.026, rack.y - rack.height * 0.40, deposit));
        doc.alpha = 1 - deposit;
        if (time >= 0.37 && time < 0.58) {
            if (!this.ray.visible) { this.ray.visible = true; this.ray.animationSpeed = 0.8; this.ray.gotoAndPlay(0); }
        } else if (this.ray.visible) { this.ray.visible = false; this.ray.gotoAndStop(0); }
        if (time >= 0.80 && !scan.lit) { scan.lit = true; rack.animationSpeed = 0.7; rack.gotoAndPlay(0); }
    }

    animate(sample) {
        if (this.motion.matches) return Promise.resolve();
        const {applicant, prediction} = sample;
        const doc = new PIXI.Sprite(textureFor(applicant));
        doc.anchor.set(0.5);
        this.documents.addChild(doc);
        const rack = prediction.decision ? this.accepted : this.passed;
        const progress = {value: 0};
        return new Promise((resolve, reject) => {
            const scan = this.active = {doc, rack, progress, resolve, reject};
            try {
                if (this.people[0]) {
                    const {sprite} = this.people[0];
                    sprite.textures = getAnimationByName({color: applicant.spriteGroup, animName: ANIM.WALK_NEUTRAL});
                    sprite.animationSpeed = 0.5;
                    sprite.play();
                }
                this.door.animationSpeed = 0.32;
                this.door.gotoAndPlay(0);
                this.drawFrame();
                scan.tween = TweenMax.to(progress, SCAN_TIME, {value: 1, ease: 'Linear.easeNone',
                    onUpdate: () => { try { this.drawFrame(); } catch (error) { this.complete(error); } },
                    onComplete: () => this.complete()});
            } catch (error) { this.complete(error); }
        });
    }

    complete(error) {
        const scan = this.active;
        if (!scan) return;
        this.active = null;
        scan.tween?.kill();
        try {
            scan.doc.destroy();
            scan.rack.gotoAndStop(0);
            this.ray.visible = false;
            this.ray.gotoAndStop(0);
            this.door.gotoAndStop(0);
        } catch (cleanupError) { error = error || cleanupError; }
        if (error) scan.reject(error); else scan.resolve();
    }

    destroy() {
        eventEmitter.off(EVENTS.RESIZE, this.resize);
        this.complete();
        if (this.root.parent) this.root.parent.removeChild(this.root);
        this.root.destroy({children: true});
    }
}
