// 初心者ゆえに、読みづらいコードかもしれませんが、どうぞよろしくお願いします！
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SRGBColorSpace } from 'three';
import {
  CSS3DRenderer,
  CSS3DObject,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import gsap from 'gsap';
import { Player } from 'textalive-app-api';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './styles.css';

// THREEバージョン確認
console.log('THREE.REVISION:', THREE.REVISION);

// WebGL
const canvas = document.getElementById('sceneCanvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true,
});
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// CSS3D Renderer（3DUI 用）
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.classList.add('css3d-renderer');
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = 0;
document.body.appendChild(cssRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 1.6, 5); // ユーザーの目線高さ(1.6m)

const hudScene = new THREE.Scene();
const hudCamera = new THREE.OrthographicCamera(
  -window.innerWidth / 2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  -window.innerHeight / 2,
  0.1,
  100
);
hudCamera.position.z = 10;
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const GUILoader = new THREE.TextureLoader();
const arrowTexture = GUILoader.load('./Model/markup_ARROW.png');
const wasdTexture = GUILoader.load('./Model/markup_WASD.png');
const MouseTexture = GUILoader.load('./Model/Mouse.png');
const MouseArrowTexture = GUILoader.load('./Model/Mouse_Arrow.png');

const GUImaterial = new THREE.SpriteMaterial({
  map: arrowTexture,
  transparent: true,
  opacity: 1,
});
const GUIsprite = new THREE.Sprite(GUImaterial);
GUIsprite.scale.set(160, 120, 1);
GUIsprite.position.set(
  -window.innerWidth / 2 + 20,
  -window.innerHeight / 2 + 20,
  1
);
hudScene.add(GUIsprite);

const GUIMouseMaterial = new THREE.SpriteMaterial({
  map: MouseTexture,
  transparent: true,
  opacity: 1,
});
const GUIMouseSprite = new THREE.Sprite(GUIMouseMaterial);
GUIMouseSprite.scale.set(70, 70, 1);
GUIMouseSprite.position.set(
  -window.innerWidth / 2 + 130,
  -window.innerHeight / 2 + 40,
  1
);
hudScene.add(GUIMouseSprite);

const GUIMouseArrowMaterial = new THREE.SpriteMaterial({
  map: MouseArrowTexture,
  transparent: true,
  opacity: 1,
});
const GUIMouseArrowSprite = new THREE.Sprite(GUIMouseArrowMaterial);
GUIMouseArrowSprite.scale.set(50, 50, 1);
GUIMouseArrowSprite.position.set(
  -window.innerWidth / 2 + 130,
  -window.innerHeight / 2 + 40,
  1
);
hudScene.add(GUIMouseArrowSprite);

let showWASD = false;
setInterval(() => {
  GUImaterial.map = showWASD ? wasdTexture : arrowTexture;
  GUImaterial.needsUpdate = true;
  showWASD = !showWASD;
}, 1000);

function updateHudSpritePosition() {
  GUIsprite.position.set(hudCamera.left + 90, hudCamera.bottom + 70, 1);
}

let mouseDragTimeline = null;
let currentMouseDragMode = null;
function startMouseDragLoop(centered = false) {
  if (mouseDragTimeline) return; // 既に動いていたら二重起動しない
  currentMouseDragMode = centered ? 'center' : 'left';

  let baseX, baseY;
  if (centered) {
    baseX = (hudCamera.left + hudCamera.right) / 2;
    baseY = hudCamera.bottom + 45;
  } else {
    baseX = hudCamera.left + 230;
    baseY = hudCamera.bottom + 45;
  }

  GUIMouseSprite.position.set(baseX, baseY, 1);
  GUIMouseArrowSprite.position.set(baseX + 50, baseY + 20, 1);
  GUIMouseSprite.material.rotation = 0;
  GUIMouseArrowSprite.material.rotation = -Math.PI / 16;

  mouseDragTimeline = gsap.timeline({
    repeat: -1, // 無限ループ
    yoyo: true, // 元に戻る動き
    ease: 'circ.inOut',
    defaults: { duration: 2 },
  });

  mouseDragTimeline.to(
    GUIMouseSprite.position,
    {
      x: baseX + 70,
      y: baseY + 40,
    },

    0
  );

  mouseDragTimeline.to(
    GUIMouseSprite.material,
    {
      rotation: -Math.PI / 16,
    },
    0
  );

  mouseDragTimeline.to(
    GUIMouseArrowSprite.position,
    {
      x: baseX,
      y: baseY + 5,
    },
    0
  );

  mouseDragTimeline.to(
    GUIMouseArrowSprite.material,
    {
      rotation: (Math.PI * 3) / 5,
    },
    0
  );
}
startMouseDragLoop();

function stopMouseDragLoop() {
  if (mouseDragTimeline) {
    mouseDragTimeline.kill();
    mouseDragTimeline = null;
    GUIMouseSprite.material.rotation = 0;
    GUIMouseArrowSprite.material.rotaation = -Math.PI / 16;
    updateHudSpritePosition(); // 元の位置に戻す
  }
}

function addBillboardPlane({
  texturePath,
  size = [30, 30],
  position = [0, 0, 0],
  renderOrder = 200,
}) {
  const loader = new THREE.TextureLoader();
  loader.load(texturePath, (texture) => {
    const [width, height] = size;
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      alphaTest: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.raycast = () => {}; // クリック無効化
    mesh.position.set(...position);
    mesh.renderOrder = renderOrder;
    mesh.lookAt(camera.position);
    scene.add(mesh);
  });
}



addBillboardPlane({
  texturePath: './texture/miku.png',
  size: [20, 40],
  position: [0, 15, 50],
  renderOrder: 222,
});

addBillboardPlane({
  texturePath: './texture/eight.png',
  size: [20, 20],
  position: [-55, 5, -70],
  renderOrder: 223,
});

addBillboardPlane({
  texturePath: './texture/DEight.png',
  size: [10, 10],
  position: [40, 20, -30],
  renderOrder: 224,
});

addBillboardPlane({
  texturePath: './texture/magi.png',
  size: [90, 45],
  position: [0, 8, -60],
  renderOrder: 225,
});

addBillboardPlane({
  texturePath: './texture/four.png',
  size: [20, 20],
  position: [40, 8, -10],
  renderOrder: 226,
});

addBillboardPlane({
  texturePath: './texture/sixt.png',
  size: [20, 20],
  position: [-55, 30, -20],
  renderOrder: 227,
});

addBillboardPlane({
  texturePath: './texture/ruka.png',
  size: [20, 40],
  position: [25, 15, 20],
  renderOrder: 228,
});

addBillboardPlane({
  texturePath: './texture/kagamine.png',
  size: [15, 30],
  position: [-20, 10, 10],
  renderOrder: 229,
});

addBillboardPlane({
  texturePath: './texture/four.png',
  size: [20, 20],
  position: [30, 80, -40],
  renderOrder: 230,
});

const starRightPositions = [
  {
    position: new THREE.Vector3(2.8, 0, 6),
    rotation: new THREE.Euler(0, Math.PI / 5, -Math.PI / 5),
    scale: new THREE.Vector3(0.125, 0.125, 0.125),
  },
  {
    position: new THREE.Vector3(-2.9, 0, 4),
    rotation: new THREE.Euler(-Math.PI / 4, Math.PI / 9, 0),
    scale: new THREE.Vector3(0.1, 0.1, 0.1),
  },
  {
    position: new THREE.Vector3(1.5, 0, 7),
    rotation: new THREE.Euler(0, Math.PI / 3, -Math.PI / 6),
    scale: new THREE.Vector3(0.125, 0.125, 0.125),
  },
  {
    position: new THREE.Vector3(-2.5, 0, 6.5),
    rotation: new THREE.Euler(0, -Math.PI / 2, Math.PI / 5),
    scale: new THREE.Vector3(0.11, 0.11, 0.11),
  },
  {
    position: new THREE.Vector3(0.5, 0, 6),
    rotation: new THREE.Euler(-Math.PI / 7, -Math.PI / 4, -Math.PI / 3),
    scale: new THREE.Vector3(0.04, 0.04, 0.04),
  },
  {
    position: new THREE.Vector3(0.23, 0, 4),
    rotation: new THREE.Euler(-Math.PI / 3, -Math.PI / 4, -Math.PI / 3),
    scale: new THREE.Vector3(0.05, 0.05, 0.05),
  },
  {
    position: new THREE.Vector3(2.2, 0, 1.7),
    rotation: new THREE.Euler(-Math.PI / 7, -Math.PI / 4, -Math.PI / 3),
    scale: new THREE.Vector3(0.08, 0.08, 0.08),
  },
  {
    position: new THREE.Vector3(-2.2, 0, 2.6),
    rotation: new THREE.Euler(-(Math.PI * 2) / 5, -Math.PI / 4, -Math.PI / 3),
    scale: new THREE.Vector3(0.06, 0.06, 0.06),
  },
  {
    position: new THREE.Vector3(-2.5, 0, 7.1),
    rotation: new THREE.Euler(-Math.PI / 8, -Math.PI / 3, Math.PI / 3),
    scale: new THREE.Vector3(0.05, 0.05, 0.05),
  },
  {
    position: new THREE.Vector3(-1.2, 0, 6.1),
    rotation: new THREE.Euler(-Math.PI / 7, -Math.PI / 4, -Math.PI / 3),
    scale: new THREE.Vector3(0.05, 0.05, 0.05),
  },
  {
    position: new THREE.Vector3(2.2, 0, 7.5),
    rotation: new THREE.Euler(-Math.PI / 6, -Math.PI / 7, -Math.PI / 5),
    scale: new THREE.Vector3(0.05, 0.05, 0.05),
  },
  {
    position: new THREE.Vector3(1, 0, 8.5),
    rotation: new THREE.Euler(-Math.PI / 7, -Math.PI / 4, Math.PI / 8),
    scale: new THREE.Vector3(0.08, 0.08, 0.08),
  },
  {
    position: new THREE.Vector3(-0.9, 0, 6.3),
    rotation: new THREE.Euler(-Math.PI / 7, -Math.PI / 2, Math.PI / 3),
    scale: new THREE.Vector3(0.07, 0.07, 0.07),
  },
  {
    position: new THREE.Vector3(-1, 0, 8),
    rotation: new THREE.Euler(0, -Math.PI / 3, (Math.PI * 3) / 8),
    scale: new THREE.Vector3(0.17, 0.17, 0.17),
  },
  {
    position: new THREE.Vector3(-0.4, 0, 7.6),
    rotation: new THREE.Euler(0, -Math.PI / 3, Math.PI / 4),
    scale: new THREE.Vector3(0.09, 0.09, 0.09),
  },
  {
    position: new THREE.Vector3(-0.5, 0, 1.5),
    rotation: new THREE.Euler(Math.PI / 4, Math.PI / 7, 0),
    scale: new THREE.Vector3(0.1, 0.1, 0.1),
  },
];

