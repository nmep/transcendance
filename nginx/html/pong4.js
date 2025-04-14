// ==============================
// Imports and Global Variables
// ==============================
import * as THREE from '/threejs/three.js';
import { OrbitControls } from '/threejs/orbitcontrols.js';
import { FontLoader } from '/threejs/fontloader.js';
import { TextGeometry } from '/threejs/textgeometry.js';


window.addEventListener("keydown", function (e) {
    const keysToPrevent = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]; // space is optional

    if (keysToPrevent.includes(e.key) && document.getElementById('webgl') && document.getElementById('webgl').style.display !== 'none') {
        e.preventDefault();
    }
}, false);

let isGameRunning = false;
let scoreData = { left: 0, right: 0 };
let scoreMesh = null;
let countDownMesh = null;
let font; // For 3D text; loaded asynchronously later
let winner;
let animationId; // for requestAnimationFrame later
let cameraInstance = null;
let rendererInstance = null;
let controlsInstance = null;
// ==============================
// eventListener on resize
// ==============================
// window.addEventListener('resize', () => {
//     // Update camera
//     if (cameraInstance) {
//         cameraInstance.aspect = window.innerWidth / window.innerHeight;
//         cameraInstance.updateProjectionMatrix();
//     }
//     // Update renderer
//     if (rendererInstance) {
//         rendererInstance.setSize(window.innerWidth, window.innerHeight);
//     }
// });

// ==============================
// Scene, Camera, Renderer, and Controls Setup
// ==============================
const scene = new THREE.Scene();

function buildCamera() {

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 6, 10);
    camera.lookAt(arena.position);
    camera.updateProjectionMatrix();
    return camera;
}

function resetCamera(camera) {
    camera.position.set(0, 6, 10);
    camera.lookAt(arena.position);
    camera.updateProjectionMatrix();
}

function buildRenderer() {
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById('webgl')
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
}
// Set up environment map (cube map for reflections/background)
function setupEnvironment() {
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const envMap = cubeTextureLoader.load('');
    scene.background = envMap;
    scene.environment = envMap;
    const light = new THREE.AmbientLight(0xffffff)
    scene.add(light);
}
setupEnvironment();

// Orbit Controls
function buildControls(renderer, camera) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxDistance = 15;
    controls.minDistance = 5;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.update();
    return controls;
}
// ==============================
// Arena Construction
// ==============================
let arena;
let bordPieces;

