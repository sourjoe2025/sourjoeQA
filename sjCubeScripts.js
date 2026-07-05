//Start of scripts for Flip Box
const flipMsg = [   
        '<strong><em>By Home Bakers - For Home Bakers<sup>&copy</sup></em></strong>',
        'Oh, My! - (Whole Wheat) Goodness',
        'Bubbly & Heady - The Leaven is Ready!',
        'Slap, Fold, Go - Strengthen the Dough...',
        "Don't ask Why - I love dark Rye",
        'What the - Focaccia!',

        '<strong><em>By Home Bakers - For Home Bakers<sup>&copy</sup></em></strong>',
        'Pan de mie - for PB & J',
        'Sourdough Pizza - Gimme a Piece, huh!',
        'Skilled & Steady - A Baker is always ready!',
        'Rustic Bread weekly - Easy Peasy!',
        'My first Bake - result was Great!',

        '<strong><em>By Home Bakers - For Home Bakers<sup>&copy</sup></em></strong>',
        'Wheat Berries = Bread Fairies!',
        'Salute the Kernel',
        'Yes you can - Bake Bread in a Pan',
        "Don't get bored - Mix it Up!",
        "Let's Bake!"
    ];
const imageUrls = [
    "url('https://sjmedia0.w3spaces.com/sjICONS/logoSOURJOETRANSPARENT_Cropped_31Aug21.png')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/breadWWloaf.png')",
    "url('https://sjmedia0.w3spaces.com/sjMP4/floatTest.gif')",
    "url('https://sjmedia0.w3spaces.com/sjMP4/Slap_And_Fold_GIF_d87abace95.gif')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/breadRyeDark.jpg')",
    "url('https://sjmedia0.w3spaces.com/sjMP4/5_FOCACCIA_Dimple.gif')",

    "url('https://sjmedia0.w3spaces.com/sjICONS/logoSOURJOETRANSPARENT_Cropped_31Aug21.png')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/breadPandeMei.jpg')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/breadPizzaOnPeel.jpg')",
    "url('https://sjmedia0.w3spaces.com/sjMP4/prepGIF.gif')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/breadRusticLoaf.jpg')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/crustCrumbMyFirstBake.jpg')",

    "url('https://sjmedia0.w3spaces.com/sjICONS/logoSOURJOETRANSPARENT_Cropped_31Aug21.png')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/WheatBerries.png')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/WheatKernel.png')",
    "url('https://sjmedia0.w3spaces.com/sjPICS/breadPanLoaf.png')",
    "url('https://sjmedia0.w3spaces.com/sjMP4/Initial_Mix_GIF.gif')",
    "url('https://sjmedia0.w3spaces.com/sjMP4/6_Bake_Uncovered.gif')"
];

// ✅ 2026-03-13 🧩 [SJ-CUBE-JS-01] Harden cube boot logic so the module is reusable as a standalone include.
// - Wait for DOM readiness instead of executing immediately.
// - Guard missing markup so this file can be loaded on pages that do not render the cube.
// - Apply the FIRST image set on boot (the previous flow skipped to the second set immediately).
(function () {
    'use strict';

    const setLength = 6;  //6 sides to a cube
    const numberOfSets = Math.floor(imageUrls.length / setLength);  //number of sets of images for the cube
    let currentFace = 0; // Start on the front face (SJ logo)
    let imageSet = 0; //first set of images

    const faces = [
        { x: 0, y: 0, z: 0 },         // Front
        { x: 0, y: 90, z: 360 },      // Right
        { x: 0, y: 180, z: 0 },       // Back
        { x: 0, y: -90, z: -360 },    // Left
        { x: 90, y: 0, z: 0 },        // Top
        { x: -90, y: 0, z: 360 }      // Bottom
    ];

    let cube = null;
    let flipBoxMsg = null;
    let rotationTimer = null;
    let setTimer = null;

    function applyImageSet(index) {
        if (!numberOfSets) return;

        imageSet = ((index % numberOfSets) + numberOfSets) % numberOfSets;

        for (let i = 0; i < setLength; i++) {  //update *{} in CSS to current set
            const targetImg = "--image-" + (i + 1);
            const newURL = imageUrls[i + setLength * imageSet];
            document.documentElement.style.setProperty(targetImg, newURL);
        }
    }

    function queueNextSet() {
        window.clearTimeout(setTimer);

        // Delay to allow cube face to reach SJ logo (avoids image set load flash)
        setTimer = window.setTimeout(function () {
            applyImageSet(imageSet + 1);
        }, 4500);
    }

    function rotateCube() {
        if (!cube || !flipBoxMsg || !numberOfSets) return;

        // Schedule the next rotation
        rotationTimer = window.setTimeout(rotateCube, 8000);

        // Set rotation to the current face
        const { x, y, z } = faces[currentFace];

        // Queue the next image set when we return to the front/logo face.
        if (currentFace === 0) { queueNextSet(); }

        cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;

        // Keep the caption synchronized with the currently visible set/face.
        const msgIndex = currentFace + setLength * imageSet;
        flipBoxMsg.innerHTML = flipMsg[msgIndex] || '';

        // Move to the next face, cycling back to 0 if necessary
        currentFace = (currentFace + 1) % faces.length;
    }

    function initCube() {
        cube = document.querySelector('.cube');
        flipBoxMsg = document.getElementById('flipBoxMsg');

        if (!cube || !flipBoxMsg || !numberOfSets) return;

        applyImageSet(0);
        rotateCube();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCube, { once: true });
    } else {
        initCube();
    }
})();
