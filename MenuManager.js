/**
 * Pre-game menu system: a main menu with two entry points (Mode Select and
 * Instructions), plus the two sub-screens themselves. Entirely canvas-drawn
 * (no DOM) so it shares the same rendering pipeline as the arena. Clickable
 * regions are rebuilt every frame and hit-tested by the caller; hovering
 * brightens a region for feedback.
 */
class MenuManager {
    /**
     * @param {number} canvasW - Full canvas width in pixels.
     * @param {number} canvasH - Full canvas height in pixels.
     */
    constructor(canvasW, canvasH) {
        this.canvasW = canvasW;
        this.canvasH = canvasH;

        /** @type {"main"|"modes"|"instructions"} Active sub-screen. */
        this.screen = "main";
        /** @type {Array<object>} Clickable regions rebuilt every draw() call. */
        this.buttons = [];

        /** @type {Array<object>} Mode descriptions in British English. */
        this.modeInfo = [
            {
                title: "Mode 1 — Practice",
                action: "mode1",
                lines: [
                    "Four opponents start parked in the Start Zone.",
                    "A gentle introduction to the controls before",
                    "facing moving traffic."
                ]
            },
            {
                title: "Mode 2 — Random Opponents",
                action: "mode2",
                lines: [
                    "Four opponents spawn at random positions and",
                    "headings, each travelling in a straight line.",
                    "They ricochet off barriers and other cars."
                ]
            },
            {
                title: "Mode 3 — Advanced Opponents",
                action: "mode3",
                lines: [
                    "As Random Opponents, but each car weaves along",
                    "a sine-wave trajectory at a steady speed —",
                    "trickier to read and avoid."
                ]
            }
        ];

        /** @type {Array<Array<string>>} [heading, body] pairs for Instructions. */
        this.instructionItems = [
            ["Driving", "Arrow keys only. Up/Down accelerate or reverse; Left/Right steer."],
            ["Switching modes", "Press 1, 2 or 3 at any time to change arena mode (this clears the arena and restarts)."],
            ["Spawning", "Press I to arm spawning, then click inside the Start Zone (the pale blue bay on the left) to place your car."],
            ["Identification", "Your car is always coloured differently from every opponent, so it is easy to spot."],
            ["Barrier collisions", "Hitting the perimeter barrier reverses an opponent's heading and triggers an orange ripple."],
            ["Car collisions", "Hitting another car deflects both cars' headings by ninety degrees and triggers a spark flash."],
            ["Damage", "Repeated collisions tint a car's chassis towards red and eventually make it emit smoke."],
            ["Minimap", "The panel in the top-right corner shows every car's position; your car blinks white."]
        ];
    }

    /**
     * Draws the active sub-screen. Rebuilds the button list every call so
     * hit-testing always matches what is currently on screen.
     * @return {void}
     */
    draw() {
        this.buttons = [];
        background(24, 28, 34);

        if (this.screen === "main") this.drawMain();
        else if (this.screen === "modes") this.drawModes();
        else if (this.screen === "instructions") this.drawInstructions();
    }

    /**
     * Registers a clickable rectangle and renders it, brightened on hover.
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string} label
     * @param {string} action - Identifier returned by handleClick on hit.
     * @return {void}
     */
    button(x, y, w, h, label, action) {
        const hovered =
            mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
        this.buttons.push({ x: x, y: y, w: w, h: h, action: action });

        rectMode(CORNER);
        noStroke();
        fill(hovered ? 90 : 60, hovered ? 130 : 90, hovered ? 200 : 150);
        rect(x, y, w, h, 8);

        fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        text(label, x + w / 2, y + h / 2);
    }

    /**
     * Main menu: title plus two entry points.
     * @return {void}
     */
    drawMain() {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(46);
        text("DODGEM ARENA", this.canvasW / 2, this.canvasH / 2 - 120);

        textSize(18);
        fill(180);
        text(
            "A top-down bumper-car simulation built with p5.js and matter.js",
            this.canvasW / 2,
            this.canvasH / 2 - 75
        );

        const bw = 260, bh = 56;
        const bx = this.canvasW / 2 - bw / 2;
        this.button(bx, this.canvasH / 2 - 10, bw, bh, "Mode Select", "modes");
        this.button(bx, this.canvasH / 2 + 60, bw, bh, "Instructions", "instructions");
    }

    /**
     * Mode select screen: one card per arena mode with a British-English
     * description, plus a Back button.
     * @return {void}
     */
    drawModes() {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(34);
        text("SELECT A MODE", this.canvasW / 2, 74);

        const cardW = 400, cardH = 230, gap = 36;
        const totalW = cardW * 3 + gap * 2;
        const startX = this.canvasW / 2 - totalW / 2;
        const y = 150;

        for (let i = 0; i < this.modeInfo.length; i++) {
            const info = this.modeInfo[i];
            const x = startX + i * (cardW + gap);

            const hovered =
                mouseX >= x && mouseX <= x + cardW &&
                mouseY >= y && mouseY <= y + cardH;

            noStroke();
            fill(hovered ? 45 : 36, hovered ? 52 : 42, hovered ? 64 : 52);
            rect(x, y, cardW, cardH, 10);

            fill(255, 210, 100);
            textAlign(CENTER, TOP);
            textSize(21);
            text(info.title, x + cardW / 2, y + 20);

            fill(210);
            textSize(16);
            let ly = y + 66;
            for (const line of info.lines) {
                text(line, x + cardW / 2, ly);
                ly += 25;
            }

            this.buttons.push({ x: x, y: y, w: cardW, h: cardH, action: info.action });
        }

        this.button(this.canvasW / 2 - 90, y + cardH + 40, 180, 46, "Back", "back");
    }

    /**
     * Instructions screen: controls, spawning and collision rules in
     * British English, plus a Back button.
     * @return {void}
     */
    drawInstructions() {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(34);
        text("INSTRUCTIONS", this.canvasW / 2, 58);

        textAlign(LEFT, TOP);
        const leftX = this.canvasW / 2 - 400;
        const headingX = leftX;
        const bodyX = leftX + 190;
        const bodyW = 610;
        let y = 108;

        for (const [heading, body] of this.instructionItems) {
            fill(255, 210, 100);
            textSize(18);
            text(heading, headingX, y);
            fill(210);
            textSize(16);
            text(body, bodyX, y, bodyW);
            y += 68;
        }

        this.button(this.canvasW / 2 - 90, y + 10, 180, 46, "Back", "back");
    }

    /**
     * Hit-tests the click point against the buttons drawn on the last frame.
     * @param {number} mx
     * @param {number} my
     * @return {string|null} The action of the clicked button, or null.
     */
    handleClick(mx, my) {
        for (const b of this.buttons) {
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                return b.action;
            }
        }
        return null;
    }
}
