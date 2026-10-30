import '@babel/polyfill';
import ComponentLoader from 'component-loader-js';
import {pixiApp, startTweenManager} from './gameSetup.js';
import {gameFSM} from './stateManager.js';
import * as textures from '../common/textures.js';
import * as sound from '../game/sound.js';
import ChoiceButton from '../../components/interface/transition/choice-button/choice-button';
import Replica from '../../components/interface/transition/replica/replica';
import StatsConvChoiceButton from '../../components/interface/stats-conversation/stats-choice-button/stats-choice-button';
import StatsReplica from '../../components/interface/stats-conversation/replica/replica';
import Footer from '../../components/interface/footer/footer';


const componentLoader = new ComponentLoader({
    ChoiceButton,
    Replica,
    Footer,
    StatsConvChoiceButton,
    StatsReplica,
});

document.getElementById('gameCanvas').appendChild(pixiApp.view);

sound.init();

Promise.all([sound.load(), textures.loadAssets()])
    .then(() => {
        console.log('assets have loaded start the game');
        gameFSM.startGame();
        componentLoader.scan();
        startTweenManager();
    }).catch((err) => {
        console.error('Unable to start game:', err);
        const message = document.createElement('div');
        message.setAttribute('role', 'alert');
        message.style.cssText = 'position:fixed;inset:15%;z-index:99999;background:#f9f0e3;color:#142d4e;padding:32px;font:24px monospace;';
        const title = document.createElement('h1');
        title.textContent = 'The game could not load its assets.';
        const detail = document.createElement('p');
        detail.textContent = 'Keep the local server running and reload this page. If the problem continues, check the server output.';
        const reload = document.createElement('button');
        reload.textContent = 'Reload game';
        reload.onclick = () => window.location.reload();
        message.append(title, detail, reload);
        document.body.appendChild(message);
    });


