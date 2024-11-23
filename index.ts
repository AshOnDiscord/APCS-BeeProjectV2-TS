import { aStar } from "./pathFinder";

class Point {
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public state = false
  ) {
    // check to make sure all values are valid
    if (x == null || y == null || z == null) {
      throw new Error(`Invalid point: ${x}, ${y}, ${z}`);
    }
    if (x == undefined || y == undefined || z == undefined) {
      throw new Error(`Invalid point: ${x}, ${y}, ${z}`);
    }
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      throw new Error(`Invalid point: ${x}, ${y}, ${z}`);
    }
  }

  public toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }

  public static fromString(str: string): Point {
    const [x, y, z] = str
      .slice(1, -1)
      .split(",")
      .map((n) => parseInt(n));
    return new Point(x, y, z);
  }
}

class Grid2D {
  public grid: Point[][][] = [];
  // public start: Point | null = null;
  constructor(
    public width: number,
    public height: number,
    public depth: number
  ) {
    for (let y = 0; y < height; y++) {
      const plane: Point[][] = [];
      for (let x = 0; x < width; x++) {
        const row: Point[] = [];
        for (let z = 0; z < depth; z++) {
          row.push(new Point(x, y, z, false));
        }
        plane.push(row);
      }
      this.grid.push(plane);
    }
    // this.start = this.grid[width / 2][height / 2][depth / 2];
  }

  public rookPath(
    origin: Point,
    xDir: number,
    yDir: number,
    zDir: number,
    end: Point[] = []
  ): Point[] {
    // exactly one will not be 0
    if (xDir === 0 && yDir === 0 && zDir === 0) {
      throw new Error("Invalid direction"); // require at least one direction
    }
    // zy diagonal
    if (xDir !== 0 && yDir !== 0) {
      throw new Error("Invalid direction");
    }
    // yx diagonal
    if (xDir !== 0 && zDir !== 0) {
      throw new Error("Invalid direction");
    }
    // zx diagonal
    if (yDir !== 0 && zDir !== 0) {
      throw new Error("Invalid direction");
    }
    const isX = xDir !== 0;
    const isY = yDir !== 0;
    // no isZ because if it's not x or y, it's z
    const dir = xDir || yDir || zDir;
    let ob: number;
    const important: Point[] = [];
    if (dir == 1) {
      ob = isX ? this.width : isY ? this.height : this.depth;
    } else {
      ob = -1;
    }
    for (let i = origin[isX ? "x" : isY ? "y" : "z"]; i !== ob; i += dir) {
      let cell: Point;
      if (isX) {
        cell = this.grid[origin.y][i][origin.z];
      } else if (isY) {
        cell = this.grid[i][origin.x][origin.z];
      } else {
        cell = this.grid[i][origin.y][origin.x];
      }
      if (cell.state) {
        break;
      }
      let sides: [Point, Point, Point, Point];
      if (isX) {
        sides = [
          this.grid[origin.y - 1]?.[i][origin.z],
          this.grid[origin.y + 1]?.[i][origin.z],
          this.grid[origin.y][i][origin.z - 1],
          this.grid[origin.y][i][origin.z + 1],
        ];
      } else if (isY) {
        sides = [
          this.grid[i][origin.x - 1]?.[origin.z],
          this.grid[i][origin.x + 1]?.[origin.z],
          this.grid[i][origin.x][origin.z - 1],
          this.grid[i][origin.x][origin.z + 1],
        ];
      } else {
        sides = [
          this.grid[origin.y - 1]?.[origin.x][i],
          this.grid[origin.y + 1]?.[origin.x][i],
          this.grid[origin.y][origin.x - 1]?.[i],
          this.grid[origin.y][origin.x + 1]?.[i],
        ];
      }
      // console.log(sides, isX, isY);
      if (end.some((e) => e.toString() === cell.toString())) {
        important.push(cell);
        continue;
      }
      // if atleast one side is open, the cell is important
      for (const side of sides) {
        if (side && !side.state) {
          // this.important.push(cell);
          important.push(cell);
          break;
        }
      }
    }
    return important; // non-important cells are pruned
  }

