import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import {ft_ia} from './ia.js'

// Initialisation de la scène
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 6, 10);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxDistance = 15;
controls.minDistance = 5;
controls.maxPolarAngle = Math.PI / 2.5;
controls.update();








// Ajout des bordures néons avec coins arrondis
const neonMaterial = new THREE.MeshBasicMaterial({ color: 0x4C4C4C})

const arena = new THREE.Group()


const rightFloorShape = new THREE.Shape()
rightFloorShape.moveTo(0, 0)
rightFloorShape.lineTo(3.5, 0)
rightFloorShape.lineTo(4.5, 1)
rightFloorShape.lineTo(4.5, 7)
rightFloorShape.lineTo(3.5, 8)
rightFloorShape.lineTo(0, 8)
rightFloorShape.lineTo(0, 0)



const centerFloorShape = new THREE.Shape()
centerFloorShape.moveTo(0, 0)
centerFloorShape.lineTo(3, 0)
centerFloorShape.lineTo(3, 8)
centerFloorShape.lineTo(0, 8)
centerFloorShape.lineTo(0, 0)


const leftFloorShape = new THREE.Shape()
leftFloorShape.moveTo(0, 0)
leftFloorShape.lineTo(-3.5, 0)
leftFloorShape.lineTo(-4.5, 1)
leftFloorShape.lineTo(-4.5, 7)
leftFloorShape.lineTo(-3.5, 8)
leftFloorShape.lineTo(0, 8)
leftFloorShape.lineTo(0, 0)


const floorExtrudeSettings = {
    depth: 0.001,
    bevelEnabled: false
};

const rightFloorGeometry = new THREE.ExtrudeGeometry(rightFloorShape, floorExtrudeSettings)
const rightFloorMaterial = new THREE.MeshBasicMaterial({ color: 0xE60012 })
const rightFloor = new THREE.Mesh(rightFloorGeometry, rightFloorMaterial)

const centerFloorGeometry = new THREE.ExtrudeGeometry(centerFloorShape, floorExtrudeSettings)
const centerFloorMaterial = new THREE.MeshBasicMaterial({ color: 0x99a0a0 })
const centerFloor = new THREE.Mesh(centerFloorGeometry, centerFloorMaterial)

const leftFloorGeometry = new THREE.ExtrudeGeometry(leftFloorShape, floorExtrudeSettings)
const leftFloorMaterial = new THREE.MeshBasicMaterial({ color: 0x1D75BB })
const leftFloor = new THREE.Mesh(leftFloorGeometry, leftFloorMaterial)

rightFloor.rotation.x = Math.PI / 2
rightFloor.position.set(1.5, -1, -4)

centerFloor.rotation.x = Math.PI / 2
centerFloor.position.set(-1.5, -1, -4)

leftFloor.rotation.x = Math.PI / 2
leftFloor.position.set(-1.5, -1, -4)

// arena.add(rightFloor, centerFloor, leftFloor)
arena.add(rightFloor, centerFloor, leftFloor)



const cornerShape = new THREE.Shape()

cornerShape.moveTo(0, 0)
cornerShape.lineTo(1, 0)
cornerShape.lineTo(2, 1)
cornerShape.lineTo(2, 2)
cornerShape.lineTo(0, 0)

const extrudeSettings = {
    depth: 1,
    bevelEnabled: false
};

const cornerGeometry = new THREE.ExtrudeGeometry(cornerShape, extrudeSettings)
const cornerMaterial = new THREE.MeshBasicMaterial({color: 0x4C4C4C, wireframe: true })
const corner = [
    new THREE.Mesh(cornerGeometry, cornerMaterial),
    new THREE.Mesh(cornerGeometry, cornerMaterial),
    new THREE.Mesh(cornerGeometry, cornerMaterial),
    new THREE.Mesh(cornerGeometry, cornerMaterial)
];

corner.forEach(corner => corner.rotation.x = Math.PI / 2);

