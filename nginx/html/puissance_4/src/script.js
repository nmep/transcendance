import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';




let grille = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0]
];
let turn = 1;
let doneMoving = true
let winner = 0



// Initialisation de la scène
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x0ab3c1);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 6, 12);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxDistance = 20;
controls.minDistance = 7;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = -Math.PI / 2.5;
controls.maxAzimuthAngle = Math.PI / 2.5;
controls.update();

// Création de la grille perforée
const rows = 6;
const cols = 7;
const gridGroup = new THREE.Group();
const gridMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, side: THREE.DoubleSide });

// Définir la forme extérieure de la grille
const shape = new THREE.Shape();
shape.moveTo(-cols / 2 - 0.1, -rows / 2 - 0.1);
shape.lineTo(cols / 2 + 0.1, -rows / 2 - 0.1);
shape.lineTo(cols / 2 + 0.1, rows / 2 + 0.1);
shape.lineTo(-cols / 2 - 0.1, rows / 2 + 0.1);
shape.lineTo(-cols / 2 - 0.1, -rows / 2 - 0.1);

// Création des trous
const holeRadius = 0.4;
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const hole = new THREE.Path();
        hole.absarc(j - cols / 2 + 0.5, -i + rows / 2 - 0.5, holeRadius, 0, Math.PI * 2, false);
        shape.holes.push(hole);
    }
}

const extrudeSettings = { depth: 0.2, bevelEnabled: false };
const gridGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
gridGroup.add(gridMesh);

// Création du fond perforé (identique à la face avant)
const backGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
const backMesh = new THREE.Mesh(backGeometry, gridMaterial);
backMesh.position.set(0, 0, -0.5);
gridGroup.add(backMesh);

// // Ajustement du plateau inférieur pour mieux retenir les jetons
const baseGeometry = new THREE.BoxGeometry(cols + 0.35, 0.2, 0.7);
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const base = new THREE.Mesh(baseGeometry, baseMaterial);
base.position.set(0, -rows / 2 - 0.1, -0.15);
gridGroup.add(base);

scene.add(gridGroup);

// // Ajout des parois latérales pour l'espace des jetons
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const sideWallGeometry = new THREE.BoxGeometry(0.2, rows + 0.2, 0.7);

const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWall.position.set(-cols / 2 - 0.075, 0, -0.15);
gridGroup.add(leftWall);

const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWall.position.set(cols / 2 + 0.075, 0, -0.15);
gridGroup.add(rightWall);

// Ajout des cadrillages au sein de la grille
const cadrillagesMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, side: THREE.DoubleSide});
const cadrillagesGeometry = new THREE.PlaneGeometry(0.3, rows + 0.2);

for (let i = 1; i < 7; i++)
{
    const cadWall = new THREE.Mesh(cadrillagesGeometry, cadrillagesMaterial);
    cadWall.position.set(-cols / 2 + i, 0, -0.15);
    cadWall.rotation.y = Math.PI / 2

    gridGroup.add(cadWall);
}

// Ajout d'un sol
const floorGeometry = new THREE.CircleGeometry(12,64,32)
// const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0,-3.7,-4)
scene.add(floor);

// Lumières
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 10);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);




for (let i = 0; i < 2; i++)
{
    const shapes = new THREE.Shape();
    shapes.moveTo(0, 0);
    shapes.lineTo(1, 0);
    shapes.lineTo(0, 1);
    shapes.lineTo(0, 0);
    
    const extrudeSettings = { depth: 0.5, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
    
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const triangle3D = new THREE.Mesh(geometry, material);
    triangle3D.rotation.z = Math.PI * 1.25
    triangle3D.rotation.y = Math.PI * 0.5
    if (i == 0)
        triangle3D.position.set(-cols / 2 - 0.075, -rows / 2, -0.15)
    else
        triangle3D.position.set(cols / 2 - 0.425, -rows / 2, -0.15)
    scene.add(triangle3D);
}




const validDestinations = [1, 2, 3, 4, 5, 6, 7, '1', '2', '3', '4', '5', '6', '7'];
document.addEventListener('keydown', (event) => {
    if (doneMoving == true && validDestinations.includes(event.key) && grille[0][Number(event.key) - 1] == 0)
        createToken(Number(event.key));
});

let tokenToUpdate = []

function createToken(param) {
    doneMoving = false
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32); // Rayon supérieur, rayon inférieur, hauteur
    let material = null
    if (turn == 1)
        material = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Couleur dorée pour le jeton
    else
        material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });

    const token = new THREE.Mesh(geometry, material)
    token.position.set(-cols / 2 + param - 0.5, 3.5, -0.15)
    token.rotation.x = Math.PI / 2
    scene.add(token)

    for (let i = 0; i < 6; i++)
    {
        if (grille[i][param - 1] != 0)
        {
            grille[i - 1][param - 1] = turn
            tokenToUpdate.push({
                token: token,
                destination: i - 1,
                arrived: false
            })
            i = 6;
        }
        if (i == 5)
        {
            grille[5][param - 1] = turn
            tokenToUpdate.push({
                token: token,
                destination: 5,
                arrived: false
            })
            i = 6;
        }
    }
    turn *= -1
}

function checkWinner() {
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (grille[row][col] != 0 && grille[row][col] == grille[row][col + 1] && grille[row][col] == grille[row][col + 2] && grille[row][col] == grille[row][col + 3]) {
                return grille[row][col];
            }
        }
    }
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 3; row++) {
            if (grille[row][col] != 0 && grille[row][col] == grille[row + 1][col] && grille[row][col] == grille[row + 2][col] && grille[row][col] == grille[row + 3][col]) {
                return grille[row][col];
            }
        }
    }
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (grille[row][col] != 0 && grille[row][col] == grille[row + 1][col + 1] && grille[row][col] == grille[row + 2][col + 2] && grille[row][col] == grille[row + 3][col + 3]) {
                return grille[row][col];
            }
        }
    }
    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (grille[row][col] != 0 && grille[row][col] == grille[row - 1][col + 1] && grille[row][col] == grille[row - 2][col + 2] && grille[row][col] == grille[row - 3][col + 3]) {
                return grille[row][col];
            }
        }
    }
    return 0;
}


let direction = -1; // 1 pour descendre, -1 pour monter
const speed = 0.13; // Vitesse du mouvement


function updateToken()
{
    for (const tok of tokenToUpdate)
    {
        if (tok.arrived == false)
        {
            tok.token.position.y += speed * direction;
            if (tok.token.position.y <= 2.5 - tok.destination)
            {
                tok.arrived = true
                doneMoving = true
                winner = checkWinner()
                if (winner != 0)// stop la partie gg message blabla...
                    doneMoving = false //temporaire on stop la partie todo
                    
            }
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);


    updateToken()
    

    controls.update();
    renderer.render(scene, camera);
}

animate();