const starClones = []; // 全ての starClone をここに保持

const StarRightLoader = new GLTFLoader();
StarRightLoader.load('./Model/StarRightModel/StarRight.glb', function (gltf) {
  const starRight = gltf.scene;

  starRightPositions.forEach((t) => {
    const starClone = starRight.clone(true); // true: deep clone
    starClone.position.copy(t.position);
    starClone.rotation.copy(t.rotation);
    starClone.scale.copy(t.scale);

    // ⭐ 材質を個別に複製（色変更に必要）
    starClone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(0xdddddd); // 初期色：グレー
      }
    });

    scene.add(starClone);
    starClones.push(starClone);
  });
});

let floor;
const floorLoader = new GLTFLoader();
floorLoader.load(
  './Model/FloorModel/floor.glb',
  function (gltf) {
    floor = gltf.scene;
    floor.traverse((child) => {
      if (child.isMesh) {
        child.renderOrder = 500;
        child.material.depthWrite = false;
        child.material.transparent = true;
      }
    });

    floor.scale.set(0.25, 0.25, 0.25);
    floor.position.set(0, 0, 5);
    scene.add(floor);
    console.log(' GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック
  function (error) {
    console.error(' GLB読み込みエラー:', error);
  }
);

let amp;
const ampLoader = new GLTFLoader();
ampLoader.load(
  './Model/AmpModel/amp.glb',
  function (gltf) {
    amp = gltf.scene;
    amp.scale.set(0.24, 0.24, 0.24);
    amp.position.set(-2.0, 0, 7.3);
    amp.rotation.y = (Math.PI * 4) / 5;
    scene.add(amp);
    onModelLoaded(amp);
    console.log(' GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error(' GLB読み込みエラー:', error);
  }
);
let title;
const titleLoader = new GLTFLoader();
titleLoader.load(
  './Model/TitleModel/Title.glb',
  function (gltf) {
    title = gltf.scene;
    title.scale.set(0.5, 0.5, 0.5);
    title.position.set(2.5, 0, 4);
    title.rotation.y = -Math.PI / 3; // 90度回転
    scene.add(title);
    onModelLoaded(title);
    console.log(' GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error(' GLB読み込みエラー:', error);
  }
);
let mic;
const micLoader = new GLTFLoader();
micLoader.load(
  './Model/MicModel/mic.glb',
  function (gltf) {
    mic = gltf.scene;
    mic.scale.set(0.12, 0.11, 0.12);
    mic.position.set(0.8, 0, 2.0);
    mic.rotation.y = -Math.PI / 8;
    scene.add(mic);
    onModelLoaded(mic);
    console.log(' GLBモデル読み込み完了');
    showClickHereAboveMic();
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error(' GLB読み込みエラー:', error);
  }
);

let telescope;
const telescopeLoader = new GLTFLoader();
telescopeLoader.load(
  './Model/TeleScopeModel/Telescope.glb',
  function (gltf) {
    telescope = gltf.scene;
    telescope.scale.set(0.5, 0.5, 0.5);
    telescope.position.set(-1.5, 0, 2.4);
    telescope.rotation.y = Math.PI;
    scene.add(telescope);
    onModelLoaded(telescope);
    console.log(' GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error(' GLB読み込みエラー:', error);
  }
);

const totalModels = 4; // 読み込むモデル数（amp, title, mic）
let loadedModels = 0;
const collidableObjects = []; // 衝突判定対象オブジェクト
const collidableBoxes = []; // ↑から生成されたBox3

// 衝突ボックス初期化関数（モデルロード後などに呼ぶ）
function initCollisionBoxes() {
  collidableBoxes.length = 0;
  for (const obj of collidableObjects) {
    if (!obj) continue;
    const box = new THREE.Box3().setFromObject(obj);
    collidableBoxes.push(box);
  }
}

function onModelLoaded(model) {
  collidableObjects.push(model);
  loadedModels++;

  if (loadedModels === totalModels) {
    initCollisionBoxes(); // すべてのモデルが読み込まれたら一度だけ呼ぶ
  }
}

const keysPressed = {};
window.addEventListener('keydown', (e) => (keysPressed[e.key] = true));
window.addEventListener('keyup', (e) => (keysPressed[e.key] = false));
// 再利用ベクトルを関数外で定義
const tempVec1 = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 0.04;
const right = new THREE.Vector3();
const offset = new THREE.Vector3(0, -1.6, 0); // 足元で判定
const collisionCenter = new THREE.Vector3(0, 0, 5);
const collisionRadius = 4;
function updateCameraMovement() {
  // 向き計算
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();
  right.crossVectors(direction, camera.up).normalize();

  moveVector.set(0, 0, 0);

  if (keysPressed['ArrowUp'] || keysPressed['w']) {
    moveVector.add(tempVec1.copy(direction).multiplyScalar(moveSpeed));
  }
  if (keysPressed['ArrowDown'] || keysPressed['s']) {
    moveVector.add(tempVec1.copy(direction).multiplyScalar(-moveSpeed));
  }
  if (keysPressed['ArrowLeft'] || keysPressed['a']) {
    moveVector.add(tempVec1.copy(right).multiplyScalar(-moveSpeed));
  }
  if (keysPressed['ArrowRight'] || keysPressed['d']) {
    moveVector.add(tempVec1.copy(right).multiplyScalar(moveSpeed));
  }

  const hitPos = tempVec2.copy(camera.position).add(moveVector).add(offset);

  // 範囲外なら無視
  if (hitPos.distanceTo(collisionCenter) > collisionRadius) return;

  // 衝突判定
  for (const box of collidableBoxes) {
    if (box.containsPoint(hitPos)) return;
  }

  // 移動
  camera.position.add(moveVector);
  controls.target.add(moveVector);
}

const billboardElement = document.getElementById('hologramBillboard');
const hologramObject = new CSS3DObject(billboardElement);
billboardElement.style.display = 'block'; // 念のため上書き
hologramObject.scale.set(0.005, 0.005, 0.005);
hologramObject.visible = false;
scene.add(hologramObject);

const ampMessageElement = document.getElementById('ampMessageBillboard');
const ampHologramObject = new CSS3DObject(ampMessageElement);
ampMessageElement.style.display = 'block'; // 念のため
ampHologramObject.scale.set(0.005, 0.005, 0.005);
ampHologramObject.visible = false;
scene.add(ampHologramObject);

const wrapper = document.createElement('div');
wrapper.id = 'clickHereContainer';

const clickHereElement = document.createElement('div');
clickHereElement.id = 'clickHerePrompt';
wrapper.appendChild(clickHereElement);
const clickHereObj = new CSS3DObject(wrapper);
clickHereElement.style.display = 'block'; // 念のため上書き
clickHereObj.scale.set(0.01, 0.01, 0.01);
clickHereObj.position.set(0, 0, 0);
scene.add(clickHereObj);

let clickHereTarget = null;

function updateClickHere() {
  if (!clickHereObj.visible || !clickHereTarget) return;

  const pos = new THREE.Vector3();
  clickHereTarget.getWorldPosition(pos);
  clickHereObj.position.set(pos.x, pos.y + 1.7, pos.z);
  clickHereObj.lookAt(camera.position);
}

function showClickHereAboveTelescope() {
  clickHereTarget = telescope;

  clickHereObj.visible = true;
  clickHereElement.innerHTML = `
      <p style="text-align: center; margin: 0px;">
        Click Here<br>
        ⇩
      </p>
    `;
  clickHereElement.style.opacity = 0;

  // フェードイン演出
  gsap.to(clickHereElement, {
    opacity: 1,
    duration: 0.6,
    onComplete: () => {
      telescopeClickable = true; // 望遠鏡がクリック可能になる
    },
  });
}

function showClickHereAboveMic() {
  clickHereTarget = mic;

  clickHereObj.visible = true;
  clickHereElement.innerHTML = `
      <p style="text-align: center; margin: 0px;">
        Select Music<br>
        ⇩
      </p>
    `;
  //clickHereElement.textContent = 'Click Mic';
  clickHereElement.style.opacity = 0;

  gsap.to(clickHereElement, {
    opacity: 1,
    duration: 0.6,
  });
}

/* --------------------------
  OrbitControls の設定
--------------------------*/

// 視点の操作の制限
const controls = new OrbitControls(camera, renderer.domElement);
// 操作を禁止する
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enabled = true;
controls.enablePan = false;
controls.enableZoom = false;
//controls.enabled = false;

// 原点を向く
controls.target.set(0, 1.6, 4.9);
// キャプチャ：シーン初期化完了後にカメラ・コントロールの初期状態を保存
const initialCameraPosition = camera.position.clone();
const initialCameraQuaternion = camera.quaternion.clone();

/* --------------------------
  グローバルフラグ
--------------------------*/
let phase = 'init'; // フェーズ管理
let resettingCamera = false; // カメラリセット中、animate() の controls.update() を抑制する

function fadeOutOverlay(callback) {
  const overlay = document.getElementById('fadeOverlay');
  overlay.style.pointerEvents = 'auto';
  overlay.style.opacity = '1';
  setTimeout(() => callback && callback(), 1000); // 1秒後にコールバック
}

function fadeInOverlay(callback) {
  const overlay = document.getElementById('fadeOverlay');
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.pointerEvents = 'none';
    if (callback) callback();
  }, 1000); // 1秒後にコールバック
}

// 視点の端を暗くする
function showVignette() {
  document.getElementById('vignetteOverlay').style.opacity = '1';
}

function hideVignette() {
  document.getElementById('vignetteOverlay').style.opacity = '0';
}

// 演出上邪魔になる望遠鏡を非表示に
function hideModelsBeforeTelescopeScene() {
  if (telescope) telescope.visible = false;
}

function showModelsBack() {
  if (telescope) telescope.visible = true;
}

// 素となる星の球体を生成する
let starSphere;
function createStarSphere() {
  // すでに星空がある場合は削除して再生成
  if (starSphere) {
    scene.remove(starSphere);
  }

  // 天球のジオメトリ（大きめの球体）
  const geometry = new THREE.SphereGeometry(80, 64, 64);

  // 内側から見えるようにマテリアルのsideを指定
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true,
  });

  starSphere = new THREE.Mesh(geometry, material);
  starSphere.renderOrder = -1;
  starSphere.frustumCulled = false;
  scene.add(starSphere);

  // 星の点群（Points）をランダムに配置
  const starCount = 1500;
  const starGeometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];

  const color = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    const radius = 49.5; // 球の内側に少し小さめに配置
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    positions.push(x, y, z);
    //  色もランダムに決定
    color.setHSL(Math.random(), 1.0, 0.7 + Math.random() * 0.3);
    colors.push(color.r, color.g, color.b);
  }
  // ジオメトリ生成
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  starGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );
  // マテリアル生成
  const starMaterial = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  });
  // 星生成
  const stars = new THREE.Points(starGeometry, starMaterial);
  starSphere.add(stars);

  // GSAP で星のまたたきをランダムに演出
  gsap.to(starMaterial, {
    opacity: 0.3 + Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  });

  stars.name = 'starSphere';
  return stars;
}
// 最初から表示するために一度生成しておく
createStarSphere();