corner[1].rotation.z = Math.PI * 0.5
corner[2].rotation.z = Math.PI
corner[3].rotation.z = Math.PI * 1.5

corner[0].position.set(-7, 0, 3)
corner[1].position.set(-5, 0, -5)
corner[2].position.set(7, 0, -3)
corner[3].position.set(5, 0, 5)

corner.forEach(corner => arena.add(corner))





const bord = [
    new THREE.Mesh(new THREE.BoxGeometry(10, 1, 1), neonMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(10, 1, 1), neonMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(6, 1, 1), neonMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(6, 1, 1), neonMaterial)
];


bord[0].position.set(0, -0.5, -4.5)
bord[1].position.set(0, -0.5, 4.5)

bord[2].rotation.y = Math.PI / 2
bord[3].rotation.y = Math.PI / 2

bord[2].position.set(-6.5, 0, 0)
bord[3].position.set(6.5, 0, 0)


bord.forEach(bord => arena.add(bord))








arena.position.y += 1

scene.add(arena)



// Raquettes
const paddleGeometry = new THREE.BoxGeometry(0.5, 0.2, 1.2)
const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff })
const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
leftPaddle.position.set(-4, 0.1, 0)
scene.add(leftPaddle)
const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial)
rightPaddle.position.set(4, 0.1, 0)
scene.add(rightPaddle)



// Transformation de la balle en palais
const puckGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32)
const puckMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 })
const puck = new THREE.Mesh(puckGeometry, puckMaterial)
puck.position.set(0, 0.05, 0)
scene.add(puck)


let leftPadMove = {
    up: false,
    left: false,
    down: false,
    right: false,
}

let rightPadMove = {
    up: false,
    left: false,
    down: false,
    right: false,
}

// Déplacement des raquettes
document.addEventListener('keydown', (event) => {
    if (event.key === 'w') leftPadMove.up = true
    if (event.key === 'a') leftPadMove.left = true
    if (event.key === 's') leftPadMove.down = true
    if (event.key === 'd') leftPadMove.right = true

    if (event.key === 'ArrowUp') rightPadMove.up = true
    if (event.key === 'ArrowLeft') rightPadMove.left = true
    if (event.key === 'ArrowDown') rightPadMove.down = true
    if (event.key === 'ArrowRight') rightPadMove.right = true
})

document.addEventListener('keyup', (event) => {
    if (event.key === 'w') leftPadMove.up = false
    if (event.key === 'a') leftPadMove.left = false
    if (event.key === 's') leftPadMove.down = false
    if (event.key === 'd') leftPadMove.right = false

    if (event.key === 'ArrowUp') rightPadMove.up = false
    if (event.key === 'ArrowLeft') rightPadMove.left = false
    if (event.key === 'ArrowDown') rightPadMove.down = false
    if (event.key === 'ArrowRight') rightPadMove.right = false
})

// // Animation du palais
// let puckVelocity = new THREE.Vector3(0.1, 0, 0.05);
// let gameActive = true;



// const geometry = new THREE.SphereGeometry(1, 32, 32);

// // Create a material for the sphere (basic material with color)
// const material = new THREE.MeshBasicMaterial({ color: 0x0077ff });

// // Create a mesh using the geometry and material
// const sphere = new THREE.Mesh(geometry, material);

// // Add the sphere to the scene
// scene.add(sphere);


// les deux point de la ligne puis le point a checker
function checkCollision(x1, z1, x2, z2, x0, z0) {
    const crossProduct = (x2 - x1) * (z0 - z1) - (z2 - z1) * (x0 - x1);
    
    if (crossProduct >= 0)
        return true
    else if (crossProduct < 0)
        return false
}

const ball = {
    mesh: puck,
    speed: 0.1,
    angle: -10 // juste avant que la partie demarre (en radian)
};
// ball.mesh.position.x = -4
// ball.mesh.position.z = 0