function buildArena() {
    arena = new THREE.Group();
    const neonMaterial = new THREE.MeshNormalMaterial();

    // ----- Floor Shapes and Extrusion Settings
    const floorExtrudeSettings = { depth: 0.001, bevelEnabled: false };

    // Right Floor Shape
    const rightFloorShape = new THREE.Shape();
    rightFloorShape.moveTo(0, 0);
    rightFloorShape.lineTo(3.5, 0);
    rightFloorShape.lineTo(4.5, 1);
    rightFloorShape.lineTo(4.5, 9);
    rightFloorShape.lineTo(3.5, 10);
    rightFloorShape.lineTo(0, 10);
    rightFloorShape.lineTo(0, 0);
    const rightFloor = new THREE.Mesh(
        new THREE.ExtrudeGeometry(rightFloorShape, floorExtrudeSettings),
        new THREE.MeshNormalMaterial()
    );
    rightFloor.rotation.x = Math.PI / 2;
    rightFloor.position.set(0.5, -1, -4);

    // Center Floor Shape
    const centerFloorShape = new THREE.Shape();
    centerFloorShape.moveTo(0, 0);
    centerFloorShape.lineTo(3, 0);
    centerFloorShape.lineTo(3, 10);
    centerFloorShape.lineTo(0, 10);
    centerFloorShape.lineTo(0, 0);
    const centerFloor = new THREE.Mesh(
        new THREE.ExtrudeGeometry(centerFloorShape, floorExtrudeSettings),
        new THREE.MeshNormalMaterial()
    );
    centerFloor.rotation.x = Math.PI / 2;
    centerFloor.position.set(-1.5, -1, -4);

    // Left Floor Shape
    const leftFloorShape = new THREE.Shape();
    leftFloorShape.moveTo(0, 0);
    leftFloorShape.lineTo(-3.5, 0);
    leftFloorShape.lineTo(-4.5, 1);
    leftFloorShape.lineTo(-4.5, 9);
    leftFloorShape.lineTo(-3.5, 10);
    leftFloorShape.lineTo(0, 10);
    leftFloorShape.lineTo(0, 0);
    const leftFloor = new THREE.Mesh(
        new THREE.ExtrudeGeometry(leftFloorShape, floorExtrudeSettings),
        new THREE.MeshNormalMaterial()
    );
    leftFloor.rotation.x = Math.PI / 2;
    leftFloor.position.set(-0.5, -1, -4);

    arena.add(rightFloor, centerFloor, leftFloor);

    // ----- Corner Pieces
    const cornerShape = new THREE.Shape();
    cornerShape.moveTo(0, 0);
    cornerShape.lineTo(1, 0);
    cornerShape.lineTo(2, 1);
    cornerShape.lineTo(2, 2);
    cornerShape.lineTo(0, 0);
    const extrudeSettings = { depth: 1, bevelEnabled: false };
    const cornerGeometry = new THREE.ExtrudeGeometry(cornerShape, extrudeSettings);
    const cornerMaterial = new THREE.MeshNormalMaterial();

    // Create four corner meshes and rotate/position them
    const corners = [
        new THREE.Mesh(cornerGeometry, cornerMaterial),
        new THREE.Mesh(cornerGeometry, cornerMaterial),
        new THREE.Mesh(cornerGeometry, cornerMaterial),
        new THREE.Mesh(cornerGeometry, cornerMaterial)
    ];
    corners.forEach(c => c.rotation.x = Math.PI / 2);
    corners[1].rotation.z = Math.PI * 0.5;
    corners[2].rotation.z = Math.PI;
    corners[3].rotation.z = Math.PI * 1.5;
    corners[0].position.set(-6, 0, 5);
    corners[1].position.set(-4, 0, -5);
    corners[2].position.set(6, 0, -3);
    corners[3].position.set(4, 0, 7);
    corners.forEach(c => arena.add(c));

    // ----- Border Pieces (Bord)
    bordPieces =
    {
        up: new THREE.Mesh(new THREE.BoxGeometry(8, 1, 1), neonMaterial),
        down: new THREE.Mesh(new THREE.BoxGeometry(8, 1, 1), neonMaterial),
        right: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 8), neonMaterial),
        left: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 8), neonMaterial)
        // You can add more borders if needed...
    };
    bordPieces.up.position.set(0, -0.5, -4.5);
    bordPieces.down.position.set(0, -0.5, 6.5);
    bordPieces.left.position.set(5.5, -0.5, 1);
    bordPieces.right.position.set(-5.5, -0.5, 1);
    // arena.add(bordPieces.up, bordPieces.down, bordPieces.left, bordPieces.right);
    arena.position.y += 1;
    scene.add(arena);
}
buildArena();
// arena.add(bordPieces.up)
// ==============================
// Game Elements: Paddles and Ball
// ==============================
function createGameElements() {
    // Paddles
    const paddleGeometry = new THREE.BoxGeometry(0.5, 0.2, 1.2);
    const paddleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff
    });

    const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    leftPaddle.position.set(-5.25, 0.1, 1);
    scene.add(leftPaddle);

    const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    rightPaddle.position.set(5.25, 0.1, 1);
    scene.add(rightPaddle);

    const topPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    topPaddle.position.set(0, 0.1, 6.25);
    topPaddle.rotation.y = Math.PI / 2;
    scene.add(topPaddle);

    const bottomPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    bottomPaddle.position.set(0, 0.1, -4.25);
    bottomPaddle.rotation.y = Math.PI / 2;
    scene.add(bottomPaddle);

    // Ball (Puck)
    const puckGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32);
    const puckMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00
    });
    const puck = new THREE.Mesh(puckGeometry, puckMaterial);
    puck.position.set(0, 0.05, 0);
    scene.add(puck);

    // Ball object with "angle" flag (-10 means uninitialized)
    const ball = {
        mesh: puck,
        speed: 0.1,
        angle: -10
    };

    return { leftPaddle, rightPaddle, topPaddle, bottomPaddle, ball };
}
const { leftPaddle, rightPaddle, topPaddle, bottomPaddle, ball } = createGameElements();

// ==============================
// 3D Score Display Setup
// ==============================
function initScoreDisplay() {
    const fontLoader = new FontLoader();
    fontLoader.load('helvetiker_regular.typeface.json', loadedFont => {
        font = loadedFont;
        updateScoreDisplay();
    });
}

