// ==============================
// Imports and Global Variables
// ==============================
import * as THREE from '/threejs/three.js';
import { OrbitControls } from '/threejs/orbitcontrols.js';
import { FontLoader } from '/threejs/fontloader.js';
import { TextGeometry } from '/threejs/textgeometry.js';


window.addEventListener("keydown", function (e) {
    const keysToPrevent = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]; // space is optional

    if (keysToPrevent.includes(e.key) && document.getElementById('webgl4') && document.getElementById('webgl4').style.display !== 'none') {
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
        canvas: document.getElementById('webgl4')
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
        top: new THREE.Mesh(new THREE.BoxGeometry(8, 1, 1), neonMaterial),
        bottom: new THREE.Mesh(new THREE.BoxGeometry(8, 1, 1), neonMaterial),
        right: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 8), neonMaterial),
        left: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 8), neonMaterial)
        // You can add more borders if needed...
    };
    bordPieces.top.position.set(0, 0.5, -4.5);
    bordPieces.top.name = "topBorder";
    bordPieces.bottom.position.set(0, 0.5, 6.5);
    bordPieces.bottom.name = "bottomBorder";
    bordPieces.left.position.set(-5.5, 0.5, 1);
    bordPieces.left.name = "leftBorder";
    bordPieces.right.position.set(5.5, 0.5, 1);
    bordPieces.right.name = "rightBorder";
    // arena.add(bordPieces.top, bordPieces.bottom, bordPieces.left, bordPieces.right);
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
    topPaddle.position.set(0, 0.1, -4.25);
    topPaddle.rotation.y = Math.PI / 2;
    scene.add(topPaddle);

    const bottomPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    bottomPaddle.position.set(0, 0.1, 7.25);
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
    const scoreText = `Lives:\nL${lives.left} R${lives.right} T${lives.top} B${lives.bottom}`;
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
        scoreMesh.position.set(-3.5, 5, 0);
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
const topPadMove = { up: false, left: false, down: false, right: false };
const bottomPadMove = { up: false, left: false, down: false, right: false };

function handleKeyDown(event) {
    switch (event.key) {
        // Left paddle controls
        case 'w': leftPadMove.up = true; break;
        case 's': leftPadMove.down = true; break;
        // Top paddle controls (arrow keys)
        case 'g': topPadMove.left = true; break;
        case 'h': topPadMove.right = true; break;
        // Bottom paddle controls (arrow keys)
        case 'k': bottomPadMove.left = true; break;
        case 'l': bottomPadMove.right = true; break;
        // Right paddle controls (arrow keys)
        case 'ArrowDown': rightPadMove.down = true; break;
        case 'ArrowUp': rightPadMove.up = true; break;
    }
}

