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
//import { all, max } from 'three/tsl';
//import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './styles.css';

// THREEバージョン確認
console.log('THREE.REVISION:', THREE.REVISION);

/* --------------------------
  Renderer の設定
--------------------------*/
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

/* --------------------------
  シーン・カメラ・ライト の設定
--------------------------*/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.6, 5); // ユーザーの目線高さ(1.6m)

// const bloomLayer = new THREE.Layers();
// bloomLayer.set(1); // Layer1をBloom専用として扱う

// const renderScene = new RenderPass(scene, camera);

// const bloomPass = new UnrealBloomPass(
//   new THREE.Vector2(window.innerWidth, window.innerHeight),
//   1.5,
//   0.5,
//   0.9
// );

// const bloomComposer = new EffectComposer(renderer);
// bloomComposer.addPass(renderScene);
// bloomComposer.addPass(bloomPass);

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

/* --------------------------
  オブジェクトロード
--------------------------*/

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
GUIsprite.scale.set(80, 60, 1);
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
GUIMouseSprite.scale.set(35, 35, 1);
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
GUIMouseArrowSprite.scale.set(25, 25, 1);
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
  GUIsprite.position.set(hudCamera.left + 60, hudCamera.bottom + 50, 1);
}

let mouseDragTimeline = null;
let currentMouseDragMode = null; // 'center' または 'left'
function startMouseDragLoop(centered = false) {
  if (mouseDragTimeline) return; // 既に動いていたら二重起動しない
  currentMouseDragMode = centered ? 'center' : 'left';

  let baseX, baseY;
  if (centered) {
    baseX = (hudCamera.left + hudCamera.right) / 2;
    baseY = hudCamera.bottom + 40;
  } else {
    baseX = hudCamera.left + 130;
    baseY = hudCamera.bottom + 40;
  }

  GUIMouseSprite.position.set(baseX, baseY, 1);
  GUIMouseArrowSprite.position.set(baseX + 30, baseY + 10, 1);
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
      x: baseX + 30,
      y: baseY + 10,
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

let floor;
const floorLoader = new GLTFLoader();
floorLoader.load(
  './Model/FloorModel/floor.glb',
  function (gltf) {
    floor = gltf.scene;
    floor.scale.set(0.25, 0.25, 0.25);
    floor.position.set(0, 0, 5);
    scene.add(floor);
    console.log('✅ GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error('❌ GLB読み込みエラー:', error);
  }
);
const starRightPositions = [
  {
    position: new THREE.Vector3(2.8, 0, 4.6),
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

const StarRightLoader = new GLTFLoader();
StarRightLoader.load('./Model/StarRightModel/StarRight.glb', function (gltf) {
  let starRight = gltf.scene;

  starRightPositions.forEach((t) => {
    const starClone = starRight.clone();
    starClone.position.copy(t.position);
    starClone.scale.copy(t.scale);
    scene.add(starClone);
  });
});

let amp;
const ampLoader = new GLTFLoader();
ampLoader.load(
  './Model/AmpModel/amp.glb',
  function (gltf) {
    amp = gltf.scene;
    amp.scale.set(0.24, 0.24, 0.24);
    amp.position.set(-3, 0, 5.5);
    amp.rotation.y = (Math.PI * 3) / 5; // 90度回転
    scene.add(amp);
    onModelLoaded(amp);
    console.log('✅ GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error('❌ GLB読み込みエラー:', error);
  }
);
let title;
const titleLoader = new GLTFLoader();
titleLoader.load(
  './Model/TitleModel/Title.glb',
  function (gltf) {
    title = gltf.scene;
    title.scale.set(0.5, 0.5, 0.5);
    title.position.set(2.5, 0, 6);
    title.rotation.y = (-Math.PI * 2) / 3; // 90度回転
    scene.add(title);
    onModelLoaded(title);
    console.log('✅ GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error('❌ GLB読み込みエラー:', error);
  }
);
let mic;
const micLoader = new GLTFLoader();
micLoader.load(
  './Model/MicModel/mic.glb',
  function (gltf) {
    mic = gltf.scene;
    mic.scale.set(0.12, 0.11, 0.12);
    mic.position.set(1.25, 0, 2.5);
    mic.rotation.y = -Math.PI / 4;
    scene.add(mic);
    onModelLoaded(mic);
    console.log('✅ GLBモデル読み込み完了');
    showClickHereAboveMic();

    console.log('mic world position:', mic.position);
    console.log('clickHereObj position:', clickHereObj.position);
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error('❌ GLB読み込みエラー:', error);
  }
);

const totalModels = 3; // 読み込むモデル数（amp, title, mic）
let loadedModels = 0;

function onModelLoaded(model) {
  collidableObjects.push(model);
  loadedModels++;

  if (loadedModels === totalModels) {
    initCollisionBoxes(); // すべてのモデルが読み込まれたら一度だけ呼ぶ
    console.log('✅ すべてのモデル読み込み完了 → 衝突ボックス初期化');
  }
}

const billboardElement = document.getElementById('hologramBillboard');
const hologramObject = new CSS3DObject(billboardElement);
billboardElement.style.display = 'block'; // 念のため上書き
hologramObject.scale.set(0.005, 0.005, 0.005);
hologramObject.visible = false;
scene.add(hologramObject);

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
  clickHereElement.textContent = 'Click Telescope';
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
  clickHereElement.textContent = 'Click Mic';
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
const initialControlsTarget = controls.target.clone();
// デバッグ用
console.log(initialControlsTarget);
console.log(camera.position);
console.log('初期のカメラQuaternion:', initialCameraQuaternion);

/* --------------------------
  グローバルフラグ
--------------------------*/
let phase = 'init'; // フェーズ管理(init, fadingOut, smartphoneZoom, telescopeZooming, exploringStars, selectMusic, resettingCamera, viewing)
let resettingCamera = false; // カメラリセット中、animate() の controls.update() を抑制する

/* --------------------------
  スマホモデルと望遠鏡モデルのロードと CSS3D UI 配置
--------------------------*/

let telescope;
const telescopeLoader = new GLTFLoader();
telescopeLoader.load(
  './Model/TeleScopeModel/Telescope.glb',
  function (gltf) {
    telescope = gltf.scene;
    telescope.scale.set(0.5, 0.5, 0.5);
    telescope.position.set(-1.5, 0, 2.5);
    telescope.rotation.y = Math.PI;
    scene.add(telescope);
    collidableObjects.push(telescope);
    console.log('✅ GLBモデル読み込み完了');
  },
  undefined, // ロード中の進行状況コールバック(デバッグ用)
  function (error) {
    console.error('❌ GLB読み込みエラー:', error);
  }
);

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
  const geometry = new THREE.SphereGeometry(50, 64, 64);

  // 内側から見えるようにマテリアルのsideを指定
  const material = new THREE.MeshBasicMaterial({
    // ほんのり青っぽく
    color: 0x000010,
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

  console.log('🌌 星空が生成されました');
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
  controls.minPolarAngle = (Math.PI * 3) / 7; // 下方向の限界
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
  console.log('カメラの初期状態へのリセットが完了しました');
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
              //console.log('ループ再生中');
              //console.log('   ★ allLyricData:', allLyricData.map(d => d.startTime));

              allLyricData.forEach((data, idx) => {
                //console.log(`     → idx=${idx}, returned=${data.returned}, startTime=${data.startTime}`);
                if (
                  !data.returned &&
                  data.startTime > lastPosition &&
                  position >= data.startTime
                ) {
                  console.log(
                    `  ↳ 戻す星群 idx=${idx} phrase="${data.text}" startTime=${data.startTime}`
                  );
                  // uTime を 0→1 にアニメーションして文字形状に戻す
                  const newData = displayLyricInStars(
                    data.text,
                    data.startTime,
                    data.center
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
        console.log('🎬 Video Ready', video);
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
          console.log('⏺ 終了直後のpause検出 → 再生再開');

          allLyricData.forEach((data) => (data.returned = false));

          //this.loopOnEnd = false; // ループフラグをリセット

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
scene.add(lyricsGroup);

const allLyricData = [];

function onNewPhrase(phrase, position) {
  console.log('▶ onNewPhrase:', phrase.text, 'at', position);
  const data = displayLyricInStars(phrase.text, position);
  spawnExplosionStars(data.center);
  spawnNebulaAt(data.center, 4);

  data.returned = false;
  // 後で戻すためのデータを保存
  allLyricData.push(data);
  //　デバッグ
  console.log('   → allLyricData length:', allLyricData.length);
}

// ======= ヘルパー関数群 =======
/**
 * 歌詞テキストをキャンバスに描画し、
 * 明るいピクセル座標のインデックス配列を返す
 */
function sampleTextAlphaIndices(
  text,
  {
    canvasSize = 1024,
    xStep = 2,
    yStep = 1,
    threshold = 128,
    font = 'bold 48px "Noto Sans JP", Meiryo, sans-serif',
  } = {}
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = 'white';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasSize / 2, canvasSize / 2);
  const data = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  const coords = [];
  for (let y = 0; y < canvasSize; y += yStep) {
    for (let x = 0; x < canvasSize; x += xStep) {
      if (data[(y * canvasSize + x) * 4 + 3] > threshold) {
        coords.push({ x, y });
      }
    }
  }
  return { coords, canvasSize };
}

/**
 * 画面内ランダムオフセットを加えたワールド座標にマッピング
 */
function mapToWorldPositions(coords, { canvasSize, scale = 120 }) {
  return coords.map(({ x, y }) => {
    const nx = (x / canvasSize - 0.5) * scale;
    const ny = (0.5 - y / canvasSize) * scale;
    const nz = (Math.random() - 0.5) * 1.5;
    return new THREE.Vector3(nx, ny, nz);
  });
}

/**
 * BufferGeometry／ShaderMaterial をまとめて作る
 */
function createLyricPoints(
  worldPositions,
  { sizeRange = [0.1, 0.3], colorHueRange = [0, 1], keepIndices = [] } = {}
) {
  const count = worldPositions.length;
  const posArray = [];
  const colorArray = [];
  const sizeArray = [];
  const keepArray = [];

  for (let i = 0; i < count; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5
    );
    const initPos = worldPositions[i].clone().add(offset);
    posArray.push(...initPos.toArray());

    const hue =
      Math.random() * (colorHueRange[1] - colorHueRange[0]) + colorHueRange[0];
    const col = new THREE.Color().setHSL(hue, 1, 0.7);
    colorArray.push(col.r, col.g, col.b);

    const isKeep = keepIndices.includes(i);
    const baseSize =
      2.5 * Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
    const enlargedSize = isKeep ? baseSize * 2 : baseSize; // 星座用は2倍
    sizeArray.push(enlargedSize);

    keepArray.push(isKeep ? 1.0 : 0.0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colorArray, 3));
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizeArray, 1));
  geo.setAttribute('aKeep', new THREE.Float32BufferAttribute(keepArray, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aKeep;
      varying vec3 vColor;
      varying float vKeep;
      uniform float uTime;
      void main(){
        vColor = aColor;
        vKeep = aKeep;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = aSize * (300.0 / -mv.z) * clamp(uTime,0.0,1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vKeep;
      uniform float uOpacity;
      void main(){
        float d = distance(gl_PointCoord, vec2(0.5));
        if(d>0.5) discard;
        float alpha = mix(uOpacity, 1.0, vKeep);
        gl_FragColor = vec4(vColor, alpha);
      }`,
  });

  const points = new THREE.Points(geo, mat);

  // 粒子をアニメーションして元の位置に集める
  const posAttr = geo.getAttribute('position');
  worldPositions.forEach((target, i) => {
    const from = new THREE.Vector3(
      posAttr.getX(i),
      posAttr.getY(i),
      posAttr.getZ(i)
    );
    gsap.to(from, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1.2,
      delay: Math.random() * 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        posAttr.setXYZ(i, from.x, from.y, from.z);
        posAttr.needsUpdate = true;
      },
    });
  });

  return points;
}

// ======= リファクタ後の displayLyricInStars =======
function displayLyricInStars(text, startTime, reusedCenter = null) {
  // 1) テキストから有効なピクセル座標を取得
  const { coords, canvasSize } = sampleTextAlphaIndices(text, {
    canvasSize: 1024,
    xStep: 2,
    yStep: 1,
    threshold: 128,
    font: 'bold 48px "Noto Sans JP", Meiryo',
  });

  // 2) キャンバス座標 → ワールド座標へマッピング
  const worldPositions = mapToWorldPositions(coords, {
    canvasSize,
    scale: 120,
  });

  // 3) 星座に残す粒子インデックスをランダムに選出
  const total = worldPositions.length;
  const keepCount = Math.min(6, total); // 星座として残す数
  const keepIndices = [];
  while (keepIndices.length < keepCount) {
    const i = Math.floor(Math.random() * total);
    if (!keepIndices.includes(i)) keepIndices.push(i);
  }

  // 4) Points オブジェクト生成
  const points = createLyricPoints(worldPositions, {
    sizeRange: [0.1, 0.25],
    colorHueRange: [0, 1],
    keepIndices,
  });

  // カメラの前方・右方向・上方向ベクトルを取得
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  camera.getWorldDirection(forward); // 前方向
  right.crossVectors(forward, camera.up).normalize(); // 右方向
  up.copy(camera.up).normalize(); // 上方向

  // 中心点（カメラから前方50〜70の範囲で少し右寄り）
  const distance = 45 + Math.random() * 20; // 45〜65
  const rightBias = 10 + Math.random() * 20; // 右方向に10〜30のバイアス
  const upOffset = (Math.random() - 0.5) * 30; // 上下ランダム ±15
  const forwardOffset = (Math.random() - 0.5) * 20; // 前後にも少し散らす

  const baseCenter = camera.position
    .clone()
    .add(forward.clone().multiplyScalar(distance))
    .add(right.clone().multiplyScalar(rightBias))
    .add(up.clone().multiplyScalar(upOffset))
    .add(forward.clone().multiplyScalar(forwardOffset));

  const center = reusedCenter || baseCenter;
  points.position.copy(center);
  lyricsGroup.add(points);

  // アニメーション開始
  const mat = points.material;
  gsap.to(mat.uniforms.uTime, { value: 1, duration: 1.0, ease: 'power2.out' });

  gsap.to(mat.uniforms.uOpacity, {
    value: 1.0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      // フェードアウト時に散らす処理
      const posAttr = points.geometry.getAttribute('position');
      const scatterTargets = [];

      for (let i = 0; i < posAttr.count; i++) {
        const from = new THREE.Vector3().fromBufferAttribute(posAttr, i);

        if (keepIndices.includes(i)) {
          scatterTargets.push(null); // 星座用は固定
        } else {
          const dir = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          )
            .normalize()
            .multiplyScalar(2 + Math.random() * 4);

          scatterTargets.push(from.clone().add(dir));
        }
      }

      scatterTargets.forEach((target, i) => {
        if (!target) return;
        const current = new THREE.Vector3().fromBufferAttribute(posAttr, i);
        gsap.to(current, {
          x: target.x,
          y: target.y,
          z: target.z,
          delay: 8.0,
          duration: 2.0,
          ease: 'power2.out',
          onUpdate: () => {
            posAttr.setXYZ(i, current.x, current.y, current.z);
            posAttr.needsUpdate = true;
          },
        });
      });

      gsap.to(mat.uniforms.uOpacity, {
        value: 0.0,
        delay: 8.0,
        duration: 1.0,
        ease: 'power2.out',
        onComplete: () => {
          // 星座化
          createConstellation({ text, startTime, center, points, keepIndices });
        },
      });
    },
  });

  return { text, startTime, center, points };
}

/**
 * 歌詞の星を星座化して Scene に追加し、データを返す
 */
function createConstellation({ points, keepIndices, center, text, startTime }) {
  const posAttr = points.geometry.getAttribute('position');

  // center を基準にしたローカル拡散先を計算
  const localCenter = points.worldToLocal(center.clone()); // ←中心をローカルに変換
  const targetPositions = keepIndices.map(() => {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 13, // X方向 ±10
      (Math.random() - 0.5) * 13, // Y方向 ±10
      (Math.random() - 0.5) * 13 // Z方向 ±10
    );
    return localCenter.clone().add(offset);
  });

  const worldStars = [];

  // 各インデックスの頂点をアニメーション
  keepIndices.forEach((i, idx) => {
    const from = new THREE.Vector3(
      posAttr.getX(i),
      posAttr.getY(i),
      posAttr.getZ(i)
    );
    const to = targetPositions[idx];

    gsap.to(from, {
      x: to.x,
      y: to.y,
      z: to.z,
      duration: 2.0,
      ease: 'power2.out',
      onUpdate: () => {
        posAttr.setXYZ(i, from.x, from.y, from.z);
        posAttr.needsUpdate = true;
      },
      onComplete: () => {
        // 最後の1つが終わった後に線を引く
        if (idx === keepIndices.length - 1) {
          keepIndices.forEach((i) => {
            const local = new THREE.Vector3(
              posAttr.getX(i),
              posAttr.getY(i),
              posAttr.getZ(i)
            );
            worldStars.push(points.localToWorld(local.clone()));
          });

          const lines = createConstellationLines(worldStars, 0.7);
          scene.add(lines);

          const data = allLyricData.find(
            (d) => d.text === text && d.startTime === startTime
          );
          if (data) {
            data.keepIndices = keepIndices;
            data.constellationLines = lines;
          }
        }
      },
    });
  });
}

// 星座の線を生成
function createConstellationLines(positions, offset = 0.7) {
  const linePoints = [];

  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i];
    const b = positions[i + 1];

    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const start = a.clone().add(dir.clone().multiplyScalar(offset));
    const end = b.clone().add(dir.clone().multiplyScalar(-offset));

    linePoints.push(start, end);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const material = new THREE.LineBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.7,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.LineSegments(geometry, material);
}

// function highlightConstellation(data) {
//   if (!data || !data.points || !data.keepIndices) return;

//   const geo = data.points.geometry;
//   const aSize = geo.getAttribute('aSize');

//   data.points.layers.enable(1);

//   // アニメーション設定（拡大→縮小を繰り返す）
//   data.keepIndices.forEach((i) => {
//     const baseSize = aSize.getX(i);
//     const temp = { value: baseSize };

//     gsap.to(temp, {
//       value: baseSize * 1.5,
//       duration: 0.6,
//       yoyo: true,
//       repeat: 3,
//       ease: 'sine.inOut',
//       onUpdate: () => {
//         aSize.setX(i, temp.value);
//         aSize.needsUpdate = true;
//       },
//     });
//   });

//   // 線も明滅させる（線オブジェクトが存在する場合）
//   if (data.constellationLines) {
//     const lineMat = data.constellationLines.material;
//     gsap.fromTo(
//       lineMat,
//       {
//         opacity: 1.0,
//       },
//       {
//         opacity: 0.0,
//         duration: 0.6,
//         yoyo: true,
//         repeat: 3,
//         ease: 'sine.inOut',
//         onComplete: () => {
//           lineMat.opacity = 1.0;
//           data.points.layers.disable(1);
//         },
//       }
//     );
//   }
// }

const persistentStarsGroup = new THREE.Group();
scene.add(persistentStarsGroup);

function spawnExplosionStars(center, count = 25) {
  console.log('💥 spawnExplosionStars called at', center);
  const positions = [];
  const targets = [];
  const colors = [];
  const sizes = [];

  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const spread = 30;
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

    sizes.push(0.4 + Math.random() * 0.6);
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
        float flick = 0.1 + 0.3 * sin(uFlicker + aSize * 5.0);
        float pointSize = aSize * (300.0 / abs(mvPosition.z)) * flick;
        gl_PointSize = floor(pointSize) + 0.5;
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
  points.renderOrder = 888;
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
  // フェードアウトせず永続的に残す（必要に応じて opacity も調整可能）
}

// astro.pngを多く配置し、星雲が出る確率を上げておく。
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
// 基本星雲を生成するが、イラストなどもランダムで表示する。
function spawnNebulaAt(center, count) {
  if (nebulaTextures.length === 0) {
    console.warn('🌌 nebula textures not yet loaded');
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
    plane.renderOrder = 777;
    plane.frustumCulled = false;
    const spread = 30;
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
    plane.position.copy(center).add(offset);

    const size = 8 + Math.random() * 6;
    plane.scale.set(size, size, 1);
    plane.userData.lookAtCamera = true;

    persistentStarsGroup.add(plane);

    gsap.to(material, {
      opacity: 0.1 + Math.random() * 0.3,
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

function startShootingStars() {
  setInterval(() => {
    //if (phase === 'exploringStars') {
    const count = Math.random() < 0.3 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      spawnShootingStar();
    }
    //}
  }, 2000 + Math.random() * 10000);
}

function spawnShootingStar() {
  const particleCount = 40;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const sizes = [];
  const colors = [];

  const distance = 30;
  const spreadX = 20;
  const spreadY = 10;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const basePosition = new THREE.Vector3()
    .copy(camera.position)
    .add(direction.multiplyScalar(distance));

  const offsetX = (Math.random() - 0.5) * spreadX * 2;
  const offsetY = (Math.random() - 0.5) * spreadY * 2;
  const offsetZ = (Math.random() - 0.5) * 0.3;

  const start = new THREE.Vector3(
    basePosition.x + offsetX,
    basePosition.y + offsetY,
    basePosition.z + offsetZ
  );
  const end = start
    .clone()
    .add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 20.0,
        Math.random() * -4.0,
        Math.random() * -2.0
      )
    );

  const colorStart = new THREE.Color(0xffffff);
  const colorEnd = new THREE.Color(0xbbeeff);

  for (let i = 0; i < particleCount; i++) {
    const ratio = i / (particleCount - 1);
    const point = start.clone().lerp(end, ratio);
    positions.push(point.x, point.y, point.z);

    sizes.push(0.1 + ratio * 0.3); // * x.xで拡大サイズ

    const color = colorStart.clone().lerp(colorEnd, ratio);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));

  const vertexShader = `
  precision mediump float;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z); // 視距離に応じて調整
    gl_Position = projectionMatrix * mvPosition;
  }
`;

  const fragmentShader = `
  precision mediump float;
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard; // 丸い粒に
    gl_FragColor = vec4(vColor, uOpacity);
  }
`;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1.0 },
    },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  createAfterglowParticles(end);

  gsap.to(material.uniforms.uOpacity, {
    value: 0,
    duration: 1.2,
    ease: 'power1.out',
    onComplete: () => {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  });
}

function createAfterglowParticles(position) {
  const particleCount = 40;
  const positions = [];

  for (let i = 0; i < particleCount; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    const pos = position.clone().add(offset);
    positions.push(pos.x, pos.y, pos.z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    color: 0x88ccff,
    size: 0.07,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // フェードアウト＆削除
  gsap.to(material, {
    opacity: 0,
    duration: 2.0,
    ease: 'power1.out',
    onComplete: () => {
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
    },
  });
}

// 再利用用ベクトルを関数外で定義
// const tempBox = new THREE.Box3();
const tempVec1 = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
const direction = new THREE.Vector3();
const right = new THREE.Vector3();
const offset = new THREE.Vector3(0, -1.6, 0);
const moveVector = new THREE.Vector3();

const moveSpeed = 0.05;
const keysPressed = {};
const collidableObjects = []; // 衝突判定対象オブジェクト
const collidableBoxes = []; // ↑から生成されたBox3
const collisionCenter = new THREE.Vector3(0, 0, 5);
const collisionRadius = 4;

// 衝突ボックス初期化関数（モデルロード後などに呼ぶ）
function initCollisionBoxes() {
  collidableBoxes.length = 0;
  for (const obj of collidableObjects) {
    if (!obj) continue;
    const box = new THREE.Box3().setFromObject(obj);
    collidableBoxes.push(box);
  }
}

window.addEventListener('keydown', (e) => (keysPressed[e.key] = true));
window.addEventListener('keyup', (e) => (keysPressed[e.key] = false));

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

const raycaster = new THREE.Raycaster();

window.addEventListener('mousemove', onMouseMove);

let micClicked = false;
let telescopeClickable = false;
let telescopeClicked = false;
let lyricsDisplayEnabled = false;
document.addEventListener('DOMContentLoaded', () => {
  const safePlayer = new SafeTextAlivePlayer({
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

  // 各オブジェクトへのクリック判定
  window.addEventListener('click', (event) => {
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
        console.log('マイクがクリックされました');
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
        // デバッグ
        if (!safePlayer.player.video || !telescopeClickable) return;
        console.log('望遠鏡がクリックされました');
        startTelescopeTransition();
      } else if (
        phase === 'init' &&
        amp &&
        isDescendantOf(clickedObject, amp)
      ) {
        console.log('アンプがクリックされました');
        //safePlayer.loadSong(trackList[2]); // デバッグ用仮呼び出し
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

    // 📸 カメラのズーム（位置）
    gsap.to(camera.position, {
      x: telescopePosition.x,
      y: telescopePosition.y + 1.2,
      z: telescopePosition.z + 0.6,
      duration: 2,
      ease: 'power2.inOut',
    });

    // 📸 カメラの向き（Quaternion補間）
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
            await safePlayer._sleep(1500); // 再生まで少し待つ
            safePlayer.restartCurrentSong();
            lyricsDisplayEnabled = true;
          });
        },
      }
    );
  }

  safePlayer.on('appready', () => {
    console.log('✅ アプリ準備完了');
  });

  safePlayer.on('videoready', () => {
    console.log('✅ ビデオ準備完了');
  });

  safePlayer.on('play', () => {
    const song = safePlayer.getCurrentSong();
    if (song) {
      console.log(`▶️ 再生中: ${song.name} by ${song.artist?.name ?? '不明'}`);
    }
  });

  safePlayer.on('pause', () => {
    console.warn('🛑 safePause 呼び出し（スタックトレース）');
    console.trace();
    console.log('pause');
  });

  safePlayer.on('stop', () => {
    console.log('stop');
    // if (safePlayer.loopOnEnd) {
    //   // 次ループに備えてすべての data.returned を false に
    //   allLyricData.forEach(({ data }) => {
    //     data.returned = false;
    //   });
    //   //safePlayer.loopOnEnd = false;
    // }
  });

  const trackList = [
    {
      title: 'ストリートライト',
      artist: '加賀(ネギシャワーP)',
      url: 'https://piapro.jp/t/ULcJ/20250205120202',
      image: './Model/cover.png',
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
      image: './Model/cover.png',
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
      image: './Model/cover.png',
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
      image: './Model/cover.png',
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
      image: './Model/cover.png',
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
      image: './Model/cover.png',
      beatId: 4694280,
      chordId: 2830735,
      repetitiveSegmentId: 2946483,
      lyricId: 67815,
      lyricDiffId: 20659,
    },
  ];
});

const mouse = new THREE.Vector2();

function onMouseMove(event) {
  // マウス座標を正規化
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
/* --------------------------
  アニメーションループ
--------------------------*/

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materialsCache = new Map();

function darkenNonBloomed(obj) {
  if (obj.isMesh || obj.isPoints || obj.isLine) {
    if (!bloomLayer.test(obj.layers)) {
      materialsCache.set(obj, obj.material);
      obj.material = darkMaterial;
    }
  }
}

function restoreMaterials(obj) {
  if (materialsCache.has(obj)) {
    obj.material = materialsCache.get(obj);
    materialsCache.delete(obj);
  }
}

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
    const intersects = raycaster.intersectObjects(raycastTargets, true); // mic は glb モデルのルートオブジェクト
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
  }

  const starSphere = scene.getObjectByName('starSphere');
  if (starSphere) {
    starSphere.rotation.y += 0.00002;
  }

  if (hologramObject.visible) {
    hologramObject.lookAt(camera.position);
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

  // === [1] 通常描画前に bloom レイヤーだけを描画 ===
  // scene.traverse(darkenNonBloomed);
  // camera.layers.set(1); // bloomLayer のみ描画
  // bloomComposer.render(); // UnrealBloomPass 用
  // scene.traverse(restoreMaterials);

  // === [2] 通常描画 ===
  // camera.layers.set(0); // 通常レイヤー
  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth(); // 深度バッファをクリア
  renderer.render(hudScene, hudCamera);
  cssRenderer.render(scene, camera);
}
animate();
startShootingStars();

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
  エラー対応
--------------------------*/
window.onerror = function (message, source, lineno, colno, error) {
  console.error('🌍 グローバルエラーキャッチ:', {
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