function switchToStarScene() {
  // 星空の生成
  createStarSphere();
  // カメラの設定を回転できるように変更
  configureTelescopeControls();
}

function configureTelescopeControls() {
  // 望遠鏡を覗いているような視点の調整
  controls.enabled = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.minPolarAngle = Math.PI / 2; // 下方向の限界
  controls.maxPolarAngle = (Math.PI * 7) / 8; // 上方向の限界

  // 初期視点位置と向きの調整
  camera.position.set(telescope.position.x, 2.0, telescope.position.z); // 地面から少し高め
  controls.target.set(telescope.position.x, 2.0, telescope.position.z - 0.1); // やや前方に向かせる
  controls.update();
}

/* --------------------------
  カメラリセット関数（位置・回転を初期状態に同時に補間）
--------------------------*/

function resetCameraFromTelescope() {
  if (phase !== 'exploringStars') return;
  phase = 'resettingCamera';
  resettingCamera = true;
  controls.enabled = false;
  controls.minPolarAngle = Math.PI / 4; // 下方向の限界
  controls.maxPolarAngle = Math.PI; // 上方向の限界

  camera.position.copy(initialCameraPosition);
  camera.quaternion.copy(initialCameraQuaternion);
  const newTarget = new THREE.Vector3(0, 0, -0.01);
  newTarget.applyQuaternion(camera.quaternion).add(camera.position);
  controls.target.copy(newTarget);
  controls.update();
  resettingCamera = false;
}

/* --------------------------
  TextAlive Player の初期化と音楽再生処理
--------------------------*/
class SafeTextAlivePlayer {
  constructor(playerOptions) {
    this.player = new Player(playerOptions);
    this.listeners = {};
    this.videoReady = false;
    this.songReady = false;
    this.song = null;
    this._holoSliderTimeUpdateRegistered = false;
    this.loopOnEnd = false;

    this.player.addListener({
      onAppReady: (app) => {
        console.log('TextAlive App Ready');
        this.appReady = true;
        this._emit('appready', app);

        let previousPhraseStartTime = null;
        let lastPosition = 0;
        this.player.addListener({
          onTimeUpdate: (position) => {
            if (!this.player.video) return;
            this._emit('timeupdate', position);

            const duration = this.player.video.duration || 0;

            if (!lyricsDisplayEnabled) return;

            if (this.loopOnEnd) {
              allLyricData.forEach((data, idx) => {
                if (
                  !data.returned &&
                  data.startTime > lastPosition &&
                  position >= data.startTime
                ) {
                  console.log(
                    `戻す星群 idx=${idx} phrase="${data.text}" startTime=${data.startTime}`
                  );

                  const phrase = this.player.video.findPhrase(data.startTime);
                  const endTime = phrase?.endTime || data.startTime + 4000;
                  const phraseDuration = endTime - data.startTime;

                  // uTime を 0→1 にアニメーションして文字形状に戻す
                  const newData = displayLyricInStars(
                    data.text,
                    data.startTime,
                    data.center,
                    phraseDuration
                  );
                  allLyricData[idx] = { ...data, ...newData, returned: true };
                }
              });
            }

            lastPosition = position;
            if (phase !== 'exploringStars') return;

            const phrase = this.player.video.findPhrase(position);
            if (phrase && phrase.startTime !== previousPhraseStartTime) {
              previousPhraseStartTime = phrase.startTime;
              console.log(phrase.text);
              onNewPhrase(phrase, position);
            }

            if (duration && position >= duration - 100) {
              console.log('曲終了検出');

              if (phase === 'exploringStars') {
                fadeOutOverlay(() => {
                  resetCameraFromTelescope();
                  showModelsBack();
                  hideVignette();

                  phase = 'viewing';
                  GUIsprite.visible = true;
                  GUIMouseSprite.visible = true;
                  GUIMouseSprite.material.opacity = 1.0;
                  GUIMouseArrowSprite.visible = true;
                  GUIMouseArrowSprite.material.opacity = 1.0;
                  stopMouseDragLoop();
                  startMouseDragLoop();
                  controls.enabled = true;
                  fadeInOverlay();
                  previousPhraseStartTime = null;
                });
                this.loopOnEnd = true;
              }
            }
          },
        });
      },

      onVideoReady: async (video) => {
        console.log('Video Ready', video);
        this.videoReady = true;

        const song = this.player.data.song;
        let retries = 0;
        while (!song?.name && retries++ < 10) {
          console.log('曲情報を待機中...', retries);
          await this._sleep(100);
        }

        if (!song?.name) {
          console.warn('曲情報取得に失敗');
        } else {
          this.songReady = true;
          this.song = song;
          console.log('曲名:', song.name);
        }

        this._emit('videoready', video);
      },
      onPlay: () => this._emit('play'),
      onPause: () => {
        console.log('⏸ onPause');

        const position = this.player.timer.position;
        const duration = this.player.video?.duration || 0;

        // 再ループ期間なら再スタート
        if (this.loopOnEnd && duration && position >= duration - 200) {
          console.log(' 終了直後のpause検出 → 再生再開');

          allLyricData.forEach((data) => (data.returned = false));

          this.restartCurrentSong();
          return;
        }

        this._emit('pause');
      },
      onStop: () => {
        this._emit('stop');
      },
    });
  }

  // イベント登録用 classの中身をいじらずに追加。
  on(eventName, callback) {
    if (!this.listeners[eventName]) this.listeners[eventName] = [];
    this.listeners[eventName].push(callback);
  }
  // 追加内容を実行
  _emit(eventName, data) {
    (this.listeners[eventName] || []).forEach((cb) => cb(data));
  }

  _sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async loadSong(track) {
    try {
      console.log('loadSong 開始:', track.url);
      if (this.player && this.player.isPlaying) {
        this.player.requestStop();
      }
    } catch (e) {
      console.warn('loadSong: stop失敗（無視）', e.name, e.message);
    }

    this.videoReady = false;
    this.songReady = false;
    this.song = null;

    try {
      await this.player.createFromSongUrl(track.url, {
        video: {
          beatId: track.beatId,
          chordId: track.chordId,
          repetitiveSegmentId: track.repetitiveSegmentId,
          lyricId: track.lyricId,
          lyricDiffId: track.lyricDiffId,
        },
      });
    } catch (e) {
      console.error('createFromSongUrl: エラー', e.name, e.message);
      throw e;
    }

    let retries = 0;
    while (!this.videoReady && retries++ < 10) {
      await this._sleep(300);
    }

    if (!this.videoReady) {
      throw new Error('videoReady タイムアウト');
    }
    return true;
  }

  async safePlay(retry = true) {
    try {
      if (!this.player.mediaElement) {
        console.warn('mediaElement が未定義です');
        return;
      }
      console.log('safePlay 実行開始');
      if (this.player.mediaElement.paused) {
        try {
          this.player.requestPlay();
        } catch (err) {
          if (err.name === 'AbortError') {
            console.warn(
              'AbortError: play() が中断されました。pause() が割り込んだ可能性'
            );
          } else {
            throw err; // 予期しない例外は再スロー
          }
        }
      }

      await this._sleep(200);

      if (!this.player.isPlaying && retry) {
        console.warn('再試行: requestPlay');
        try {
          this.player.requestPlay();
        } catch (e) {
          if (e.name === 'AbortError') {
            console.warn('再試行でも AbortError:', e.message);
          } else {
            console.warn('再試行も中断:', e);
          }
        }
      }
    } catch (err) {
      console.error('requestPlay 完全失敗', err);
    }
  }

  async safePause() {
    try {
      this.player.requestPause();
    } catch (e) {
      console.error('requestPause エラー', e);
    }
  }

  async safeStop() {
    try {
      this.player.requestStop();
    } catch (e) {
      console.error('requestStop エラー', e);
    }
  }

  getPlayer() {
    return this.player;
  }

  getCurrentSong() {
    return this.song;
  }

  get isPlaying() {
    return this.player.isPlaying;
  }

  restartCurrentSong() {
    if (this.player && this.player.video) {
      this.player.requestMediaSeek(0); // 再生位置を0秒に
      setTimeout(() => {
        this.safePlay();
      }, 500);
    }
  }
}

const lyricsGroup = new THREE.Group();
lyricsGroup.position.set(0, 0, 0);
lyricsGroup.rotation.set(0, 0, 0);
lyricsGroup.scale.set(1, 1, 1);
lyricsGroup.renderOrder = 399;
scene.add(lyricsGroup);

const allLyricData = [];

function onNewPhrase(phrase, position) {
  console.log(' onNewPhrase:', phrase.text, 'at', position);

  const startTime = phrase.startTime;
  const endTime = phrase.endTime || startTime + 4000; // endTime が無ければ仮に4秒に
  const duration = endTime - startTime;

  const data = displayLyricInStars(phrase.text, position, null, duration);
  spawnExplosionStars(data.center);
  spawnNebulaAt(data.center, 1);

  data.returned = false;
  // 後で戻すためのデータを保存
  allLyricData.push(data);
  //　デバッグ
  console.log('   → allLyricData length:', allLyricData.length);
}

// ======= ヘルパー関数群 =======
function getWorldPositionsFromText(
  text,
  {
    canvasSize = 1024,
    xStep = 1,
    yStep = 1,
    threshold = 128,
    font = 'bold 48px "Noto Sans JP", Meiryo, sans-serif',
    scale = 120,
  } = {}
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  // テキスト描画
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = 'white';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasSize / 2, canvasSize / 2);

  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  const coords = [];

  // アルファ判定された座標収集
  for (let y = 0; y < canvasSize; y += yStep) {
    for (let x = 0; x < canvasSize; x += xStep) {
      const alpha = imageData[(y * canvasSize + x) * 4 + 3];
      if (alpha > threshold) coords.push({ x, y });
    }
  }

  // 中心（重心）を計算
  let sumX = 0,
    sumY = 0;
  coords.forEach(({ x, y }) => {
    sumX += x;
    sumY += y;
  });
  const centerX = sumX / coords.length;
  const centerY = sumY / coords.length;

  // キャンバス→ワールド座標（中心揃え）
  const worldPositions = coords.map(({ x, y }) => {
    const nx = ((x - centerX) / canvasSize) * scale;
    const ny = ((centerY - y) / canvasSize) * scale;
    const nz = (Math.random() - 0.5) * 1.5;
    return new THREE.Vector3(nx, ny, nz);
  });

  return worldPositions;
}