function updateScoreDisplay() {
    const scoreText = `${scoreData.left}   -   ${scoreData.right}`;
    const textGeometry = new TextGeometry(scoreText, {
        font: font,
        size: 1,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 5
    });

    if (scoreMesh) {
        scoreMesh.geometry.dispose();
        scoreMesh.geometry = textGeometry;
    } else {
        const textMaterial = new THREE.MeshNormalMaterial();
        scoreMesh = new THREE.Mesh(textGeometry, textMaterial);
        scoreMesh.position.set(-2, 5, 0);
        scoreMesh.name = 'scoreDisplay';
        scene.add(scoreMesh);
    }
}
initScoreDisplay();

// ==============================
// Input Handling for Paddle Movement
// ==============================
const leftPadMove = { up: false, left: false, down: false, right: false };
const rightPadMove = { up: false, left: false, down: false, right: false };

function handleKeyDown(event) {
    switch (event.key) {
        // Left paddle controls
        case 'd': leftPadMove.up = true; break;
        case 'w': leftPadMove.left = true; break;
        case 'a': leftPadMove.down = true; break;
        case 's': leftPadMove.right = true; break;
        // Right paddle controls (arrow keys)
        case 'ArrowLeft': rightPadMove.up = true; break;
        case 'ArrowDown': rightPadMove.left = true; break;
        case 'ArrowRight': rightPadMove.down = true; break;
        case 'ArrowUp': rightPadMove.right = true; break;
    }
}

