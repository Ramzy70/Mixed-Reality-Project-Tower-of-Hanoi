import * as THREE from "https://unpkg.com/three@0.159.0/build/three.module.js";
import { ARButton } from "https://unpkg.com/three@0.159.0/examples/jsm/webxr/ARButton.js";

console.log("Mixed Reality Towers of Hanoi – Tap-to-Move Smooth");

// -----------------------------------------------------
// RENDERER — AR ONLY
// -----------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType("local-floor");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

document.body.appendChild(
  ARButton.createButton(renderer, { requiredFeatures: ["local-floor"] })
);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
scene.add(camera);

// -----------------------------------------------------
// LIGHTS
// -----------------------------------------------------
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
dirLight.position.set(2, 4, 2);
scene.add(dirLight);

// -----------------------------------------------------
// CONSTANTS & STATE
// -----------------------------------------------------
const pegPositions = [-0.6, 0, 0.6];
const sizes = [0.45, 0.35, 0.25, 0.15];
const pegStacks = [[], [], []];

let selectedDisk = null;
let selectedIndex = null;
let hasWon = false;

// for smooth movement
const controllerTarget = new THREE.Vector3();

// -----------------------------------------------------
// AUDIO – USSR ANTHEM
// -----------------------------------------------------
const winAudio = new Audio(
  "https://upload.wikimedia.org/wikipedia/commons/7/70/Anthem_of_USSR_-_1943.ogg"
);
winAudio.preload = "auto";

// -----------------------------------------------------
// WALL + IMAGES
// -----------------------------------------------------
const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 3),
  new THREE.MeshBasicMaterial({ color: 0x111111 })
);
wall.position.set(0, 0.5, -3.4);
scene.add(wall);

const loader = new THREE.TextureLoader();
function addImage(url, x) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.2),
    new THREE.MeshBasicMaterial({ map: loader.load(url), toneMapped: false })
  );
  mesh.position.set(x, 1.25, -3.39);
  scene.add(mesh);
}

addImage(
  "https://upload.wikimedia.org/wikipedia/commons/b/b3/Karl_Marx_by_John_Jabez_Edwin_Mayall_1875_-_Restored.png",
  -1.2
);
addImage(
  "https://upload.wikimedia.org/wikipedia/commons/f/f8/Flag_of_the_new_USSR_%282%29.svg",
  1.2
);

// -----------------------------------------------------
// BASE — PERFECT HEIGHT
// -----------------------------------------------------
const base = new THREE.Mesh(
  new THREE.BoxGeometry(2.5, 0.1, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x8b4513 })
);
base.position.set(0, -0.43, -2.0);
scene.add(base);

// -----------------------------------------------------
// PEGS
// -----------------------------------------------------
const pegs = [];
pegPositions.forEach((x) => {
  const peg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.9, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  peg.position.set(base.position.x + x, base.position.y + 0.45, base.position.z);
  scene.add(peg);
  pegs.push(peg);
});

// -----------------------------------------------------
// DISKS — all start on left peg
// -----------------------------------------------------
const disks = [];
for (let i = 0; i < sizes.length; i++) {
  const disk = new THREE.Mesh(
    new THREE.CylinderGeometry(sizes[i], sizes[i], 0.1, 32),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(i / sizes.length, 0.7, 0.5),
      emissive: 0x000000
    })
  );
  const y = base.position.y + 0.05 + i * 0.12;
  disk.position.set(base.position.x + pegPositions[0], y, base.position.z);
  scene.add(disk);
  disks.push(disk);
  pegStacks[0].push(i);
}

// -----------------------------------------------------
// WIN TEXT + RED BACKGROUND
// -----------------------------------------------------
function createWinText() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "green";
  ctx.font = "70px Arial";
  ctx.textAlign = "center";
  ctx.fillText("You win Comrade... OUR comrade", 512, 170);

  const tex = new THREE.CanvasTexture(canvas);

  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.7),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );

  const bgMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.95),
    new THREE.MeshBasicMaterial({ color: 0x700000, opacity: 0.8, transparent: true })
  );
  bgMesh.position.z = -0.02;

  const g = new THREE.Group();
  g.add(bgMesh);
  g.add(textMesh);
  g.visible = false;
  return g;
}

const winText = createWinText();
scene.add(winText);

// Show in front of camera
function showWinText() {
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);

  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  winText.visible = true;
  winText.position.copy(camPos.add(camDir.multiplyScalar(2)));
  winText.lookAt(camera.position);
  winAudio.play().catch(() => {});
}

// -----------------------------------------------------
// USSR STAR PARTICLES
// -----------------------------------------------------
const starParticles = [];
const STAR_LIFE = 120;

function createStars(origin) {
  const shape = new THREE.Shape();
  const outer = 0.06, inner = 0.028;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ShapeGeometry(shape);

  for (let i = 0; i < 40; i++) {
    const star = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 1, transparent: true })
    );
    star.position.copy(origin);
    star.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.03,
      0.02 + Math.random() * 0.03,
      (Math.random() - 0.5) * 0.03
    );
    star.life = STAR_LIFE;
    scene.add(star);
    starParticles.push(star);
  }
}

// -----------------------------------------------------
// GHOST DISK + PEG HIGHLIGHT
// -----------------------------------------------------
const ghostGeo = new THREE.CylinderGeometry(sizes[0], sizes[0], 0.05, 32);
const ghostMatLegal = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.4
});
const ghostMatIllegal = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.4
});

const ghostDisk = new THREE.Mesh(ghostGeo, ghostMatLegal);
ghostDisk.visible = false;
scene.add(ghostDisk);

