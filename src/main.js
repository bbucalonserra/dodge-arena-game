/**
 * ======================================================================
 * COMMENTARY (<= 500 words)
 *
 * 1. PHYSICS
 * The arena is a top-down simulation with zero gravity (engine.gravity = 0
 * on both axes). Cars are matter.js rectangles with frictionAir modelling
 * tyre-ground drag; without it, vehicles would glide indefinitely. Barriers
 * use isStatic: true (infinite mass) and restitution: 0.9, producing a firm
 * bounce with slight energy loss. Two archetypes differ by density and
 * enginePower: StandardCar is nimble; SlowCar is heavy and sluggish,
 * transferring more impulse in collisions. Density is tuned so the enlarged
 * bodies keep the intended mass, acceleration and top speed. Throttle applies
 * a directional force each frame via Body.applyForce along the chassis angle;
 * capSpeed clamps the velocity magnitude to a per-type ceiling. A tyre-grip
 * model splits velocity into forward and lateral components and cancels a
 * fraction of the lateral part each frame; because steering rotates the
 * chassis instantly, a fast turn leaves velocity off-axis, so the car drifts
 * (a real slip angle) until grip realigns it.
 *
 * 2. OPPONENT LOGIC (MODES 2 and 3)
 * Opponent driving uses the Strategy pattern. StraightStrategy holds a fixed
 * heading; SineStrategy oscillates the heading around a base direction via
 * sin(phase). Both call enforceHeading(), setting velocity and angle directly,
 * since opponents follow prescribed paths rather than simulating engine
 * inertia. The collision policy mutates whichever field a strategy steers by
 * (heading or baseHeading), so it applies to both types: reverse 180 degrees
 * on a barrier, rotate a random plus or minus 90 degrees on car-car contact.
 * A collisionStart only fires once per contact, so a car pinned against a wall
 * (nudged there by another car, or overtaken by a moving Sudden Death wall)
 * would otherwise grind in place or slip through. A per-frame containment pass
 * reflects the heading component aimed at a nearby wall and hard-clamps
 * opponents inside the current bounds, which track the shrinking arena.
 *
 * 3. ANIMATIONS
 * Particle systems share an emit/update/draw lifecycle. MotionTrail spawns
 * speed-scaled fading marks; ImpactFlash bursts radial sparks that decelerate
 * and fade; BarrierPulse expands a stroked ring. SkidMarks records dark,
 * slow-fading dots under the rear tyres while the player drifts. All prune
 * dead particles by reverse-iteration splice.
 *
 * 4. CREATIVE EXTENSION
 * (a) Minimap: a scaled HUD mapping world coordinates to a corner viewport,
 * with a blinking player dot. (b) Damage system: a per-car counter in a Map
 * drives a lerpColor tint toward red plus a smoke particle system past a
 * threshold. (c) Slip-angle drift with skid marks (see physics above),
 * coupling the grip model to a dedicated visual. (d) Mode 3 dynamic arena:
 * every cycle a Sudden Death phase gradually moves the four static walls
 * inward (Body.setPosition) to shrink the playfield, held then restored,
 * forcing cars together; boost pads apply a forward launch past the normal
 * speed cap and vanish during the shrink. (e) A canvas-drawn menu and looped
 * background music via p5.sound. These add persistent state, dynamic geometry
 * and audio, going well beyond simple scoring.
 * ======================================================================
 */

/** @type {PhysicsWorld} */
let physicsWorld;
/** @type {GameManager} */
let gameManager;
/** @type {MenuManager} */
let menuManager;

const ARENA_W = 1400;
const ARENA_H = 700;
const ARENA_MARGIN_X = 50;
// Equal top/bottom margins keep the arena vertically centred; the top margin
// also has to clear the perimeter wall and the HUD line above it.
const ARENA_MARGIN_TOP = 100;
const ARENA_MARGIN_BOTTOM = 100;
const CANVAS_W = ARENA_W + ARENA_MARGIN_X * 2;
const CANVAS_H = ARENA_H + ARENA_MARGIN_TOP + ARENA_MARGIN_BOTTOM;

// Required by the spec to be a global.
let carNumbers = 4;

/** @type {"menu"|"game"} */
let appState = "menu";

/** @type {p5.SoundFile|undefined} */
let bgMusic;
let musicReady = false;
let musicStarted = false;
let musicMuted = false;
const MUSIC_VOLUME = 0.4;

/**
 * Wrapped so a missing or blocked file cannot abort startup.
 * @return {void}
 */
function preload() {
    if (typeof loadSound === "function") {
        bgMusic = loadSound(
            "assets/retro-quest.mp3",
            () => { musicReady = true; },
            () => { musicReady = false; }
        );
    }
}

/**
 * @return {void}
 */
function setup() {
    createCanvas(CANVAS_W, CANVAS_H);

    const arenaX = ARENA_MARGIN_X;
    const arenaY = ARENA_MARGIN_TOP;

    physicsWorld = new PhysicsWorld(ARENA_W, ARENA_H);
    physicsWorld.buildBarriers(arenaX, arenaY);

    gameManager = new GameManager(physicsWorld, arenaX, arenaY, ARENA_W, ARENA_H);
    menuManager = new MenuManager(CANVAS_W, CANVAS_H);

    // Try to start music straight away on the menu. Browsers that block
    // autoplay defer the audio until startMusicOnce() runs from a gesture.
    startMusicOnce();
}

/**
 * @return {void}
 */
function draw() {
    if (appState === "game") {
        physicsWorld.update();
        gameManager.update();
        background(200);
        gameManager.draw();
    } else {
        menuManager.draw();
    }
}

/**
 * Autoplay is blocked until a user gesture, so this may be called from setup
 * (menu) and again from the first click or key; the guard makes it idempotent.
 * @return {void}
 */
function startMusicOnce() {
    if (musicStarted || !musicReady || !bgMusic) return;
    if (typeof userStartAudio === "function") userStartAudio();
    bgMusic.setVolume(musicMuted ? 0 : MUSIC_VOLUME);
    bgMusic.loop();
    musicStarted = true;
}

/**
 * @return {void}
 */
function toggleMusicMute() {
    musicMuted = !musicMuted;
    if (bgMusic) bgMusic.setVolume(musicMuted ? 0 : MUSIC_VOLUME);
}

/**
 * Mode keys work from anywhere, including the menu, dropping straight into
 * the arena.
 * @return {void}
 */
function keyPressed() {
    startMusicOnce();

    if (key === "1") { gameManager.startMode1(); appState = "game"; }
    if (key === "2") { gameManager.startMode2(); appState = "game"; }
    if (key === "3") { gameManager.startMode3(); appState = "game"; }
    if (appState === "game" && (key === "i" || key === "I")) gameManager.armSpawn();
    if (key === "m" || key === "M") toggleMusicMute();
    if (key === "Escape") { appState = "menu"; menuManager.screen = "main"; }
}

/**
 * @return {void}
 */
function mousePressed() {
    startMusicOnce();

    if (appState === "game") {
        gameManager.trySpawn(mouseX, mouseY);
        return;
    }

    const action = menuManager.handleClick(mouseX, mouseY);
    if (action === "modes") menuManager.screen = "modes";
    else if (action === "instructions") menuManager.screen = "instructions";
    else if (action === "back") menuManager.screen = "main";
    else if (action === "mode1") { gameManager.startMode1(); appState = "game"; }
    else if (action === "mode2") { gameManager.startMode2(); appState = "game"; }
    else if (action === "mode3") { gameManager.startMode3(); appState = "game"; }
}
