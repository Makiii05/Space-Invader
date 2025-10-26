const btn = document.querySelectorAll(".btn");
const selector = document.querySelectorAll(".selector");

const menuCon = document.querySelector("#menu-con");
const hpCon = document.querySelector("#hp-con");
const statsCon = document.querySelector("#stats-con");
const mainCon = document.querySelector("#main-con");
const instructionCon = document.querySelector("#instruction-con");

const scoreEl = document.getElementById("scoreEl");
const roundEl = document.getElementById("roundEl");
const enemyEl = document.getElementById("enemyEl");
const lifeEl = document.getElementById("life-con");
const hpBar = document.getElementById("hp-bar");
const superBallBar = document.getElementById("super-ball-bar");
const healBar = document.getElementById("heal-bar");

const shootS = new Audio("mp3/shoot.wav");
const explosionS = new Audio("mp3/explosion.wav");
const healS = new Audio("mp3/heal.mp3");
const superballS = new Audio("mp3/superball.mp3");

const mainS = new Audio("mp3/main.mp3");
mainS.loop = true;
mainS.volume = 0.5;

const menuS = new Audio("mp3/menu.mp3");
menuS.loop = true;
menuS.volume = 1;

const keys = {};
let bullets = [];
let enemies = [];
let curRound;
let gameLoopRunning = false;
let gameLoopId = null;
let currentPlayer = null;
let keyHandlers = { down: null, up: null };
let lastPowerUpUpdate = 0;
let backgroundY = 0;

let playerHp = 100;
let score = 0;
let enemyCount = 0;
let superBall = 0;
let heal = 0;
let life = 3;

let menu_btn_selected_id = 0;
let page = "Menu";
let nextRoundCalled = false;

const classicRound = {
    1: ["line", 20, 3000, 1],
    2: ["diagonal", 20, 1000, 1],
    3: ["arrow", 2, 1000, 1],
    4: ["boss", 1, 1000, 20],
    5: ["line", 30, 750, 1],
    6: ["diagonal", 30, 750, 1],
    7: ["arrow", 3, 1000, 1],
    8: ["boss", 2, 1000, 30],
    9: ["line", 50, 500, 1],
    10: ["diagonal", 50, 500, 1],
    11: ["arrow", 4, 1000, 1],
    12: ["mothership", 1, 3000, 40],
};

function updateSelection() {
    btn.forEach((b, i) => {
        if (i === menu_btn_selected_id) {
            b.classList.add("fs-5");
            selector[i].classList.remove("d-none");
        } else {
            b.classList.remove("fs-5");
            selector[i].classList.add("d-none");
        }
    });
}

function updatePage() {
    [menuCon, hpCon, statsCon, mainCon, instructionCon].forEach(el => {
        el.classList.add("d-none");
    });
    stopGame();

    if (page === "Menu") {
        playMenuS();
        stopMainS();
        resetGameState();
        menuCon.classList.remove("d-none");
    } else if (page === "Classic Mode") {
        playMainS();
        stopMenuS();
        curRound = 1;
        mainCon.classList.remove("d-none");
        hpCon.classList.remove("d-none");
        statsCon.classList.remove("d-none");
        loadMainBackground();
        startCountdown(mainCon);
    } else if (page === "Instruction") {
        instructionCon.classList.remove("d-none");
    }
}

function updateStats() {
    lifeEl.innerHTML = "";
    for (let i = 0; i < life; i++) {
        lifeEl.innerHTML += `<img id="life-img" src="img/sprite/player.png">`;
    }
    hpBar.style.width = playerHp + "%";
    scoreEl.innerText = score;
    roundEl.innerText = curRound + "/" + Object.keys(classicRound).length;
    enemyCount = enemies.length;
    enemyEl.innerText = enemyCount;
}

function updatePowerUPs() {
    if (superBall < 100) {
        superBall += 1;
        superBallBar.style.width = superBall + "%";
        superBallBar.style.backgroundColor = "green";
    } else {
        superBallBar.style.backgroundColor = "red";
    }

    if (heal < 100) {
        heal += 2;
        healBar.style.width = heal + "%";
        healBar.style.backgroundColor = "green";
    } else {
        healBar.style.backgroundColor = "red";
    }
}

