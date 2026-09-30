import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202832);
scene.fog = new THREE.Fog(0x202832, 15, 90);

const camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("game").appendChild(renderer.domElement);

/* LUMIÈRES */

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x444444,
        2
    )
);

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(10, 20, 10);
scene.add(sun);

/* SOL */

const floor = new THREE.Mesh(
    new THREE.BoxGeometry(60, 1, 60),
    new THREE.MeshStandardMaterial({
        color: 0x46515d
    })
);

floor.position.y = -0.5;
scene.add(floor);

/* MURS */

function wall(x, y, z, w, h, d) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
            color: 0x697582
        })
    );

    mesh.position.set(x, y, z);
    scene.add(mesh);
}

wall(0, 3, -30, 60, 6, 1);
wall(0, 3, 30, 60, 6, 1);
wall(-30, 3, 0, 1, 6, 60);
wall(30, 3, 0, 1, 6, 60);

/* OBSTACLES */

wall(-10, 2, -8, 8, 4, 2);
wall(10, 2, 5, 8, 4, 2);
wall(0, 2, 15, 10, 4, 2);

/* JOUEUR */

const player = {
    position: new THREE.Vector3(0, 1.7, 20),
    velocity: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    speed: 7,
    jump: 9,
    grounded: true
};

/* CLAVIER */

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.code] = true;
});

window.addEventListener("keyup", e => {
    keys[e.code] = false;
});

/* JOYSTICK */

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joyX = 0;
let joyY = 0;
let joyActive = false;

function joystickMove(e) {

    const r = joystick.getBoundingClientRect();

    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);

    const max = 40;
    const distance = Math.sqrt(x * x + y * y);

    if (distance > max) {
        x = x / distance * max;
        y = y / distance * max;
    }

    joyX = x / max;
    joyY = y / max;

    stick.style.transform =
        `translate(${x}px, ${y}px)`;
}

joystick.addEventListener("pointerdown", e => {
    joyActive = true;
    joystick.setPointerCapture(e.pointerId);
    joystickMove(e);
});

joystick.addEventListener("pointermove", e => {
    if (joyActive) joystickMove(e);
});

joystick.addEventListener("pointerup", () => {
    joyActive = false;
    joyX = 0;
    joyY = 0;
    stick.style.transform = "translate(0,0)";
});

/* REGARDER AVEC LE DOIGT */

let lookActive = false;
let lastX = 0;
let lastY = 0;

window.addEventListener("pointerdown", e => {

    if (
        e.target === joystick ||
        e.target === stick ||
        e.target === document.getElementById("jump")
    ) return;

    lookActive = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("pointermove", e => {

    if (!lookActive) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    player.yaw -= dx * 0.005;
    player.pitch -= dy * 0.005;

    player.pitch = THREE.MathUtils.clamp(
        player.pitch,
        -1.4,
        1.4
    );

    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("pointerup", () => {
    lookActive = false;
});

/* SAUT */

function jump() {

    if (!player.grounded) return;

    player.velocity.y = player.jump;
    player.grounded = false;
}

document.getElementById("jump")
    .addEventListener("pointerdown", jump);

window.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

/* DÉPLACEMENT */

function updatePlayer(dt) {

    let forward = 0;
    let right = 0;

    if (keys["KeyW"]) forward += 1;
    if (keys["KeyS"]) forward -= 1;
    if (keys["KeyD"]) right += 1;
    if (keys["KeyA"]) right -= 1;

    if (Math.abs(joyY) > 0.05)
        forward = -joyY;

    if (Math.abs(joyX) > 0.05)
        right = joyX;

    const direction = new THREE.Vector3();

    direction.set(
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
        direction.x * player.speed * dt;

    player.position.z +=
        direction.z * player.speed * dt;

    /* gravité */

    player.velocity.y -= 25 * dt;

    player.position.y +=
        player.velocity.y * dt;

    if (player.position.y <= 1.7) {

        player.position.y = 1.7;
        player.velocity.y = 0;
        player.grounded = true;
    }

    /* limites */

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

/* CAMÉRA */

function updateCamera() {

    camera.position.copy(
        player.position
    );

    camera.rotation.order = "YXZ";

    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
}

/* REDIMENSIONNEMENT */

function resize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);

/* BOUCLE */

const clock = new THREE.Clock();

function loop() {

    const dt =
        Math.min(clock.getDelta(), 0.05);

    updatePlayer(dt);
    updateCamera();

    renderer.render(scene, camera);

    requestAnimationFrame(loop);
}

resize();
loop();
