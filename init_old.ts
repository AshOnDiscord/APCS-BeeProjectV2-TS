import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Point {
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

export const init = () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document
    .querySelector<HTMLDivElement>("#app")!
    .appendChild(renderer.domElement);
  document.querySelector<HTMLDivElement>("#app")!.style.position = "relative";
  document.querySelector<HTMLDivElement>("#app")!.style.width = "100%";
  document.querySelector<HTMLDivElement>("#app")!.style.height = "100%";
  const crosshair = document.createElement("div");
  crosshair.id = "crosshair";
  document.querySelector<HTMLDivElement>("#app")!.appendChild(crosshair);

  // const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  const createCube = (color: number, opacity: number, outline: boolean) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity,
      transparent: true,
    });
    if (outline) {
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0x000000,
          opacity: 1,
          transparent: true,
        })
      );
      return {
        cube: new THREE.Mesh(geometry, material),
        line,
      };
    }
    return {
      cube: new THREE.Mesh(geometry, material),
      line: null,
    };
  };

  const createGrid = (x: number, y: number, z: number, gaps: number) => {
    const grid = new Array<{
      cube: THREE.Mesh;
      line: THREE.LineSegments | null;
      coords: Point;
    }>();
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        for (let k = 0; k < z; k++) {
          // random color
          const color = 0xffffff;
          const { cube, line } = createCube(color, 0, true) as {
            cube: THREE.Mesh;
            line: THREE.LineSegments;
          };
          // center grid
          cube.position.x = i + (i / 2) * gaps - x / 2;
          cube.position.y = j + (j / 2) * gaps - y / 2;
          cube.position.z = k + (k / 2) * gaps - z / 2;
          line.position.x = i + (i / 2) * gaps - x / 2;
          line.position.y = j + (j / 2) * gaps - y / 2;
          line.position.z = k + (k / 2) * gaps - z / 2;
          grid.push({ cube, line, coords: new Point(i, j, k) });
        }
      }
    }
    return grid;
  };

  // set sky to light blue
  scene.background = new THREE.Color(0xadd8e6);

  // set camera position
  camera.position.z = 5;
  camera.position.y = 2;
  camera.lookAt(0, 0, 0);

  const controls = new PointerLockControls(camera, renderer.domElement);
  // add controls to scene
  scene.add(controls.getObject());
  // turn on pointer lock
  document.addEventListener("click", () => {
    controls.lock();
  });
  // listen for mouse movement

  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  let prevTime = performance.now();
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  const animate = () => {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true) {
      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster.ray.origin.y -= 10;

      const delta = (time - prevTime) / 1000;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;
      velocity.y -= velocity.y * 10.0 * delta;

      // velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize(); // this ensures consistent movements in all directions

      if (moveForward || moveBackward)
        velocity.z -= direction.z * 400.0 * delta;
      if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
      if (moveUp) velocity.y += 400.0 * delta;
      if (moveDown) velocity.y -= 400.0 * delta;

      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);

      controls.getObject().position.y += velocity.y * delta; // new behavior
    }

    prevTime = time;

    renderer.render(scene, camera);
  };
  animate();

  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;
  let moveUp = false;
  let moveDown = false;

  const onKeyDown = function (event: KeyboardEvent) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        moveUp = true;
        moveDown = false;
        break;

      case "ShiftLeft":
        moveDown = true;
        moveUp = false;
        break;
    }
  };

  const onKeyUp = function (event: KeyboardEvent) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;

      case "Space":
      case "ShiftLeft":
        moveUp = false;
        moveDown = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  document.addEventListener("wheel", (e) => {
    camera.fov -= e.deltaY * 0.05;
    camera.updateProjectionMatrix();
  });

  return {
    grid: createGrid(4, 4, 4, 4),
    scene,
    camera,
  };
};
