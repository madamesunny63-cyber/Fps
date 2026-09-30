import * as THREE from "three";

/* =========================
   SCÈNE
========================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x202832);
scene.fog = new THREE.Fog(0x202832, 20, 90);


/* =========================
   CAMÉRA
========================= */

const camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);


/* =========================
   RENDERER
========================= */

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

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =========================
   LUMIÈRES
========================= */

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x303030,
        2
    )
);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(20, 30, 10);

scene.add(sun);


/* =========================
   SOL
========================= */

const floor = new THREE.Mesh(
    new THREE.BoxGeometry(60, 1, 60),
    new THREE.MeshStandardMaterial({
        color: 0x39434d
    })
);

floor.position.y = -0.5;

scene.add(floor);


/* =========================
   MURS
========================= */

function wall(x, y, z, w, h, d) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
            color: 0x59636e
        })
    );

    mesh.position.set(x, y, z);

    scene.add(mesh);
}


/* murs extérieurs */

wall(0, 3, -30, 60, 6, 1);
wall(0, 3, 30, 60, 6, 1);
wall(-30, 3, 0, 1, 6, 60);
wall(30, 3, 0, 1, 6, 60);


/* obstacles dans l'arène */

wall(-10, 2, -8, 8, 4, 2);
wall(10, 2, 5, 8, 4, 2);
wall(0, 2, 15, 10, 4, 2);
wall(0, 2, -15, 10, 4, 2);


/* =========================
   JOUEUR
========================= */

const player = {

    position: new THREE.Vector3(
        0,
        1.7,
        20
    ),

    velocity: new THREE.Vector3(),

    yaw: 0,
    pitch: 0,

    speed: 7,
    sprint: 11,

    jump: 9,

    gravity: 25,

    grounded: true
};


/* =========================
   CLAVIER
========================= */

const keys = {};

window.addEventListener(
    "keydown",
    e => {
        keys[e.code] = true;
    }
);

window.addEventListener(
    "keyup",
    e => {
        keys[e.code] = false;
    }
);


/* =========================
   SOURIS
========================= */

let mouseDown = false;

renderer.domElement.addEventListener(
    "click",
    () => {

        if (window.innerWidth > 800) {
            renderer.domElement.requestPointerLock();
        }

    }
);

document.addEventListener(
    "pointerlockchange",
    () => {

        mouseDown =
            document.pointerLockElement ===
            renderer.domElement;

    }
);

document.addEventListener(
    "mousemove",
    e => {

        if (!mouseDown) return;

        player.yaw -= e.movementX * 0.002;
        player.pitch -= e.movementY * 0.002;

        player.pitch = THREE.MathUtils.clamp(
            player.pitch,
            -1.4,
            1.4
        );
    }
);


/* =========================
   JOYSTICK
========================= */

const joystick =
    document.getElementById("joystick");

const stick =
    document.getElementById("stick");

let joystickX = 0;
let joystickY = 0;

joystick.addEventListener(
    "pointermove",
    e => {

        if (e.buttons === 0) return;

        const rect =
            joystick.getBoundingClientRect();

        let x =
            e.clientX -
            (rect.left + rect.width / 2);

        let y =
            e.clientY -
            (rect.top + rect.height / 2);

        const max = 38;

        const length =
            Math.sqrt(x * x + y * y);

        if (length > max) {

            x = x / length * max;
            y = y / length * max;

        }

        joystickX = x / max;
        joystickY = y / max;

        stick.style.transform =
            `translate(${x}px, ${y}px)`;
    }
);

joystick.addEventListener(
    "pointerup",
    () => {

        joystickX = 0;
        joystickY = 0;

        stick.style.transform =
            "translate(0,0)";
    }
);


/* =========================
   CAMÉRA TACTILE
========================= */

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener(
    "touchstart",
    e => {

        if (
            e.target === joystick ||
            e.target === stick ||
            e.target.id === "jump"
        ) return;

        const touch = e.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    },
    { passive: true }
);

window.addEventListener(
    "touchmove",
    e => {

        if (
            e.target === joystick ||
            e.target === stick ||
            e.target.id === "jump"
        ) return;

        const touch = e.touches[0];

        const dx =
            touch.clientX - touchStartX;

        const dy =
            touch.clientY - touchStartY;

        player.yaw -= dx * 0.004;
        player.pitch -= dy * 0.004;

        player.pitch =
            THREE.MathUtils.clamp(
                player.pitch,
                -1.4,
                1.4
            );

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    },
    { passive: true }
);


/* =========================
   SAUT
========================= */

function jump() {

    if (!player.grounded) return;

    player.velocity.y =
        player.jump;

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
    e => {

        if (e.code === "Space") {
            jump();
        }

    }
);


/* =========================
   DÉPLACEMENT
========================= */

const forward =
    new THREE.Vector3();

const right =
    new THREE.Vector3();

function updatePlayer(dt) {

    let forwardInput = 0;
    let rightInput = 0;

    /* PC */

    if (keys["KeyW"])
        forwardInput += 1;

    if (keys["KeyS"])
        forwardInput -= 1;

    if (keys["KeyD"])
        rightInput += 1;

    if (keys["KeyA"])
        rightInput -= 1;

    /* téléphone */

    if (Math.abs(joystickY) > 0.05)
        forwardInput = -joystickY;

    if (Math.abs(joystickX) > 0.05)
        rightInput = joystickX;


    /* direction */

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
        new THREE.Vector3(0,1,0),
        player.yaw
    );

    right.applyAxisAngle(
        new THREE.Vector3(0,1,0),
        player.yaw
    );


    const direction =
        new THREE.Vector3();

    direction
        .addScaledVector(
            forward,
            forwardInput
        )
        .addScaledVector(
            right,
            rightInput
        );

    if (direction.lengthSq() > 1)
        direction.normalize();


    let speed = player.speed;

    if (
        keys["ShiftLeft"] ||
        keys["ShiftRight"]
    ) {
        speed = player.sprint;
    }


    player.velocity.x =
        direction.x * speed;

    player.velocity.z =
        direction.z * speed;


    /* gravité */

    player.velocity.y -=
        player.gravity * dt;


    player.position.x +=
        player.velocity.x * dt;

    player.position.y +=
        player.velocity.y * dt;

    player.position.z +=
        player.velocity.z * dt;


    /* sol */

    if (player.position.y <= 1.7) {

        player.position.y = 1.7;

        player.velocity.y = 0;

        player.grounded = true;
    }


    /* limites arène */

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


/* =========================
   CAMÉRA
========================= */

function updateCamera() {

    camera.position.copy(
        player.position
    );

    camera.rotation.order = "YXZ";

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;
}


/* =========================
   HUD
========================= */

function updateHUD() {

    const speed =
        Math.sqrt(
            player.velocity.x ** 2 +
            player.velocity.z ** 2
        );

    document.getElementById(
        "speed"
    ).textContent =
        Math.round(speed * 10);
}


/* =========================
   RESIZE
========================= */

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


/* =========================
   BOUCLE
========================= */

const clock =
    new THREE.Clock();

function loop() {

    const dt =
        Math.min(
            clock.getDelta(),
            0.05
        );

    updatePlayer(dt);
    updateCamera();
    updateHUD();

    renderer.render(
        scene,
        camera
    );

    requestAnimationFrame(loop);
}

loop();
