import { io } from 'socket.io-client';

const socket = io(
  import.meta.env.VITE_MULTIPLAYER_URL || 'http://localhost:3001',
  { autoConnect: false, reconnection: true }
);

const $ = id => document.getElementById(id);

let state = null;
let roomId = '';
let selectedCards = new Set();
let lastRTT = null;

let token = localStorage.getItem('juniper.multiplayer.token');

if (!token) {
  token = crypto.randomUUID();
  localStorage.setItem('juniper.multiplayer.token', token);
}

const savedRoom = sessionStorage.getItem('juniper.room');
const savedName = localStorage.getItem('juniper.playerName') || '';

$('name').value = savedName;

function message(text) {
  $('message').textContent = text;
}

function request(event, data = {}) {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error('Not connected to server'));
      return;
    }

    socket.timeout(5000).emit(event, data, (err, response) => {
      if (err) reject(new Error('Server request timed out'));
      else resolve(response);
    });
  });
}

function makeText(tag, content, className = '') {
  const el = document.createElement(tag);
  el.textContent = content;
  if (className) el.className = className;
  return el;
}

function saveIdentity() {
  const name = $('name').value.trim() || 'Player';
  localStorage.setItem('juniper.playerName', name);
  return name;
}

function saveRoom(id) {
  roomId = id;
  sessionStorage.setItem('juniper.room', id);
  $('room-code').value = id;
}

function showPage(page) {
  $('lobby').hidden = page !== 'lobby';
  $('room').hidden = page !== 'room';
  $('battle').hidden = page !== 'battle';
}

async function createRoom() {
  try {
    const result = await request('createRoom', {
      name: saveIdentity(),
      token,
    });

    if (!result.success) {
      message(result.error);
      return;
    }

    saveRoom(result.roomId);
    message('Room created');
  } catch (err) {
    message(err.message);
  }
}

async function joinRoom() {
  try {
    const id = $('room-code').value.trim().toUpperCase();

    const result = await request('joinRoom', {
      name: saveIdentity(),
      roomId: id,
      token,
    });

    if (!result.success) {
      message(result.error);
      return;
    }

    saveRoom(result.roomId);
  } catch (err) {
    message(err.message);
  }
}

async function ready() {
  try {
    const result = await request('ready');
    if (!result.success) alert(result.error);
  } catch (err) {
    alert(err.message);
  }
}

async function leave() {
  try {
    await request('leaveRoom');
  } catch {
    // Clear local room even when the server is unavailable.
  }

  sessionStorage.removeItem('juniper.room');
  roomId = '';
  state = null;
  selectedCards.clear();
  showPage('lobby');
  message('Left room');
}

async function action(type, cardIds) {
  const start = performance.now();

  try {
    const result = await request(
      'action',
      { type, cardIds }
    );

    lastRTT = Math.round(performance.now() - start);
    $('latency').textContent = `Server action RTT: ${lastRTT} ms`;

    if (!result.success) {
      alert(result.error);
    }
  } catch (err) {
    alert(err.message);
  }
}

function renderPlayers(container, players) {
  container.replaceChildren();

  players.forEach(p => {
    const card = document.createElement('article');
    card.className = 'player-card';

    card.append(
      makeText('h3', `${p.name}${p.isYou ? ' (You)' : ''}`),
      makeText('p', p.connected ? '● Connected' : '○ Disconnected'),
      makeText('p', `HP: ${p.hp}/100`),
      makeText('p', `Shield: ${p.shield}`),
      makeText('p', `Energy: ${p.energy}`),
      makeText('p', `Wins: ${p.wins} | Games: ${p.games}`),
      makeText('p', p.ready ? 'Ready' : 'Not Ready')
    );

    container.appendChild(card);
  });
}

function renderLobby(data) {
  $('room-id').textContent = data.roomId;
  renderPlayers($('players'), data.players);

  $('room-status').textContent =
    data.players.length < 2
      ? 'Waiting for second player...'
      : 'Both players connected. Press Ready to start.';

  const me = data.players.find(p => p.isYou);

  $('ready').disabled = !me || me.ready || data.players.length < 2;
}