/**
 * BufferGeometry／ShaderMaterial をまとめて作る
 */
function createLyricPoints(
  worldPositions,
  { sizeRange = [0.1, 0.3], colorHueRange = [0, 1], sortDirection = null } = {}
) {
  const count = worldPositions.length;
  const posArray = [];
  const colorArray = [];
  const sizeArray = [];
  const opacityArray = new Float32Array(count).fill(0); // 初期は全て非表示

  for (let i = 0; i < count; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 7
    );
    const initPos = worldPositions[i].clone().add(offset);
    posArray.push(...initPos.toArray());

    const hue =
      Math.random() * (colorHueRange[1] - colorHueRange[0]) + colorHueRange[0];
    const col = new THREE.Color().setHSL(hue, 1, 0.7);
    colorArray.push(col.r, col.g, col.b);

    const baseSize =
      2.0 * Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];

    sizeArray.push(baseSize);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colorArray, 3));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizeArray, 1));
  geo.setAttribute(
    'aOpacity',
    new THREE.Float32BufferAttribute(opacityArray, 1)
  );

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 }, // 全体の乗算係数（常時1）
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aOpacity;
      varying vec3 vColor;
      varying float vOpacity;
      uniform float uTime;
      void main(){
        vColor = aColor;
        vOpacity = aOpacity;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = aSize * (300.0 / -mv.z) * clamp(uTime, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;

      varying float vOpacity;
      uniform float uOpacity;
      void main(){
        float d = distance(gl_PointCoord, vec2(0.5));
        if(d > 0.5) discard;
        float alpha = mix(0.0, 1.0, vOpacity);
        gl_FragColor = vec4(vColor, alpha * uOpacity);
      }`,
  });

  const points = new THREE.Points(geo, mat);
  points.renderOrder = 445;

  // 並べ替え（左→右）してアニメーション
  const posAttr = geo.getAttribute('position');
  const opacityAttr = geo.getAttribute('aOpacity');
  const sortedIndices = [...Array(count).keys()];

  if (sortDirection) {
    sortedIndices.sort((a, b) => {
      const aVal = worldPositions[a].dot(sortDirection);
      const bVal = worldPositions[b].dot(sortDirection);
      return aVal - bVal;
    });
  }

  sortedIndices.forEach((sortedIndex, idx) => {
    const from = new THREE.Vector3(
      posAttr.getX(sortedIndex),
      posAttr.getY(sortedIndex),
      posAttr.getZ(sortedIndex)
    );
    const to = worldPositions[sortedIndex];

    // フェードイン順に透明度を上げる
    gsap.to(opacityArray, {
      [sortedIndex]: 1.0,
      delay: idx * 0.0002,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        opacityAttr.array[sortedIndex] = opacityArray[sortedIndex];
        opacityAttr.needsUpdate = true;
      },
    });

    // 星の収束アニメーション（集まる動き）
    gsap.to(from, {
      x: to.x,
      y: to.y,
      z: to.z,
      delay: idx * 0.0002,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        posAttr.setXYZ(sortedIndex, from.x, from.y, from.z);
        posAttr.needsUpdate = true;
      },
    });
  });

  return points;
}

function getAdjustedSortDirection(worldPositions) {
  // カメラの右方向ベクトル
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3()
    .crossVectors(forward, camera.up)
    .normalize();

  // 並べ替え用に x に沿ってソート（もとの worldPositions は左→右に並んでるはず）
  const sortedIndices = [...Array(worldPositions.length).keys()].sort(
    (a, b) => {
      return worldPositions[a].x - worldPositions[b].x;
    }
  );

  // 並べ替えた上で、first → last ベクトルを得る
  const first = worldPositions[sortedIndices[0]];
  const last = worldPositions[sortedIndices[sortedIndices.length - 1]];
  const spanVec = new THREE.Vector3().subVectors(last, first).normalize();

  // spanVec がカメラの right 方向とどれだけ一致してるか調べる
  const dot = spanVec.dot(right);

  // right 方向と逆なら反転
  return dot >= 0 ? right : right.negate();
}

function displayLyricInStars(
  text,
  startTime,
  reusedCenter = null,
  duration = 4000
) {
  const scatterDelay = Math.max(duration / 1000, 1.5);

  const worldPositions = getWorldPositionsFromText(text, {
    canvasSize: 1024,
    xStep: 1,
    yStep: 1,
    scale: 120,
    font: 'bold 48px "Noto Sans JP", Meiryo',
  });

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const distance = 55 + Math.random() * 5;
  const baseCenter = camera.position
    .clone()
    .add(forward.clone().multiplyScalar(distance));
  const center = reusedCenter || baseCenter;

  const sortDirection = getAdjustedSortDirection(worldPositions);

  const points = createLyricPoints(worldPositions, {
    sizeRange: [0.1, 0.25],
    colorHueRange: [0, 1],
    sortDirection,
  });

  points.position.copy(center);
  lyricsGroup.add(points);

  const sortedIndices = [...Array(worldPositions.length).keys()];
  sortedIndices.sort((a, b) => {
    const aVal = worldPositions[a].dot(sortDirection);
    const bVal = worldPositions[b].dot(sortDirection);
    return aVal - bVal;
  });

  const mat = points.material;
  gsap.to(mat.uniforms.uTime, { value: 1, duration: 1.0, ease: 'power2.out' });

  gsap.to(mat.uniforms.uOpacity, {
    value: 1.0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      const posAttr = points.geometry.getAttribute('position');
      const opacityAttr = points.geometry.getAttribute('aOpacity');
      const opacityArray = opacityAttr.array;

      const scatterTargets = [];
      for (let i = 0; i < posAttr.count; i++) {
        const from = new THREE.Vector3().fromBufferAttribute(posAttr, i);
        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
          .normalize()
          .multiplyScalar(2 + Math.random() * 4);
        scatterTargets.push(from.clone().add(dir));
      }

      sortedIndices.forEach((i, idx) => {
        const target = scatterTargets[i];
        if (!target) return;

        const current = new THREE.Vector3().fromBufferAttribute(posAttr, i);

        gsap.to(current, {
          x: target.x,
          y: target.y,
          z: target.z,
          delay: scatterDelay - 0.8 + idx * 0.0002,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            posAttr.setXYZ(i, current.x, current.y, current.z);
            posAttr.needsUpdate = true;
          },
        });

        gsap.to(opacityArray, {
          [i]: 0.0,
          delay: scatterDelay - 0.8 + idx * 0.0002,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            opacityAttr.array[i] = opacityArray[i];
            opacityAttr.needsUpdate = true;
          },
        });
      });
    },
  });

  // 既存のターゲットの中から最も近いものに向けて線を伸ばす

  // if (constellationTargets.length === 0) {
  //   console.warn('No constellation targets available');
  //   return { text, startTime, center, points };
  // }

  // // 最近傍のターゲットを探す
  // let nearestTarget = null;
  // let minDist = Infinity;
  // for (const target of constellationTargets) {
  //   const dist = center.distanceTo(target.position);
  //   if (dist < minDist) {
  //     minDist = dist;
  //     nearestTarget = target;
  //   }
  // }

  // if (!nearestTarget) {
  //   console.warn('最近傍ターゲットが見つかりませんでした');
  //   return { text, startTime, center, points };
  // }

  // const targetPos = nearestTarget.position.clone();

  // console.log(`Nearest constellation: ${nearestTarget.name}`);
  // console.log('center:', center.toArray());
  // console.log('targetPos:', targetPos.toArray());
  // console.log('distance:', minDist.toFixed(2));

  // //drawDebugLine(center, targetPos, 0xffff00); // 黄色の線でデバッグ

  // // 閾値内なら星座生成
  // const maxDistanceThreshold = 5;
  // if (minDist < maxDistanceThreshold) {
  //   console.log(`星座「${nearestTarget.name}」を生成`);
  //   createConstellationFromData({
  //     data: nearestTarget.data,
  //     position: targetPos,
  //     name: nearestTarget.name,
  //   });
  // } else {
  //   console.log(`距離が遠すぎて星座未生成`);
  // }

  // // ヒント矢印表示処理
  // if (!safePlayer?.loopOnEnd && minDist > 5 && minDist < 50) {
  //   const dir = new THREE.Vector3().subVectors(targetPos, center).normalize();
  //   createHintParticlesAt(center, dir, minDist);
  // } else if (safePlayer?.loopOnEnd) {
  //   console.log('ループ中のためヒント表示はスキップ');
  // }

  return { text, startTime, center, points };
}

// function createHintParticlesAt(center, dir, dist) {
//   const hintParticleCount = 500;
//   const hintPositions = [];
//   const hintColors = [];
//   const hintGeometry = new THREE.BufferGeometry();
//   const tempColor = new THREE.Color();

//   // 距離に応じたパラメータ
//   const clampedDist = Math.max(5, Math.min(dist, 50));
//   const t = (clampedDist - 5) / 40;

//   const baseOpacity = 0.9 * (1 - t);
//   const forwardLength = 5 + 10 * (1 - t); // dir方向の長さ（近いほど長く）
//   const spreadRadius = 2.0 + 6.0 * t; // 底面半径（遠いほど広がる）

//   // 指向性ベクトル（軸：dir、垂直：up）
//   const up = new THREE.Vector3(0, 1, 0);
//   const basis = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, up); // ローカル座標系作成

//   for (let i = 0; i < hintParticleCount; i++) {
//     const h = Math.random() * forwardLength; // 高さ（鋭さ）
//     const r = (1 - h / forwardLength) * spreadRadius; // 高さに応じて底面に近づくほど広がる

//     const angle = Math.random() * Math.PI * 2;
//     const x = Math.cos(angle) * r;
//     const y = Math.sin(angle) * r;
//     const z = -h;

//     const localPos = new THREE.Vector3(x, y, z).applyMatrix4(basis);
//     const worldPos = center.clone().add(localPos);

//     hintPositions.push(worldPos.x, worldPos.y, worldPos.z);

//     // 彩度：近いほど高彩度
//     const hue = 0.15 + Math.random() * 0.4;
//     const saturation = 1.0 - t;
//     const lightness = 0.7;
//     tempColor.setHSL(hue, saturation, lightness);
//     hintColors.push(tempColor.r, tempColor.g, tempColor.b);
//   }

//   // Geometry & Material
//   hintGeometry.setAttribute(
//     'position',
//     new THREE.Float32BufferAttribute(hintPositions, 3)
//   );
//   hintGeometry.setAttribute(
//     'color',
//     new THREE.Float32BufferAttribute(hintColors, 3)
//   );

//   const hintMaterial = new THREE.PointsMaterial({
//     size: 0.0,
//     vertexColors: true,
//     transparent: true,
//     opacity: 0,
//     depthWrite: false,
//     blending: THREE.AdditiveBlending,
//   });

//   const hintParticles = new THREE.Points(hintGeometry, hintMaterial);
//   scene.add(hintParticles);

//   // フェードイン＋明滅
//   const pulse = { value: 0 };
//   const pulseTween = gsap.to(pulse, {
//     value: Math.PI * 2,
//     duration: 1.5,
//     repeat: -1,
//     ease: 'sine.inOut',
//     onUpdate: () => {
//       const wave = (Math.sin(pulse.value) + 1) / 2;
//       hintMaterial.opacity = baseOpacity * (0.3 + 0.6 * wave);
//     },
//   });

//   // 一定時間後に削除
//   setTimeout(() => {
//     pulseTween.kill();
//     gsap.to(hintMaterial, {
//       opacity: 0.0,
//       duration: 1.0,
//       ease: 'power2.in',
//       onComplete: () => {
//         scene.remove(hintParticles);
//         hintGeometry.dispose();
//         hintMaterial.dispose();
//       },
//     });
//   }, 1500);
// }

// const generatedConstellations = new Set();
// function createConstellationFromData({ data, position, name }) {
//   if (generatedConstellations.has(name)) {
//     console.log(` 星座 "${name}" は既に生成済みです`);
//     return;
//   }

//   const group = new THREE.Group();

//   // 中心座標を求める
//   const center = new THREE.Vector3();
//   data.stars.forEach(([x, y, z]) => {
//     center.x += x;
//     center.y += y;
//     center.z += z;
//   });
//   center.divideScalar(data.stars.length);

//   group.position.copy(position);
//   scene.add(group);

//   const starMeshes = [];

//   // 星を順番に出す
//   data.stars.forEach((star, i) => {
//     const finalPos = new THREE.Vector3(...star).sub(center);
//     const mesh = new THREE.Mesh(
//       new THREE.SphereGeometry(0.2, 8, 8),
//       new THREE.MeshBasicMaterial({
//         color: 0xffffcc,
//         transparent: true,
//         opacity: 0,
//       })
//     );

//     mesh.position.copy(finalPos);
//     mesh.scale.set(0.1, 0.1, 0.1); // 最初は小さく
//     group.add(mesh);
//     starMeshes.push(mesh);

//     // アニメーション
//     const delay = i * 0.2;
//     gsap.to(mesh.material, {
//       opacity: 1.0,
//       delay,
//       duration: 0.3,
//       ease: 'power2.out',
//     });
//     gsap.to(mesh.scale, {
//       x: 1,
//       y: 1,
//       z: 1,
//       delay,
//       duration: 0.4,
//       ease: 'back.out(2)', // 弾むように
//     });
//   });

//   // 線をあとから一本ずつ描画
//   const lineStartDelay = data.stars.length * 0.2 + 0.3;
//   data.connections.forEach(([a, b], i) => {
//     const start = new THREE.Vector3(...data.stars[a]).sub(center);
//     const end = new THREE.Vector3(...data.stars[b]).sub(center);

//     const geometry = new THREE.BufferGeometry().setFromPoints([
//       start.clone(),
//       start.clone(),
//     ]);
//     const line = new THREE.Line(
//       geometry,
//       new THREE.LineBasicMaterial({
//         color: 0x86cecb,
//         transparent: true,
//         opacity: 0,
//       })
//     );
//     group.add(line);

//     const attr = line.geometry.getAttribute('position');

//     gsap.to(line.material, {
//       opacity: 1.0,
//       delay: lineStartDelay + i * 0.2,
//       duration: 0.4,
//     });

//     const tweenObj = { t: 0 };
//     gsap.to(tweenObj, {
//       t: 1,
//       delay: lineStartDelay + i * 0.2,
//       duration: 0.4,
//       ease: 'power2.out',
//       onUpdate() {
//         const t = tweenObj.t;
//         const interp = start.clone().lerp(end, t);
//         attr.setXYZ(1, interp.x, interp.y, interp.z);
//         attr.needsUpdate = true;
//       },
//     });
//   });

//   // カメラに向ける
//   const lookTarget = new THREE.Vector3().copy(camera.position);
//   group.lookAt(lookTarget);

//   // 管理
//   generatedConstellations.add(name);

//   updateStarCloneColors();
//   //updateStarSphereColor();

//   if (generatedConstellations.size === 1) {
//     startShootingStars();
//   }
// }

// const constellationsData = {
//   hercules: {
//     stars: [
//       [0, 0, 0],
//       [6, 9, 0.2],
//       [-6, 9, -0.2],
//       [6, 18, 0],
//       [-6, 18, 0],
//     ],
//     connections: [
//       [0, 1],
//       [0, 2],
//       [1, 3],
//       [2, 4],
//       [3, 4],
//     ],
//     size: 16,
//   },

//   canisMajor: {
//     stars: [
//       [0, 0, 0],
//       [5, 6, 0],
//       [10, 3, 0.2],
//       [15, 0, -0.2],
//       [5, -6, 0.1],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [0, 4],
//     ],
//     size: 15,
//   },

//   ursaMinor: {
//     stars: [
//       [0, 0, 0],
//       [3, 3, 0.2],
//       [6, 6, -0.2],
//       [9, 9, 0],
//       [12, 12, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//     ],
//     size: 12,
//   },

//   draco: {
//     stars: [
//       [0, 0, 0],
//       [3, 3, 0.3],
//       [6, 6, -0.2],
//       [9, 9, 0.1],
//       [12, 6, 0],
//       [15, 3, -0.1],
//       [18, 0, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//       [4, 5],
//       [5, 6],
//     ],
//     size: 18,
//   },

//   capricornus: {
//     stars: [
//       [0, 0, 0],
//       [6, 0, 0.1],
//       [3, 6, -0.1],
//       [0, 12, 0],
//       [-3, 6, 0],
//       [-6, 0, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//       [4, 5],
//       [5, 0],
//     ],
//     size: 12,
//   },

//   crux: {
//     stars: [
//       [0, 0, 0],
//       [0, 11.25, 0],
//       [7.5, 5.625, 0.375],
//       [-7.5, 5.625, -0.375],
//     ],
//     connections: [
//       [0, 1],
//       [2, 3],
//     ],
//     size: 12,
//   },

//   pegasus: {
//     stars: [
//       [0, 0, 0],
//       [11.25, 0, 0.375],
//       [11.25, 11.25, -0.375],
//       [0, 11.25, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 0],
//     ],
//     size: 12,
//   },

//   leo: {
//     stars: [
//       [0, 0, 0],
//       [7.5, 3.75, 0.1875],
//       [15, 0, -0.1875],
//       [11.25, 11.25, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [1, 3],
//     ],
//     size: 15,
//   },

//   andromeda: {
//     stars: [
//       [0, 0, 0],
//       [3.75, 7.5, 0.375],
//       [7.5, 15, -0.375],
//       [11.25, 22.5, 0.1875],
//       [15, 30, -0.1875],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//     ],
//     size: 16,
//   },

//   taurus: {
//     stars: [
//       [0, 0, 0],
//       [-5.625, 11.25, 0],
//       [-11.25, 22.5, -0.375],
//       [-16.875, 33.75, 0.375],
//       [-22.5, 22.5, 0],
//       [-28.125, 11.25, -0.1875],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//       [4, 5],
//     ],
//     size: 16,
//   },

//   lyra: {
//     stars: [
//       [0, 0, 0],
//       [11.25, 0, 0.375],
//       [5.625, 11.25, 0],
//       [5.625, 5.625, 3.75],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 0],
//       [2, 3],
//     ],
//     size: 12,
//   },

//   scorpius: {
//     stars: [
//       [0, 0, 0],
//       [3.75, 7.5, 0],
//       [7.5, 11.25, -0.375],
//       [11.25, 7.5, 0],
//       [15, 0, 0.375],
//       [11.25, -7.5, 0],
//       [7.5, -11.25, -0.375],
//       [3.75, -7.5, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//       [4, 5],
//       [5, 6],
//       [6, 7],
//     ],
//     size: 13,
//   },

//   aquarius: {
//     stars: [
//       [0, 0, 0],
//       [3.75, 3.75, 0.375],
//       [7.5, 0, -0.375],
//       [11.25, 3.75, 0.1875],
//       [15, 0, -0.1875],
//       [18.75, 3.75, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//       [4, 5],
//     ],
//     size: 15,
//   },

//   orion: {
//     stars: [
//       [0, 0, 0],
//       [7.5, 15, 0.375],
//       [-7.5, 15, -0.375],
//       [0, 30, 0],
//       [11.25, -7.5, 0.375],
//       [-11.25, -7.5, -0.375],
//       [0, -18.75, 0],
//     ],
//     connections: [
//       [0, 1],
//       [0, 2],
//       [1, 3],
//       [2, 3],
//       [0, 4],
//       [0, 5],
//       [4, 6],
//       [5, 6],
//     ],
//     size: 16,
//   },

//   cassiopeia: {
//     stars: [
//       [0, 0, 0],
//       [7.5, 7.5, 0.375],
//       [15, 0, 0],
//       [22.5, 7.5, -0.375],
//       [30, 0, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [2, 3],
//       [3, 4],
//     ],
//     size: 15,
//   },

//   cygnus: {
//     stars: [
//       [0, 0, 0],
//       [0, 7.5, 0.375],
//       [0, 15, -0.375],
//       [-7.5, 7.5, 0],
//       [7.5, 7.5, 0],
//     ],
//     connections: [
//       [0, 1],
//       [1, 2],
//       [1, 3],
//       [1, 4],
//     ],
//     size: 10,
//   },
// };

// const constellationTargets = []; // 星座ターゲット（配置された位置と参照データ）

// function placeConstellationTargets({
//   // 初期設定
//   count = 10,
//   minDistance = 40,
//   cameraDistance = 55,
//   minPolarAngle = (Math.PI * 2) / 14, // 上方向の制限（例）引数からは変更しない
//   maxPolarAngle = (Math.PI * 4) / 8, // 下方向の制限（例）引数からは変更しない
// }) {
//   constellationTargets.length = 0;
//   const keys = Object.keys(constellationsData);
//   const selectedKeys = [];

//   const forward = new THREE.Vector3();
//   if (camera) camera.getWorldDirection(forward);

//   while (selectedKeys.length < count && keys.length > 0) {
//     const idx = Math.floor(Math.random() * keys.length);
//     const key = keys.splice(idx, 1)[0];
//     const data = constellationsData[key];

//     let tryCount = 0;
//     while (tryCount < 300) {
//       // ランダムな方向ベクトルを生成（球面上の点）
//       const theta = Math.random() * 2 * Math.PI;
//       const phi = Math.acos(2 * Math.random() - 1);
//       const dir = new THREE.Vector3(
//         Math.sin(phi) * Math.cos(theta),
//         Math.cos(phi),
//         Math.sin(phi) * Math.sin(theta)
//       );

//       // dirの極座標のpolar angleを計算
//       const polarAngle = Math.acos(dir.y);

//       // 望遠鏡の上下回転範囲内かチェック
//       if (polarAngle < minPolarAngle || polarAngle > maxPolarAngle) {
//         tryCount++;
//         continue; // 範囲外なら再生成
//       }

//       const pos = camera
//         ? camera.position.clone().add(dir.multiplyScalar(cameraDistance))
//         : dir.multiplyScalar(cameraDistance);

//       const tooClose = constellationTargets.some(
//         (target) => target.position.distanceTo(pos) < minDistance + data.size
//       );

//       if (!tooClose) {
//         constellationTargets.push({
//           name: key,
//           data,
//           position: pos,
//         });
//         selectedKeys.push(key);
//         break;
//       }

//       tryCount++;
//     }
//   }
//   if (constellationTargets.length < count) {
//     console.log(
//       `${count}個中${constellationTargets.length}個しか配置できませんでした`
//     );
//   }

//   console.log(' Placed constellation targets:', constellationTargets);
// }

// const constellationDebugGroup = new THREE.Group();
// scene.add(constellationDebugGroup);

const persistentStarsGroup = new THREE.Group();
scene.add(persistentStarsGroup);

function spawnExplosionStars(center, count = 500) {
  console.log(' spawnExplosionStars called at', center);
  const positions = [];
  const targets = [];
  const colors = [];
  const sizes = [];
  

  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const spread = 50;
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
    const startPos = new THREE.Vector3().copy(center); // 拡散スタート位置
    const targetPos = new THREE.Vector3().copy(center).add(offset);

    positions.push(startPos.x, startPos.y, startPos.z);
    targets.push(targetPos.x, targetPos.y, targetPos.z);

    color.setHSL(Math.random(), 0.6, 0.6 + Math.random() * 0.3);
    colors.push(color.r, color.g, color.b);

    sizes.push(1.8 + Math.random() * 1.0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    'aTarget',
    new THREE.Float32BufferAttribute(targets, 3)
  );
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0.0 },
      uFlicker: { value: 0.0 },
      uOpacity: { value: 1.0 },
    },
    vertexShader: `
      attribute vec3 aTarget;
      attribute vec3 aColor;
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uFlicker;
      void main() {
        vec3 newPos = mix(position, aTarget, uTime);
        vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float flick = 0.3 + 0.1 * sin(uFlicker + aSize * 1.5);
        float pointSize = aSize * (300.0 / abs(mvPosition.z)) * flick;
        gl_PointSize = floor(pointSize) + 0.4;
        vColor = aColor;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        float alpha = smoothstep(0.5, 0.4, d) * uOpacity;
        //if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = 222;
  points.frustumCulled = false;
  persistentStarsGroup.add(points);

  // アニメーション
  gsap.to(material.uniforms.uTime, {
    value: 1.0,
    duration: 1.0,
    ease: 'power2.out',
  });

  gsap.to(material.uniforms.uFlicker, {
    value: Math.PI * 2,
    duration: 2.0,
    repeat: -1,
    ease: 'linear',
  });
  //console.log("geometry count", geometry.attributes.position.count);
}

const textures = [
  './texture/astro1.png',
  './texture/astro2.png',
  './texture/astro3.png',
  './texture/astro1.png',
  './texture/astro2.png',
  './texture/astro3.png',
  './texture/astro1.png',
  './texture/astro2.png',
  './texture/astro3.png',
];
const nebulaTextures = [];
const textureLoader = new THREE.TextureLoader();
// プリロード
textures.forEach((url) => {
  textureLoader.load(
    url,
    (tex) => nebulaTextures.push(tex),
    undefined,
    (err) => console.error('Nebula load error', url, err)
  );
});
// 星雲を生成
function spawnNebulaAt(center, count) {
  if (nebulaTextures.length === 0) {
    console.warn(' nebula textures not yet loaded');
    return;
  }

  for (let i = 0; i < count; i++) {
    // 表示する画像をランダムで決定。
    const texture =
      nebulaTextures[Math.floor(Math.random() * nebulaTextures.length)];

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.renderOrder = 111;
    plane.frustumCulled = false;
    //const spread = 30;
    // const offset = new THREE.Vector3(
    //   (Math.random() - 0.5) * spread,
    //   (Math.random() - 0.5) * spread,
    //   (Math.random() - 0.5) * spread
    // );
    plane.position.copy(center) /*.add(offset)*/;

    const size = 35 + Math.random() * 10;
    plane.scale.set(size, size, 1);
    plane.userData.lookAtCamera = true;

    persistentStarsGroup.add(plane);

    gsap.to(material, {
      opacity: 0.1,
      duration: 1.5,
      ease: 'power2.out',
    });

    gsap.to(plane.scale, {
      x: size + 8,
      y: size + 8,
      duration: 3.0,
      ease: 'sine.inOut',
    });
  }
}

// let shootingStarLoopStarted = false;

// function startShootingStars() {
//   if (shootingStarLoopStarted) return;
//   shootingStarLoopStarted = true;

//   let lastSpawn = 0;

//   function loop() {
//     const now = performance.now();
//     const foundCount = generatedConstellations.size; // 星座の発見数

//     // 出現間隔を動的調整
//     const baseInterval = 8000; // ms
//     const interval = Math.max(1000, baseInterval - foundCount * 500); // 最短1秒

//     if (now - lastSpawn > interval) {
//       lastSpawn = now;

//       // 生成数を動的調整
//       const baseCount = 1;
//       const extra = foundCount;
//       const count = baseCount + Math.floor(Math.random() * (1 + extra));

//       for (let i = 0; i < count; i++) {
//         spawnShootingStar();
//       }
//     }

//     requestAnimationFrame(loop);
//   }

//   loop();
// }

// function spawnShootingStar() {
//   const particleCount = 40;
//   const geometry = new THREE.BufferGeometry();
//   const positions = [];
//   const sizes = [];
//   const colors = [];

//   const distance = 30;
//   const spreadRadius = 30; // camera center からの広がり範囲

//   // カメラの視線ベクトル（正面方向）
//   const direction = new THREE.Vector3();
//   camera.getWorldDirection(direction);

//   // cameraの中心前方（注視点）からの球面ランダム生成
//   const center = new THREE.Vector3()
//     .copy(camera.position)
//     .add(direction.multiplyScalar(distance));

//   // ランダム方向に微小なオフセット（球面座標で）
//   const theta = Math.random() * 2 * Math.PI;
//   const phi = Math.acos(2 * Math.random() - 1);
//   const r = Math.random() * spreadRadius;

//   const offset = new THREE.Vector3(
//     r * Math.sin(phi) * Math.cos(theta),
//     r * Math.sin(phi) * Math.sin(theta),
//     r * Math.cos(phi)
//   );

//   const start = center.clone().add(offset);
//   const end = start
//     .clone()
//     .add(
//       new THREE.Vector3(
//         (Math.random() - 0.5) * 20.0,
//         Math.random() * -4.0,
//         Math.random() * -2.0
//       )
//     );

//   const colorStart = new THREE.Color(0xffffff);
//   const colorEnd = new THREE.Color(0xbbeeff);

//   for (let i = 0; i < particleCount; i++) {
//     const ratio = i / (particleCount - 1);
//     const point = start.clone().lerp(end, ratio);
//     positions.push(point.x, point.y, point.z);

//     sizes.push(0.1 + ratio * 0.3);

//     const color = colorStart.clone().lerp(colorEnd, ratio);
//     colors.push(color.r, color.g, color.b);
//   }

//   geometry.setAttribute(
//     'position',
//     new THREE.Float32BufferAttribute(positions, 3)
//   );
//   geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
//   geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));

//   const vertexShader = `
//     precision mediump float;
//     attribute float aSize;
//     attribute vec3 aColor;
//     varying vec3 vColor;
//     void main() {
//       vColor = aColor;
//       vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//       gl_PointSize = aSize * (300.0 / -mvPosition.z);
//       gl_Position = projectionMatrix * mvPosition;
//     }
//   `;

//   const fragmentShader = `
//     precision mediump float;
//     uniform float uOpacity;
//     varying vec3 vColor;
//     void main() {
//       float d = length(gl_PointCoord - vec2(0.5));
//       if (d > 0.5) discard;
//       gl_FragColor = vec4(vColor, uOpacity);
//     }
//   `;

//   const material = new THREE.ShaderMaterial({
//     uniforms: {
//       uOpacity: { value: 1.0 },
//     },
//     vertexShader,
//     fragmentShader,
//     vertexColors: true,
//     transparent: true,
//     depthWrite: false,
//   });

//   const points = new THREE.Points(geometry, material);
//   scene.add(points);

//   createAfterglowParticles(end);

//   gsap.to(material.uniforms.uOpacity, {
//     value: 0,
//     duration: 1.2,
//     ease: 'power1.out',
//     onComplete: () => {
//       scene.remove(points);
//       geometry.dispose();
//       material.dispose();
//     },
//   });
// }

// function createAfterglowParticles(position) {
//   const particleCount = 40;
//   const positions = [];

//   for (let i = 0; i < particleCount; i++) {
//     const offset = new THREE.Vector3(
//       (Math.random() - 0.5) * 2,
//       (Math.random() - 0.5) * 2,
//       (Math.random() - 0.5) * 2
//     );
//     const pos = position.clone().add(offset);
//     positions.push(pos.x, pos.y, pos.z);
//   }

//   const geometry = new THREE.BufferGeometry();
//   geometry.setAttribute(
//     'position',
//     new THREE.Float32BufferAttribute(positions, 3)
//   );

//   const material = new THREE.PointsMaterial({
//     color: 0x88ccff,
//     size: 0.07,
//     transparent: true,
//     opacity: 1,
//     depthWrite: false,
//     blending: THREE.NormalBlending,
//   });

//   const particles = new THREE.Points(geometry, material);
//   scene.add(particles);

//   // フェードアウト＆削除
//   gsap.to(material, {
//     opacity: 0,
//     duration: 2.0,
//     ease: 'power1.out',
//     onComplete: () => {
//       scene.remove(particles);
//       geometry.dispose();
//       material.dispose();
//     },
//   });
// }

// function updateStarCloneColors() {
//   const count = generatedConstellations.size;

//   const rainbowColors = [
//     0xff0000, // 赤
//     0xff7f00, // オレンジ
//     0xffff00, // 黄
//     0x00ff00, // 緑
//     0x0000ff, // 青
//     0x4b0082, // 藍
//     0x8b00ff, // 紫
//   ];

//   let getColorForClone;

//   if (count >= 12) {
//     getColorForClone = (index) => {
//       const hex = rainbowColors[index % rainbowColors.length];
//       return new THREE.Color(hex);
//     };
//   } else {
//     let targetColor;
//     if (count >= 10) {
//       targetColor = 0x00ced1; // ミクカラー（シアン系）
//     } else if (count >= 8) {
//       targetColor = 0x0000ff; // 青
//     } else if (count >= 6) {
//       targetColor = 0x800080; // 紫
//     } else if (count >= 3) {
//       targetColor = 0xff69b4; // ピンク（ホットピンク）
//     } else {
//       targetColor = 0xaaaaaa; // グレー
//     }

//     const newColor = new THREE.Color(targetColor);
//     getColorForClone = () => newColor;
//   }

//   starClones.forEach((clone, index) => {
//     const lastTargetColor = getColorForClone(index);

//     clone.traverse((child) => {
//       if (child.isMesh && child.material && child.material.color) {
//         const currentColor = child.material.color.clone();

//         gsap.to(currentColor, {
//           r: lastTargetColor.r,
//           g: lastTargetColor.g,
//           b: lastTargetColor.b,
//           duration: 1.2,
//           ease: 'power2.out',
//           onUpdate: () => {
//             child.material.color.setRGB(
//               currentColor.r,
//               currentColor.g,
//               currentColor.b
//             );
//           },
//         });
//       }
//     });
//   });
// }

// function updateStarSphereColor() {
//   if (!starSphere) return;

//   const count = generatedConstellations.size;
//   const maxCount = 10;
//   const t = Math.min(count / maxCount, 1);

//   // ベースの暗い色
//   const baseColor = new THREE.Color(0x101020);

//   // 明るくなる目標色
//   const brightColor = new THREE.Color(0x202040);

//   // 現在の目標色を計算
//   const targetColor = baseColor.clone().lerp(brightColor, t);

//   gsap.to(starSphere.material.color, {
//     r: targetColor.r,
//     g: targetColor.g,
//     b: targetColor.b,
//     duration: 1.5,
//     ease: 'power2.out',
//   });
// }

const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', onMouseMove);
let safePlayer;
let micClicked = false;
let telescopeClickable = false;
let telescopeClicked = false;
let lyricsDisplayEnabled = false;

safePlayer = new SafeTextAlivePlayer({
  app: { token: 'F3s1rJugVHrXdNRN' },
  mediaElement: document.querySelector('#media'),
});
// クリックされたオブジェクトの親(target)を探す
function isDescendantOf(object, target) {
  let o = object;
  while (o) {
    if (o === target) return true;
    o = o.parent;
  }
  return false;
}

clickHereElement.addEventListener('click', () => {
  const label = clickHereElement.innerHTML;

  if (label.includes('Click Here')) {
    if (!safePlayer.player.video || !telescopeClickable) return;
    console.log('望遠鏡クリック');
    startTelescopeTransition();
  } else if (label.includes('Select Music')) {
    console.log('マイククリック');
    micClicked = true;
    gsap.to(clickHereElement, {
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        clickHereObj.visible = false;
        setupHoloSlider();
        showCSSHologramAboveMic();

        setTimeout(() => {
          showClickHereAboveTelescope();
        }, 3000);
      },
    });
  }
});

// 各オブジェクトへのクリック判定
window.addEventListener('mousedown', (event) => {
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    console.log(clickedObject);
    if (
      phase === 'init' &&
      !micClicked &&
      mic &&
      isDescendantOf(clickedObject, mic)
    ) {
      console.log('マイククリック');
      micClicked = true;
      gsap.to(clickHereElement, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          clickHereObj.visible = false;
          setupHoloSlider();
          showCSSHologramAboveMic();

          setTimeout(() => {
            showClickHereAboveTelescope();
          }, 3000);
        },
      });
    } else if (
      phase === 'init' &&
      !telescopeClicked &&
      telescope &&
      isDescendantOf(clickedObject, telescope)
    ) {
      if (!safePlayer.player.video || !telescopeClickable) return;
      console.log('望遠鏡クリック');
      telescopeClicked = true;
      startTelescopeTransition();
    } else if (
      (phase === 'viewing' || phase === 'init') &&
      amp &&
      isDescendantOf(clickedObject, amp) &&
      !ampHologramObject.visible
    ) {
      console.log('アンプクリック');
      showAmpMessageUI();
    }
  }
});

