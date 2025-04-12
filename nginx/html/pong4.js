// Refactoring complet du jeu Pong pour 4 joueurs avec arène carrée, vies, et conditions de victoire

// === IMPORTS ===
import * as THREE from './threejs/three.js';
import { OrbitControls } from './threejs/orbitcontrols.js';
import { FontLoader } from './threejs/fontloader.js';
import { TextGeometry } from './threejs/textgeometry.js';

// === VARIABLES GLOBALES ===
let scene, camera, renderer, controls;
let paddles = {}; // { left, right, top, bottom }
let lives = { left: 3, right: 3, top: 3, bottom: 3 };
let lifeBalls = {};
let ball;
let font;
let arena;
let animationId;
let isGameRunning = false;

const paddleSpeed = 0.08;
const ballSpeed = 0.12;
const maxLives = 3;

// === SETUP INITIAL ===
init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('webgl') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    setupArena();
    setupPaddles();
    setupBall();
    loadFont();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// === ARÈNE CARRÉE ===
function setupArena() {
    arena = new THREE.Group();
    const material = new THREE.MeshNormalMaterial();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 10), material);
    floor.position.y = -0.05;
    arena.add(floor);
    scene.add(arena);
}

// === PADDLES ===
function setupPaddles() {
    const paddleGeo = new THREE.BoxGeometry(0.5, 0.3, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });

    paddles.left = new THREE.Mesh(paddleGeo, material);
    paddles.left.position.set(-4.75, 0.15, 0);
    scene.add(paddles.left);

    paddles.right = new THREE.Mesh(paddleGeo, material);
    paddles.right.position.set(4.75, 0.15, 0);
    scene.add(paddles.right);

    paddles.top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.5), material);
    paddles.top.position.set(0, 0.15, -4.75);
    scene.add(paddles.top);

    paddles.bottom = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.5), material);
    paddles.bottom.position.set(0, 0.15, 4.75);
    scene.add(paddles.bottom);

    setupLifeBalls();
}

// === VIES ===
function setupLifeBalls() {
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });

    Object.keys(paddles).forEach(side => {
        lifeBalls[side] = [];
        for (let i = 0; i < maxLives; i++) {
            const ball = new THREE.Mesh(geometry, material);
            const paddle = paddles[side];
            ball.position.y = 1;
            if (side === 'left' || side === 'right') {
                ball.position.x = paddle.position.x;
                ball.position.z = paddle.position.z + (i - 1) * 0.5;
            } else {
                ball.position.z = paddle.position.z;
                ball.position.x = paddle.position.x + (i - 1) * 0.5;
            }
            scene.add(ball);
            lifeBalls[side].push(ball);
        }
    });
}

function loseLife(side) {
    lives[side]--;
    const removed = lifeBalls[side].pop();
    if (removed) {
        scene.remove(removed);
    }
    if (lives[side] <= 0) {
        const paddle = paddles[side];
        scene.remove(paddle);
        const wall = new THREE.Mesh(
            side === 'top' || side === 'bottom'
                ? new THREE.BoxGeometry(10, 1, 0.5)
                : new THREE.BoxGeometry(0.5, 1, 10),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        wall.position.copy(paddle.position);
        wall.position.y = 0.5;
        scene.add(wall);
    }
    checkWinner();
}

function checkWinner() {
    const alive = Object.keys(lives).filter(k => lives[k] > 0);
    if (alive.length === 1) {
        alert(`Winner: ${alive[0].toUpperCase()} Player!`);
        stopGame();
    }
}

// === BALLE ===
function setupBall() {
    const geometry = new THREE.SphereGeometry(0.25, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.25, 0);
    scene.add(mesh);
    const angle = Math.random() * Math.PI * 2;
    ball = { mesh, vx: ballSpeed * Math.cos(angle), vz: ballSpeed * Math.sin(angle) };
}

function resetBall() {
    ball.mesh.position.set(0, 0.25, 0);
    const angle = Math.random() * Math.PI * 2;
    ball.vx = ballSpeed * Math.cos(angle);
    ball.vz = ballSpeed * Math.sin(angle);
}

// === INPUTS ===
const keys = {};
function handleKeyDown(e) { keys[e.key] = true; }
function handleKeyUp(e) { keys[e.key] = false; }

function movePaddles() {
    if (lives.left > 0) {
        if (keys['w']) paddles.left.position.z -= paddleSpeed;
        if (keys['s']) paddles.left.position.z += paddleSpeed;
    }
    if (lives.right > 0) {
        if (keys['ArrowUp']) paddles.right.position.z -= paddleSpeed;
        if (keys['ArrowDown']) paddles.right.position.z += paddleSpeed;
    }
    if (lives.top > 0) {
        if (keys['i']) paddles.top.position.x -= paddleSpeed;
        if (keys['k']) paddles.top.position.x += paddleSpeed;
    }
    if (lives.bottom > 0) {
        if (keys['4']) paddles.bottom.position.x -= paddleSpeed;
        if (keys['6']) paddles.bottom.position.x += paddleSpeed;
    }
}

// === FONTS ===
function loadFont() {
    const loader = new FontLoader();
    loader.load('helvetiker_regular.typeface.json', f => font = f);
}

// === MOUVEMENT BALLE + COLLISIONS ===
function updateBall() {
    ball.mesh.position.x += ball.vx;
    ball.mesh.position.z += ball.vz;

    // collisions paddles
    Object.entries(paddles).forEach(([side, paddle]) => {
        if (lives[side] <= 0) return;
        const b = ball.mesh.position;
        const p = paddle.position;
        const hitX = Math.abs(b.x - p.x) < 1;
        const hitZ = Math.abs(b.z - p.z) < 1;
        if (side === 'left' || side === 'right') {
            if (hitX && hitZ) ball.vx *= -1;
        } else {
            if (hitX && hitZ) ball.vz *= -1;
        }
    });

    // bords perdants
    if (ball.mesh.position.x < -5) loseLife('left'), resetBall();
    if (ball.mesh.position.x > 5) loseLife('right'), resetBall();
    if (ball.mesh.position.z < -5) loseLife('top'), resetBall();
    if (ball.mesh.position.z > 5) loseLife('bottom'), resetBall();
}

// === BOUCLE PRINCIPALE ===
function animate() {
    animationId = requestAnimationFrame(animate);
    if (!isGameRunning) return;
    movePaddles();
    updateBall();
    controls.update();
    renderer.render(scene, camera);
}

function startGame() {
    isGameRunning = true;
}

function stopGame() {
    isGameRunning = false;
    cancelAnimationFrame(animationId);
}
startGame();