function handleKeyUp(event) {
    switch (event.key) {
        // Left paddle controls
        case 'w': leftPadMove.up = false; break;
        case 's': leftPadMove.down = false; break;
        // Top paddle controls (arrow keys)
        case 'g': topPadMove.left = false; break;
        case 'h': topPadMove.right = false; break;
        // Bottom paddle controls (arrow keys)
        case 'k': bottomPadMove.left = false; break;
        case 'l': bottomPadMove.right = false; break;
        // Right paddle controls (arrow keys)
        case 'ArrowDown': rightPadMove.down = false; break;
        case 'ArrowUp': rightPadMove.up = false; break;
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


// let xmin = -5
// let xmax = 5
// let zmax = 6
// let zmin = -4


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
    if (!scene.children.includes(leftPaddle) && hasLife("left")) { scene.add(leftPaddle); console.log('adding left') }
    rightPaddle.position.set(5.25, 0.1, 1);
    if (!scene.children.includes(rightPaddle) && hasLife("right")) { scene.add(rightPaddle); }
    bottomPaddle.position.set(0, 0.1, 6.25);
    if (!scene.children.includes(bottomPaddle) && hasLife("bottom")) { scene.add(bottomPaddle); }
    topPaddle.position.set(0, 0.1, -4.25);
    if (!scene.children.includes(topPaddle) && hasLife("top")) { scene.add(topPaddle); }
}

/**
 * Checks collision between the ball and a paddle.
 * Returns true if a collision is detected and adjusts the ball's angle.
 */
function checkCollisionBallRaquette(futureX, futureZ) {

    const circleRay = 0.35;
    const xmax = 5 - circleRay;
    const xmin = -5 + circleRay;
    const zmax = 6 - circleRay;
    const zmin = -4 + circleRay;

    if (checkCollision(-5, 5, -4, 6, futureX - 0.35, futureZ + 0.35) ||
        checkCollision(5, -3, 4, -4, futureX + 0.35, futureZ - 0.35)) { return 3; }
    else if (checkCollision(-4, -4, -5, -3, futureX - 0.35, futureZ - 0.35) ||
        checkCollision(4, 6, 5, 5, futureX + 0.35, futureZ + 0.35)) { return 4; }
    else if (futureX < xmin) {
        if (!hasLife("left") || (hasLife("left") && leftPaddle.position.z + 0.6 >= futureZ - 0.35 && leftPaddle.position.z - 0.6 <= futureZ + 0.35)) { return 5; }
        else {
            removeLife("left");
            return 1;
        }
    }
    else if (futureX > xmax) {
        if (!hasLife("right") || (hasLife("right") && rightPaddle.position.z + 0.6 >= futureZ - 0.35 && rightPaddle.position.z - 0.6 <= futureZ + 0.35)) { return 5; }
        else {
            // StopBall = true
            removeLife("right");
            return 1;
        }
    }
    else if (futureZ > zmax) {
        if (!hasLife("bottom") || (hasLife("bottom") && bottomPaddle.position.x + 0.6 >= futureX - 0.35 && bottomPaddle.position.x - 0.6 <= futureX + 0.35)) { return 2; }
        else {
            removeLife("bottom");
            return 1;
        }
    }
    else if (futureZ < zmin) {
        if (!hasLife("top") || (hasLife("top") && topPaddle.position.x + 0.6 >= futureX - 0.35 && topPaddle.position.x - 0.6 <= futureX + 0.35)) { return 2; }
        else {
            removeLife("top");
            return 1;
        }
    }
    else { return 0; }

}

// let StopBall = false;
function moveTheBall(isTournament) {
    // Launch ball if uninitialized
    if (ball.angle === -10) {
        ball.angle = getRandomValidAngle();
    }
    // if (StopBall) { return; }
    const futureX = ball.mesh.position.x + ball.speed * Math.sin(ball.angle);
    const futureZ = ball.mesh.position.z + ball.speed * Math.cos(ball.angle);

    const collision = checkCollisionBallRaquette(futureX, futureZ);
    switch (collision) {
        case 0:
            ball.mesh.position.x = futureX;
            ball.mesh.position.z = futureZ;
            break; //no hit
        case 1:
            if (checkLives()) {
                onGameOver4(isTournament);
            }
            updateScoreDisplay();
            repositionPaddles();
            countDownStarted = false;
            countDownDone = false;
            // Reset the ball
            ball.angle = -10;
            ball.mesh.position.set(0, 0.05, 0);
            ball.speed = 0.1;
            break; //ball went through
        case 2:
            ball.angle += (Math.PI * 1.5 - ball.angle) * 2;
            break; //hit top/bottom wall or paddle
        case 5:
            ball.angle += (Math.PI * 2 - ball.angle) * 2;
            break;
        case 4:
            ball.angle += (Math.PI * 1.75 - ball.angle) * 2;
            ball.speed += 0.025;
            break; //hit coin haut gauche || bas droite
        case 3:
            ball.angle += (Math.PI * 1.25 - ball.angle) * 2;
            ball.speed += 0.025;
            break; //hit other coin bas gauche || haut droite
    }
}

const padSpeed = 0.08;
function moveThePad() {
    // ----- Left Paddle Movement
    if (leftPadMove.up && leftPaddle.position.z > -2.5) {
        leftPaddle.position.z = Math.max(leftPaddle.position.z - padSpeed, -2.42);
    }
    if (leftPadMove.down && leftPaddle.position.z < 4.5) {
        leftPaddle.position.z = Math.min(leftPaddle.position.z + padSpeed, 4.42);
    }

    // ----- Top Paddle Movement
    if (topPadMove.left && topPaddle.position.x > -3.5) {
        topPaddle.position.x = Math.max(topPaddle.position.x - padSpeed, -3.42);
    }
    if (topPadMove.right && topPaddle.position.x < 3.5) {
        topPaddle.position.x = Math.min(topPaddle.position.x + padSpeed, 3.42);
    }
    // ----- Bottom Paddle Movement
    if (bottomPadMove.left && bottomPaddle.position.x > -3.5) {
        bottomPaddle.position.x = Math.max(bottomPaddle.position.x - padSpeed, -3.42);
    }
    if (bottomPadMove.right && bottomPaddle.position.x < 3.5) {
        bottomPaddle.position.x = Math.min(bottomPaddle.position.x + padSpeed, 3.42);
    }

    // ----- Right Paddle Movement
    if (rightPadMove.down &&
        rightPaddle.position.z < 4.5) {
        rightPaddle.position.z = Math.min(rightPaddle.position.z + padSpeed, 4.42);
    }
    if (rightPadMove.up &&
        rightPaddle.position.z > -2.5) {
        rightPaddle.position.z = Math.max(rightPaddle.position.z - padSpeed, -2.42);
    }
}

// ==============================
// Main Animation Loop and Game State Functions
// ==============================
let maxLife = 3;
let lives = {
    top: maxLife,
    bottom: maxLife,
    left: maxLife,
    right: maxLife
}

function hasLife(which) {
    return lives[which] > 0;
}

function removeLife(which) {
    if (hasLife(which)) {
        lives[which]--;
    }
}

function resetLives() {
    lives.top = maxLife;
    lives.bottom = maxLife;
    lives.left = maxLife;
    lives.right = maxLife;
}

function checkLives() {
    let alive = 4;
    if (lives.bottom <= 0) {
        alive--;
        showBorders("bottom");
    }
    if (lives.top <= 0) {
        alive--;
        showBorders("top");
    }
    if (lives.left <= 0) {
        alive--;
        showBorders("left");
    }
    if (lives.right <= 0) {
        alive--;
        showBorders("right");
    }
    return alive <= 1;
}

function showBorders(which) {
    if (!scene.children.includes(bordPieces[which])) {
        scene.add(bordPieces[which]);
        hidePaddle(which);
    }
}

function hidePaddle(which) {
    switch (which) {
        case "left": scene.remove(leftPaddle); break;
        case "right": scene.remove(rightPaddle); break;
        case "top": scene.remove(topPaddle); break;
        case "bottom": scene.remove(bottomPaddle); break;
    }
}

function removeBorders() {
    if (scene.children.includes(bordPieces.top)) {
        scene.remove(bordPieces.top);
    }
    if (scene.children.includes(bordPieces.bottom)) {
        scene.remove(bordPieces.bottom);
    }
    if (scene.children.includes(bordPieces.left)) {
        scene.remove(bordPieces.left);
    }
    if (scene.children.includes(bordPieces.right)) {
        scene.remove(bordPieces.right);
    }
}



function resizeCanvas(render, camera) {
    if (!render || !camera) { return; }
    render.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();
}
let countDownStarted = false;
let countDownDone = false;
let countDownCount = 1

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
    resizeCanvas(rendererInstance, cameraInstance);
    cameraInstance.lookAt(arena.position)
    controlsInstance.update();
    rendererInstance.render(scene, cameraInstance);
}