let currentPlayButton = null;
let currentSeekBar = null;
let currentTimeDisplay = null;
let currentIndex = 0;

function setupHoloSlider() {
  const slider = document.querySelector('.slider-wrapper');
  slider.innerHTML = '';

  function formatTime(ms) {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${min}:${s}`;
  }

  function updateSeekUI(posMs) {
    const video = safePlayer.player.video;
    if (!video) return;

    const durMs = video.duration;
    const pct = (posMs / durMs) * 100;

    currentSeekBar.value = pct;
    currentTimeDisplay.textContent = `${formatTime(posMs)} / ${formatTime(
      durMs
    )}`;
  }

  if (!safePlayer._holoSliderTimeUpdateRegistered) {
    safePlayer._holoSliderTimeUpdateRegistered = true;
    safePlayer.on('timeupdate', (posMs) => {
      if (!currentSeekBar || !currentTimeDisplay) return;

      updateSeekUI(posMs);
    });
  }

  trackList.forEach((track, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.dataset.index = i;
    slide.innerHTML = `
      <div class="slide-content">
        <img class="jacket" src="${track.image}" alt="${track.title}" />
        <div class="song-info">
          <h3 class="song-title">${track.title}</h3>
          <p class="song-artist">${track.artist}</p>
          <img src="./texture/barlines.png" class="barlines" alt="bars" />
        </div>
      </div>
      <div class="player-controls">
        <button class="play-btn">▶</button>
        <input type="range" class="seek-bar" min="0" max="100" value="0" />
        <span class="time-display">00:00 / 00:00</span>
      </div>
    `;
    slider.appendChild(slide);
  });

  const btnPrev = document.getElementById('slidePrev');
  const btnNext = document.getElementById('slideNext');

  btnPrev.addEventListener('click', () => updateSlide(-1));
  btnNext.addEventListener('click', () => updateSlide(+1));

  async function updateSlide(offset) {
    currentIndex =
      (currentIndex + offset + trackList.length) % trackList.length;
    const slideWidth = slider.querySelector('.slide').offsetWidth;

    gsap.to(slider, {
      x: -slideWidth * currentIndex,
      duration: 0.3,
      ease: 'power2.out',
    });

    const currentSlide = slider.children[currentIndex];
    currentPlayButton = currentSlide.querySelector('.play-btn');
    currentSeekBar = currentSlide.querySelector('.seek-bar');
    currentTimeDisplay = currentSlide.querySelector('.time-display');

    btnPrev.classList.add('disabled');
    btnNext.classList.add('disabled');
    currentPlayButton.classList.add('disabled');
    currentPlayButton.textContent = '...';
    currentSeekBar.classList.add('disabled');
    currentSeekBar.value = 0;
    currentTimeDisplay.textContent = '読み込み中...';

    await safePlayer.loadSong(trackList[currentIndex]);

    btnPrev.classList.remove('disabled');
    btnNext.classList.remove('disabled');
    currentPlayButton.classList.remove('disabled');
    currentPlayButton.textContent = '▶';
    currentSeekBar.value = 0;
    const dur = safePlayer.player.video?.duration || 0;
    currentTimeDisplay.textContent = `00:00 / ${formatTime(dur)}`;

    currentPlayButton.onclick = async () => {
      if (!safePlayer.videoReady) {
        return;
      }

      if (safePlayer.isPlaying) {
        await safePlayer.safePause();
        currentPlayButton.textContent = '▶';
        currentSeekBar.classList.add('disabled');
        console.log(`[play button] Paused.`);
      } else {
        await safePlayer.safePlay();
        currentPlayButton.textContent = '⏸';
        currentSeekBar.classList.remove('disabled');
        console.log(`[play button] Playing.`);
      }
    };

    currentSeekBar.oninput = () => {
      const video = safePlayer.player.video;
      if (!video) return;

      const newTime = (currentSeekBar.value / 100) * video.duration;

      console.log(
        `[seekBar.input] Requesting seek to: ${newTime.toFixed(0)}ms`
      );
      safePlayer.player.requestMediaSeek(newTime);
    };
  }

  updateSlide(0);
}

function hideHologramUI() {
  hologramObject.visible = false;
}

function showCSSHologramAboveMic() {
  const micTop = new THREE.Vector3();
  mic.getWorldPosition(micTop);
  micTop.y += 2.1;

  hologramObject.position.copy(micTop);
  hologramObject.visible = true;

  // スケールを0に初期化してからアニメーション
  hologramObject.scale.set(0.0001, 0.0001, 0.0001);

  // UI要素のopacityを0にしてからフェードイン
  const ui = document.getElementById('hologramBillboard');
  ui.style.opacity = 0;

  // アニメーション同時に実行
  gsap.to(hologramObject.scale, {
    x: 0.005,
    y: 0.005,
    z: 0.005,
    duration: 0.8,
    ease: 'expo.out',
  });

  gsap.to(ui, {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
  });
}

function showAmpMessageUI() {
  const pos = new THREE.Vector3();
  amp.getWorldPosition(pos);
  pos.y += 2.0;
  ampHologramObject.position.copy(pos);
  ampHologramObject.visible = true;
  ampHologramObject.scale.set(0.0001, 0.0001, 0.0001);

  const ui = document.getElementById('ampMessageBillboard');
  ui.style.opacity = 0;

  // フェーズによってUI切り替え
  if (phase === 'viewing') {
    ui.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <h2 style="font-size: 22px; color: #aaffff;">遊んでくれてありがとう！</h2>
        <hr style="border: none; border-top: 1px solid #88ccff; margin: 1em 0;">
        <p style="font-size: 16px; color: #aaffff;">使用させていただいたイラスト</p>
        <p style="font-size: 10px; color: #aaffff;">
          シルエット初音ミク(修正版)-- 栄光の幕切れ様<br>
          シルエット巡音ルカ(修正版)-- 栄光の幕切れ様<br>
          鏡音リン&鏡音レン透過シルエット-- Naut_As様
        </p>
      </div>
    `;
  } else {
    // 初期メッセージ
    ui.innerHTML = `
      <div style="text-align: center; line-height: 1.6;">
        <h2 style="font-size: 22px; margin-bottom: 10px; color: #aaffff;">
          曲を選んでみよう
        </h2>
        <p style="font-size: 16px; color: #aaffff;">
          マイクをクリックして曲を選ぼう<br>
          選び終わったら望遠鏡を覗いてみよう
        </p>
        <hr style="border: none; border-top: 1px solid #88ccff; margin: 1em 0;">
        <p style="font-size: 14px; color: #aaffff;">
          星空には隠れた〇〇があるかも…？
        </p>
      </div>
    `;
  }

  // フェードイン表示
  gsap.to(ampHologramObject.scale, {
    x: 0.005,
    y: 0.005,
    z: 0.005,
    duration: 0.8,
    ease: 'expo.out',
  });

  gsap.to(ui, {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
  });

  // 自動でフェードアウト
  gsap.to(ampHologramObject.scale, {
    x: 0.0001,
    y: 0.0001,
    z: 0.0001,
    delay: 5,
    duration: 1.5,
    ease: 'expo.in',
  });

  gsap.to(ui, {
    opacity: 0,
    delay: 5,
    duration: 1.5,
    ease: 'expo.in',
    onComplete: () => {
      ampHologramObject.visible = false;
    },
  });
}