function renderHand(data) {
  const hand = $('hand');
  hand.replaceChildren();

  const validIds = new Set(data.hand.map(c => c.id));
  selectedCards = new Set(
    [...selectedCards].filter(id => validIds.has(id))
  );

  for (const card of data.hand) {
    const button = document.createElement('button');
    button.className =
      `playing-card ${selectedCards.has(card.id) ? 'selected' : ''}`;

    button.textContent = `${card.rank}${card.suit}`;

    if (card.suit === '♥' || card.suit === '♦') {
      button.classList.add('red');
    }

    button.disabled = !isMyTurn(data);

    button.onclick = () => {
      if (selectedCards.has(card.id)) {
        selectedCards.delete(card.id);
      } else if (selectedCards.size < 5) {
        selectedCards.add(card.id);
      }
      renderHand(data);
    };

    hand.appendChild(button);
  }
}

function isMyTurn(data) {
  const me = data.players.find(p => p.isYou);
  return data.status === 'playing' &&
    data.currentPlayer === me?.name &&
    data.players[data.activeIndex]?.isYou === true &&
    me.connected &&
    me.hp > 0;
}

function renderBlackjack(data) {
  const info = $('blackjack-info');
  info.replaceChildren();

  if (!data.blackjack) {
    info.textContent = 'No active Blackjack round';
    return;
  }

  const bj = data.blackjack;

  info.append(
    makeText('h3', 'Blackjack'),
    makeText(
      'p',
      `Your cards: ${bj.player.map(c => c.rank + c.suit).join(' ')}`
    ),
    makeText(
      'p',
      `Dealer: ${bj.dealer[0].rank}${bj.dealer[0].suit} + Hidden card`
    )
  );
}

function renderBattle(data) {
  $('turn').textContent =
    data.status === 'finished'
      ? 'Battle finished'
      : `Turn ${data.turn} — ${data.currentPlayer}`;

  $('enemy-name').textContent = data.enemy.name;
  $('enemy-hp').textContent =
    `HP ${data.enemy.hp}/${data.enemy.maxHp}`;

  $('enemy-bar').style.width =
    `${100 * data.enemy.hp / data.enemy.maxHp}%`;

  renderPlayers($('battle-players'), data.players);
  renderHand(data);
  renderBlackjack(data);

  const myTurn = isMyTurn(data);
  const me = data.players.find(p => p.isYou);

  $('play-poker').disabled =
    !myTurn || selectedCards.size === 0 ||
    me.energy < 3 || !!data.blackjack;

  $('deal').disabled =
    !myTurn || me.energy < 1 || !!data.blackjack;

  $('hit').disabled = !myTurn || !data.blackjack;
  $('stand').disabled = !myTurn || !data.blackjack;
  $('end-turn').disabled = !myTurn || !!data.blackjack;

  const log = $('log');
  log.replaceChildren();

  for (const line of [...data.log].reverse()) {
    log.append(makeText('p', line));
  }
}

function render(data) {
  state = data;
  roomId = data.roomId;

  if (data.status === 'waiting') {
    showPage('room');
    renderLobby(data);
  } else {
    showPage('battle');
    renderBattle(data);
  }
}

socket.on('connect', async () => {
  $('connection').textContent = '● Connected';

  const reconnectRoom = roomId || savedRoom;
  if (reconnectRoom) {
    try {
      const result = await request('joinRoom', {
        roomId: reconnectRoom,
        name: saveIdentity(),
        token,
      });

      if (!result.success) {
        sessionStorage.removeItem('juniper.room');
        roomId = '';
        showPage('lobby');
        message(result.error);
      }
    } catch (err) {
      message(err.message);
    }
  }
});

socket.on('disconnect', () => {
  $('connection').textContent = '○ Disconnected — reconnecting';
});

socket.on('connect_error', err => {
  $('connection').textContent = '○ Server unavailable';
  message(err.message);
});

socket.on('roomUpdate', render);

$('create').onclick = createRoom;
$('join').onclick = joinRoom;
$('ready').onclick = ready;
$('leave').onclick = leave;
$('battle-leave').onclick = leave;

$('play-poker').onclick = () => {
  action('poker', [...selectedCards]);
};

$('deal').onclick = () => action('deal');
$('hit').onclick = () => action('hit');
$('stand').onclick = () => action('stand');
$('end-turn').onclick = () => action('endTurn');

socket.connect();

setInterval(async () => {
  if (!socket.connected) return;

  const start = performance.now();

  try {
    const response = await request('pingCheck');
    if (response.success) {
      lastRTT = Math.round(performance.now() - start);
      $('latency').textContent = `Server RTT: ${lastRTT} ms`;
    }
  } catch {
    // Reconnection status is handled by Socket.IO.
  }
}, 3000);