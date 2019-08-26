/*
    DotLoading by Rph

    This file is a part of DotLoading, a project submitted into the public domain.
    You are free to use this file for any purpose you wish.
    The author provides absolutely no warranty for anything related to this file.
 */

// ToDo: Make this a parameter to the main function
window.dotLoadingConfig = {
    canvas: "__particles_canvas"
};

// Don't pollute window (besides our config, oh well)
let dotLoading = (function() {
    // Physics engine constants
    const gravity = 0.2; // Gravity in pixels per frame
    const friction = 0.025; // Friction (reduction of speed to the sides)
    const terminalV = 30; // Terminal velocity

    // Master objects (circles) Map
    const objects = new Map();

    // Speed of movement of the virtual adder
    const adderSpeed = 1.5;

    // Next ID for the circle
    let nextId = 0;

    // If this becomes 1, everything stops.
    let stop = 0;

    /* region Rainbow */
    // This generator generates new RGB values from a rainbow
    function * rainbow() {
        let r = 255, g = 0, b = 0; // Intermediate values
        let steps = 0, stage = 0;
        while(true) {
            yield {r, g, b};
            steps++;
            if (steps > 255) {
                steps = 0;
                stage++;
            }

            if (stage > 5)
                stage = 0;

            switch(stage) {
                case 0:
                    g = steps;
                    break;
                case 1:
                    r = 255 - steps;
                    break;
                case 2:
                    b = steps;
                    break;
                case 3:
                    g = 255 - steps;
                    break;
                case 4:
                    r = steps;
                    break;
                case 5:
                    b = 255 - steps;
                    break;
            }
        }
    }

    // Calculate ALL rainbow values into a lookup table, will be used by the render function.
    const rainbowValues = [];
    const rainbowGenerator = rainbow();
    for (let i = 0; i < 1535; i++) { // 1535 = 256 * 6 - 1 (amount of steps in the full rainbow)
        rainbowValues.push(
            rainbowGenerator.next().value
        );
    }
    /* endregion */

    /* region Canvas Setup */
    // Acquire both the canvas object and the rendering context
    const canvas = document.getElementById(window.dotLoadingConfig.canvas);
    const renderingContext = canvas.getContext("2d");

    function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    updateCanvasSize();

    // We don't want the canvas to distort itself
    window.addEventListener("resize", updateCanvasSize);
    /* endregion */

    /* region Render loop */
    // Values that change at runtime
    let colorTableOffset = 0;

    // Get color from the lookup table based on the current offset and the distance off the left.
    function getColorForX(x) {
        // Base width in pixels of a color step
        const colorStep = rainbowValues.length / window.innerWidth;

        // Which color step we are on
        let location = Math.floor(colorStep * x);

        // Adding the offset and if its over the colorstep length limit, cut off.
        location += colorTableOffset;
        location = location % rainbowValues.length;

        let color = rainbowValues[location]; // Final color, now we need to build a `rgb()` string
        if (!color) color = {r:255, g: 255, b: 255}; // Fix for a really weird bug
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    // Render, this function is called from the physics engine after it calculates new states.
    function renderObjects() {
        renderingContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
        objects.forEach(function(v) {
            renderingContext.fillStyle = getColorForX(v.position.x);
            renderingContext.beginPath();
            renderingContext.arc(v.position.x, v.position.y, v.radius, 0, 2 * Math.PI);
            renderingContext.fill();
        });
        colorTableOffset++;
    }

    /* endregion */

    /* region Physics */
    // This function tries to bring `number` closer to `0` maximum by `step` either negative or positive
    function reduceTowardsZero(number, step) {
        if (number === 0) return 0;

        const wasInverted = (number < 0);
        number = Math.abs(number); // We only work on absolute values, to make the code complexity lower.

        if (number < step && number > 0) // Number lower than step, greater than zero, we have zero.
            return 0;

        number -= step; // After all other possibilities are removed, number is greater than step.
        if (wasInverted)
            number *= -1; // Invert it back, if it was inverted

        return number;
    }

    // This function takes into account: gravity, friction, terminalV and applies them to x,y values
    function updateMomentum(x, y) {
        // Updating movement to sides (Friction)
        x = reduceTowardsZero(x, friction); // We have our new x momentum.

        y += gravity; // Add gravity
        if (y > terminalV) // And cap downwards momentum
            y = terminalV;

        return {x, y};
    }

    // This function takes momentum and position and updates the position.
    function updatePosition(x, y, momentumX, momentumY) {
        x += momentumX;
        y += momentumY;
        return {x, y};
    }

    // Main physics loop, goes over every existing object and updates it
    function physicsTick() {
        objects.forEach(function(v, k) {
            let newMomentum = updateMomentum(v.momentum.x, v.momentum.y);
            let newPosition = updatePosition(
                v.position.x,
                v.position.y,
                newMomentum.x,
                newMomentum.y
            );

            v.momentum = newMomentum;
            v.position = newPosition;

            // Check if it went off screen + some threshold
            if (v.position.y > (window.innerHeight * 1.5)) {
                objects.delete(k);
            }
        });

        renderObjects();

        if (!stop)
            requestAnimationFrame(physicsTick);
    }
    /* endregion */

    /* region Element Adder */
    let currentXoffset = 0; // Current offset from the center of the screen;
    let currentOffsetChangeDirection = adderSpeed;
    let addDot = 0; // This decides if current run of additionLoop can add a dot.
    function addElement(x) {
        let momentum = {
            x: (Math.random() * 10) - 5, // So it moves in either direction, a bit
            y: Math.random() * -((Math.sqrt(window.innerHeight * gravity) * 1.5) + 10) // Thru trial and error I came to this, idk why
        };

        // Bottom of the screen at x
        let position = {
            x,
            y: window.innerHeight
        };

        let radius = Math.floor(Math.random() * 20) + 5;

        nextId++; // Increment nextId, it doesn't matter by itself but makes things work
        objects.set(nextId, {
            momentum,
            position,
            radius
        });
    }

    // This function basically adds new stuff all the time
    function additionLoop() {
        let x = window.innerWidth / 2;
        let realX = x + currentXoffset;
        if (addDot === 0)
            addElement(realX);

        addDot++;
        if (addDot > 7)
            addDot = 0;

        currentXoffset+=currentOffsetChangeDirection;
        if (currentXoffset > x)
            currentOffsetChangeDirection = -adderSpeed;

        if (currentXoffset < -x)
            currentOffsetChangeDirection = adderSpeed;

        if (!stop)
            requestAnimationFrame(additionLoop);
    }
    /* endregion */

    function startEverything() {
        stop = 0;
        objects.clear();
        for (let i = 0; i < 10; i++)
            additionLoop();

        // Kick start the physics by running the first tick manually
        physicsTick();
    }

    function stopEverything() {
        // Reset everything.
        stop = 1;
        objects.clear();
    }

    return {stopEverything, startEverything}
})();

dotLoading.startEverything();