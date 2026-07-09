/**
 * COMMENTARY (490 words).
 *
 * 1. PHYSICS
    * The arena is a simulation with no gravity (hence engine.gravity = 0 on both axes), 
    * where cars are matter.js rectangles with a frictionAir tyre drag. Without it, the 
    * cars would glide indefinitely. The barriers from the rectangle (arena) use isStatic = true, 
    * with infinite mass and a restitution of 0.9, making a firm bounce with energy loss. There are 
    * two types that differ by density and enginePower: the StandardCar is nimble and the Slow car 
    * is heavy and sluggish, which makes it transfer more impulse during collisions. The expanded bodies
    * are able to maintain their weight, acceleration and maximum velocity thanks to the adjustment of
    * density. The throttle applies directional force in Body.applyForce in every frame according to the
    * chassis angle, carSpeed converts movement into forward and sideways force and subtracts part of the 
    * sideways force in every frame because of the rotation of chassis, as quick turning rotates the chassis 
    * right away leaving the speed skewed so that the car will slide until the grip of the wheels 
    * gets aligned again.

 * 2. OPPONENT LOGIC (MODES 2 and 3)

    * In the case of the strategy approach, we can observe its usage among the opponents, where StraightStrategy 
    * (Mode 2) leads to maintaining heading at constant speed (using Body.setVelocity). SineStrategy (Mode 3) makes the 
    * heading oscillate around some direction based on trigonometric operations, using the fact that phase progresses regularly 
    * with time according to frame count. Employing enforceHeading() in both cases, which both determines the angle and speed 
    * at the same time, is reasonable for the project since it directs the movement and not applies game physics. The collision
    * basically leads to the change of the strategy heading from outside: +PI on barrier contact in addition to
    * either +PI/2 or -PI/2 when the car collides with another one (there can be a random case).

 * 3. ANIMATIONS
    * The particle system uses the same update and draw cycle, where:
    *   - MotionTrail created a speed-scaled fading markws;
    *   - ImpactFlash bursts sparks that decelerate and fade; 
    *   - BarrierPulse expands a stroke ring. 
    * Finally, the SkidMarks records a slow-fading dots under the rear tyres during player drift. All particles dead by dead 
    * reverse iteration cut.


 * 4. CREATIVE EXTENSION
    * i. Minimap: HUD mapping world coordinates in top right screen,
    * with the player dot blinking for better understanding.
    * ii. Damage system: for each car, a counter in a Map makes a lerpColor tint toward red plus, making it
    * change colour for each crash.
    * iii. An angle drift with skid marks (see physics above),
    * coupling the grip model to a dedicated visual. 
    * iv. Mode 3 dynamic arena: a Sudden Death phase, where the arena gradually moves the four static walls
    * inward (Body.setPosition) to shrink area where player can drive,
    * forcing cars to get together.
    * v. Boost pads apply a forward launch past the normal speed cap, going back to normal
    * after a few milliseconds.
    * vi. A menu, together with instruction draw directly using p5.js, and a background music via p5.sound
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
 * Wrapped so a missing or blocked file cannot abort the sketch.
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
