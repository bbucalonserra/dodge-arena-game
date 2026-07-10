# Dodgem Arena

A bumper car game built on p5.js for renderign and matter.js for physics.

## How to run

The game must be ran in a local web server (opening `index.html` directly from the file system blocks the music from loading).

### Option 1: VS Code Live Server

1. Open the project folder in VS Code.
2. Install the "Live Server" extension (if not installed).
3. Right click `index.html` and choose **Open with Live Server**.
4. The game opens in your browser.

### Option 2: Python

1. Open a terminal in the project folder.
2. Check if you have Python properly installed in your machine or local environment.
3. Run: `python -m http.server 8000`
4. Open `http://localhost:8000` in your browser.

## How to play

1. On the main menu, click **Mode Select** and select a mode (or press `1`, `2` or `3` at any time).
2. Press `I` to spawn the car, then click inside the blue **Start Zone** on the left to place your car where you want to start, but it must be in start zone.
3. Drive with the **arrow keys**: Up/Down for throttle and reverse, Left/Right to steer.

Other keys: `M` mutes the music, `Esc` returns to the menu.