let highlightedPegIndex = null;

function clearPegHighlight() {
  if (highlightedPegIndex !== null) {
    pegs[highlightedPegIndex].material.color.setHex(0xffffff);
    highlightedPegIndex = null;
  }
}

// -----------------------------------------------------
// RAYCAST + CONTROLLER
// -----------------------------------------------------
const controller = renderer.xr.getController(0);
scene.add(controller);

controller.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -4)
    ]),
    new THREE.LineBasicMaterial({ color: 0xffdd66 })
  )
);

const raycaster = new THREE.Raycaster();
function updateRay() {
  const m = new THREE.Matrix4().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m);
}

// -----------------------------------------------------
// OPTION A — TAP TO PICK / TAP TO DROP (SMOOTHER)
// -----------------------------------------------------
controller.addEventListener("selectstart", () => {
  if (hasWon) return;

  updateRay();

  // If no disk held → try to pick one
  if (!selectedDisk) {
    const hit = raycaster.intersectObjects(disks)[0];
    if (!hit) return;

    selectedDisk = hit.object;
    selectedIndex = disks.indexOf(selectedDisk);

    // verify top of its stack
    const peg = pegStacks.findIndex((s) => s.includes(selectedIndex));
    if (pegStacks[peg].at(-1) !== selectedIndex) {
      selectedDisk = null;
      selectedIndex = null;
      return;
    }

    selectedDisk.material.emissive.setHex(0x444444);
    // initialise smoothing position
    controllerTarget.copy(selectedDisk.position);
    return;
  }

  // Disk already selected → try to drop it on nearest peg
  let nearestPeg = 0,
    best = Infinity;
  pegPositions.forEach((p, i) => {
    const d = Math.abs(selectedDisk.position.x - (base.position.x + p));
    if (d < best) {
      best = d;
      nearestPeg = i;
    }
  });

  const oldPeg = pegStacks.findIndex((s) => s.includes(selectedIndex));
  const newStack = pegStacks[nearestPeg];

  // rule check: no larger on smaller
  if (newStack.length && sizes[selectedIndex] > sizes[newStack.at(-1)]) {
    resetDisk(oldPeg, selectedIndex);
    selectedDisk.material.emissive.setHex(0x000000);
    selectedDisk = null;
    selectedIndex = null;
    ghostDisk.visible = false;
    clearPegHighlight();
    return;
  }

  pegStacks[oldPeg].pop();
  newStack.push(selectedIndex);

  const y = base.position.y + 0.05 + (newStack.length - 1) * 0.12;
  selectedDisk.position.set(
    base.position.x + pegPositions[nearestPeg],
    y,
    base.position.z
  );
  selectedDisk.material.emissive.setHex(0x000000);

  selectedDisk = null;
  selectedIndex = null;
  ghostDisk.visible = false;
  clearPegHighlight();

  // win condition
  if (pegStacks[2].length === sizes.length) {
    hasWon = true;
    showWinText();
    const pos = new THREE.Vector3();
    winText.getWorldPosition(pos);
    createStars(pos);
  }
});

// -----------------------------------------------------
// RESET
// -----------------------------------------------------
function resetDisk(peg, idx) {
  const pos = pegStacks[peg].indexOf(idx);
  disks[idx].position.set(
    base.position.x + pegPositions[peg],
    base.position.y + 0.05 + pos * 0.12,
    base.position.z
  );
}

// -----------------------------------------------------
// MAIN LOOP (SMOOTH MOTION + PREVIEW)
// -----------------------------------------------------
renderer.setAnimationLoop(() => {
  // smooth follow for selected disk
  if (selectedDisk) {
    const controllerPos = new THREE.Vector3().setFromMatrixPosition(
      controller.matrixWorld
    );

    // clamp Z to board, use fixed Y slightly above base
    controllerTarget.set(
      controllerPos.x,
      base.position.y + 0.25,
      base.position.z
    );

    // LERP for smoothness
    selectedDisk.position.lerp(controllerTarget, 0.2);

    // compute nearest peg for preview
    let nearestPeg = 0,
      best = Infinity;
    pegPositions.forEach((p, i) => {
      const d = Math.abs(selectedDisk.position.x - (base.position.x + p));
      if (d < best) {
        best = d;
        nearestPeg = i;
      }
    });

    const stack = pegStacks[nearestPeg];
    const legal =
      !stack.length || sizes[selectedIndex] < sizes[stack[stack.length - 1]];

    // update ghost disk
    ghostDisk.visible = true;
    ghostDisk.material = legal ? ghostMatLegal : ghostMatIllegal;
    const y = base.position.y + 0.05 + stack.length * 0.12;
    ghostDisk.position.set(
      base.position.x + pegPositions[nearestPeg],
      y,
      base.position.z
    );

    // highlight peg color
    clearPegHighlight();
    highlightedPegIndex = nearestPeg;
    pegs[nearestPeg].material.color.setHex(legal ? 0x55ff55 : 0xff5555);
  } else {
    ghostDisk.visible = false;
    clearPegHighlight();
  }

  // update star particles
  starParticles.forEach((s, i) => {
    s.position.add(s.velocity);
    s.velocity.y -= 0.0004;
    s.material.opacity = s.life / STAR_LIFE;
    s.life--;
    if (s.life <= 0) {
      scene.remove(s);
      starParticles.splice(i, 1);
    }
  });

  renderer.render(scene, camera);
});

// -----------------------------------------------------
// RESIZE
// -----------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