function moveTheBall()
{
    if (ball.angle == -10)
    {
        while ((ball.angle >= Math.PI * 5 / 6 && ball.angle <= Math.PI * 7 / 6) || ball.angle <= Math.PI / 6 || ball.angle >= Math.PI * 11 / 6)
        {
            // ball.angle = Math.random() * 2 * Math.PI
            ball.angle = Math.PI * 1.5
        }
    }
    let futurX = ball.mesh.position.x + ball.speed * Math.sin(ball.angle)
    let futurZ = ball.mesh.position.z + ball.speed * Math.cos(ball.angle)


    if (checkCollisionBallRaquette(futurX, futurZ, leftPaddle.position.x, leftPaddle.position.z, false, true) == true)
    {
        futurX = ball.mesh.position.x + ball.speed * Math.sin(ball.angle)
        futurZ = ball.mesh.position.z + ball.speed * Math.cos(ball.angle)
        ball.mesh.position.x = futurX
        ball.mesh.position.z = futurZ
        console.log('dessus')
        console.log(ball.angle)

        return
    }
    else if (checkCollisionBallRaquette(futurX, futurZ, rightPaddle.position.x, rightPaddle.position.z, false, true) == true)
    {
        futurX = ball.mesh.position.x + ball.speed * Math.sin(ball.angle)
        futurZ = ball.mesh.position.z + ball.speed * Math.cos(ball.angle)
        ball.mesh.position.x = futurX
        ball.mesh.position.z = futurZ
        console.log('dessous')
        console.log(ball.angle)
        return
    }
    if (checkCollision(5, -4, -5, -4, futurX, futurZ - 0.35) == true || checkCollision(-5, 4, 5, 4, futurX, futurZ + 0.35) == true)
        ball.angle += (Math.PI * 1.5 - ball.angle) * 2
    else if (checkCollision(6, 3, 6, -3, futurX + 0.35, futurZ) == true || checkCollision(-6, -3, -6, 3, futurX - 0.35, futurZ) == true)
    {
        // ball.angle += (Math.PI * 2 - ball.angle) * 2
        // but en realite todo
        ball.angle = -10
        ball.mesh.position.x = 0
        ball.mesh.position.z = 0
        ball.speed = 0.1
    }
    else if (checkCollision(-5, -4, -6, -3, futurX - 0.35, futurZ - 0.35) == true || checkCollision(5, 4, 6, 3, futurX + 0.35, futurZ + 0.35) == true)
    {
        ball.angle += (Math.PI * 1.75 - ball.angle) * 2
        ball.speed += 0.025
    }
    else if (checkCollision(-6, 3, -5, 4, futurX - 0.35, futurZ + 0.35) == true || checkCollision(6, -3, 5, -4, futurX + 0.35, futurZ - 0.35) == true)
    {
        ball.angle += (Math.PI * 1.25 - ball.angle) * 2
        ball.speed += 0.025
    }
    else
    {
        ball.mesh.position.x = futurX
        ball.mesh.position.z = futurZ
    }
}

// pour les angles en radian vu qu'on fait que des += on peut avoir des angles enorme, la on le ramene a son equivalent compris entre 0 et 2 PI
function simplfied_angle(angle)
{
    let tmp = angle
    while(tmp - 2 * Math.PI >= 0)
        tmp -= 2 * Math.PI
    return tmp
}

