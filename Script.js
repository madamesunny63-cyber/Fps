import * as THREE from "three";

/*
==================================================
   SCÈNE
==================================================
*/

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x101720);

scene.fog = new THREE.Fog(
    0x101720,
    10,
    80
);


/*
==================================================
   CAMÉRA
==================================================
*/

const camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.05,
    200
);


/*
==================================================
   RENDERER
==================================================
*/

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/*
==================================================
   LUMIÈRES
==================================================
*/

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x202530,
    2
);

scene.add(ambientLight);

const light = new THREE.DirectionalLight(
    0xffffff,
    2
);

light.position.set(10, 20, 10);

light.castShadow = true;

scene.add(light);


/*
==================================================
   SOL
==================================================
*/

const floorGeometry =
    new THREE.PlaneGeometry(100, 100);

const floorMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x30363d
    });

const floor =
    new THREE.Mesh(
        floorGeometry,
        floorMaterial
    );

floor.rotation.x = -Math.PI / 2;

floor.receiveShadow = true;

scene.add(floor);


/*
==================================================
   MURS
==================================================
*/

function createWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x454d58
        });

    const wall =
        new THREE.Mesh(
            geometry,
            material
        );

    wall.position.set(x, y, z);

    wall.castShadow = true;
    wall.receiveShadow = true;

    scene.add(wall);
}


// Mur arrière
createWall(
    0,
    2,
    -20,
    40,
    4,
    1
);

// Mur avant
createWall(
    0,
    2,
    20,
    40,
    4,
    1
);

// Mur gauche
createWall(
    -20,
    2,
    0,
    1,
    4,
    40
);

// Mur droit
createWall(
    20,
    2,
    0,
    1,
    4,
    40
);


/*
==================================================
   JOUEUR FPS
==================================================
*/

const player = {

    // Position
    position: new THREE.Vector3(
        0,
        2,
        10
    ),

    // Vitesse
    velocity: new THREE.Vector3(),

    // Rotation
    yaw: 0,
    pitch: 0,

    // Hauteur
    standingHeight: 1.8,
    crouchHeight: 1.15,

    // État
    grounded: false,
    crouching: false,

    // Statistiques
    health: 100,

    // Mouvement
    walkSpeed: 7,
    sprintSpeed: 11,
    crouchSpeed: 4,

    // Physique
    jumpForce: 8.5,
    gravity: 24
};


/*
==================================================
   TOUCHES
==================================================
*/

const keys = {};

document.addEventListener(
    "keydown",
    (event) => {

        keys[event.code] = true;

        // Empêcher le défilement
        if (
            event.code === "Space" ||
            event.code === "ArrowUp" ||
            event.code === "ArrowDown"
        ) {
            event.preventDefault();
        }

    }
);

document.addEventListener(
    "keyup",
    (event) => {

        keys[event.code] = false;

    }
);


/*
==================================================
   SOURIS / FPS LOOK
==================================================
*/

let mouseLocked = false;

renderer.domElement.addEventListener(
    "click",
    () => {

        renderer.domElement.requestPointerLock();

    }
);

document.addEventListener(
    "pointerlockchange",
    () => {

        mouseLocked =
            document.pointerLockElement ===
            renderer.domElement;

        document
            .getElementById("game")
            .classList.toggle(
                "playing",
                mouseLocked
            );

    }
);

document.addEventListener(
    "mousemove",
    (event) => {

        if (!mouseLocked) {
            return;
        }

        const sensitivity = 0.002;

        player.yaw -=
            event.movementX *
            sensitivity;

        player.pitch -=
            event.movementY *
            sensitivity;

        // Limiter le regard vertical

        const maxPitch =
            Math.PI / 2 - 0.05;

        player.pitch =
            THREE.MathUtils.clamp(
                player.pitch,
                -maxPitch,
                maxPitch
            );

    }
);


/*
==================================================
   SAUT
==================================================
*/

function jump() {

    if (!player.grounded) {
        return;
    }

    if (player.crouching) {
        return;
    }

    player.velocity.y =
        player.jumpForce;

    player.grounded = false;
}


/*
==================================================
   ACCROUPISSEMENT
==================================================
*/

function updateCrouch() {

    player.crouching =
        keys["ControlLeft"] ||
        keys["ControlRight"];

}


/*
==================================================
   DIRECTION
==================================================
*/

const forward =
    new THREE.Vector3();

const right =
    new THREE.Vector3();


function getMovementDirection() {

    forward.set(
        0,
        0,
        -1
    );

    right.set(
        1,
        0,
        0
    );

    forward.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        player.yaw
    );

    right.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        player.yaw
    );

}


/*
==================================================
   DÉPLACEMENT
==================================================
*/

