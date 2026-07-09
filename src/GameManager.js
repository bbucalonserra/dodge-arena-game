/** Class representing the game manager. */
class GameManager {
    /**
     * @param {PhysicsWorld} physics - The shared physics facade.
     * @param {number} arenaX - Arena left edge on the canvas.
     * @param {number} arenaY - Arena top edge on the canvas.
     * @param {number} arenaW - Arena width in pixels.
     * @param {number} arenaH - Arena height in pixels.
     */
    constructor(physics, arenaX, arenaY, arenaW, arenaH) {
        this.physics = physics;
        this.arenaX = arenaX;
        this.arenaY = arenaY;
        this.arenaW = arenaW;
        this.arenaH = arenaH;

        this.startZoneW = arenaW * 0.2;

        /** @type {StandardCar|null} */
        this.playerCar = null;
        /** @type {Array<OpponentCar>} */
        this.opponents = [];

        this.spawnArmed = false;
        /** @type {number} 0 means no mode selected yet. */
        this.currentMode = 0;

        this.motionTrail = new MotionTrail();
        this.impactFlash = new ImpactFlash();
        this.barrierPulse = new BarrierPulse();

        this.damageSystem = new DamageSystem();
        this.skidMarks = new SkidMarks();
        this.minimap = new Minimap(arenaX, arenaY, arenaW, arenaH, 0.15);

        /** @type {Array<BoostPad>} */
        this.boostPads = [];
        this.BOOST_TARGET = 12;
        this.BOOST_FRAMES = 40;

        // Sudden Death timeline (seconds).
        this.SD_FIRST_WAIT = 18;
        this.SD_WAIT = 30;
        this.SD_DURATION = 18;
        this.SD_SHRINK_DUR = 3;
        this.SD_RESTORE_DUR = 1.5;
        // Inset per side; 0.15 shrinks the arena to 70% of full size.
        this.SD_MAX_INSET_FRAC = 0.15;

        this.sdPhase = "wait";
        this.sdTimer = 0;
        this.currentWait = this.SD_FIRST_WAIT;
        this.insetX = 0;
        this.insetY = 0;
        this.suddenDeathActive = false;

        // Density is compensated for the enlarged body (see Car subclasses).
        // Slow has lower grip, so it slides more under hard direction changes.
        this.standardConfig = {
            density: 0.000314,
            enginePower: 0.0009,
            maxSpeed: 7,
            turnRate: 0.06,
            frictionAir: 0.05,
            grip: 0.18,
            bodyColor: "#3EA85E",
            type: "standard"
        };
        this.slowConfig = {
            density: 0.000732,
            enginePower: 0.0007,
            maxSpeed: 4,
            turnRate: 0.045,
            frictionAir: 0.07,
            grip: 0.10,
            bodyColor: "#D4883E",
            type: "slow"
        };

        this.registerCollisionHandler();
    }

    /**
     * @return {void}
     */
    clearCars() {
        if (this.playerCar) {
            this.physics.remove(this.playerCar.body);
            this.playerCar = null;
        }
        for (const opp of this.opponents) {
            this.physics.remove(opp.body);
        }
        this.opponents = [];
        this.spawnArmed = false;
        this.damageSystem.reset();
        this.skidMarks.reset();
    }

    /**
     * Runs on every mode start so non-Mode-3 modes always get full-size walls.
     * @return {void}
     */
    resetSuddenDeath() {
        this.sdPhase = "wait";
        this.sdTimer = 0;
        this.currentWait = this.SD_FIRST_WAIT;
        this.insetX = 0;
        this.insetY = 0;
        this.suddenDeathActive = false;
        this.boostPads = [];
        this.physics.setInset(0, 0);
    }

    /**
     * @return {void}
     */
    startMode1() {
        this.clearCars();
        this.resetSuddenDeath();
        this.currentMode = 1;

        const spacing = (this.arenaH - 80) / carNumbers;
        for (let i = 0; i < carNumbers; i++) {
            const x = this.arenaX + this.startZoneW / 2;
            const y = this.arenaY + 60 + i * spacing;
            const cfg = i < 2 ? this.standardConfig : this.slowConfig;
            const opp = new OpponentCar(this.physics, x, y, cfg, new StaticStrategy());
            this.opponents.push(opp);
        }
    }

