import { Game, GameMap, MAP_SIZE, Position } from '../../game/domain/index.js';

const STUDENT_WEIGHT = 100;
const MASTER_ATTACKED_PENALTY = 400;
const TEMPLE_REACHABLE_PENALTY = 400;
const HANGING_STUDENT_WEIGHT = 40;
const CONTROL_WEIGHT = 6;
const TEMPLE_DISTANCE_WEIGHT = 12;
const MOBILITY_WEIGHT = 2;

interface Side {
  students: number[];
  master: number | null;
  control: Set<number>;
  moves: number;
  templeDistance: number;
  reachesTemple: boolean;
}

export function evaluate(game: Game, player: number): number {
  if (game.winner !== null) {
    return game.winner === player ? Infinity : -Infinity;
  }

  const mine = survey(game, player);
  const theirs = survey(game, player === 0 ? 1 : 0);
  const masterAttacked =
    mine.master !== null && theirs.control.has(mine.master);

  return (
    STUDENT_WEIGHT * (mine.students.length - theirs.students.length) -
    (masterAttacked ? MASTER_ATTACKED_PENALTY : 0) -
    (theirs.reachesTemple ? TEMPLE_REACHABLE_PENALTY : 0) +
    HANGING_STUDENT_WEIGHT * (hanging(theirs, mine) - hanging(mine, theirs)) +
    CONTROL_WEIGHT * (mine.control.size - theirs.control.size) +
    TEMPLE_DISTANCE_WEIGHT * (theirs.templeDistance - mine.templeDistance) +
    MOBILITY_WEIGHT * (mine.moves - theirs.moves)
  );
}

function survey(game: Game, player: number): Side {
  const { map, spread } = game;
  const temple = GameMap.templeArch(player);
  const side: Side = {
    students: [],
    master: null,
    control: new Set(),
    moves: 0,
    templeDistance: 0,
    reachesTemple: false,
  };

  for (const from of map.entitiesOf(player)) {
    const isMaster = map.entityAt(from)?.isMaster ?? false;
    if (isMaster) {
      side.master = square(from);
      side.templeDistance = distance(from, temple);
    } else {
      side.students.push(square(from));
    }

    for (const card of spread.handOf(player)) {
      for (const [rowDelta, colDelta] of card.movesFor(player)) {
        const to = from.translate(rowDelta, colDelta);
        if (!map.isInside(to)) {
          continue;
        }
        side.control.add(square(to));
        if (map.entityAt(to)?.belongsTo(player)) {
          continue;
        }
        side.moves++;
        if (isMaster && to.equals(temple)) {
          side.reachesTemple = true;
        }
      }
    }
  }

  return side;
}

function hanging(side: Side, enemy: Side): number {
  return side.students.filter(
    (student) => enemy.control.has(student) && !side.control.has(student),
  ).length;
}

function distance(from: Position, to: Position): number {
  const [rowDelta, colDelta] = from.deltaTo(to);
  return Math.max(Math.abs(rowDelta), Math.abs(colDelta));
}

function square(position: Position): number {
  return position.row * MAP_SIZE + position.col;
}
