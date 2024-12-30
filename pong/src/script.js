import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'



/**
 * debug
 */
const gui = new GUI()
const selfPaddleFolder = gui.addFolder('Player Pad')
const opponentPaddleFolder = gui.addFolder('Opponent Pad')
/***
 * init
 *  ***/
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const scene = new THREE.Scene()
const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize( sizes.width, sizes.height );
const camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 0.1, 100)
/*
on resize
*/

    window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.height = window.innerHeight
        sizes.width = window.innerWidth
        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()
        
        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })
/**
 * start scene
 */
const debugObject = {
    colorSelf: 0xff0000,
    colorOpponent: 0xff0000
}

const boxGeometry = new THREE.BoxGeometry(1,1,1)
const selfPaddleMaterial = new THREE.MeshBasicMaterial({color: debugObject.colorSelf})
const opponentPaddleMaterial = new THREE.MeshBasicMaterial({color: debugObject.colorOpponent})
const selfPaddle = new THREE.Mesh(boxGeometry, selfPaddleMaterial,)
selfPaddle.position.x = -3.5
selfPaddle.scale.x = 0.05
selfPaddle.scale.y = 1
selfPaddle.scale.z = 1
    selfPaddleFolder
        .addColor(debugObject, 'colorSelf').name('Player Pad Color').onChange(() =>
        {
            selfPaddleMaterial.color.set(debugObject.colorSelf)
        })
    selfPaddleFolder.add(selfPaddle.material, 'wireframe')
    selfPaddleFolder.add(selfPaddle.position, 'x')
            .min(-10).max(10).step(0.001)
    selfPaddleFolder.add(selfPaddle.position, 'y')
            .min(-10).max(10).step(0.00001)
    selfPaddleFolder.add(selfPaddle.position, 'z')
            .min(-10).max(10).step(0.001)
        selfPaddleFolder.add(selfPaddle.scale, 'x')
            .min(0.01).max(10).step(0.001)
        selfPaddleFolder.add(selfPaddle.scale, 'y')
            .min(0.01).max(10).step(0.001)
        selfPaddleFolder.add(selfPaddle.scale, 'z')
            .min(0.01).max(10).step(0.001)
    selfPaddleFolder.add(selfPaddle.scale, 'y')
            .min(0.01).max(10).step(0.001).name('Paddle Size')
const opponentPaddle = new THREE.Mesh(boxGeometry, opponentPaddleMaterial)
opponentPaddle.position.x = 3.5
opponentPaddle.scale.x = 0.05
opponentPaddle.scale.y = 1
opponentPaddle.scale.z = 1
    opponentPaddleFolder
        .addColor(debugObject, 'colorOpponent').name('Opponent Pad Color').onChange(() =>
            {
                opponentPaddleMaterial.color.set(debugObject.colorOpponent)
            })
    opponentPaddleFolder.add(opponentPaddle.material, 'wireframe')
    opponentPaddleFolder.add(opponentPaddle.position, 'x')
            .min(-10).max(10).step(0.001)
    opponentPaddleFolder.add(opponentPaddle.position, 'y')
            .min(-10).max(10).step(0.001)
    opponentPaddleFolder.add(opponentPaddle.position, 'z')
            .min(-10).max(10).step(0.001)
    opponentPaddleFolder.add(opponentPaddle.scale, 'y')
            .min(0.1).max(10).step(0.001).name('Paddle Size')

camera.position.z = 5        
const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true

scene.add(camera)
scene.add(selfPaddle)
scene.add(opponentPaddle)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()