    /**
     * @return {void}
     */
    startMode2() {
        this.clearCars();
        this.resetSuddenDeath();
        this.currentMode = 2;
        this.spawnOpponentsRandom((heading) => {
            return new StraightStrategy(heading, 2.5);
        });
    }

    /**
     * @return {void}
     */
    startMode3() {
        this.clearCars();
        this.resetSuddenDeath();
        this.currentMode = 3;
        this.buildBoostPads();
        this.spawnOpponentsRandom((heading) => {
            return new SineStrategy(heading, 2.5, 0.6, 0.4);
        });
    }

    /**
     * Places opponents outside the Start Zone, rejecting positions that land
     * too close to an already-placed car.
     * @param {function} strategyFactory - Receives a heading, returns a strategy.
     * @return {void}
     */
    spawnOpponentsRandom(strategyFactory) {
        const positions = [];
        const minSep = 160;

        for (let i = 0; i < carNumbers; i++) {
            let x, y, valid;
            let attempts = 0;
            do {
                x = this.arenaX + this.startZoneW + 80 +
                    random(this.arenaW - this.startZoneW - 160);
                y = this.arenaY + 60 + random(this.arenaH - 120);
                valid = positions.every(
                    (p) => dist(p.x, p.y, x, y) > minSep
                );
                attempts++;
            } while (!valid && attempts < 200);

            positions.push({ x: x, y: y });

            const heading = random(TWO_PI);
            const cfg = i < 2 ? this.standardConfig : this.slowConfig;
            const strategy = strategyFactory(heading);
            const opp = new OpponentCar(this.physics, x, y, cfg, strategy);
            this.opponents.push(opp);
        }
    }

    /**
     * Fixed spots in the open arena. The stored angle only orients each pad's
     * chevrons.
     * @return {void}
     */
    buildBoostPads() {
        const ax = this.arenaX;
        const ay = this.arenaY;
        const aw = this.arenaW;
        const ah = this.arenaH;
        this.boostPads = [
            new BoostPad(ax + aw * 0.45, ay + ah * 0.28, 120, 84, 0),
            new BoostPad(ax + aw * 0.66, ay + ah * 0.72, 120, 84, -HALF_PI),
            new BoostPad(ax + aw * 0.83, ay + ah * 0.42, 120, 84, PI)
        ];
    }

    /**
     * @return {void}
     */
    armSpawn() {
        if (this.currentMode === 0) return;
        this.spawnArmed = true;
    }

    /**
     * @param {number} mx - Mouse x in canvas pixels.
     * @param {number} my - Mouse y in canvas pixels.
     * @return {boolean} Whether the spawn succeeded.
     */
    trySpawn(mx, my) {
        if (!this.spawnArmed || this.playerCar) return false;

        if (
            mx < this.arenaX ||
            mx > this.arenaX + this.startZoneW ||
            my < this.arenaY ||
            my > this.arenaY + this.arenaH
        ) {
            return false;
        }

        const minSep = 120;
        for (const opp of this.opponents) {
            if (dist(mx, my, opp.body.position.x, opp.body.position.y) < minSep) {
                return false;
            }
        }

        this.playerCar = new StandardCar(this.physics, mx, my, "#3B8BD4");
        this.spawnArmed = false;
        return true;
    }