function loadMainBackground() {
    mainCon.style.backgroundImage = "url('img/backdrop/starfield.png')";
    mainCon.style.backgroundRepeat = "repeat-y";
    mainCon.style.backgroundSize = "cover";
    mainCon.style.backgroundPosition = "0% 0%";
}

function resetGameState() {
    gameLoopRunning = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    backgroundY = 0;
    mainCon.style.backgroundPosition = "0% 0%";


    playerHp = 100;
    score = 0;
    enemyCount = 0;
    superBall = 0;
    heal = 0;
    life = 3;
    curRound = null;
    nextRoundCalled = false;

    Object.keys(keys).forEach(k => delete keys[k]);

    if (keyHandlers.down) {
        document.removeEventListener("keydown", keyHandlers.down);
        keyHandlers.down = null;
    }
    if (keyHandlers.up) {
        document.removeEventListener("keyup", keyHandlers.up);
        keyHandlers.up = null;
    }

    if (currentPlayer && currentPlayer.el && currentPlayer.el.parentNode) {
        currentPlayer.el.remove();
    }
    currentPlayer = null;

    bullets.forEach(b => {
        if (b.el && b.el.parentNode) b.el.remove();
        if (b.moveInterval) clearInterval(b.moveInterval);
    });
    enemies.forEach(e => {
        if (e.el && e.el.parentNode) e.el.remove();
        if (e.moveInterval) clearInterval(e.moveInterval);
        if (e.attackInterval) clearInterval(e.attackInterval);
    });
    bullets = [];
    enemies = [];

    menu_btn_selected_id = 0;
    updateSelection();

    mainCon.innerHTML = "";
    hpCon.classList.add("d-none");
    statsCon.classList.add("d-none");
    instructionCon.classList.add("d-none");
    menuCon.classList.add("d-none");

    hpBar.style.width = "100%";
    superBallBar.style.width = "0%";
    superBallBar.style.backgroundColor = "green";
    healBar.style.width = "0%";
    healBar.style.backgroundColor = "green";
    lifeEl.innerHTML = "";
    for (let i = 0; i < life; i++) {
        lifeEl.innerHTML += `<img id="life-img" src="img/sprite/player.png">`;
    }

    scoreEl.innerText = 0;
    roundEl.innerText = "- / " + Object.keys(classicRound).length;
    enemyEl.innerText = 0;
    page = "Menu";
    lastPowerUpUpdate = 0;
}

function stopGame() {
    gameLoopRunning = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    if (keyHandlers.down) {
        document.removeEventListener("keydown", keyHandlers.down);
        keyHandlers.down = null;
    }
    if (keyHandlers.up) {
        document.removeEventListener("keyup", keyHandlers.up);
        keyHandlers.up = null;
    }
    if (currentPlayer && currentPlayer.el && currentPlayer.el.parentNode) {
        currentPlayer.el.remove();
    }
    currentPlayer = null;
    bullets.forEach(b => {
        if (b.el && b.el.parentNode) b.el.remove();
        if (b.moveInterval) clearInterval(b.moveInterval);
    });
    enemies.forEach(e => {
        if (e.el && e.el.parentNode) e.el.remove();
        if (e.moveInterval) clearInterval(e.moveInterval);
    });
    bullets = [];
    enemies = [];
    Object.keys(keys).forEach(key => delete keys[key]);
}

function mothershipAttack(enemy, container) {
    if (!gameLoopRunning || !enemy || enemy.remove) return;
    let bulletsFired = 0;
    const bulletFireRate = 100;
    const totalBullets = 10;
    const shootInterval = setInterval(() => {
        if (!gameLoopRunning || !enemy || enemy.remove || !currentPlayer) {
            clearInterval(shootInterval);
            return;
        }
        if (bulletsFired >= totalBullets) {
            clearInterval(shootInterval);
            return;
        }
        const playerX = currentPlayer.x + 4.5;
        const playerY = currentPlayer.y;
        const bulletX = enemy.x + 28;
        const bulletY = enemy.y + 28;
        const bullet = new EnemyBullet(bulletX, bulletY, playerX, playerY);
        bullet.render(container);
        bulletsFired++;
    }, bulletFireRate);
}