function handleKeyUp(event) {
    switch (event.key) {
        // Left paddle controls
        case 'd': leftPadMove.up = false; break;
        case 'w': leftPadMove.left = false; break;
        case 'a': leftPadMove.down = false; break;
        case 's': leftPadMove.right = false; break;
        // Right paddle controls (arrow keys)
        case 'ArrowLeft': rightPadMove.up = false; break;
        case 'ArrowDown': rightPadMove.left = false; break;
        case 'ArrowRight': rightPadMove.down = false; break;
        case 'ArrowUp': rightPadMove.right = false; break;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// ==============================
// Helper Functions for Ball and Collision Logic
// ==============================

/**
 * Returns a random angle (in radians) that avoids shallow directions.
 */
function getRandomValidAngle() {
    let angle = Math.random() * 2 * Math.PI;
    while (
        (angle >= Math.PI * 5 / 6 && angle <= Math.PI * 7 / 6) ||
        angle <= Math.PI / 6 ||
        angle >= Math.PI * 11 / 6
    ) {
        angle = Math.random() * 2 * Math.PI;
    }
    return angle;
}

/**
 * Checks if a point (x0, z0) lies on a given line segment (from (x1, z1) to (x2, z2)).
 * Returns true if the cross product is positive.
 */
function checkCollision(x1, z1, x2, z2, x0, z0) {
    const crossProduct = (x2 - x1) * (z0 - z1) - (z2 - z1) * (x0 - x1);
    return crossProduct >= 0;
}

/**
 * Returns an equivalent angle between 0 and 2PI.
 */
function simplifiedAngle(angle) {
    let result = angle;
    while (result >= 2 * Math.PI) result -= 2 * Math.PI;
    while (result < 0) result += 2 * Math.PI;
    return result;
}

/**
 * Checks collision between the ball and a paddle.
 * Returns true if a collision is detected and adjusts the ball's angle.
 */
function checkCollisionBallRaquette(cx, cz, rx, rz, mode, checkFromBall) {
    const leftBound = rx - 0.25 - 0.35;
    const rightBound = rx + 0.25 + 0.35;
    const backBound = rz - 0.6 - 0.35;
    const frontBound = rz + 0.6 + 0.35;

    let hitLeft = false,
        hitRight = false,
        hitBack = false,
        hitFront = false;

    if (cx >= leftBound && cx <= rightBound && cz >= backBound && cz <= frontBound) {
        if (mode === true) return true;

        if (cx >= leftBound && cx <= rx - 0.35 && cz >= backBound && cz <= frontBound) hitLeft = true;
        if (cx <= rightBound && cx >= rx + 0.35 && cz >= backBound && cz <= frontBound) hitRight = true;
        if (cx >= leftBound && cx <= rightBound && cz >= rz + 0.35 && cz <= frontBound) hitFront = true;
        if (cx >= leftBound && cx <= rightBound && cz >= backBound && cz <= rz - 0.35) hitBack = true;


        if ((hitLeft && simplifiedAngle(ball.angle) <= Math.PI) ||
            (hitRight && simplifiedAngle(ball.angle) >= Math.PI)) {
            ball.angle += (Math.PI * 2 - ball.angle) * 2;
        } else if (hitFront) {
            ball.angle = simplifiedAngle(ball.angle) <= Math.PI ? Math.PI * 0.25 : Math.PI * 1.75;
        } else if (hitBack) {
            ball.angle = simplifiedAngle(ball.angle) <= Math.PI ? Math.PI * 0.75 : Math.PI * 1.25;
        }
        return true;
    }
    return false;
}

// Maximum score to end the game
const maxScore = 10;

// ==============================
// Ball and Paddle Movement Functions
// ==============================

function startCountdown(time) {
    let currentTime = time;

    showCountDown(currentTime); // Initial display

    const interval = setInterval(() => {
        currentTime--;

        if (currentTime > 0) {
            showCountDown(currentTime);
        } else {
            clearInterval(interval);
            scene.remove(countDownMesh);
            countDownMesh.geometry.dispose();
            countDownMesh = null;
            countDownDone = true;
            return;
        }
    }, 500);
}

function showCountDown(time) {
    const toStart = time;
    const scoreText = `${toStart}`;
    const textGeometry = new TextGeometry(scoreText, {
        font: font,
        size: 3,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 5
    });

    if (countDownMesh) {
        countDownMesh.geometry.dispose();
        countDownMesh.geometry = textGeometry;
    } else {
        const textMaterial = new THREE.MeshNormalMaterial();
        countDownMesh = new THREE.Mesh(textGeometry, textMaterial);
        countDownMesh.position.set(-1, 3, 7);
        countDownMesh.name = 'countdown';
        scene.add(countDownMesh);
    }
}

function repositionPaddles() {

    leftPaddle.position.set(-5.25, 0.1, 1);
    rightPaddle.position.set(5.25, 0.1, 1);
    topPaddle.position.set(0, 0.1, 6.25);
    bottomPaddle.position.set(0, 0.1, -4.25);
}

function moveTheBall(isTournament) {
    // Launch ball if uninitialized
    if (ball.angle === -10) {
        ball.angle = getRandomValidAngle();
    }

    const futureX = ball.mesh.position.x + ball.speed * Math.sin(ball.angle);
    const futureZ = ball.mesh.position.z + ball.speed * Math.cos(ball.angle);

    // Check collisions with left paddle
    if (checkCollisionBallRaquette(futureX, futureZ, leftPaddle.position.x, leftPaddle.position.z, false, true)) {
        ball.mesh.position.x = futureX;
        ball.mesh.position.z = futureZ;
        return;
    }
    // Check collisions with right paddle
    else if (checkCollisionBallRaquette(futureX, futureZ, rightPaddle.position.x, rightPaddle.position.z, false, true)) {
        ball.mesh.position.x = futureX;
        ball.mesh.position.z = futureZ;
        return;
    }
    // Check collision with top and bottom boundaries
    if (checkCollision(5, -4, -5, -4, futureX, futureZ - 0.35) ||
        checkCollision(-5, 4, 5, 4, futureX, futureZ + 0.35)) {
        ball.angle += (Math.PI * 1.5 - ball.angle) * 2;
    }
    // Check goal conditions (ball passed left/right boundaries)
    else if (checkCollision(6, 3, 6, -3, futureX + 0.35, futureZ) ||
        checkCollision(-6, -3, -6, 3, futureX - 0.35, futureZ)) {
        // Update score based on boundary
        if (checkCollision(6, 3, 6, -3, futureX + 0.35, futureZ)) {
            scoreData.left++;
        }
        if (checkCollision(-6, -3, -6, 3, futureX - 0.35, futureZ)) {
            scoreData.right++;
        }
        if (scoreData.left >= maxScore || scoreData.right >= maxScore) {
            onGameOver(isTournament);
        }
        updateScoreDisplay();
        repositionPaddles();
        countDownStarted = false;
        countDownDone = false;
        // Reset the ball
        ball.angle = -10;
        ball.mesh.position.set(0, 0.05, 0);
        ball.speed = 0.1;
        return;
    }


    // Additional collision checks with borders; adjust angle and speed
    else if (checkCollision(-5, -4, -6, -3, futureX - 0.35, futureZ - 0.35) ||
        checkCollision(5, 4, 6, 3, futureX + 0.35, futureZ + 0.35)) {
        ball.angle += (Math.PI * 1.75 - ball.angle) * 2;
        ball.speed += 0.025;
    }
    else if (checkCollision(-6, 3, -5, 4, futureX - 0.35, futureZ + 0.35) ||
        checkCollision(6, -3, 5, -4, futureX + 0.35, futureZ - 0.35)) {
        ball.angle += (Math.PI * 1.25 - ball.angle) * 2;
        ball.speed += 0.025;
    }
    else {
        ball.mesh.position.x = futureX;
        ball.mesh.position.z = futureZ;
    }
}

const padSpeed = 0.08;
let alreadyChangeAngle = false;

function moveThePad() {
    alreadyChangeAngle = false;

    // ----- Left Paddle Movement
    if (leftPadMove.up &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            leftPaddle.position.x + padSpeed,
            leftPaddle.position.z,
            alreadyChangeAngle,
            false
        )) {
        leftPaddle.position.x = Math.min(leftPaddle.position.x + padSpeed, -1.75);
    }
    if (leftPadMove.left &&
        !checkCollision(
            -5, -4, -6, -3,
            leftPaddle.position.x - 0.25,
            leftPaddle.position.z - 0.6 - padSpeed
        ) &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            leftPaddle.position.x,
            leftPaddle.position.z - padSpeed,
            alreadyChangeAngle,
            false
        )) {
        leftPaddle.position.z = Math.max(leftPaddle.position.z - padSpeed, -3.4);
    }
    if (leftPadMove.down &&
        !checkCollision(
            -5, -4, -6, -3,
            leftPaddle.position.x - 0.25 - padSpeed,
            leftPaddle.position.z - 0.6
        ) &&
        !checkCollision(
            -6, 3, -5, 4,
            leftPaddle.position.x - 0.25 - padSpeed,
            leftPaddle.position.z + 0.6
        ) &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            leftPaddle.position.x - padSpeed,
            leftPaddle.position.z,
            alreadyChangeAngle,
            false
        )) {
        leftPaddle.position.x = Math.max(leftPaddle.position.x - padSpeed, -5.75);
    }
    if (leftPadMove.right &&
        !checkCollision(
            -6, 3, -5, 4,
            leftPaddle.position.x - 0.25,
            leftPaddle.position.z + 0.6 + padSpeed
        ) &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            leftPaddle.position.x,
            leftPaddle.position.z + padSpeed,
            alreadyChangeAngle,
            false
        )) {
        leftPaddle.position.z = Math.min(leftPaddle.position.z + padSpeed, 3.4);
    }

    // ----- Right Paddle Movement
    if (rightPadMove.up &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            rightPaddle.position.x - padSpeed,
            rightPaddle.position.z,
            alreadyChangeAngle,
            false
        )) {
        rightPaddle.position.x = Math.max(rightPaddle.position.x - padSpeed, 1.75);
    }
    if (rightPadMove.left &&
        !checkCollision(
            5, 4, 6, 3,
            rightPaddle.position.x + 0.25,
            rightPaddle.position.z + 0.6 + padSpeed
        ) &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            rightPaddle.position.x,
            rightPaddle.position.z + padSpeed,
            alreadyChangeAngle,
            false
        )) {
        rightPaddle.position.z = Math.min(rightPaddle.position.z + padSpeed, 3.4);
    }
    if (rightPadMove.down &&
        !checkCollision(
            6, -3, 5, -4,
            rightPaddle.position.x + 0.25 + padSpeed,
            rightPaddle.position.z - 0.6
        ) &&
        !checkCollision(
            5, 4, 6, 3,
            rightPaddle.position.x + 0.25 + padSpeed,
            rightPaddle.position.z + 0.6
        ) &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            rightPaddle.position.x + padSpeed,
            rightPaddle.position.z,
            alreadyChangeAngle,
            false
        )) {
        rightPaddle.position.x = Math.min(rightPaddle.position.x + padSpeed, 5.75);
    }
    if (rightPadMove.right &&
        !checkCollision(

            6, -3, 5, -4,
            rightPaddle.position.x + 0.25,
            rightPaddle.position.z - 0.6 - padSpeed
        ) &&
        !checkCollisionBallRaquette(
            ball.mesh.position.x,
            ball.mesh.position.z,
            rightPaddle.position.x,
            rightPaddle.position.z - padSpeed,
            alreadyChangeAngle,
            false
        )) {
        rightPaddle.position.z = Math.max(rightPaddle.position.z - padSpeed, -3.4);
    }
}

