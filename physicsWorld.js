/**
 * Facade over the matter.js engine. Owns the single source of physical
 * truth for the simulation: it creates the engine, holds the world,
 * builds the arena barriers, and advances the simulation one step per
 * frame. Every other module interacts with matter.js only through here.
 */
class PhysicsWorld {
  /**
   * @param {number} arenaWidth
   * @param {number} arenaHeight
   */
  constructor(arenaWidth, arenaHeight) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    // Aliases into the matter.js namespace keep call sites short.
    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    this.Body = Matter.Body;
    this.Composite = Matter.Composite;
    this.Events = Matter.Events;

    this.engine = this.Engine.create();
    this.world = this.engine.world;

    // Top-down arena: no downward gravity, cars glide on a flat surface.
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;

    // Thickness of the perimeter barrier in pixels.
    this.wallThickness = 40;
    this.barriers = [];
  }

  /**
   * Builds the four perimeter walls as static bodies and adds them to
   * the world. Walls are hard, bouncy surfaces (high restitution) and
   * never move (isStatic), so cars rebound off them cleanly.
   * @param {number} offsetX - Left edge of the arena on the canvas.
   * @param {number} offsetY - Top edge of the arena on the canvas.
   * @return {void}
   */
  buildBarriers(offsetX, offsetY) {
    const w = this.arenaWidth;
    const h = this.arenaHeight;
    const t = this.wallThickness;

    const wallOptions = {
      isStatic: true,
      restitution: 0.9,
      friction: 0.0,
      label: "barrier"
    };

    // Each wall is centred on its midpoint; matter.js rectangles are
    // defined by centre x, centre y, width, height.
    const top = this.Bodies.rectangle(
      offsetX + w / 2, offsetY - t / 2, w + t * 2, t, wallOptions
    );
    const bottom = this.Bodies.rectangle(
      offsetX + w / 2, offsetY + h + t / 2, w + t * 2, t, wallOptions
    );
    const left = this.Bodies.rectangle(
      offsetX - t / 2, offsetY + h / 2, t, h, wallOptions
    );
    const right = this.Bodies.rectangle(
      offsetX + w + t / 2, offsetY + h / 2, t, h, wallOptions
    );

    this.barriers = [top, bottom, left, right];
    this.World.add(this.world, this.barriers);
  }

  /**
   * Adds an arbitrary matter.js body (e.g. a car) to the world.
   * @param {Matter.Body} body - The body to insert into the simulation.
   * @return {void}
   */
  add(body) {
    this.World.add(this.world, body);
  }

  /**
   * Removes a body from the world (e.g. when despawning a car).
   * @param {Matter.Body} body - The body to remove from the simulation.
   * @return {void}
   */
  remove(body) {
    this.World.remove(this.world, body);
  }

  /**
   * Advances the physics simulation by one fixed time step. Called once
   * per p5 draw() frame so physical state stays in lockstep with rendering.
   * @return {void}
   */
  update() {
    this.Engine.update(this.engine, 1000 / 60);
  }

  /**
   * Registers a callback fired whenever two bodies begin touching.
   * Used by the game to trigger collision responses and animations.
   * @param {function} callback - Receives the matter.js collision event.
   * @return {void}
   */
  onCollisionStart(callback) {
    this.Events.on(this.engine, "collisionStart", callback);
  }
}