function startCountdown(pageCon) {
    pageCon.innerHTML = `
        <div id="countdown-con" class="fs-1 text-center border d-flex flex-column align-items-center justify-content-center h-100">
            <small class="fs-3">(${page})</small>
            <p>GET READY!</p>
            <p>GAME STARTS IN</p>
        </div>`;
    const countdownEl = document.createElement("p");
    document.getElementById("countdown-con").appendChild(countdownEl);
    let count = 3;
    const timer = setInterval(() => {
        if (count > 0) {
            countdownEl.innerText = count;
            count--;
        } else {
            countdownEl.innerText = "GO!";
            clearInterval(timer);
            setTimeout(() => {
                if (page === "Classic Mode") {
                    pageCon.innerHTML = "";
                    classicMode(mainCon);
                }
            }, 1000);
        }
    }, 1000);
}

function classicMode(container) {
    stopGame();

    currentPlayer = new Player(100, 1);
    currentPlayer.render(container);

    keyHandlers.down = (e) => {
        keys[e.key] = true;
        if (e.key === " ") {
            e.preventDefault();
        }
        if (e.key.toLowerCase() === "x" && gameLoopRunning) {
            if (playerHp < 100 && heal >= 100) {
                playHealS()
                playerHp += 10;
                heal = 0;
                if (playerHp > 100) playerHp = 100;
                updateStats();
            }
        }
        if (e.key.toLowerCase() === "z" && gameLoopRunning && currentPlayer) {
            if (superBall >= 100) {
                playSuperballS()
                e.preventDefault();
                currentPlayer.shoot(container, true);
                superBall = 0;
                updateStats();
            }
        }
    };

    keyHandlers.up = (e) => {
        keys[e.key] = false;
    };

    document.addEventListener("keydown", keyHandlers.down);
    document.addEventListener("keyup", keyHandlers.up);

    const roundData = classicRound[curRound];
    if (!roundData) {
        console.error("Invalid round:", curRound);
        return;
    }

    const [type, number, speed, hp] = roundData;

    if (type === "line") {
        spawnLineEnemies(container, number, speed, hp);
    } else if (type === "diagonal") {
        spawnDiagonalEnemies(container, number, speed, hp);
    } else if (type === "arrow") {
        spawnArrowEnemies(container, number, speed, hp);
    } else if (type === "boss" || type === "mothership") {
        spawnBoss(container, speed, hp, type);
    }

    gameLoopRunning = true;
    function gameLoop(timestamp) {
        if (!gameLoopRunning) return;

        if (currentPlayer) {
            if (keys["ArrowLeft"]) currentPlayer.move("left");
            if (keys["ArrowRight"]) currentPlayer.move("right");
            if (keys[" "]) {
                currentPlayer.shoot(container);
            }
        }

        if (!lastPowerUpUpdate || timestamp - lastPowerUpUpdate >= 1000) {
            updatePowerUPs();
            lastPowerUpUpdate = timestamp;
        }
        backgroundY += 0.5;
        mainCon.style.backgroundPosition = `0px ${backgroundY}px`;

        checkCollisions();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);

    gameLoop();
    updateStats();
    updatePowerUPs();
}

function spawnLineEnemies(container, number, speed, hp) {
    const enemiesPerRow = 10;
    const spacingX = 5;
    const spacingY = 5;
    const totalRows = Math.ceil(number / enemiesPerRow);
    let spawned = 0;

    for (let row = 0; row < totalRows; row++) {
        let enemiesThisRow = Math.min(enemiesPerRow, number - spawned);
        let rowY = 5 + row * spacingY;
        let startX = 5;

        for (let i = 0; i < enemiesThisRow; i++) {
            const x = startX + i * spacingX;
            const min = x - 5;
            const max = x + ((enemiesThisRow * 5) - 5);

            const enemy = new Enemy(x, rowY, speed, hp, "line");
            enemy.render(container);
            enemy.move(min, max);
            updateStats();

            spawned++;
        }
    }
}

