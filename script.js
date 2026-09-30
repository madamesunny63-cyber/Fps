import * as THREE from "three";


/* =====================================================
   SCÈNE
===================================================== */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x202832);

scene.fog = new THREE.Fog(
    0x202832,
    15,
    90
);


/* =====================================================
   CAMÉRA
===================================================== */

const camera = new THREE.PerspectiveCamera(
    80,
    1,
    0.1,
    200
);

camera.rotation.order = "YXZ";


/* =====================================================
   RENDERER
===================================================== */

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setSize(
    1,
    1,
    false
);

renderer.domElement.style.position = "absolute";
renderer.domElement.style.left = "0";
renderer.domElement.style.top = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =====================================================
   LUMIÈRES
===================================================== */

const ambientLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x303840,
        2
    );

scene.add(ambientLight);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        2
    );

sun.position.set(
    10,
    20,
    10
);

scene.add(sun);


/* =====================================================
   SOL
===================================================== */

const floor =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            60,
            1,
            60
        ),

        new THREE.MeshStandardMaterial({
            color: 0x46515d
        })
    );

floor.position.y = -0.5;

scene.add(floor);


/* =====================================================
   MURS
===================================================== */

function createWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            new THREE.MeshStandardMaterial({
                color: 0x697582
            })
        );

    mesh.position.set(
        x,
        y,
        z
    );

    scene.add(mesh);
}


/* Murs de l'arène */

createWall(
    0,
    3,
    -30,
    60,
    6,
    1
);

createWall(
    0,
    3,
    30,
    60,
    6,
    1
);

createWall(
    -30,
    3,
    0,
    1,
    6,
    60
);

createWall(
    30,
    3,
    0,
    1,
    6,
    60
);


/* =====================================================
   OBSTACLES
===================================================== */

createWall(
    -10,
    2,
    -8,
    8,
    4,
    2
);

createWall(
    10,
    2,
    5,
    8,
    4,
    2
);

createWall(
    0,
    2,
    15,
    10,
    4,
    2
);


/* =====================================================
   JOUEUR
===================================================== */

const player = {

    position:
        new THREE.Vector3(
            0,
            1.7,
            20
        ),

    velocity:
        new THREE.Vector3(
            0,
            0,
            0
        ),

    yaw: 0,

    pitch: 0,

    speed: 7,

    jumpForce: 9,

    grounded: true
};


/* =====================================================
   CLAVIER
===================================================== */

const keys = {};

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;

        if (
            event.code === "Space" ||
            event.code === "ArrowUp" ||
            event.code === "ArrowDown"
        ) {
            event.preventDefault();
        }
    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.code] = false;
    }
);


/* =====================================================
   JOYSTICK
===================================================== */

const joystick =
    document.getElementById(
        "joystick"
    );

const stick =
    document.getElementById(
        "stick"
    );

let joyX = 0;
let joyY = 0;

let joystickActive = false;


function updateJoystick(event) {

    const rect =
        joystick.getBoundingClientRect();

    let x =
        event.clientX -
        (
            rect.left +
            rect.width / 2
        );

    let y =
        event.clientY -
        (
            rect.top +
            rect.height / 2
        );

    const maxDistance = 40;

    const distance =
        Math.sqrt(
            x * x +
            y * y
        );

    if (
        distance >
        maxDistance
    ) {

        x =
            x / distance *
            maxDistance;

        y =
            y / distance *
            maxDistance;
    }

    joyX =
        x / maxDistance;

    joyY =
        y / maxDistance;

    stick.style.transform =
        `translate(${x}px, ${y}px)`;
}


joystick.addEventListener(
    "pointerdown",
    event => {

        joystickActive = true;

        joystick.setPointerCapture(
            event.pointerId
        );

        updateJoystick(event);
    }
);


joystick.addEventListener(
    "pointermove",
    event => {

        if (!joystickActive)
            return;

        updateJoystick(event);
    }
);


function resetJoystick() {

    joystickActive = false;

    joyX = 0;
    joyY = 0;

    stick.style.transform =
        "translate(0px, 0px)";
}


joystick.addEventListener(
    "pointerup",
    resetJoystick
);

joystick.addEventListener(
    "pointercancel",
    resetJoystick
);


/* =====================================================
   REGARDER AVEC LE DOIGT
===================================================== */

let looking = false;

let lastTouchX = 0;
let lastTouchY = 0;


