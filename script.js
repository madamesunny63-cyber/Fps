import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


/* =========================
   SCÈNE
========================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x18222d);


/* =========================
   CAMÉRA
========================= */

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

camera.rotation.order = "YXZ";


/* =========================
   RENDERER
========================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =========================
   LUMIÈRE
========================= */

const light = new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    2
);

scene.add(light);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(10, 20, 10);

scene.add(sun);


/* =========================
   SOL
========================= */

const floor = new THREE.Mesh(
    new THREE.BoxGeometry(60, 1, 60),
    new THREE.MeshStandardMaterial({
        color: 0x46515d
    })
);

floor.position.y = -0.5;

scene.add(floor);


/* =========================
   MURS
========================= */

function createWall(x, y, z, width, height, depth) {

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            height,
            depth
        ),

        new THREE.MeshStandardMaterial({
            color: 0x697582
        })
    );

    wall.position.set(x, y, z);

    scene.add(wall);
}


/* arène */

createWall(0, 3, -30, 60, 6, 1);
createWall(0, 3, 30, 60, 6, 1);
createWall(-30, 3, 0, 1, 6, 60);
createWall(30, 3, 0, 1, 6, 60);


/* quelques obstacles */

createWall(-10, 2, -8, 8, 4, 2);
createWall(10, 2, 5, 8, 4, 2);
createWall(0, 2, 15, 10, 4, 2);


/* =========================
   JOUEUR
========================= */

const player = {

    x: 0,
    y: 1.7,
    z: 20,

    yaw: 0,
    pitch: 0,

    speed: 7,

    velocityY: 0,

    grounded: true
};


/* =========================
   CLAVIER
========================= */

const keys = {};

window.addEventListener("keydown", function(e) {
    keys[e.code] = true;
});

window.addEventListener("keyup", function(e) {
    keys[e.code] = false;
});


/* =========================
   JOYSTICK
========================= */

const joystick =
    document.getElementById("joystick");

const stick =
    document.getElementById("stick");

let joyX = 0;
let joyY = 0;
let touchingJoystick = false;

joystick.addEventListener(
    "pointerdown",
    function(e) {

        touchingJoystick = true;

        joystick.setPointerCapture(e.pointerId);

        moveJoystick(e);
    }
);

joystick.addEventListener(
    "pointermove",
    function(e) {

        if (!touchingJoystick) return;

        moveJoystick(e);
    }
);

joystick.addEventListener(
    "pointerup",
    function() {

        touchingJoystick = false;

        joyX = 0;
        joyY = 0;

        stick.style.transform =
            "translate(0px,0px)";
    }
);


function moveJoystick(e) {

    const rect =
        joystick.getBoundingClientRect();

    let x =
        e.clientX -
        (rect.left + rect.width / 2);

    let y =
        e.clientY -
        (rect.top + rect.height / 2);

    const max = 40;

    const distance =
        Math.sqrt(x * x + y * y);

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


/* =========================
   REGARDER AVEC LE DOIGT
========================= */

let looking = false;
let lastX = 0;
let lastY = 0;

window.addEventListener(
    "pointerdown",
    function(e) {

        if (
            e.target === joystick ||
            e.target === stick ||
            e.target === document.getElementById("jump")
        ) {
            return;
        }

        looking = true;

        lastX = e.clientX;
        lastY = e.clientY;
    }
);

window.addEventListener(
    "pointermove",
    function(e) {

        if (!looking) return;

        const dx =
            e.clientX - lastX;

        const dy =
            e.clientY - lastY;

        player.yaw -= dx * 0.006;
        player.pitch -= dy * 0.006;

        player.pitch =
            Math.max(
                -1.4,
                Math.min(
                    1.4,
                    player.pitch
                )
            );

        lastX = e.clientX;
        lastY = e.clientY;
    }
);

window.addEventListener(
    "pointerup",
    function() {
        looking = false;
    }
);


/* =========================
   SAUT
========================= */

function jump() {

    if (!player.grounded) return;

    player.velocityY = 9;

    player.grounded = false;
}

document
    .getElementById("jump")
    .addEventListener(
        "pointerdown",
        jump
    );

window.addEventListener(
    "keydown",
    function(e) {

        if (e.code === "Space") {
            jump();
        }
    }
);


/* =========================
   DÉPLACEMENT
========================= */

function updatePlayer(dt) {

    let forward = 0;
    let right = 0;


    /* clavier */

    if (keys["KeyW"])
        forward += 1;

    if (keys["KeyS"])
        forward -= 1;

    if (keys["KeyD"])
        right += 1;

    if (keys["KeyA"])
        right -= 1;


    /* joystick */

    if (Math.abs(joyY) > 0.05)
        forward = -joyY;

    if (Math.abs(joyX) > 0.05)
        right = joyX;


    /* direction */

    const sin =
        Math.sin(player.yaw);

    const cos =
        Math.cos(player.yaw);

    const moveX =
        (-sin * forward) +
        (cos * right);

    const moveZ =
        (-cos * forward) +
        (-sin * right);


    const length =
        Math.sqrt(
            moveX * moveX +
            moveZ * moveZ
        );

    if (length > 0) {

        player.x +=
            (moveX / length) *
            player.speed *
            dt;

        player.z +=
            (moveZ / length) *
            player.speed *
            dt;
    }


    /* gravité */

    player.velocityY -=
        25 * dt;

    player.y +=
        player.velocityY * dt;


    /* sol */

    if (player.y <= 1.7) {

        player.y = 1.7;

        player.velocityY = 0;

        player.grounded = true;
    }


    /* limites */

    player.x =
        Math.max(
            -28,
            Math.min(28, player.x)
        );

    player.z =
        Math.max(
            -28,
            Math.min(28, player.z)
        );
}


/* =========================
   CAMÉRA
========================= */

function updateCamera() {

    camera.position.set(
        player.x,
        player.y,
        player.z
    );

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;
}


/* =========================
   REDIMENSIONNEMENT
========================= */

function resize() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height,
        false
    );
}

window.addEventListener(
    "resize",
    resize
);

window.addEventListener(
    "orientationchange",
    function() {
        setTimeout(resize, 200);
    }
);


/* =========================
   JEU
========================= */

let previous =
    performance.now();

function gameLoop(now) {

    const dt =
        Math.min(
            (now - previous) / 1000,
            0.05
        );

    previous = now;

    updatePlayer(dt);

    updateCamera();

    renderer.render(
        scene,
        camera
    );

    requestAnimationFrame(
        gameLoop
    );
}


/* DÉMARRAGE */

resize();

requestAnimationFrame(
    gameLoop
);