function updateMovement(deltaTime) {

    updateCrouch();

    getMovementDirection();

    let moveForward = 0;
    let moveRight = 0;

    if (keys["KeyW"]) {
        moveForward += 1;
    }

    if (keys["KeyS"]) {
        moveForward -= 1;
    }

    if (keys["KeyD"]) {
        moveRight += 1;
    }

    if (keys["KeyA"]) {
        moveRight -= 1;
    }

    const direction =
        new THREE.Vector3();

    direction
        .addScaledVector(
            forward,
            moveForward
        )
        .addScaledVector(
            right,
            moveRight
        );

    // Normalisation
    if (direction.lengthSq() > 0) {

        direction.normalize();

    }


    /*
    ----------------------------------------------
       VITESSE
    ----------------------------------------------
    */

    let speed =
        player.walkSpeed;


    // Sprint

    const sprinting =
        keys["ShiftLeft"] ||
        keys["ShiftRight"];

    if (
        sprinting &&
        !player.crouching &&
        moveForward > 0
    ) {

        speed =
            player.sprintSpeed;

    }


    // Accroupi

    if (player.crouching) {

        speed =
            player.crouchSpeed;

    }


    /*
    ----------------------------------------------
       ACCÉLÉRATION
    ----------------------------------------------
    */

    const acceleration =
        45;

    const targetX =
        direction.x * speed;

    const targetZ =
        direction.z * speed;


    player.velocity.x =
        THREE.MathUtils.damp(
            player.velocity.x,
            targetX,
            acceleration,
            deltaTime
        );

    player.velocity.z =
        THREE.MathUtils.damp(
            player.velocity.z,
            targetZ,
            acceleration,
            deltaTime
        );


    /*
    ----------------------------------------------
       GRAVITÉ
    ----------------------------------------------
    */

    player.velocity.y -=
        player.gravity * deltaTime;


    /*
    ----------------------------------------------
       POSITION
    ----------------------------------------------
    */

    player.position.x +=
        player.velocity.x *
        deltaTime;

    player.position.y +=
        player.velocity.y *
        deltaTime;

    player.position.z +=
        player.velocity.z *
        deltaTime;


    /*
    ----------------------------------------------
       SOL
    ----------------------------------------------
    */

    const standingY =
        player.standingHeight;

    const crouchY =
        player.crouchHeight;

    const targetHeight =
        player.crouching
            ? crouchY
            : standingY;


    if (
        player.position.y <=
        targetHeight
    ) {

        player.position.y =
            targetHeight;

        player.velocity.y = 0;

        player.grounded = true;

    } else {

        player.grounded = false;

    }


    /*
    ----------------------------------------------
       LIMITES DE L'ARÈNE
    ----------------------------------------------
    */

    const limit = 18.5;

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -limit,
            limit
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -limit,
            limit
        );

}


/*
==================================================
   CAMÉRA
==================================================
*/

function updateCamera(deltaTime) {

    const targetHeight =
        player.crouching
            ? player.crouchHeight
            : player.standingHeight;


    /*
    Position
    */

    camera.position.copy(
        player.position
    );


    /*
    Regard horizontal
    */

    camera.rotation.order =
        "YXZ";

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;


    /*
    FOV dynamique pendant le sprint
    */

    const sprinting =
        (
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
        ) &&
        keys["KeyW"];


    const targetFOV =
        sprinting
            ? 100
            : 90;


    camera.fov =
        THREE.MathUtils.damp(
            camera.fov,
            targetFOV,
            8,
            deltaTime
        );

    camera.updateProjectionMatrix();

}


/*
==================================================
   HUD
==================================================
*/

function updateHUD() {

    document.getElementById(
        "health"
    ).textContent =
        Math.max(
            0,
            Math.round(player.health)
        );


    const horizontalSpeed =
        Math.sqrt(
            player.velocity.x ** 2 +
            player.velocity.z ** 2
        );


    document.getElementById(
        "speed"
    ).textContent =
        Math.round(horizontalSpeed);

}


/*
==================================================
   RESIZE
==================================================
*/

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


/*
==================================================
   ESPACE = SAUT
==================================================
*/

document.addEventListener(
    "keydown",
    (event) => {

        if (event.code === "Space") {

            jump();

        }

    }
);


/*
==================================================
   BOUCLE PRINCIPALE
==================================================
*/

const clock =
    new THREE.Clock();

function gameLoop() {

    const deltaTime =
        Math.min(
            clock.getDelta(),
            0.05
        );


    updateMovement(
        deltaTime
    );

    updateCamera(
        deltaTime
    );

    updateHUD();


    renderer.render(
        scene,
        camera
    );


    requestAnimationFrame(
        gameLoop
    );

}

gameLoop();
