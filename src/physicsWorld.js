/** Class representing the physics simulation. */
class PhysicsWorld {
    /**
     * @param {number} arenaWidth
     * @param {number} arenaHeight
     */
    constructor(arenaWidth, arenaHeight) {
        this.arenaWidth = arenaWidth;
        this.arenaHeight = arenaHeight;

        this.Engine = Matter.Engine;
        this.World = Matter.World;
        this.Bodies = Matter.Bodies;
        this.Body = Matter.Body;
        this.Composite = Matter.Composite;
        this.Events = Matter.Events;

        this.engine = this.Engine.create();
        this.world = this.engine.world;

        // Top-down view, so no gravity on either axis.
        this.engine.gravity.x = 0;
        this.engine.gravity.y = 0;

        this.wallThickness = 40;
        this.barriers = [];

        // Arena origin, captured in buildBarriers and reused by setInset.
        this.offsetX = 0;
        this.offsetY = 0;

        // Kept by name so setInset can move them for Sudden Death.
        this.wallTop = null;
        this.wallBottom = null;
        this.wallLeft = null;
        this.wallRight = null;
    }

    /**
     * @param {number} offsetX - Left edge of the arena on the canvas.
     * @param {number} offsetY - Top edge of the arena on the canvas.
     * @return {void}
     */
    buildBarriers(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        const w = this.arenaWidth;
        const h = this.arenaHeight;
        const t = this.wallThickness;

        const wallOptions = {
            isStatic: true,
            restitution: 0.9,
            friction: 0.0,
            label: "barrier"
        };

        // Bodies are placed by centre. Horizontal walls are overlong (w + 2t)
        // so the corners stay sealed once setInset moves the walls inward.
        this.wallTop = this.Bodies.rectangle(
            offsetX + w / 2, offsetY - t / 2, w + t * 2, t, wallOptions
        );
        this.wallBottom = this.Bodies.rectangle(
            offsetX + w / 2, offsetY + h + t / 2, w + t * 2, t, wallOptions
        );
        this.wallLeft = this.Bodies.rectangle(
            offsetX - t / 2, offsetY + h / 2, t, h, wallOptions
        );
        this.wallRight = this.Bodies.rectangle(
            offsetX + w + t / 2, offsetY + h / 2, t, h, wallOptions
        );

        this.barriers = [
            this.wallTop, this.wallBottom, this.wallLeft, this.wallRight
        ];
        this.World.add(this.world, this.barriers);
    }

    /**
     * Moves the walls' inner faces inward to shrink the playable rectangle,
     * which is what pushes cars together during Sudden Death. Zero restores
     * full size.
     * @param {number} insetX - Horizontal shrink per side in pixels.
     * @param {number} insetY - Vertical shrink per side in pixels.
     * @return {void}
     */
    setInset(insetX, insetY) {
        const w = this.arenaWidth;
        const h = this.arenaHeight;
        const t = this.wallThickness;
        const ox = this.offsetX;
        const oy = this.offsetY;

        this.Body.setPosition(this.wallTop, {
            x: ox + w / 2, y: oy + insetY - t / 2
        });
        this.Body.setPosition(this.wallBottom, {
            x: ox + w / 2, y: oy + h - insetY + t / 2
        });
        this.Body.setPosition(this.wallLeft, {
            x: ox + insetX - t / 2, y: oy + h / 2
        });
        this.Body.setPosition(this.wallRight, {
            x: ox + w - insetX + t / 2, y: oy + h / 2
        });
    }

    /**
     * @param {Matter.Body} body - The body to insert into the simulation.
     * @return {void}
     */
    add(body) {
        this.World.add(this.world, body);
    }

    /**
     * @param {Matter.Body} body - The body to remove from the simulation.
     * @return {void}
     */
    remove(body) {
        this.World.remove(this.world, body);
    }

    /**
     * @return {void}
     */
    update() {
        this.Engine.update(this.engine, 1000 / 60);
    }

    /**
     * @param {function} callback - Receives the matter.js collision event.
     * @return {void}
     */
    onCollisionStart(callback) {
        this.Events.on(this.engine, "collisionStart", callback);
    }
}
