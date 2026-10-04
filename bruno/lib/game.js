const socket = require('./socket.js');

const GAME_NAMESPACE = '/game';
const MAX_TURNS = 300;

async function startMatch(baseUrl, tokenA, tokenB, mode = 'UNRANKED') {
  const queueA = await socket.connectAs(baseUrl, tokenA);
  const queueB = await socket.connectAs(baseUrl, tokenB);
  const matchedA = socket.waitFor(queueA, 'queue.matched');
  const matchedB = socket.waitFor(queueB, 'queue.matched');
  await socket.joinQueue(queueA, mode);
  await socket.joinQueue(queueB, mode);
  const match = await matchedA;
  await matchedB;
  socket.closeAll(queueA, queueB);
  return match.matchId;
}

function connectGame(baseUrl, token) {
  return socket.connectAs(baseUrl, token, GAME_NAMESPACE);
}

function joinGame(client, matchId) {
  const state = socket.waitFor(client, 'game.state');
  client.emit('game.join', { matchId });
  return state;
}

async function startGame(baseUrl, tokenA, tokenB, mode) {
  const matchId = await startMatch(baseUrl, tokenA, tokenB, mode);
  const clientA = await connectGame(baseUrl, tokenA);
  const clientB = await connectGame(baseUrl, tokenB);
  const waitingState = await joinGame(clientA, matchId);
  const started = socket.waitFor(clientA, 'game.state');
  const stateB = await joinGame(clientB, matchId);
  const stateA = await started;
  return { matchId, clientA, clientB, waitingState, stateA, stateB };
}

async function resign(client, matchId) {
  const over = socket.waitFor(client, 'game.over');
  client.emit('game.resign', { matchId });
  return over;
}

async function endGame(game) {
  await resign(game.clientA, game.matchId);
  socket.closeAll(game.clientA, game.clientB);
}

async function cancelMatch(baseUrl, token, matchId) {
  const client = await connectGame(baseUrl, token);
  const over = await resign(client, matchId);
  socket.closeAll(client);
  return over;
}

async function expectError(client, event, payload) {
  const exception = socket.waitFor(client, 'exception', 2000);
  client.emit(event, payload);
  return (await exception).message;
}

function players(game, state, idA) {
  const currentIsA = state.playerIds[state.currentPlayer] === idA;
  return currentIsA
    ? { current: game.clientA, waiting: game.clientB }
    : { current: game.clientB, waiting: game.clientA };
}

async function act(current, waiting, event, payload) {
  const currentState = socket.waitFor(current, 'game.state');
  const waitingState = socket.waitFor(waiting, 'game.state');
  current.emit(event, payload);
  const [state, mirrored] = await Promise.all([currentState, waitingState]);
  return { state, mirrored };
}

function masterOf(state, player) {
  const value = player === 0 ? 2 : -2;
  for (let row = 0; row < state.board.length; row++) {
    const col = state.board[row].indexOf(value);
    if (col !== -1) {
      return { row, col };
    }
  }
  return null;
}

function pickMove(state) {
  const opponent = state.currentPlayer === 0 ? 1 : 0;
  const enemyMaster = masterOf(state, opponent);
  const ownTemple = { row: state.currentPlayer === 0 ? 0 : 4, col: 2 };
  const ownMaster = masterOf(state, state.currentPlayer);
  const sameSquare = (a, b) => a && b && a.row === b.row && a.col === b.col;

  const winning = state.legalMoves.find(
    (move) =>
      sameSquare(move.to, enemyMaster) ||
      (sameSquare(move.from, ownMaster) && sameSquare(move.to, ownTemple)),
  );
  if (winning) return winning;

  const captures = state.legalMoves.filter(
    (move) => state.board[move.to.row][move.to.col] !== 0,
  );
  const pool = captures.length > 0 ? captures : state.legalMoves;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function playUntilOver(game, idA) {
  let state = game.stateA;
  let turns = 0;
  while (state.winnerId === null && turns < MAX_TURNS) {
    const { current, waiting } = players(game, state, idA);
    const move = pickMove(state);
    const result = move
      ? await act(current, waiting, 'game.move', {
          matchId: game.matchId,
          ...move,
        })
      : await act(current, waiting, 'game.pass', {
          matchId: game.matchId,
          card: state.hands[state.currentPlayer][0].name,
        });
    state = result.state;
    turns++;
  }
  return { state, turns };
}

module.exports = {
  startMatch,
  connectGame,
  joinGame,
  startGame,
  resign,
  endGame,
  cancelMatch,
  expectError,
  players,
  act,
  playUntilOver,
};
