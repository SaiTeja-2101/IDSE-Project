const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const loader = require('./helpers/load-source.cjs');

test('factory routes the supplied decision, keeps the scan on resize, and cleans up on exit', async t => {
    const previousWindow = global.window;
    t.after(() => { global.window = previousWindow; });
    const motion = {matches: false};
    global.window = {matchMedia: () => motion};
    class Point { set(x, y = x) { Object.assign(this, {x, y}); } }
    class Container {
        constructor() { this.children = []; this.anchor = new Point(); this.scale = new Point(); this.position = new Point(); }
        addChild(...items) { for (const item of items) { this.children.push(item); item.parent = this; } }
        removeChild(item) { this.children = this.children.filter(child => child !== item); item.parent = null; }
        destroy() { for (const child of [...this.children]) child.destroy(); this.parent?.removeChild(this); }
    }
    class Graphics extends Container { clear() { return this; } beginFill() { return this; } drawRect() { return this; } endFill() { return this; } }
    const art = {orig: {width: 100, height: 120}, width: 100, height: 120};
    class Sprite extends Container {
        constructor(texture) { super(); this.texture = texture; this.scale.set(1); this.tileScale = new Point(); this.tilePosition = new Point(); }
        get y() { return this.position.y; }
        get width() { return this.texture.orig.width * this.scale.x; }
        get height() { return this.texture.orig.height * this.scale.y; }
    }
    class Belt extends Sprite { set width(v) { this.w = v; } set height(v) { this.h = v; } get height() { return this.h; } }
    class Animation extends Sprite {
        constructor(textures) { super(textures[0]); }
        gotoAndPlay() { this.play(); } play() { this.playing = true; } gotoAndStop() { this.playing = false; }
    }
    const stage = new Container(), eventEmitter = new EventEmitter(), screen = {width: 960, height: 360};
    const tweens = [];
    const sprites = {machine: {texture: art}, factoryBelt: art, factoryCvBlue: art, factoryCvOrange: art};
    for (const key of ['dataServerAccepted', 'dataServerRejected', 'rayAnim', 'doorEntry']) sprites[key] = {textures: [art]};
    const {default: ScoutFactory} = loader({
        'pixi.js': {Container, Sprite, Graphics, extras: {AnimatedSprite: Animation, TilingSprite: Belt}},
        'gsap/TweenMax': {TweenMax: {to(progress, seconds, config) {
            const tween = {kill() { this.killed = true; }, at(v) { progress.value = v; config.onUpdate(); }, finish: config.onComplete};
            tweens.push(tween); return tween;
        }}},
        'public/game/controllers/game/gameSetup.js': {mlLabStageContainer: stage, eventEmitter, pixiApp: {screen}},
        'public/game/controllers/common/utils.js': {createPersonSprite: () => new Animation([art]), getAnimationByName: () => [art]},
        'public/game/controllers/common/textures.js': {SPRITES: sprites},
        'public/game/controllers/constants.js': {EVENTS: {RESIZE: 'resize'}, ANIM: {WALK_NEUTRAL: 'walk'}},
    })('public/game/components/pixi/scout-factory/scout-factory.js');
    const factory = new ScoutFactory(), queue = Array.from({length: 10}, (_, id) => ({id, spriteGroup: 'blue'}));
    factory.setQueue(queue);
    assert.equal(factory.queue.children.length, 9);
    const scan = factory.animate({applicant: queue[0], prediction: {decision: false}});
    tweens[0].at(0.5);
    assert.equal(factory.ray.visible, true);
    screen.width = 320; eventEmitter.emit('resize');
    assert.equal(factory.ray.visible, true);
    assert.equal(tweens[0].killed, undefined);
    assert.equal(factory.queue.children.length, 5);
    tweens[0].at(0.88);
    assert.equal(factory.ray.visible, false);
    assert.equal(factory.passed.playing, true);
    assert.equal(factory.accepted.playing, undefined);
    tweens[0].finish(); await scan;
    assert.equal(factory.documents.children.length, 0);
    assert.equal(factory.passed.playing, false);
    factory.setQueue(queue.slice(1));
    motion.matches = true;
    await factory.animate({applicant: queue[1], prediction: {decision: true}});
    assert.equal(tweens.length, 1);
    motion.matches = false;
    const pending = factory.animate({applicant: queue[1], prediction: {decision: true}});
    tweens[1].at(0.88);
    assert.equal(factory.accepted.playing, true);
    factory.destroy(); await pending;
    assert.equal(tweens[1].killed, true);
    assert.equal(stage.children.length, 0);
    assert.equal(eventEmitter.listenerCount('resize'), 0);
});