    /**
     * @return {void}
     */
    registerCollisionHandler() {
        this.physics.onCollisionStart((event) => {
            for (const pair of event.pairs) {
                const a = pair.bodyA;
                const b = pair.bodyB;
                // supports[0] is the contact point; fall back to the midpoint.
                const contactPoint = pair.collision.supports[0] ||
                    { x: (a.position.x + b.position.x) / 2,
                        y: (a.position.y + b.position.y) / 2 };

                const aIsBarrier = a.label === "barrier";
                const bIsBarrier = b.label === "barrier";
                const aIsCar = a.label === "car";
                const bIsCar = b.label === "car";

                if (aIsCar && bIsBarrier) {
                    this.onBarrierHit(a.carRef, contactPoint);
                } else if (bIsCar && aIsBarrier) {
                    this.onBarrierHit(b.carRef, contactPoint);
                } else if (aIsCar && bIsCar) {
                    this.onCarCarHit(a.carRef, b.carRef, contactPoint);
                }
            }
        });
    }

    /**
     * Reverses an opponent's heading by 180 degrees.
     * @param {Car} car - The car that hit the barrier.
     * @param {object} point - {x, y} of the contact.
     * @return {void}
     */
    onBarrierHit(car, point) {
        this.barrierPulse.emit(point.x, point.y);
        this.damageSystem.registerHit(car);

        // Reverse whichever field the strategy actually steers by, so Sine
        // opponents (baseHeading, no heading) respond to walls too.
        if (car instanceof OpponentCar) {
            if (car.strategy.heading !== undefined) car.strategy.heading += Math.PI;
            if (car.strategy.baseHeading !== undefined) car.strategy.baseHeading += Math.PI;
        }
    }

    /**
     * Deflects each opponent's heading by a random plus or minus 90 degrees.
     * @param {Car} carA - First car in the collision.
     * @param {Car} carB - Second car in the collision.
     * @param {object} point - {x, y} of the contact.
     * @return {void}
     */
    onCarCarHit(carA, carB, point) {
        this.impactFlash.emit(point.x, point.y);
        this.damageSystem.registerHit(carA);
        this.damageSystem.registerHit(carB);

        const deflect = (car) => {
            if (!(car instanceof OpponentCar)) return;
            const sign = random() > 0.5 ? 1 : -1;
            if (car.strategy.heading !== undefined) {
                car.strategy.heading += sign * (Math.PI / 2);
            }
            if (car.strategy.baseHeading !== undefined) {
                car.strategy.baseHeading += sign * (Math.PI / 2);
            }
        };
        deflect(carA);
        deflect(carB);
    }

    /**
     * @return {void}
     */
    handleInput() {
        if (!this.playerCar) return;
        if (keyIsDown(UP_ARROW)) this.playerCar.throttle(1);
        if (keyIsDown(DOWN_ARROW)) this.playerCar.throttle(-1);
        if (keyIsDown(LEFT_ARROW)) this.playerCar.steer(-1);
        if (keyIsDown(RIGHT_ARROW)) this.playerCar.steer(1);
    }

    /**
     * Runs the Mode 3 cycle: wait, gradual inward shrink held for a few
     * seconds, then gradual restore. The first wait is shorter; later ones
     * are longer. Pads are dropped when the shrink starts and rebuilt when
     * the arena reopens.
     * @return {void}
     */
    updateSuddenDeath() {
        const dt = deltaTime / 1000;
        this.sdTimer += dt;

        if (this.sdPhase === "wait") {
            this.insetX = 0;
            this.insetY = 0;
            if (this.sdTimer >= this.currentWait) {
                this.sdPhase = "active";
                this.sdTimer = 0;
                this.currentWait = this.SD_WAIT;
                this.boostPads = [];
            }
        } else if (this.sdPhase === "active") {
            const factor = Math.min(this.sdTimer / this.SD_SHRINK_DUR, 1);
            this.insetX = this.SD_MAX_INSET_FRAC * factor * this.arenaW;
            this.insetY = this.SD_MAX_INSET_FRAC * factor * this.arenaH;
            if (this.sdTimer >= this.SD_DURATION) {
                this.sdPhase = "restore";
                this.sdTimer = 0;
            }
        } else if (this.sdPhase === "restore") {
            const factor = Math.max(1 - this.sdTimer / this.SD_RESTORE_DUR, 0);
            this.insetX = this.SD_MAX_INSET_FRAC * factor * this.arenaW;
            this.insetY = this.SD_MAX_INSET_FRAC * factor * this.arenaH;
            if (this.sdTimer >= this.SD_RESTORE_DUR) {
                this.sdPhase = "wait";
                this.sdTimer = 0;
                this.insetX = 0;
                this.insetY = 0;
                this.buildBoostPads();
            }
        }

        this.physics.setInset(this.insetX, this.insetY);
        this.suddenDeathActive = this.sdPhase !== "wait";
    }