// mode pour changer ou juste checker (true pour changer)
function checkCollisionBallRaquette(cx, cz, rx, rz, mode, checkfromball)
{
    const left = rx - 0.25 - 0.35
    const right = rx + 0.25 + 0.35
    const back = rz - 0.6 - 0.35
    const front = rz + 0.6 + 0.35

    let hitLeft = false
    let hitRight = false
    let hitBack = false
    let hitFront = false

    if (cx >= left && cx <= right && cz >= back && cz <= front)
    {
        if (mode == true)
            return true

        if (cx >= left && cx <= rx - 0.35 && cz >= back && cz <= front)
            hitLeft = true
        if (cx <= right && cx >= rx + 0.35 && cz >= back && cz <= front)
            hitRight = true
        if (cx >= left && cx <= right && cz >= rz + 0.35 && cz <= front)
            hitFront = true
        if (cx >= left && cx <= right && cz >= back && cz <= rz - 0.35)
            hitBack = true


        // if ((hitLeft || hitRight) && !hitFront && !hitBack)
        // {
        //     ball.angle += (Math.PI * 2 - ball.angle) * 2
        //     // if ((hitRight && ball.angle >= Math.PI) || (hitLeft && ball.angle <= Math.PI))
        //     console.log('here0')
        // }
        // else if ((hitFront || hitBack) && !hitLeft && !hitRight)
        // {
        //     ball.angle += (Math.PI * 1.5 - ball.angle) * 2
        //     // if ((hitFront && (ball.angle >= Math.PI * 1.5 || ball.angle <= Math.PI * 0.5)) || (hitBack && ball.angle <= Math.PI * 1.5 && ball.angle >= Math.PI))
            
        // }



        console.log('avant')
        console.log(ball.angle)

        if ((hitLeft && simplfied_angle(ball.angle) <= Math.PI) || (hitRight && simplfied_angle(ball.angle) >= Math.PI))
            ball.angle += (Math.PI * 2 - ball.angle) * 2
        else if (hitFront)     
        {
            already_change_angle = true
            console.log('front')
            if (simplfied_angle(ball.angle) <= Math.PI)// palet en direction de la droite
            ball.angle = Math.PI * 0.25
            else// palet en direction de la gauche
            ball.angle = Math.PI * 1.75
        }
        else if (hitBack)
        {
            already_change_angle = true
            console.log('back')
            if (simplfied_angle(ball.angle) <= Math.PI)// palet en direction de la droite
            ball.angle = Math.PI * 0.75
            else// palet en direction de la gauche
            ball.angle = Math.PI * 1.25
        }
        
                
        // if ((hitLeft && hitBack) || (hitRight && hitFront))
        // {
        //     console.log(ball.angle)
        //     ball.angle += (Math.PI * 2 - ball.angle) * 2
        //     console.log(ball.angle)
        //     // ball.speed *= 1.2
        //     console.log('here2')
        // }
        // else if ((hitRight && hitBack) || (hitLeft && hitFront))
        // {
        //     ball.angle += (Math.PI * 2 - ball.angle) * 2
        //     // ball.speed *= 1.2
        // }
        return true
    }
    return false
}



const speed = 0.08

