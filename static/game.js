// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;  // tiles
const MAP_HEIGHT = 18; // tiles
const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

// Game state
let player = {
    x: 1,
    y: 1,
    health: 100,
    maxHealth: 100,
    speed: 0.15, // tiles per second
    lastMoveTime: 0
};
let enemies = [];
let tiles = []; // 2D array: 0 = floor, 1 = wall
let currentLevel = 1;
let score = 0;
let gameLoop;
let lastTimestamp = 0;
let keys = {};

// Input handling
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// Sprite cache
const sprites = {};

async function loadSprite(name, url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load sprite ${url}`));
        img.src = url;
    });
}

async function loadSprites() {
    // Attempt to load from assets/sprites/; fallback to colored rects
    const spriteList = [
        {name: 'player', url: '/assets/sprites/player.png'},
        {name: 'enemy1', url: '/assets/sprites/enemy1.png'},
        {name: 'enemy2', url: '/assets/sprites/enemy2.png'},
        {name: 'enemy3', url: '/assets/sprites/enemy3.png'},
        {name: 'enemy4', url: '/assets/sprites/enemy4.png'},
        {name: 'floor', url: '/assets/sprites/floor.png'},
        {name: 'wall', url: '/assets/sprites/wall.png'}
    ];
    for (const {name, url} of spriteList) {
        try {
            sprites[name] = await loadSprite(name, url);
        } catch (e) {
            console.warn(`Sprite ${name} not found, using placeholder`);
            sprites[name] = null;
        }
    }
}

// Drawing helpers
function drawSprite(ctx, sprite, tileX, tileY) {
    if (sprite) {
        ctx.drawImage(sprite, tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else {
        // placeholder color based on name
        const colors = {
            player: 'green',
            enemy1: 'red',
            enemy2: 'orange',
            enemy3: 'purple',
            enemy4: 'brown',
            floor: '#444',
            wall: '#888'
        };
        // We don't have name here; fallback to gray
        ctx.fillStyle = 'gray';
        ctx.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function drawRect(ctx, color, tileX, tileY) {
    ctx.fillStyle = color;
    ctx.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

// Level loading
async function loadLevel(levelNum) {
    const response = await fetch(`/api/level/${levelNum}`);
    if (!response.ok) {
        console.error('Failed to load level');
        return false;
    }
    const data = await response.json();
    // Expect data.tiles (2D array) and data.entities (list)
    tiles = data.tiles;
    // Reset entities
    enemies = [];
    // Place player at start position if defined, else default
    if data.playerStart {
        player.x = data.playerStart.x;
        player.y = data.playerStart.y;
    } else {
        // find first floor tile
        outer: for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                if (tiles[y][x] === 0) {
                    player.x = x;
                    player.y = y;
                    break outer;
                }
            }
        }
    }
    // Spawn enemies based on data.enemies
    for (const ent of data.entities || []) {
        if (ent.type.startsWith('enemy')) {
            enemies.push({
                x: ent.x,
                y: ent.y,
                type: ent.type,
                health: ent.health || 30,
                maxHealth: ent.health || 30,
                // behavior will be defined in updateEnemy
            });
        }
    }
    currentLevel = levelNum;
    // Update UI
    document.getElementById('level').textContent = currentLevel;
    return true;
}

// Game logic
function update(deltaTime) {
    // Player movement
    const moveSpeed = player.speed * deltaTime; // tiles per frame
    let moved = false;
    if (keys['arrowup'] || keys['w']) { if (canMove(player.x, player.y - moveSpeed)) { player.y -= moveSpeed; moved = true; } }
    if (keys['arrowdown'] || keys['s']) { if (canMove(player.x, player.y + moveSpeed)) { player.y += moveSpeed; moved = true; } }
    if (keys['arrowleft'] || keys['a']) { if (canMove(player.x - moveSpeed, player.y)) { player.x -= moveSpeed; moved = true; } }
    if (keys['arrowright'] || keys['d']) { if (canMove(player.x + moveSpeed, player.y)) { player.x += moveSpeed; moved = true; } }

    // Update enemies
    for (const enemy of enemies) {
        updateEnemy(enemy, deltaTime);
    }

    // Check collisions player vs enemies
    for (const enemy of enemies) {
        if (distance(player, enemy) < 0.5) { // touching
            player.health -= 10 * deltaTime; // damage per second
            if (player.health <= 0) {
                // Game over
                alert('Game Over! Score: ' + Math.floor(score));
                resetGame();
                return;
            }
        }
    }

    // Simple scoring: increase over time
    score += deltaTime * 10;

    // Update UI
    document.getElementById('health').textContent = Math.floor(player.health);
    document.getElementById('score').textContent = Math.floor(score);

    // Level progression: if no enemies left, go to next level
    if (enemies.length === 0) {
        score += 100; // bonus for clearing level
        if (currentLevel < 3) {
            loadLevel(currentLevel + 1);
        } else {
            alert('You Win! Final Score: ' + Math.floor(score));
            resetGame();
        }
    }
}

// Distance between entities (tile units)
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
}

// Check if position is walkable (within bounds and not wall)
function canMove(x, y) {
    // Convert to tile indices for collision checking
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= tiles[0].length || iy >= tiles.length) return false;
    // Check the tile and neighboring tiles for simplicity
    return tiles[iy][ix] === 0; // floor
}

// Enemy AI
function updateEnemy(enemy, deltaTime) {
    const speed = 0.05 * deltaTime; // slower than player
    switch (enemy.type) {
        case 'enemy1': // melee chaser
            chase(enemy, player, speed);
            break;
        case 'enemy2': // ranged shooter (not implemented shooting, just chase)
            chase(enemy, player, speed * 0.7);
            break;
        case 'enemy3': // fast zigzag
            // move randomly with some bias toward player
            if (Math.random() < 0.3) {
                chase(enemy, player, speed * 1.5);
            } else {
                randomWalk(enemy, speed * 1.5);
            }
            break;
        case 'enemy4': // tanky slow, tries to block
            chase(enemy, player, speed * 0.4);
            break;
        default:
            randomWalk(enemy, speed);
    }
}

function chase(entity, target, speed) {
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
        const moveX = (dx / dist) * speed;
        const moveY = (dy / dist) * speed;
        if (canMove(entity.x + moveX, entity.y + moveY)) {
            entity.x += moveX;
            entity.y += moveY;
        } else {
            // try sliding
            if (canMove(entity.x + moveX, entity.y)) entity.x += moveX;
            if (canMove(entity.x, entity.y + moveY)) entity.y += moveY;
        }
    }
}

function randomWalk(entity, speed) {
    const dir = Math.random() * Math.PI * 2;
    const moveX = Math.cos(dir) * speed;
    const moveY = Math.sin(dir) * speed;
    if (canMove(entity.x + moveX, entity.y + moveY)) {
        entity.x += moveX;
        entity.y += moveY;
    }
}

// Rendering
function render(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Draw tiles
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            const tile = tiles[y][x];
            if (tile === 1) {
                drawSprite(ctx, sprites.wall, x, y);
            } else {
                drawSprite(ctx, sprites.floor, x, y);
            }
        }
    }
    // Draw enemies
    for (const enemy of enemies) {
        let spriteKey = 'enemy1';
        switch (enemy.type) {
            case 'enemy1': spriteKey = 'enemy1'; break;
            case 'enemy2': spriteKey = 'enemy2'; break;
            case 'enemy3': spriteKey = 'enemy3'; break;
            case 'enemy4': spriteKey = 'enemy4'; break;
            default: spriteKey = 'enemy1';
        }
        drawSprite(ctx, sprites[spriteKey], enemy.x, enemy.y);
    }
    // Draw player
    drawSprite(ctx, sprites.player, player.x, player.y);
    // UI updates done via DOM
}

// Main loop
function gameLoopFunc(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;

    update(deltaTime);
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    render(ctx);

    gameLoop = requestAnimationFrame(gameLoopFunc);
}

// Initialize
async function init() {
    await loadSprites();
    // Set canvas size
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    // Load first level
    await loadLevel(1);
    // Start loop
    gameLoop = requestAnimationFrame(gameLoopFunc);
}

// Reset game
function resetGame() {
    cancelAnimationFrame(gameLoop);
    lastTimestamp = 0;
    player.health = player.maxHealth;
    score = 0;
    enemies = [];
    init();
}

// Start
init();