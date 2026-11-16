import './style.css';
import { Game } from './core/Game.js';

let game;
try {
  game = new Game(document.getElementById('game'));
} catch (error) {
  console.error('INFINITE RIDE could not start:', error);
  document.getElementById('error').hidden = false;
  document.getElementById('error-message').textContent =
    'Oyun başlatılamadı. WebGL 2 destekleyen güncel bir tarayıcıda, donanım hızlandırma açıkken tekrar dene.';
  document.getElementById('reload-button').onclick = () => location.reload();
}

if (import.meta.hot) import.meta.hot.dispose(() => game?.dispose());