// ==============================
// Main Animation Loop and Game State Functions
// ==============================
function resizeCanvas(render, camera) {
    if (!render || !camera) { return; }
    render.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();
}
let countDownStarted = false;
let countDownDone = false;
let countDownCount = 5

function animate(isTournament) {
    if (!isGameRunning) return;
    animationId = requestAnimationFrame(() => { animate(isTournament) });
    // Move ball and paddles, update controls, render scene
    if (!countDownStarted) {
        startCountdown(countDownCount);
        countDownStarted = true
    }
    if (countDownDone) {
        moveTheBall(isTournament);
        moveThePad();
    }
    if (!rendererInstance) {
        rendererInstance = buildRenderer();
    }
    if (!cameraInstance) {
        cameraInstance = buildCamera();
    }
    if (!controlsInstance) {
        controlsInstance = buildControls(rendererInstance, cameraInstance);
    }
    console.log(leftPaddle.position, rightPaddle.position)
    resizeCanvas(rendererInstance, cameraInstance);
    cameraInstance.lookAt(arena.position)
    controlsInstance.update();
    rendererInstance.render(scene, cameraInstance);
}
let gameWinner;
// Public API (functions called by your SPA)
export function startGame(isTournament) {
    gameWinner = null;
    // Reset score and game state if needed
    resetGameState();
    // Ensure canvas is visible (if hidden by your SPA)
    document.getElementById('webgl').style.display = 'block';

    if (!isGameRunning) {
        isGameRunning = true;
        animate(isTournament);
    }
    setInterval(() => {
        if (gameWinner) {
            const winner = gameWinner; gameWinner = null;
            if (isTournament) {
                return winner;
            }
        }
    }, 500);
}

