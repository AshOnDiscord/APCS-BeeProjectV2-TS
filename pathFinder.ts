// distances between points
export const dijkstra = (
  points: Map<unknown, Map<unknown, number>>,
  start: unknown,
  end: unknown
) => {
  const unseen: Set<unknown> = new Set(points.keys());
  const distances: Map<unknown, { distance: number; previous: unknown }> =
    new Map();

  unseen.forEach((point) => {
    distances.set(point, { distance: Infinity, previous: null });
  });

  distances.set(start, { distance: 0, previous: null });

  while (unseen.size > 0) {
    // grab the smallest dist unvisited node
    [...unseen].sort(
      (a, b) => distances.get(a)!.distance - distances.get(b)!.distance
    );
    const current = [...unseen][0];

    // visit the node
    unseen.delete(current);

    // get all neighbors
    const neighbors = points.get(current);
    for (const [neighbor, distance] of neighbors!) {
      const newDistance = distances.get(current)!.distance + distance;
      if (newDistance < distances.get(neighbor)!.distance) {
        distances.set(neighbor, { distance: newDistance, previous: current });
      }
    }
  }
  // we now have the distances, reconstruct the path
  const path: unknown[] = [];
  let current = end;
  while (current !== start) {
    path.push(current);
    current = distances.get(current)!.previous;
  }
  path.push(start);
  return { path: path.reverse(), distance: distances.get(end)?.distance };
};

export const aStar = <Node>(
  points: Set<Node>,
  start: Node,
  end: Node,
  getNeighbors: (node: Node) => { node: Node; distance: number }[],
  getHeuristics: (node: Node) => number = () => 0
) => {
  // const unseen: Set<Node> = new Set(points);
  const unseen: { node: Node; heuristics: number }[] = [...points].map((e) => {
    return {
      node: e,
      heuristics: getHeuristics(e),
    };
  });

  const minDistances: Map<Node, { distance: number; previous: Node | null }> =
    new Map();

  minDistances.set(start, { distance: 0, previous: null });

  const getWeight = ({
    node,
    heuristics,
  }: {
    node: Node;
    heuristics: number;
  }): number => {
    if (!minDistances.get(node)) return Infinity;
    return minDistances.get(node)!.distance + heuristics;
  };

  while (unseen.length > 0) {
    // grab the smallest dist unvisited node
    const current = unseen.sort((a, b) => getWeight(a) - getWeight(b)).shift()!
      .node;

    if (current === end) break; // early exit (original dijkstra gets all distances, we only need the end)

    // visit the node
    // get all neighbors
    const neighbors = getNeighbors(current);
    // and set their distances
    for (const { node, distance } of neighbors) {
      if (node == current) continue; // skip self
      let newDistance = Infinity;
      const temp = minDistances.get(current);
      if (temp) {
        newDistance = temp.distance + distance;
      }
      if (minDistances.get(node)) {
        const distances = minDistances.get(node);
        if (distances != null) {
          if (newDistance < distances.distance) {
            minDistances.set(node, {
              distance: newDistance,
              previous: current,
            });
          }
        }
      } else {
        minDistances.set(node, { distance: newDistance, previous: current });
      }
    }
  }
  // we now have the distances, reconstruct the path
  const path: Node[] = [];
  let current = end;
  while (current !== start) {
    path.push(current);
    try {
      current = minDistances.get(current)!.previous!;
    } catch {
      debugger;
    }
  }
  path.push(start);
  return { path: path.reverse(), distance: minDistances.get(end)?.distance };
};
