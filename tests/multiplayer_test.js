import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';

const player1 = io(URL);
const player2 = io(URL);

player1.on('connect', () => {
  console.log('Player 1 connected');

  player1.emit('createRoom', { name: 'Leo' }, (result) => {
    if (!result.success) {
      console.error(result.error);
      process.exitCode = 1;
      return;
    }

    console.log('Room created:', result.roomId);

    player2.emit(
      'joinRoom',
      { roomId: result.roomId, name: 'Alan' },
      (response) => {
        console.log('Player 2 joined:', response.success);
        console.log('Players:', response.room.players.map(p => p.name));

        player1.disconnect();
        player2.disconnect();
      }
    );
  });
});

player2.on('roomUpdate', (room) => {
  console.log('Room updated:', room.players.length, 'players');
});

setTimeout(() => {
  player1.disconnect();
  player2.disconnect();
}, 5000);