window.addEventListener(
    "pointerdown",
    event => {

        if (
            event.target === joystick ||
            event.target === stick ||
            event.target ===
            document.getElementById("jump")
        ) {
            return;
        }

        looking = true;

        lastTouchX =
            event.clientX;

        lastTouchY =
            event.clientY;
    }
);


window.addEventListener(
    "pointermove",
    event => {

        if (!looking)
            return;

        const dx =
            event.clientX -
            lastTouchX;

        const dy =
            event.clientY -
            lastTouchY;


        player.yaw -=
            dx * 0.005;

        player.pitch -=
            dy * 0.005;


        player.pitch =
            THREE.MathUtils.clamp(
                player.pitch,
                -1.4,
                1.4
            );


        lastTouchX =
            event.clientX;

        lastTouchY =
            event.clientY;
    }
);


window.addEventListener(
    "pointerup",
    () => {

        looking = false;
    }
);


/* =====================================================
   SAUT
===================================================== */

function jump() {

    if (!player.grounded)
        return;

    player.velocity.y =
        player.jumpForce;

    player.grounded = false;
}


const jumpButton =
    document.getElementById(
        "jump"
    );

jumpButton.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        jump();
    }
);


window.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space"
        ) {
            jump();
        }
    }
);


/* =====================================================
   DÉPLACEMENT
===================================================== */

function updateMovement(dt) {

    let forward = 0;
    let right = 0;


    /* Clavier */

    if (keys["KeyW"])
        forward += 1;

    if (keys["KeyS"])
        forward -= 1;

    if (keys["KeyD"])
        right += 1;

    if (keys["KeyA"])
        right -= 1;


    /* Joystick */

    if (
        Math.abs(joyY) > 0.05
    ) {
        forward = -joyY;
    }

    if (
        Math.abs(joyX) > 0.05
    ) {
        right = joyX;
    }


    /* Direction */

    const direction =
        new THREE.Vector3(
            right,
            0,
            -forward
        );


    direction.applyAxisAngle(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        player.yaw
    );


    if (
        direction.lengthSq() > 1
    ) {
        direction.normalize();
    }


    /* Déplacement */

    player.position.x +=
        direction.x *
        player.speed *
        dt;

    player.position.z +=
        direction.z *
        player.speed *
        dt;


    /* Gravité */

    player.velocity.y -=
        25 * dt;

    player.position.y +=
        player.velocity.y * dt;


    /* Sol */

    if (
        player.position.y <= 1.7
    ) {

        player.position.y = 1.7;

        player.velocity.y = 0;

        player.grounded = true;
    }


    /* Limites de l'arène */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -28,
            28
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -28,
            28
        );
}


/* =====================================================
   CAMÉRA
===================================================== */

function updateCamera() {

    camera.position.copy(
        player.position
    );

    camera.rotation.order =
        "YXZ";

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;
}


/* =====================================================
   REDIMENSIONNEMENT
===================================================== */

function resizeRenderer() {

    const game =
        document.getElementById(
            "game"
        );


    /*
     * On prend la taille RÉELLE
     * du conteneur du jeu.
     */

    const width =
        game.clientWidth;

    const height =
        game.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {
        return;
    }


    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height,
        false
    );


    renderer.domElement.style.width =
        width + "px";

    renderer.domElement.style.height =
        height + "px";
}


/* Resize classique */

window.addEventListener(
    "resize",
    resizeRenderer
);


/* Rotation téléphone */

window.addEventListener(
    "orientationchange",
    () => {

        resizeRenderer();

        setTimeout(
            resizeRenderer,
            100
        );

        setTimeout(
            resizeRenderer,
            300
        );

        setTimeout(
            resizeRenderer,
            700
        );
    }
);


/* Android / navigateur */

if (
    window.visualViewport
) {

    window.visualViewport.addEventListener(
        "resize",
        resizeRenderer
    );
}


/* ResizeObserver */

if (
    window.ResizeObserver
) {

    const observer =
        new ResizeObserver(
            resizeRenderer
        );

    observer.observe(
        document.getElementById(
            "game"
        )
    );
}


/* =====================================================
   BOUCLE DU JEU
===================================================== */

const clock =
    new THREE.Clock();


function gameLoop() {

    const dt =
        Math.min(
            clock.getDelta(),
            0.05
        );


    updateMovement(dt);

    updateCamera();


    renderer.render(
        scene,
        camera
    );


    requestAnimationFrame(
        gameLoop
    );
}


/* =====================================================
   DÉMARRAGE
===================================================== */

resizeRenderer();

gameLoop();
