import { run, bench, group, baseline } from "mitata";
import { dijkstra, aStar } from "./pathFinder";

const board: boolean[][] = `
.#.....
....#..
##.....
...#...
..#....
....#.#
....##.
.....+#`
  .trim()
  .split("\n")
  .map((row) =>
    row
      .trim()
      .split("")
      .map((e) => {
        if (e == "#") return true;
        return false;
      })
  );

const start = "0,0";
const end = "5,7";
const set: Set<string> = new Set();
for (let i = 0; i < board.length; i++) {
  for (let j = 0; j < board[i].length; j++) {
    set.add(`${j},${i}`);
  }
}

const getNeighbors = (key: string) => {
  const [x, y] = key.split(",").map((e) => +e);
  const neighbors = [
    { x: x - 1, y: y },
    { x: x + 1, y: y },
    { x: x, y: y - 1 },
    { x: x, y: y + 1 },
  ].filter((neighbor) => {
    // if out of bounds or wall, exit
    if (
      board[neighbor.y]?.[neighbor.x] === undefined ||
      board[neighbor.y][neighbor.x] === true
    ) {
      return false;
    }
    return true;
  });

  return neighbors.map((e) => {
    return { node: `${e.x},${e.y}`, distance: 1 };
  });
};

const getHeuristics = (key: string) => {
  const [x, y] = key.split(",").map((e) => +e);
  const [endX, endY] = end.split(",").map((e) => +e);
  // manhattan distance
  return Math.abs(x - endX) + Math.abs(y - endY);
};

const getHeuristics2 = (key: string) => {
  const [x, y] = key.split(",").map((e) => +e);
  const [endX, endY] = end.split(",").map((e) => +e);
  return Math.hypot(x - endX, y - endY);
};

const aStarRes = aStar(set, start, end, getNeighbors, getHeuristics);
console.log(aStarRes)

group("heuristics", () => {
  baseline("0 (dijkstra)", () => {
    aStar(set, start, end, getNeighbors);
  })
  bench("manhattan", () => {
    aStar(set, start, end, getNeighbors, getHeuristics);
  })
  bench("euclidean", () => {
    aStar(set, start, end, getNeighbors, getHeuristics2);
  })
})

run()