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
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
);

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =====================================================
   LUMIÈRES
===================================================== */

const light =
    new THREE.HemisphereLight(
        0xffffff,
        0x444444,
        2
    );

scene.add(light);


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

    const wall =
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

    wall.position.set(
        x,
        y,
        z
    );

    scene.add(wall);
}


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
        new THREE.Vector3(),

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

        if (event.code === "Space") {
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

    const max = 40;

    const distance =
        Math.sqrt(
            x * x +
            y * y
        );

    if (distance > max) {

        x =
            x / distance * max;

        y =
            y / distance * max;
    }

    joyX = x / max;
    joyY = y / max;

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

        if (joystickActive) {
            updateJoystick(event);
        }
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
   REGARDER
===================================================== */

let looking = false;

let lastX = 0;
let lastY = 0;


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

        lastX = event.clientX;
        lastY = event.clientY;
    }
);


window.addEventListener(
    "pointermove",
    event => {

        if (!looking) return;

        const dx =
            event.clientX - lastX;

        const dy =
            event.clientY - lastY;

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

        lastX = event.clientX;
        lastY = event.clientY;
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


document
    .getElementById("jump")
    .addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            jump();
        }
    );


window.addEventListener(
    "keydown",
    event => {

        if (event.code === "Space") {
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


    if (keys["KeyW"])
        forward += 1;

    if (keys["KeyS"])
        forward -= 1;

    if (keys["KeyD"])
        right += 1;

    if (keys["KeyA"])
        right -= 1;


    if (Math.abs(joyY) > 0.05)
        forward = -joyY;

    if (Math.abs(joyX) > 0.05)
        right = joyX;


    const direction =
        new THREE.Vector3(
            right,
            0,
            -forward
        );


    direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        player.yaw
    );


    if (direction.lengthSq() > 1)
        direction.normalize();


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


    if (player.position.y <= 1.7) {

        player.position.y = 1.7;

        player.velocity.y = 0;

        player.grounded = true;
    }


    /* Limites */

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
   CORRECTION PAYSAGE ANDROID
===================================================== */

function resizeGame() {

    let width =
        window.innerWidth;

    let height =
        window.innerHeight;


    /*
     * C'est la partie importante.
     *
     * Certains téléphones Android
     * continuent de fournir les dimensions
     * portrait après la rotation.
     *
     * En paysage, si la largeur annoncée
     * est plus petite que la hauteur,
     * on inverse les deux.
     */

    const isLandscape =
        window.matchMedia(
            "(orientation: landscape)"
        ).matches;


    if (
        isLandscape &&
        width < height
    ) {

        const oldWidth = width;

        width = height;
        height = oldWidth;
    }


    /* Taille de la caméra */

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();


    /* Taille réelle du canvas */

    renderer.setSize(
        width,
        height,
        false
    );


    renderer.domElement.style.width =
        width + "px";

    renderer.domElement.style.height =
        height + "px";


    /*
     * Le canvas doit toujours partir
     * du coin supérieur gauche.
     */

    renderer.domElement.style.left =
        "0px";

    renderer.domElement.style.top =
        "0px";
}


/* =====================================================
   ÉVÉNEMENTS DE ROTATION
===================================================== */

window.addEventListener(
    "resize",
    resizeGame
);


window.addEventListener(
    "orientationchange",
    () => {

        resizeGame();

        setTimeout(
            resizeGame,
            100
        );

        setTimeout(
            resizeGame,
            300
        );

        setTimeout(
            resizeGame,
            700
        );

        setTimeout(
            resizeGame,
            1200
        );
    }
);


/* Android */

if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        resizeGame
    );
}


/* =====================================================
   BOUCLE
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

resizeGame();

gameLoop();