function spawnDiagonalEnemies(container, number, speed, hp) {
    let summoned = 0;
    const spawn = setInterval(() => {
        if (summoned/2 >= number || !gameLoopRunning) {
            clearInterval(spawn);
            return;
        }
        const enemyR = new Enemy(0, 0, speed, hp, "diagonal");
        enemyR.render(container);
        enemyR.move(0, 95);
        const enemyL = new Enemy(95, 0, speed, hp, "diagonal");
        enemyL.render(container);
        enemyL.move(0, 95);
        updateStats();
        summoned++;
    }, 400);
}

function spawnArrowEnemies(container, number, speed, hp) {
    const numRow = number;
    const enemyPerRow = 20;
    const centerX = 50;
    const spacing = 5;

    for (let i = 0; i < enemyPerRow; i++) {
        const offset = (i - enemyPerRow / 2) * spacing;
        const x = centerX + offset;
        const y = 5 + (enemyPerRow / 2 - Math.abs(i - enemyPerRow / 2)) * 1.8;

        const enemy = new Enemy(x, y, speed, hp, "arrow");
        enemy.render(container);
        enemy.move(x + 20, x - 10);
        updateStats();
    }
}

function spawnBoss(container, speed, hp, type = "boss") {
    const enemy = new Enemy(45, 10, speed, hp, type);

    if (type === "mothership") {
        enemy.el.style.width = "60%";
        enemy.el.src = "img/sprite/mothership.png";
        enemy.render(container);
        enemy.move(0, 40);

        const attackInterval = setInterval(() => {
            if (!gameLoopRunning || enemy.remove || enemy.hp <= 0) {
                clearInterval(attackInterval);
                return;
            }
            mothershipAttack(enemy, container);
        }, 3000);
    } else {
        enemy.el.style.width = "15%";
        enemy.el.src = "img/sprite/boss.gif";
        enemy.render(container);
        enemy.move(10, 80);
    }

    updateStats();
}

function checkCollisions() {
    if (!gameLoopRunning) return;

    bullets.forEach(bullet => {
        if (bullet.remove || !bullet.el) return;
        const bRect = bullet.el.getBoundingClientRect();
        enemies.forEach(enemy => {
            if (enemy.remove || !enemy.el) return;
            const eRect = enemy.el.getBoundingClientRect();
            if (
                bRect.left < eRect.right &&
                bRect.right > eRect.left &&
                bRect.top < eRect.bottom &&
                bRect.bottom > eRect.top
            ) {
                playExplosionS()
                enemy.hp -= bullet.damage;
                enemy.el.style.filter = "brightness(200%)";
                setTimeout(() => enemy.el && (enemy.el.style.filter = "brightness(100%)"), 100);
                if (!bullet.bulletSkill) {
                    bullet.remove = true;
                }
                if (enemy.hp <= 0) {
                    score += 10;
                    enemy.remove = true;
                    updateStats();
                    enemy.el.src = "img/sprite/explode.gif";
                    setTimeout(() => enemy.el?.remove(), 500);
                }
            }
        });
    });

    if (currentPlayer && currentPlayer.el) {
        const pRect = currentPlayer.el.getBoundingClientRect();
        document.querySelectorAll('.enemy-bullet').forEach(bulletEl => {
            const bRect = bulletEl.getBoundingClientRect();
            if (
                pRect.left < bRect.right &&
                pRect.right > bRect.left &&
                pRect.top < bRect.bottom &&
                pRect.bottom > bRect.top
            ) {
                playerHp -= 10;
                updateStats();
                currentPlayer.el.style.filter = "brightness(50%)";
                setTimeout(() => {
                    if (currentPlayer && currentPlayer.el)
                        currentPlayer.el.style.filter = "brightness(100%)";
                }, 200);
                bulletEl.remove();
                if (playerHp <= 0) {
                    if(life == 0)
                        gameOver();
                    life--;
                    playerHp = 100;
                }
            }
        });
    }

    bullets = bullets.filter(b => {
        if (b.remove) {
            if (b.el && b.el.parentNode) {
                b.el.remove();
            }
            if (b.moveInterval) {
                clearInterval(b.moveInterval);
            }
            return false;
        }
        return true;
    });

    enemies = enemies.filter(e => {
        if (e.remove) {
            if (e.moveInterval) {
                clearInterval(e.moveInterval);
            }
            return false;
        }
        return true;
    });

    if (enemies.length === 0 && gameLoopRunning && !nextRoundCalled) {
        nextRoundCalled = true;
        nextRound();
        setTimeout(() => {
            nextRoundCalled = false;
        }, 4000);
    }
    checkPlayerEnemyCollision();
}

