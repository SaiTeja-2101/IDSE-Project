import '@babel/polyfill';
import {pixiApp, startTweenManager} from './gameSetup';
import {gameFSM, disposeGame} from './stateManager';
import * as textures from '../common/textures';
import * as sound from './sound';
import {initShell} from '../../components/interface/game-shell/game-shell';

document.getElementById('gameCanvas').appendChild(pixiApp.view);
sound.init();
window.addEventListener('pagehide', disposeGame, {once: true});
window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
Promise.all([sound.load(), textures.loadAssets()]).then(() => {
    initShell();
    gameFSM.startGame();
    startTweenManager();
}).catch(error => {
    console.error('Unable to start game:', error);
    const message = document.createElement('section');
    message.setAttribute('role', 'alert');
    message.style.cssText = 'position:fixed;inset:15%;z-index:99999;background:#f6f1e8;color:#142d4e;padding:32px;font:24px monospace;';
    const title = document.createElement('h1'); title.textContent = 'The game could not load.';
    const detail = document.createElement('p'); detail.textContent = 'Keep the local server running, then reload this page.';
    const reload = document.createElement('button'); reload.textContent = 'Reload game'; reload.onclick = () => window.location.reload();
    message.append(title, detail, reload); document.body.appendChild(message);
});
