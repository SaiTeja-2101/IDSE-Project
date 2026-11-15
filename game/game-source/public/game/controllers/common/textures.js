import SCALES from '~/public/game/controllers/constants/pixi-scales.js';
import {screenSizeDetector} from '~/public/game/controllers/common/utils.js';

const SPRITES = {};

const loader = PIXI.loaders.shared;
loader
    .add('machine', 'assets/img/machine.png')
    .add('scanRay', 'assets/img/scan-ray.png')
    .add('rayAnim', 'assets/spritesheets/machine-ray/ray_spritesheet.json')
    .add('dataServerRejected', 'assets/spritesheets/data-server-rejected/data-server-rejected.json')
    .add('dataServerAccepted', 'assets/spritesheets/data-server-accepted/data-server-accepted.json')
    .add('factoryCvBlue', 'assets/img/cv-flat-blue.png')
    .add('factoryCvOrange', 'assets/img/cv-flat-orange.png')
    .add('factoryBelt', 'assets/img/conveyor_belt.png')
    .add('doorAccepted', 'assets/img/door-accepted.png')
    .add('officeDoor', 'assets/spritesheets/office-door/office-door.json')
    .add('wayOutDoor', 'assets/spritesheets/way-out-door/door-rejected.json')
    .add('bluePerson', 'assets/spritesheets/characters/blue/blue.json')
    .add('orangePerson', 'assets/spritesheets/characters/orange/orange.json');


async function loadAssets() {
    console.log('load assets!');
    await new Promise((resolve, reject) => {
        loader.onError.add((error) => reject(error));
        loader.load((loader, resources) => {
            SPRITES.doorAccepted = new PIXI.extras.AnimatedSprite(resources.officeDoor.spritesheet.animations['door']);
            SPRITES.doorEntry = new PIXI.extras.AnimatedSprite(resources.officeDoor.spritesheet.animations['door']);
            SPRITES.doorRejected = new PIXI.extras.AnimatedSprite(resources.wayOutDoor.spritesheet.animations['door']);
            SPRITES.machine = new PIXI.Sprite(resources.machine.texture);
            SPRITES.factoryCvBlue = resources.factoryCvBlue.texture;
            SPRITES.factoryCvOrange = resources.factoryCvOrange.texture;
            SPRITES.factoryBelt = resources.factoryBelt.texture;
            SPRITES.scanRay = new PIXI.Sprite(resources.scanRay.texture);
            SPRITES.rayAnim = new PIXI.extras.AnimatedSprite(resources.rayAnim.spritesheet.animations['ray']);
            SPRITES.dataServerAccepted = new PIXI.extras.AnimatedSprite(resources.dataServerAccepted.spritesheet.animations['data-server-accepted']);
            SPRITES.dataServerRejected = new PIXI.extras.AnimatedSprite(resources.dataServerRejected.spritesheet.animations['data-server-rejected']);
            // Colour the retained office art at render time. Character pixels
            // and all original sprite-sheet files stay unchanged.
            const officePalette = new PIXI.filters.ColorMatrixFilter();
            officePalette.matrix = [
                0.12, 0.24, 0.04, 0, 0.05,
                0.22, 0.45, 0.08, 0, 0.06,
                0.22, 0.42, 0.08, 0, 0.12,
                0, 0, 0, 1, 0,
            ];
            for (const key of ['doorAccepted', 'doorEntry', 'doorRejected', 'machine', 'dataServerAccepted', 'dataServerRejected']) {
                SPRITES[key].filters = [officePalette];
            }
            // TODO: move data server scales to the data server component
            SPRITES.dataServerAccepted.scale.set(SCALES.DATA_SERVER[screenSizeDetector()]);
            SPRITES.dataServerRejected.scale.set(SCALES.DATA_SERVER[screenSizeDetector()]);
            console.log('all textures have loaded!');
            resolve();
        });
    });
};


// module to load textures
const orangePersonTexture = PIXI.Texture.fromImage('assets/img/person_orange.png');

orangePersonTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

const bluePersonTexture = PIXI.Texture.fromImage('assets/img/person_blue.png');
bluePersonTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

const incubator = PIXI.Texture.fromImage('assets/img/incubator-winners.jpeg');

const xIcon = PIXI.Texture.fromImage('assets/img/x-icon.png');

const beltTexture = PIXI.Texture.fromImage('assets/img/conveyor_belt.png');
beltTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

const cvTexture = PIXI.Texture.fromImage('assets/img/cv_orange.png');
cvTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;


export {cvTexture, SPRITES, loadAssets, orangePersonTexture, bluePersonTexture, incubator, xIcon, beltTexture};