let gameWinner;
// Public API (functions called by your SPA)
export function startGame4(isTournament) {
    gameWinner = null;
    // Reset score and game state if needed
    console.log("resetting game state")
    resetGameState4();
    // Ensure canvas is visible (if hidden by your SPA)
    document.getElementById('webgl4').style.display = 'block';

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

export function stopGame4() {
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
    resetGameState4();
}
export function resetGameState4() {
    // Reset score and positions to initial values
    scoreData = { left: 0, right: 0 };
    updateScoreDisplay();
    ball.angle = -10;
    ball.mesh.position.set(0, ball.mesh.position.y, 0);
    resetLives();
    repositionPaddles();
    removeBorders();
    if (cameraInstance) {
        resetCamera(cameraInstance);
    }
}

function getWinner() {
    if (hasLife("left")) { return ("Left") }
    if (hasLife("right")) { return ("Right") }
    if (hasLife("top")) { return ("Top") }
    if (hasLife("bottom")) { return ("Bottom") }
}

function onGameOver4(isTournament) {
    // Called when maxScore is reached.
    winner = getWinner();
    if (isTournament) {
        gameWinner = winner === 'Left' ? "left" : "right";
    }
    stopGame4();
    document.getElementById('webgl4').style.display = 'none';
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
            startGame4();
        });
        document.getElementById('content').appendChild(newGameBtn);
    }
}
