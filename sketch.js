/**
 * ══════════════════════════════════════════════════════════════════════
 * COMMENTARY (≤ 500 words)
 *
 * 1. PHYSICS
 * The arena is a top-down simulation with zero gravity (engine.gravity = 0
 * on both axes). Cars are matter.js rectangles with frictionAir modelling
 * tyre-ground drag — without it, vehicles would glide indefinitely.
 * Barriers use isStatic: true (infinite mass) and restitution: 0.9,
 * producing a firm bounce with slight energy loss. Two car archetypes
 * differ by density and enginePower: StandardCar (density 0.0012,
 * power 0.0009) is nimble; SlowCar (density 0.0028, power 0.0007)
 * is heavy and sluggish, transferring more impulse in collisions.
 * The throttle applies a directional force each frame via
 * Body.applyForce along the chassis angle, accumulating into smooth
 * acceleration; capSpeed clamps the velocity vector's magnitude to a
 * per-type ceiling, enforcing a realistic top speed for both
 * forward and reverse motion.
 *
 * 2. OPPONENT LOGIC (MODES 2 & 3)
 * Opponent driving uses the Strategy pattern. StraightStrategy (Mode 2)
 * enforces a fixed heading at constant speed via Body.setVelocity;
 * SineStrategy (Mode 3) oscillates the heading around a base direction
 * using sin(phase), where phase advances proportionally to frame count
 * and frequency. Both use enforceHeading(), which sets velocity and
 * angle directly — appropriate because opponents follow prescribed
 * paths rather than simulating engine inertia. The collision policy
 * mutates the strategy's heading externally: +PI on barrier contact,
 * ±PI/2 on car-car contact with random sign. SineStrategy also
 * shifts its baseHeading so the wave reflects correctly.
 *
 * 3. ANIMATIONS
 * Three particle systems share an emit/update/draw lifecycle.
 * MotionTrail: marks spawn at a car's position each frame if speed > 1;
 * size scales with speed via p5 map(). Marks fade and shrink linearly,
 * giving a speed-dependent visual trail. ImpactFlash: 10 radial sparks
 * burst from the contact point, decelerate via velocity damping (×0.9),
 * and fade over ~20 frames. BarrierPulse: a single ring expands and fades,
 * drawn as noFill stroked ellipse. All prune dead particles by
 * reverse-iteration splice.
 *
 * 4. CREATIVE EXTENSION
 * (a) Minimap — a scaled-down HUD in the top-right corner redraws all
 * cars as colour-coded dots; the player dot blinks for identification.
 * This required mapping world coordinates to minimap coordinates at
 * 15% scale and rendering a secondary viewport each frame.
 * (b) Damage system — each collision increments a per-car damage counter
 * stored in a Map keyed by body. Visual feedback is twofold: the chassis
 * colour interpolates toward dark red via lerpColor, and beyond a
 * threshold, grey smoke particles emit from the car, rising and
 * expanding. This adds persistent state and a second particle system
 * coupled to collision events, demonstrating technical depth beyond
 * simple scoring.
 * (c) Menu system — a canvas-drawn front end (Main Menu, Mode Select,
 * Instructions) gates entry into the arena, reusing the same p5 drawing
 * pipeline and mouse-based hit-testing as the rest of the game rather
 * than relying on external DOM/HTML controls.
 * ══════════════════════════════════════════════════════════════════════
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
// Top/bottom margins are kept equal so the arena stays vertically centred.
// The top margin must fit the perimeter wall plus the HUD text above it.
const ARENA_MARGIN_TOP = 100;
const ARENA_MARGIN_BOTTOM = 100;
const CANVAS_W = ARENA_W + ARENA_MARGIN_X * 2;
const CANVAS_H = ARENA_H + ARENA_MARGIN_TOP + ARENA_MARGIN_BOTTOM;

// Configurable opponent count as a global, per the spec.
let carNumbers = 4;

/** @type {"menu"|"game"} Which top-level screen is active. */
let appState = "menu";

/**
 * p5 setup: runs once. Creates the canvas, initialises the physics
 * world and barriers, and creates the game manager and menu system.
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
}

/**
 * p5 draw: runs ~60 times per second. Delegates to the arena simulation
 * while a mode is being played, or to the menu system otherwise.
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
 * p5 keyPressed: handles discrete key events (not held keys, which are
 * polled in draw via keyIsDown). Mode keys work from anywhere — including
 * straight from the menu — and drop the player directly into the arena.
 * @return {void}
 */
function keyPressed() {
    if (key === "1") { gameManager.startMode1(); appState = "game"; }
    if (key === "2") { gameManager.startMode2(); appState = "game"; }
    if (key === "3") { gameManager.startMode3(); appState = "game"; }
    if (appState === "game" && (key === "i" || key === "I")) gameManager.armSpawn();
    if (key === "Escape") { appState = "menu"; menuManager.screen = "main"; }
}

/**
 * p5 mousePressed: while playing, attempts to spawn the player car;
 * otherwise routes clicks to the active menu screen.
 * @return {void}
 */
function mousePressed() {
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