  public bishopPath(
    origin: Point,
    xDir: number,
    yDir: number,
    zDir: number
  ): Point[] {
    // exactly 2 will not be 0
    if (xDir === 0 && yDir === 0 && zDir === 0) {
      throw new Error("Invalid direction"); // require at least one direction
    }
    if (
      !(xDir !== 0 && yDir !== 0) &&
      !(xDir !== 0 && zDir !== 0) &&
      !(yDir !== 0 && zDir !== 0)
    ) {
      throw new Error("Invalid direction"); // there is only one direction, use rookPath instead
    }
    let x = origin.x + xDir;
    let y = origin.y + yDir;
    let z = origin.z + zDir;
    const important: Point[] = [];
    while (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      z >= 0 &&
      z < this.depth
    ) {
      const cell = this.grid[y][x][z];
      if (cell.state) {
        break;
      }
      let intermediate: [Point, Point];
      if (xDir !== 0 && yDir !== 0) {
        // xy diagonal, z is constant
        intermediate = [
          this.grid[y - yDir]?.[x][z],
          this.grid[y]?.[x - xDir][z],
        ];
      } else if (xDir !== 0 && zDir !== 0) {
        // xz diagonal, y is constant
        intermediate = [this.grid[y][x - xDir][z], this.grid[y][x][z - zDir]];
      } else {
        // yz diagonal, x is constant
        intermediate = [this.grid[y][x][z - zDir], this.grid[y - yDir][x][z]];
      }
      if (
        !(intermediate[0] && !intermediate[0].state) &&
        !(intermediate[1] && !intermediate[1].state)
      ) {
        break; // both intermediates are closed
      }
      // there will always be an open side due to the intermediate checks
      important.push(cell);
      x += xDir;
      y += yDir;
      z += zDir;
    }
    return important; // non-important cells are pruned
  }

  public getNeighbors(point: Point, end: Point[] = []): Point[] {
    // you can prune out cells that are not important as they shouldn't be considered by
    // the pathing algo as they would only lead to loops or just be a waste of time
    // bishopPath doesn't need end because all cells are important
    return [
      ...this.rookPath(point, 0, 1, 0, end), // down | +x
      ...this.rookPath(point, 0, -1, 0, end), // up | -x
      ...this.rookPath(point, -1, 0, 0, end), // left | -y
      ...this.rookPath(point, 1, 0, 0, end), // right | +y
      ...this.bishopPath(point, -1, -1, 0), // upLeft | -x -y
      ...this.bishopPath(point, 1, -1, 0), // upRight | +x -y
      ...this.bishopPath(point, -1, 1, 0), // downLeft | -x +y
      ...this.bishopPath(point, 1, 1, 0), // downRight | +x +y
      ...this.rookPath(point, 0, 0, 1, end), // downZ | +z
      ...this.rookPath(point, 0, 0, -1, end), // upZ | -z
      ...this.bishopPath(point, 0, -1, -1), // upLeftZ | -y -z
      ...this.bishopPath(point, 0, 1, -1), // upRightZ | +y -z
      ...this.bishopPath(point, 0, -1, 1), // downLeftZ | -y +z
      ...this.bishopPath(point, 0, 1, 1), // downRightZ | +y +z
      ...this.bishopPath(point, -1, 0, 1), // downX | -x +z
      ...this.bishopPath(point, -1, 0, -1), // upX | -x -z
      ...this.bishopPath(point, 1, 0, 1), // downXZ | +x +z
      ...this.bishopPath(point, 1, 0, -1), // upXZ | +x -z
    ];
  }
}