export function stopGame() {
    if (!isGameRunning) return;
    isGameRunning = false;
    cancelAnimationFrame(animationId);
    // Hide the canvas when leaving pong page
    // document.getElementById('webgl').style.display = 'none';
    if (rendererInstance) { rendererInstance.dispose(); }
    rendererInstance = null;
    if (controlsInstance) { controlsInstance.dispose(); }
    controlsInstance = null;
    // Optionally reset game to initial state
    resetGameState();
}
export function resetGameState() {
    // Reset score and positions to initial values
    scoreData = { left: 0, right: 0 };
    updateScoreDisplay();
    ball.angle = -10;
    ball.mesh.position.set(0, ball.mesh.position.y, 0);
    // Reset paddle positions
    // leftPaddle.position.set(-4, leftPaddle.position.y, 0);
    // rightPaddle.position.set(4, rightPaddle.position.y, 0);
    if (cameraInstance) {
        resetCamera(cameraInstance);
    }
}

export function onGameOver(isTournament) {
    // Called when maxScore is reached.
    winner = scoreData.left >= scoreData.right ? "Left" : "Right";
    if (isTournament) {
        gameWinner = winner === 'Left' ? "left" : "right";
    }
    stopGame();
    document.getElementById('webgl').style.display = 'none';
    // Display winner in your UI (create a DOM element or update a modal)
    if (!isTournament) {
        const winnerMessage = document.createElement('h1');
        winnerMessage.textContent = `Winner: ${winner} Player`;
        winnerMessage.style.textAlign = "center";
        winnerMessage.style.marginTop = "20px";
        document.getElementById('content').appendChild(winnerMessage);

        // Optionally add a "Newpad Game" button:
        const newGameBtn = document.createElement('button');
        newGameBtn.textContent = 'Start New Game';
        newGameBtn.className = 'btn btn-primary';
        newGameBtn.addEventListener('click', () => {
            // Remove winner announcement and new game button, then reset state and launch game
            winnerMessage.remove();
            newGameBtn.remove();
            startGame();
        });
        document.getElementById('content').appendChild(newGameBtn);
    }
}