    /**
     * Safety net so opponents never grind along or slip through a wall.
     * A collisionStart only fires once per contact, so a car pinned by another
     * car or overtaken by a moving Sudden Death wall gets no further event.
     * Each frame this reflects the heading component aimed at a nearby wall and
     * hard-clamps the body inside the current bounds (which follow the shrink).
     * @return {void}
     */
    keepOpponentsInBounds() {
        const soft = 60;
        const innerLeft = this.arenaX + this.insetX;
        const innerRight = this.arenaX + this.arenaW - this.insetX;
        const innerTop = this.arenaY + this.insetY;
        const innerBottom = this.arenaY + this.arenaH - this.insetY;

        for (const opp of this.opponents) {
            const s = opp.strategy;
            const prop = s.heading !== undefined
                ? "heading"
                : (s.baseHeading !== undefined ? "baseHeading" : null);
            if (!prop) continue;

            const p = opp.body.position;

            let cos = Math.cos(s[prop]);
            let sin = Math.sin(s[prop]);
            let reflected = false;
            if (p.x < innerLeft + soft && cos < 0) { cos = -cos; reflected = true; }
            else if (p.x > innerRight - soft && cos > 0) { cos = -cos; reflected = true; }
            if (p.y < innerTop + soft && sin < 0) { sin = -sin; reflected = true; }
            else if (p.y > innerBottom - soft && sin > 0) { sin = -sin; reflected = true; }
            if (reflected) s[prop] = Math.atan2(sin, cos);

            const halfW = opp.w / 2;
            const halfH = opp.h / 2;
            const cx = Math.max(innerLeft + halfW, Math.min(innerRight - halfW, p.x));
            const cy = Math.max(innerTop + halfH, Math.min(innerBottom - halfH, p.y));
            if (cx !== p.x || cy !== p.y) {
                this.physics.Body.setPosition(opp.body, { x: cx, y: cy });
            }
        }
    }

    /**
     * @return {void}
     */
    applyBoosts() {
        if (this.currentMode !== 3 || this.suddenDeathActive) return;

        const cars = [...this.opponents];
        if (this.playerCar) cars.push(this.playerCar);

        for (const car of cars) {
            for (const pad of this.boostPads) {
                if (pad.contains(car.body.position.x, car.body.position.y)) {
                    car.boost(this.BOOST_TARGET, this.BOOST_FRAMES);
                }
            }
        }
    }

    /**
     * @return {void}
     */
    emitSkidMarks() {
        if (!this.playerCar || !this.playerCar.isDrifting) return;

        const c = this.playerCar;
        const a = c.body.angle;
        const rearX = c.body.position.x - Math.cos(a) * c.w * 0.28;
        const rearY = c.body.position.y - Math.sin(a) * c.w * 0.28;
        const latX = -Math.sin(a);
        const latY = Math.cos(a);
        const off = c.h * 0.32;

        this.skidMarks.emit(rearX + latX * off, rearY + latY * off);
        this.skidMarks.emit(rearX - latX * off, rearY - latY * off);
    }

    /**
     * @return {void}
     */
    update() {
        this.handleInput();

        if (this.currentMode === 3) this.updateSuddenDeath();

        this.keepOpponentsInBounds();

        if (this.playerCar) {
            this.playerCar.update();
            this.motionTrail.emit(
                this.playerCar.body.position.x,
                this.playerCar.body.position.y,
                this.playerCar.getSpeed(),
                this.playerCar.bodyColor
            );
        }

        for (const opp of this.opponents) {
            opp.update();
            this.motionTrail.emit(
                opp.body.position.x,
                opp.body.position.y,
                opp.getSpeed(),
                opp.bodyColor
            );
        }

        this.applyBoosts();
        this.emitSkidMarks();

        this.motionTrail.update();
        this.impactFlash.update();
        this.barrierPulse.update();
        this.damageSystem.update();
        this.skidMarks.update();
    }