function checkPlayerEnemyCollision() {
    if (!currentPlayer || !currentPlayer.el) return;
    const pRect = currentPlayer.el.getBoundingClientRect();

    enemies.forEach(enemy => {
        if (enemy.remove || !enemy.el) return;
        const eRect = enemy.el.getBoundingClientRect();
        if (
            pRect.left < eRect.right &&
            pRect.right > eRect.left &&
            pRect.top < eRect.bottom &&
            pRect.bottom > eRect.top
        ) {
            playExplosionS()
            playerHp -= 5;
            updateStats();
            currentPlayer.el.style.filter = "brightness(50%)";
            setTimeout(() => {
                if (currentPlayer && currentPlayer.el)
                    currentPlayer.el.style.filter = "brightness(100%)";
            }, 200);
            enemy.hp = 0;
            enemy.remove = true;
            if (enemy.el) {
                enemy.el.src = "img/sprite/explode.gif";
                setTimeout(() => enemy.el?.remove(), 400);
            }
            if (playerHp <= 0) {
                life--;
                if (life == 0) {
                    gameOver();
                } else {
                    playerHp = 100;
                }
            }
        }
    });
    enemies = enemies.filter(e => !e.remove);
}

function gameOver() {
    stopGame();
    mainCon.innerHTML = `
        <div class="fs-1 text-center border d-flex flex-column align-items-center justify-content-center h-100 text-danger">
            <p>GAME OVER 💀</p>
            <p>Your HP reached 0</p>
            <p>Press ESC to return to Menu</p>
        </div>`;
}

function nextRound() {
    if (!gameLoopRunning) return;
    gameLoopRunning = false;
    curRound++;
    updateStats();
    if (classicRound[curRound]) {
        mainCon.innerHTML = `
            <div id="round-con" class="fs-1 text-center border d-flex flex-column align-items-center justify-content-center h-100">
                <p>ROUND ${curRound}</p>
                <p>GET READY!</p>
            </div>`;
        setTimeout(() => {
            if (page === "Classic Mode") {
                mainCon.innerHTML = "";
                classicMode(mainCon);
            }
        }, 2000);
    } else {
        mainCon.innerHTML = `
            <div class="fs-1 text-center border d-flex flex-column align-items-center justify-content-center h-100">
                <p>YOU WIN!</p>
                <p>All rounds completed</p>
                <p>Press ESC to return to Menu</p>
            </div>`;
        stopGame();
    }
}

function playMainS() {
    try { mainS.currentTime = 0; mainS.play(); }
    catch (err) { console.log("mainS blocked:", err); }
}

function stopMainS() {
    try { mainS.pause(); mainS.currentTime = 0; }
    catch (e) { }
}

// Menu music controls
function playMenuS() {
    try { menuS.currentTime = 0; menuS.play(); }
    catch (err) { console.log("Menu sound blocked:", err); }
}

function stopMenuS() {
    try { menuS.pause(); menuS.currentTime = 0; }
    catch (e) { }
}

