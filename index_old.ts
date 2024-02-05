import "./style.css";
import * as THREE from "three";
import { Point, init } from "./init_old";

const { scene, grid, camera } = init();

class Grid2D {
  public grid: Point[][][] = [];
  public start: Point | null = null;
  public neighbors: Point[] = [];
  public important: Point[] = [];
  constructor(
    public width: number,
    public height: number,
    public depth: number,
    public threeGrid: {
      cube: THREE.Mesh;
      line: THREE.LineSegments | null;
      coords: Point;
    }[]
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
  public update() {
    this.neighbors = [];
    this.important = [];
    {
      const rookPath = (
        origin: Point,
        xDir: number,
        yDir: number,
        zDir: number
      ) => {
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
      };

      const bishopPath = (
        origin: Point,
        xDir: number,
        yDir: number,
        zDir: number
      ) => {
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
            intermediate = [
              this.grid[y][x - xDir][z],
              this.grid[y][x][z - zDir],
            ];
          } else {
            // yz diagonal, x is constant
            intermediate = [
              this.grid[y][x][z - zDir],
              this.grid[y - yDir][x][z],
            ];
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
      };

      const down = rookPath(this.start!, 0, 1, 0); // +x
      const up = rookPath(this.start!, 0, -1, 0); // -x
      const left = rookPath(this.start!, -1, 0, 0); // -y
      const right = rookPath(this.start!, 1, 0, 0); // +y

      const upLeft = bishopPath(this.start!, -1, -1, 0); // -x -y
      const upRight = bishopPath(this.start!, 1, -1, 0); // +x -y
      const downLeft = bishopPath(this.start!, -1, 1, 0); // -x +y
      const downRight = bishopPath(this.start!, 1, 1, 0); // +x +y

      // // z axis
      const downZ = rookPath(this.start!, 0, 0, 1); // +z
      const upZ = rookPath(this.start!, 0, 0, -1); // -z

      // // yz diagonal
      const upLeftZ = bishopPath(this.start!, 0, -1, -1); // -y -z
      const upRightZ = bishopPath(this.start!, 0, 1, -1); // +y -z
      const downLeftZ = bishopPath(this.start!, 0, -1, 1); // -y +z
      const downRightZ = bishopPath(this.start!, 0, 1, 1); // +y +z

      // // xz diagonal
      const downX = bishopPath(this.start!, -1, 0, 1); // -x +z
      const upX = bishopPath(this.start!, -1, 0, -1); // -x -z
      const downXZ = bishopPath(this.start!, 1, 0, 1); // +x +z
      const upXZ = bishopPath(this.start!, 1, 0, -1); // +x -z
    }
    for (const cube of this.threeGrid) {
      if (this.start!.toString() === cube.coords.toString()) {
        (cube.cube.material as THREE.Material).opacity = 1;
      } else if (
        this.important.some((n) => n.toString() === cube.coords.toString())
      ) {
        (cube.cube.material as THREE.Material) = new THREE.MeshBasicMaterial({
          color: 0xaa00ff,
          opacity: 1,
          transparent: true,
        });
      } else if (
        this.neighbors.some((n) => n.toString() === cube.coords.toString())
      ) {
        (cube.cube.material as THREE.Material) = new THREE.MeshBasicMaterial({
          color: 0xaaaaaa,
          opacity: 1,
          transparent: true,
        });
      } else if (
        this.grid.some((plane) =>
          plane.some((row) =>
            row
              .filter((cell) => cell.state)
              .some((cell) => cell.toString() === cube.coords.toString())
          )
        )
      ) {
        (cube.cube.material as THREE.Material) = new THREE.MeshBasicMaterial({
          color: 0x000000,
          opacity: 1,
          transparent: true,
        });
      } else {
        (cube.cube.material as THREE.Material) = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          opacity: 0,
          transparent: true,
        });
      }
      scene.add(cube.cube);
      if (cube.line) {
        scene.add(cube.line);
      }
    }
  }
}

const grid2D = new Grid2D(4, 4, 4, grid);
// grid2D.update();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", () => {
  // shoot a ray
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster
    .intersectObjects(scene.children)
    .map((i) => i.object)
    .filter((o) => o instanceof THREE.Mesh) as THREE.Mesh[];
  if (intersects.length > 0) {
    const cube = intersects[0];
    console.log(cube);
    // find the cube in the grid
    const found = grid.find((c) => c.cube === cube);
    if (found) {
      console.log(found.coords);
    }
    // toggle the cube
    grid2D.grid[found!.coords.y][found!.coords.x][found!.coords.z].state =
      !grid2D.grid[found!.coords.y][found!.coords.x][found!.coords.z].state;
    grid2D.update();
  }
});