    /**
     * Draws the arena at its current (possibly shrunk) size. Walls tint red
     * while Sudden Death is active.
     * @return {void}
     */
    drawArena() {
        const ix = this.insetX;
        const iy = this.insetY;
        const ax = this.arenaX + ix;
        const ay = this.arenaY + iy;
        const aw = this.arenaW - 2 * ix;
        const ah = this.arenaH - 2 * iy;
        const szw = aw * 0.2;

        fill(230, 235, 240);
        noStroke();
        rect(ax, ay, aw, ah);

        fill(180, 215, 240);
        rect(ax, ay, szw, ah);

        push();
        fill(100);
        textSize(20);
        textAlign(CENTER, CENTER);
        translate(ax + szw / 2, ay + ah / 2);
        rotate(-HALF_PI);
        text("START ZONE", 0, 0);
        pop();

        // Perimeter drawn to match the physics walls.
        const t = this.physics.wallThickness;
        if (this.suddenDeathActive) {
            fill(120, 50, 50);
        } else {
            fill(80);
        }
        noStroke();
        rect(ax - t, ay - t, aw + t * 2, t);
        rect(ax - t, ay + ah, aw + t * 2, t);
        rect(ax - t, ay, t, ah);
        rect(ax + aw, ay, t, ah);
    }

    /**
     * @return {void}
     */
    drawCars() {
        for (const opp of this.opponents) {
            const original = opp.bodyColor;
            opp.bodyColor = this.damageSystem.getTintedColor(opp);
            opp.draw();
            opp.bodyColor = original;
        }
        // Player keeps its distinct colour and gets an outline so it stays
        // identifiable; its damage still shows through the smoke.
        if (this.playerCar) {
            this.playerCar.draw(true);
        }
    }

    /**
     * @return {void}
     */
    draw() {
        this.drawArena();

        if (this.currentMode === 3 && !this.suddenDeathActive) {
            for (const pad of this.boostPads) pad.draw();
        }

        this.skidMarks.draw();
        this.motionTrail.draw();
        this.drawCars();
        this.impactFlash.draw();
        this.barrierPulse.draw();
        this.damageSystem.drawSmoke();

        const allCars = [...this.opponents];
        if (this.playerCar) allCars.push(this.playerCar);
        this.minimap.draw(allCars, this.playerCar);

        this.drawHUD();
    }

    /**
     * @return {void}
     */
    drawHUD() {
        push();
        fill(50);
        noStroke();
        textSize(17);
        textAlign(LEFT, TOP);
        const x = this.arenaX;
        const y = 10;
        text(
            "Mode: " + (this.currentMode || "none") +
            "  |  [1/2/3] Switch  |  [I] Arm spawn  |  Arrows: drive" +
            "  |  [M] Mute  |  [Esc] Menu",
            x, y
        );
        if (this.spawnArmed && !this.playerCar) {
            fill(200, 60, 60);
            text("SPAWN ARMED: click inside the Start Zone", x, y + 22);
        }

        if (this.suddenDeathActive) {
            const shrinking =
                this.sdPhase === "active" && this.sdTimer < this.SD_SHRINK_DUR;
            if (shrinking) {
                // Large blinking banner, centred, only while the arena closes in.
                if (frameCount % 30 < 20) {
                    fill(200, 40, 40);
                    textSize(72);
                    textAlign(CENTER, CENTER);
                    text("SUDDEN DEATH", width / 2, height / 2);
                }
            } else {
                // Parked top-right afterwards, clear of the HUD line.
                fill(200, 40, 40);
                textSize(26);
                textAlign(RIGHT, TOP);
                text("SUDDEN DEATH", width - 20, 8);
            }
        }
        pop();
    }
}