function playShootS() {
    try { 
        const s = shootS.cloneNode(); 
        s.volume = 0.3; 
        s.play(); }
    catch (e) { 

    }
}

function playExplosionS() {
    try { 
        const s = explosionS.cloneNode(); 
        s.volume = 0.3; 
        s.play(); }
    catch (e) { 

    }
}

function playHealS(){
    try { 
        const s = healS.cloneNode(); 
        s.play(); }
    catch (e) { 

    }
}

function playSuperballS(){
    try { 
        const s = superballS.cloneNode();
        s.volume = 0.4; 
        s.play(); 
        setTimeout(()=>{
            s.pause()
        }, 1500)
    }catch (e) { 

    }
}


class Player {
    constructor(hp, playerNo) {
        this.hp = hp;
        this.playerNo = playerNo;
        this.x = 45;
        this.y = 90;
        this.min_x = 0;
        this.max_x = 90;
        this.shooted = false;
        this.fireRate = 300;

        this.el = document.createElement("img");
        this.el.src = "img/sprite/player.png";
        this.el.style.position = "absolute";
        this.el.style.width = "10%";
        this.el.style.height = "auto";
        this.el.style.top = this.y + "%";
        this.el.style.left = this.x + "%";
        this.el.style.backgroundColor = "transparent";
    }

    render(container) {
        container.appendChild(this.el);
    }

    move(direction) {
        if (!gameLoopRunning) return;
        const moveSpeed = 0.5;
        if (direction === "left" && this.x > this.min_x) {
            this.x -= moveSpeed;
        }
        if (direction === "right" && this.x < this.max_x) {
            this.x += moveSpeed;
        }
        this.el.style.left = this.x + "%";
    }

    shoot(container, bulletSkill = false) {
        if (!gameLoopRunning) return;
        if (this.shooted == false) {
            playShootS();
            let bulletX = this.x + 4.5;
            let bulletY = this.y - 5;
            if (bulletSkill) {
                bulletX = this.x + 0.5;
                bulletY = this.y - 15;
            }
            const bullet = new Bullet(bulletX, bulletY, bulletSkill);
            bullet.render(container);
            this.shooted = true;
            setTimeout(() => { this.shooted = false }, this.fireRate);
        }
    }
}

class Enemy {
    constructor(x, y, speed, hp, type) {
        this.hp = hp;
        this.x = x;
        this.y = y;
        this.direction = "right";
        this.speed = speed;
        this.type = type;
        this.remove = false;
        this.moveInterval = null;

        this.el = document.createElement("img");
        this.el.src = "img/sprite/enemy.gif";
        this.el.style.position = "absolute";
        this.el.style.width = "5%";
        this.el.style.height = "auto";
        this.el.style.top = this.y + "%";
        this.el.style.left = this.x + "%";
        this.el.style.backgroundColor = "transparent";
    }

    render(container) {
        container.appendChild(this.el);
        enemies.push(this);
    }

    move(min, max) {
        this.moveInterval = setInterval(() => {
            if (this.hp <= 0 || this.remove || !gameLoopRunning) {
                clearInterval(this.moveInterval);
                this.moveInterval = null;
                return;
            }
            if (this.y >= 95) {
                playExplosionS()
                this.hp = 0;
                this.el.src = "img/sprite/explode.gif";
                this.remove = true;
                clearInterval(this.moveInterval);
                this.moveInterval = null;
                return;
            }
            if (this.type === "line" || this.type === "boss") {
                if (this.direction === "right") {
                    this.x += 1;
                    if (this.x >= max) {
                        this.direction = "left";
                        this.y += 2;
                    }
                } else {
                    this.x -= 1;
                    if (this.x <= min) {
                        this.direction = "right";
                        this.y += 2;
                    }
                }
            } else if (this.type === "diagonal") {
                if (this.direction === "right") {
                    this.x += 1;
                    if (this.x >= max) {
                        this.direction = "left";
                    }
                } else {
                    this.x -= 1;
                    if (this.x <= min) {
                        this.direction = "right";
                    }
                }
                this.y += 0.1;
            } else if (this.type === "arrow") {
                this.y += 0.5;
            } else if (this.type === "mothership") {
                if (this.direction === "right") {
                    this.x += 1;
                    if (this.x >= max) {
                        this.direction = "left";
                    }
                } else {
                    this.x -= 1;
                    if (this.x <= min) {
                        this.direction = "right";
                    }
                }
            }
            if (this.el) {
                this.el.style.top = this.y + "%";
                this.el.style.left = this.x + "%";
            }
        }, this.speed / 20);
    }
}