// 望遠鏡へのトランジション
function startTelescopeTransition() {
  if (phase !== 'init') return;
  if (!safePlayer.songReady) return; // 曲が読み込まれていない
  safePlayer.safePause(); // 一時停止
  gsap.to(clickHereElement, {
    opacity: 0,
    duration: 0.6,
    onComplete: () => {
      clickHereObj.visible = false;
    },
  });
  phase = 'telescopeZooming';
  const telescopePosition = telescope.position.clone();
  const targetCameraPosition = camera.position.clone();
  const tempCamera = new THREE.PerspectiveCamera();
  tempCamera.position.copy(targetCameraPosition);
  tempCamera.lookAt(
    telescopePosition.x + 1,
    telescopePosition.y,
    telescopePosition.z
  );
  const targetQuaternion = tempCamera.quaternion.clone();
  const startQuaternion = camera.quaternion.clone();

  // カメラのズーム（位置）
  gsap.to(camera.position, {
    x: telescopePosition.x,
    y: telescopePosition.y + 1.2,
    z: telescopePosition.z + 0.6,
    duration: 2,
    ease: 'power2.inOut',
  });

  // カメラの向き（Quaternion補間）
  gsap.to(
    { t: 0 },
    {
      t: 1,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate() {
        let progress = this.targets()[0].t;
        camera.quaternion
          .copy(startQuaternion)
          .slerp(targetQuaternion, progress);

        // カメラ方向に合わせて controls.target も更新
        const currentTarget = new THREE.Vector3(0, 0, -0.01)
          .applyQuaternion(camera.quaternion)
          .add(camera.position);
        controls.target.copy(currentTarget);
      },
      onComplete() {
        const newTarget = new THREE.Vector3(0, 0, -0.01);
        newTarget.applyQuaternion(camera.quaternion).add(camera.position);
        controls.target.copy(newTarget);
        phase = 'fadingOut';
        fadeOutOverlay(async () => {
          hideModelsBeforeTelescopeScene();
          hideHologramUI();
          // placeConstellationTargets({
          //   count: 13, // 最大星座数
          //   minDistance: 20, // 星座同士の最小距離
          //   cameraDistance: 55,
          // });
          switchToStarScene(); // 星空シーンへの切り替え
          showVignette();
          GUIsprite.visible = false;
          stopMouseDragLoop();
          startMouseDragLoop(true);
          setTimeout(() => {
            gsap.to(GUIMouseSprite.material, {
              opacity: 0,
              duration: 1.2,
              onComplete: () => {
                GUIMouseSprite.visible = false;
              },
            });
            gsap.to(GUIMouseArrowSprite.material, {
              opacity: 0,
              duration: 1.2,
              onComplete: () => {
                GUIMouseArrowSprite.visible = false;
              },
            });
          }, 10000);
          fadeInOverlay(() => {
            phase = 'exploringStars';
          });
          await safePlayer._sleep(1500);
          safePlayer.restartCurrentSong();
          lyricsDisplayEnabled = true;
        });
      },
    }
  );
}