const parser = async (
  path: string,
  checks: boolean
): Promise<{
  cycle: number;
  size: Point;
  end: Point[];
  bees: Point[];
  obstacles: Point[];
}> => {
  const file = Bun.file(path);
  const text = (await file.text()).trim();
  const lines = text.split("\n");

  let cycle = -1;
  let size: Point = new Point(0, 0, 0);
  const end: Point[] = [];
  const bees: Point[] = [];
  let obstacleCount = 0; // checks if the correct number of obstacles are present
  const obstacles: Point[] = [];

  for (const [i, line] of lines.entries()) {
    // console.log(i, line);
    if (i === 0) {
      cycle = parseInt(line);
      continue;
    }
    if (i === 1) {
      const [w, h, d] = line.split(",").map((n) => parseInt(n));
      if (checks && (w !== h || h !== d)) {
        // no need to check w !== d because w === h
        throw new Error(`Invalid size, must be a cube: ${w}, ${h}, ${d}`);
      }
      size = new Point(w, h, d);
      continue;
    }
    if (i < 17) {
      // 15 lines
      const [x, y, z] = line.split(",").map((n) => parseInt(n));
      end.push(new Point(x, y, z));
      continue;
    }
    if (i < 32) {
      const [x, y, z] = line.split(",").map((n) => parseInt(n));
      bees.push(new Point(x, y, z));
      continue;
    }
    if (i === 32) {
      if (checks) {
        obstacleCount = parseInt(line);
      }
      continue;
    }
    const [x, y, z] = line.split(",").map((n) => parseInt(n));
    obstacles.push(new Point(x, y, z));
  }
  if (checks) {
    if (end.length !== 15) {
      throw new Error(`End points are not 15: ${end.length}`);
    }
    // all 15 points must be in a straight line
    {
      const { x, y, z } = end[0];
      const xDir = end[1].x - x;
      const yDir = end[1].y - y;
      const zDir = end[1].z - z;

      if (xDir === 0 && yDir === 0 && zDir === 0) {
        throw new Error("Invalid direction, duplicate points");
      }
      if (xDir !== 0 && yDir !== 0 && zDir !== 0) {
        throw new Error("Invalid direction, 3 axis diagonal"); // 2 axis diagonal or just 1 axis is allowed
      }
      for (let i = 1; i < end.length; i++) {
        if (end[i].x !== x + i * xDir) {
          throw new Error(`x is off. start: ${x}, end: ${end[i].x}`);
        }
        if (end[i].y !== y + i * yDir) {
          throw new Error(`y is off. start: ${y}, end: ${end[i].y}`);
        }
        if (end[i].z !== z + i * zDir) {
          throw new Error(`z is off. start: ${z}, end: ${end[i].z}`);
        }
      }
    }
    if (bees.length !== 15) {
      throw new Error(`Bees are not 15: ${bees.length}`);
    }
    if (obstacles.length !== obstacleCount) {
      throw new Error(
        `Obstacle count is off. Expected: ${obstacleCount}, Got: ${obstacles.length}`
      );
    }
  }
  console.log(`Cycle: ${cycle}`);
  console.log(`Size: ${size.toString()}`);
  console.log(`End: ${end.map((p) => p.toString()).join(", ")}`);
  console.log(`Bees: ${bees.map((p) => p.toString()).join(", ")}`);
  if (checks) console.log(`Obstacles: ${obstacleCount}`); // too many to print

  return {
    cycle,
    size,
    end,
    bees,
    obstacles,
  };
};

const { cycle, size, end, bees, obstacles } = await parser("data.txt", true);

const grid2D = new Grid2D(size.x, size.y, size.z);

for (const point of obstacles) {
  grid2D.grid[point.y][point.x][point.z].state = true;
}

const gridSet = new Set<string>(grid2D.grid.flat(2).map((p) => p.toString()));

bees.forEach((bee) => {
  const result = aStar(
    gridSet,
    bee.toString(),
    end.map((p) => p.toString()),
    (node) => {
      const neighbors = grid2D.getNeighbors(Point.fromString(node));
      return [...neighbors!].map((node) => ({
        node: node.toString(),
        distance: 1,
      }));
    },
    (node) => {
      // return 0;
      const { x, y, z } = Point.fromString(node);
      let min = Infinity;
      for (const endPoint of end) {
        const xDist = Math.abs(endPoint.x - x);
        const yDist = Math.abs(endPoint.y - y);
        const zDist = Math.abs(endPoint.z - z);
        const dist = xDist + yDist + zDist;
        if (dist < min) {
          min = dist;
        }
      }
      return min * 0.25;
    }
  );
  console.log(`${bee.toString()} -> ${result.end}: ${result.distance}`);
});