class Bullet {
    constructor(x, y, bulletSkill = false) {
        this.x = x;
        this.y = y;
        this.remove = false;
        this.moveInterval = null;
        this.bulletSkill = bulletSkill;

        this.speed = bulletSkill ? 1.1 : 2;
        this.damage = bulletSkill ? 5 : 1;

        this.el = document.createElement("img");
        this.el.src = bulletSkill ? "img/sprite/enemy-bullet.png" : "img/sprite/bullet.png";
        this.el.className = "bullet";
        this.el.style.position = "absolute";
        this.el.style.width = bulletSkill ? "15%" : "1%";
        this.el.style.height = bulletSkill ? "15%" : "3%";
        this.el.style.left = this.x + "%";
        this.el.style.top = this.y + "%";
        this.el.style.backgroundColor = "transparent";
    }

    render(container) {
        container.appendChild(this.el);
        bullets.push(this);
        this.move();
    }

    move() {
        this.moveInterval = setInterval(() => {
            if (this.remove || !gameLoopRunning) {
                clearInterval(this.moveInterval);
                this.moveInterval = null;
                return;
            }
            this.y -= this.speed;
            if (this.y < 0) {
                clearInterval(this.moveInterval);
                this.moveInterval = null;
                this.remove = true;
                if (this.el && this.el.parentNode) {
                    this.el.remove();
                }
                bullets = bullets.filter(b => b !== this);
                return;
            }
            if (this.el) {
                this.el.style.top = this.y + "%";
            }
        }, 20);
    }
}

class EnemyBullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.remove = false;
        this.moveInterval = null;
        this.speed = 1.5;
        this.damage = 10;

        this.el = document.createElement("img");
        this.el.src = "img/sprite/enemy-bullet.png";
        this.el.className = "enemy-bullet";
        this.el.style.position = "absolute";
        this.el.style.width = "2%";
        this.el.style.height = "auto";
        this.el.style.left = this.x + "%";
        this.el.style.top = this.y + "%";
        this.el.style.backgroundColor = "transparent";
    }

    render(container) {
        container.appendChild(this.el);
        this.move();
    }

    move() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const moveX = (dx / distance) * this.speed;
        const moveY = (dy / distance) * this.speed;

        this.moveInterval = setInterval(() => {
            if (this.remove || !gameLoopRunning) {
                clearInterval(this.moveInterval);
                this.moveInterval = null;
                return;
            }
            this.x += moveX;
            this.y += moveY;

            if (this.y > 100 || this.x < -5 || this.x > 105) {
                clearInterval(this.moveInterval);
                this.moveInterval = null;
                this.remove = true;
                if (this.el && this.el.parentNode) {
                    this.el.remove();
                }
                return;
            }
            if (this.el) {
                this.el.style.top = this.y + "%";
                this.el.style.left = this.x + "%";
            }
        }, 50);
    }
}

document.addEventListener("keydown", (event) => {
    if (page === "Menu") {
        if (event.key === "ArrowUp" && menu_btn_selected_id > 0) menu_btn_selected_id--;
        else if (event.key === "ArrowDown" && menu_btn_selected_id < btn.length - 1) menu_btn_selected_id++;
        else if (event.key === "Enter") {
            const btn_selected = btn[menu_btn_selected_id];
            page = btn_selected.innerText;
            updatePage();
        }
        updateSelection();
    }
    if (event.key === "Escape") {
        page = "Menu";
        updatePage();
    }
});

function main() {
    updateSelection();
    updatePage();
}

main();