let isDragging = false;
let lastCamQuat = new THREE.Quaternion();
camera.quaternion.clone(lastCamQuat);

// OrbitControlsが操作開始
controls.addEventListener('start', () => {
  isDragging = true;
});

// カメラの変化があるたび呼ばれる
controls.addEventListener('change', () => {
  if (!isDragging) return;

  // カメラの回転が変わったか確認
  if (!camera.quaternion.equals(lastCamQuat)) {
    document.body.style.cursor = 'grabbing';
  }

  // 毎回記録を更新
  lastCamQuat.copy(camera.quaternion);
});

// 操作終了
controls.addEventListener('end', () => {
  isDragging = false;
  document.body.style.cursor = 'grab';
});

safePlayer.on('appready', () => {
  console.log(' アプリ準備完了');
});

safePlayer.on('videoready', () => {
  console.log(' ビデオ準備完了');
});

safePlayer.on('play', () => {
  const song = safePlayer.getCurrentSong();
  if (song) {
    console.log(`▶ 再生中: ${song.name} by ${song.artist?.name ?? '不明'}`);
  }
});

safePlayer.on('pause', () => {
  console.warn(' safePause 呼び出し（スタックトレース）');
  console.trace();
  console.log('pause');
});

safePlayer.on('stop', () => {
  console.log('stop');
});

