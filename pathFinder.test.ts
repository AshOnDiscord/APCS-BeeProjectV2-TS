import { expect, test } from "bun:test";
import { aStar, dijkstra } from "./pathFinder" 

test("Node Graph", () => {
  const points: Map<String, Map<String, number>> = new Map();
  { // init points
    points.set(
      "A",
      new Map([
        ["B", 2],
        ["D", 8],
      ])
    );
    points.set(
      "B",
      new Map([
        ["A", 2],
        ["D", 5],
        ["E", 6],
      ])
    );
    points.set(
      "D",
      new Map([
        ["A", 8],
        ["B", 5],
        ["E", 3],
        ["F", 2],
      ])
    );
    points.set(
      "E",
      new Map([
        ["B", 6],
        ["D", 3],
        ["F", 1],
        ["C", 9],
      ])
    );
    points.set(
      "F",
      new Map([
        ["D", 2],
        ["E", 1],
        ["C", 3],
      ])
    );
    points.set(
      "C",
      new Map([
        ["E", 9],
        ["F", 3],
      ])
    );
  }

  const dijkstraResult = dijkstra(points, "A", "C");

  expect(dijkstraResult.distance).toBe(12);

  const aStarResult = aStar(new Set(points.keys()), "A", "C", (node) => {
    const neighbors = points.get(node);
    return [...neighbors!].map(([node, distance]) => ({ node, distance }));
  }) // exact same as dijkstras since no heuristics, testing the new interface
  
  expect(aStarResult.distance).toBe(12);

  expect(JSON.stringify(dijkstraResult) == JSON.stringify(aStarResult));
});
