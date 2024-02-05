class Point {
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public state = false
  ) {}

  public toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}

class Grid2D {
  public grid: Point[][][] = [];
  public start: Point | null = null;
  public neighbors: Point[] = [];
  public important: Point[] = [];
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
    this.start = this.grid[width / 2][height / 2][depth / 2];
    this.update();
  }

  public rookPath(origin: Point, xDir: number, yDir: number, zDir: number) {
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
    if (dir == 1) {
      ob = isX ? this.width : isY ? this.height : this.depth;
    } else {
      ob = -1;
    }
    for (let i = origin[isX ? "x" : isY ? "y" : "z"]; i !== ob; i += dir) {
      let cell: Point;
      // console.log(i, ob, dir);
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
      this.neighbors.push(cell);
      let sides: [Point, Point, Point, Point];
      if (isX) {
        sides = [
          this.grid[origin.y - 1][i][origin.z],
          this.grid[origin.y + 1][i][origin.z],
          this.grid[origin.y][i][origin.z - 1],
          this.grid[origin.y][i][origin.z + 1],
        ];
      } else if (isY) {
        sides = [
          this.grid[i][origin.x - 1][origin.z],
          this.grid[i][origin.x + 1][origin.z],
          this.grid[i][origin.x][origin.z - 1],
          this.grid[i][origin.x][origin.z + 1],
        ];
      } else {
        sides = [
          this.grid[origin.y - 1][origin.x][i],
          this.grid[origin.y + 1][origin.x][i],
          this.grid[origin.y][origin.x - 1][i],
          this.grid[origin.y][origin.x + 1][i],
        ];
      }
      console.log(sides, isX, isY);
      // if atleast one side is open, the cell is important
      for (const side of sides) {
        if (side && !side.state) {
          this.important.push(cell);
          break;
        }
      }
    }
  }

  public bishopPath(origin: Point, xDir: number, yDir: number, zDir: number) {
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
      // const intermediate1 = this.grid[y - yDir]?.[x];
      // const intermediate2 = this.grid[y]?.[x - xDir];
      // if (
      //   !(intermediate1 && !intermediate1.state) &&
      //   !(intermediate2 && !intermediate2.state)
      // ) {
      //   break;
      // }
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
      this.neighbors.push(cell);
      this.important.push(cell); // there will always be an open side due to the intermediate checks
      x += xDir;
      y += yDir;
      z += zDir;
    }
  }

  public update() {
    this.neighbors = [];
    this.important = [];

    const down = this.rookPath(this.start!, 0, 1, 0); // +x
    const up = this.rookPath(this.start!, 0, -1, 0); // -x
    const left = this.rookPath(this.start!, -1, 0, 0); // -y
    const right = this.rookPath(this.start!, 1, 0, 0); // +y

    const upLeft = this.bishopPath(this.start!, -1, -1, 0); // -x -y
    const upRight = this.bishopPath(this.start!, 1, -1, 0); // +x -y
    const downLeft = this.bishopPath(this.start!, -1, 1, 0); // -x +y
    const downRight = this.bishopPath(this.start!, 1, 1, 0); // +x +y

    // // z axis
    const downZ = this.rookPath(this.start!, 0, 0, 1); // +z
    const upZ = this.rookPath(this.start!, 0, 0, -1); // -z

    // // yz diagonal
    const upLeftZ = this.bishopPath(this.start!, 0, -1, -1); // -y -z
    const upRightZ = this.bishopPath(this.start!, 0, 1, -1); // +y -z
    const downLeftZ = this.bishopPath(this.start!, 0, -1, 1); // -y +z
    const downRightZ = this.bishopPath(this.start!, 0, 1, 1); // +y +z

    // // xz diagonal
    const downX = this.bishopPath(this.start!, -1, 0, 1); // -x +z
    const upX = this.bishopPath(this.start!, -1, 0, -1); // -x -z
    const downXZ = this.bishopPath(this.start!, 1, 0, 1); // +x +z
    const upXZ = this.bishopPath(this.start!, 1, 0, -1); // +x -z

    // you can prune out cells that are not important as they shouldn't be considered by
    // the pathing algo as they would only lead to loops or just be a waste of time
  }
}

const grid2D = new Grid2D(4, 4, 4);
// grid2D.update();