const trackList = [
  {
    title: 'ストリートライト',
    artist: '加賀(ネギシャワーP)',
    url: 'https://piapro.jp/t/ULcJ/20250205120202',
    image: './texture/cover.png',
    beatId: 4694275,
    chordId: 2830730,
    repetitiveSegmentId: 2946478,
    lyricId: 67810,
    lyricDiffId: 20654,
  },
  {
    title: 'アリフレーション',
    artist: '雨良 Amala',
    url: 'https://piapro.jp/t/SuQO/20250127235813',
    image: './texture/cover.png',
    beatId: 4694276,
    chordId: 2830731,
    repetitiveSegmentId: 2946479,
    lyricId: 67811,
    lyricDiffId: 20655,
  },
  {
    title: 'インフォーマルダイブ',
    artist: '99piano',
    url: 'https://piapro.jp/t/Ppc9/20241224135843',
    image: './texture/cover.png',
    beatId: 4694277,
    chordId: 2830732,
    repetitiveSegmentId: 2946480,
    lyricId: 67812,
    lyricDiffId: 20656,
  },
  {
    title: 'ハロー、フェルミ。',
    artist: 'ど～ぱみん',
    url: 'https://piapro.jp/t/oTaJ/20250204234235',
    image: './texture/cover.png',
    beatId: 4694278,
    chordId: 2830733,
    repetitiveSegmentId: 2946481,
    lyricId: 67813,
    lyricDiffId: 20657,
  },
  {
    title: 'パレードレコード',
    artist: 'きさら',
    url: 'https://piapro.jp/t/GCgy/20250202202635',
    image: './texture/cover.png',
    beatId: 4694279,
    chordId: 2830734,
    repetitiveSegmentId: 2946482,
    lyricId: 67814,
    lyricDiffId: 20658,
  },
  {
    title: 'ロンリーラン',
    artist: '海風太陽',
    url: 'https://piapro.jp/t/CyPO/20250128183915',
    image: './texture/cover.png',
    beatId: 4694280,
    chordId: 2830735,
    repetitiveSegmentId: 2946483,
    lyricId: 67815,
    lyricDiffId: 20659,
  },
];

const mouse = new THREE.Vector2();

function onMouseMove(event) {
  // マウス座標を正規化
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
/* --------------------------
  アニメーションループ
--------------------------*/

function animate() {
  requestAnimationFrame(animate);
  updateCameraMovement();
  updateHudSpritePosition();
  updateClickHere();

  raycaster.setFromCamera(mouse, camera);
  if (mic && telescope && amp) {
    const raycastTargets = [];
    if (mic && !micClicked) raycastTargets.push(mic);
    if (telescope && !telescopeClicked && micClicked && telescopeClickable)
      raycastTargets.push(telescope);
    if (amp && !ampHologramObject.visible) raycastTargets.push(amp);
    const intersects = raycaster.intersectObjects(raycastTargets, true);
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
  }

  const starSphere = scene.getObjectByName('starSphere');
  if (starSphere) {
    starSphere.rotation.y += 0.00002;
  }

  if (hologramObject.visible) {
    hologramObject.lookAt(camera.position);
  }

  if (ampHologramObject.visible) {
    ampHologramObject.lookAt(camera.position);
  }

  lyricsGroup.children.forEach((mesh) => {
    mesh.lookAt(camera.position);
  });

  persistentStarsGroup.children.forEach((obj) => {
    if (obj.userData.lookAtCamera) {
      obj.lookAt(camera.position);
    }
  });
  if (!resettingCamera) {
    controls.update();
  }

  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth(); // 深度バッファをクリア
  renderer.render(hudScene, hudCamera);
  cssRenderer.render(scene, camera);
}
animate();

/* --------------------------
  ウィンドウリサイズ対応
--------------------------*/
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  hudCamera.left = -window.innerWidth / 2;
  hudCamera.right = window.innerWidth / 2;
  hudCamera.top = window.innerHeight / 2;
  hudCamera.bottom = -window.innerHeight / 2;
  hudCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  if (mouseDragTimeline) {
    stopMouseDragLoop();
    if (currentMouseDragMode === 'center') {
      startMouseDragLoop(true);
    } else {
      startMouseDragLoop(false);
    }
  }
});

/* --------------------------
  エラーデバッグ
--------------------------*/
window.onerror = function (message, source, lineno, colno, error) {
  console.error('グローバルエラーキャッチ:', {
    message,
    source,
    lineno,
    colno,
    error,
  });
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.name === 'AbortError') {
    event.preventDefault(); // AbortError は無視
  }
});