let already_change_angle = false
function moveThePad()
{
    
    // if (checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, leftPaddle.position.x, leftPaddle.position.z) == true)
    //     return

    already_change_angle = false
    
    if (leftPadMove.up == true && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, leftPaddle.position.x + speed, leftPaddle.position.z, already_change_angle, false) == false)
    {
        if (leftPaddle.position.x + speed <= -1.75 )
            leftPaddle.position.x += speed
        else
            leftPaddle.position.x = -1.75
    }
    if (leftPadMove.left == true && checkCollision(-5, -4, -6, -3, leftPaddle.position.x - 0.25, leftPaddle.position.z -0.6 - speed) == false && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, leftPaddle.position.x, leftPaddle.position.z - speed, already_change_angle, false) == false)
    {
        if (leftPaddle.position.z - speed >= -3.4)
            leftPaddle.position.z -= speed
        else
            leftPaddle.position.z = -3.4
    }
    if (leftPadMove.down == true && checkCollision(-5, -4, -6, -3, leftPaddle.position.x - 0.25 - speed, leftPaddle.position.z -0.6) == false && checkCollision(-6, 3, -5, 4, leftPaddle.position.x - 0.25 - speed, leftPaddle.position.z + 0.6) == false && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, leftPaddle.position.x - speed, leftPaddle.position.z, already_change_angle, false) == false)
    {
        if (leftPaddle.position.x - speed >= -5.75 )
            leftPaddle.position.x -= speed
        else
            leftPaddle.position.x = -5.75
    }
    if (leftPadMove.right == true && checkCollision(-6, 3, -5, 4, leftPaddle.position.x - 0.25, leftPaddle.position.z + 0.6 + speed) == false && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, leftPaddle.position.x, leftPaddle.position.z + speed, already_change_angle, false) == false)
    {
        if (leftPaddle.position.z + speed <= 3.4)
            leftPaddle.position.z += speed
        else
            leftPaddle.position.z = 3.4
    }



    if (rightPadMove.up == true && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, rightPaddle.position.x - speed, rightPaddle.position.z, already_change_angle, false) == false)
    {
        if (rightPaddle.position.x - speed >= 1.75)
            rightPaddle.position.x -= speed
        else
            rightPaddle.position.x = 1.75
    }
    if (rightPadMove.left == true && checkCollision(5, 4, 6, 3, rightPaddle.position.x + 0.25, rightPaddle.position.z + 0.6 + speed) == false  && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, rightPaddle.position.x, rightPaddle.position.z + speed, already_change_angle, false) == false)
    {
        if (rightPaddle.position.z + speed <= 3.4)
            rightPaddle.position.z += speed
        else
            rightPaddle.position.z = 3.4
    }
    if (rightPadMove.down == true && checkCollision(6, -3, 5, -4, rightPaddle.position.x + 0.25 + speed, rightPaddle.position.z - 0.6) == false && checkCollision(5, 4, 6, 3, rightPaddle.position.x + 0.25 + speed, rightPaddle.position.z + 0.6) == false  && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, rightPaddle.position.x + speed, rightPaddle.position.z, already_change_angle, false) == false)
    {
        if (rightPaddle.position.x + speed <= 5.75)
            rightPaddle.position.x += speed
        else
            rightPaddle.position.x = 5.75
    }
    if (rightPadMove.right == true && checkCollision(6, -3, 5, -4, rightPaddle.position.x + 0.25, rightPaddle.position.z - 0.6 - speed) == false  && checkCollisionBallRaquette(ball.mesh.position.x, ball.mesh.position.z, rightPaddle.position.x, rightPaddle.position.z - speed, already_change_angle, false) == false)
    {
        if (rightPaddle.position.z - speed >= -3.4)
            rightPaddle.position.z -= speed
        else
            rightPaddle.position.z = -3.4
    }


}


function animate() {
    requestAnimationFrame(animate);

    moveTheBall()
    moveThePad()

    
    // // Déplacement du palais
    // puck.position.add(puckVelocity);
    
    // // Collision avec les bordures
    // if (puck.position.z > 2.8 || puck.position.z < -2.8) {
    //     puckVelocity.z *= -1;
    // }
    
    // // Collision avec les raquettes
    // if (
    //     (puck.position.x < leftPaddle.position.x + 0.6 && puck.position.x > leftPaddle.position.x - 0.6 && 
    //     puck.position.z < leftPaddle.position.z + 1 && puck.position.z > leftPaddle.position.z - 1) ||
    //     (puck.position.x < rightPaddle.position.x + 0.6 && puck.position.x > rightPaddle.position.x - 0.6 && 
    //     puck.position.z < rightPaddle.position.z + 1 && puck.position.z > rightPaddle.position.z - 1)
    // ) {
    //     puckVelocity.x *= -1;
    // }
    
    // // // Vérification des buts
    // // if (puck.position.x > 4.8 || puck.position.x < -4.8) {
    // //     console.log("But marqué ! Fin de la partie.");
    // //     gameActive = false;
    // // }
    
    controls.update();
    renderer.render(scene, camera);
}


animate();
