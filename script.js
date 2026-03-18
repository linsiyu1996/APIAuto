const keys = {};
const weapons = {
    1: { type: 'normal', damage: 1, speed: 6, active: false, charge: 0 },
    2: { type: 'double', damage: 1, speed: 6, active: false, charge: 0 },
    3: { type: 'spread', damage: 1, speed: 6, active: false, charge: 0 },
    4: { type: 'laser', damage: 2, speed: 6, active: false, charge: 0 },
    5: { type: 'missile', damage: 3, speed: 4, active: false, charge: 0 },
    6: { type: 'machine', damage: 1, speed: 8, active: false, charge: 0 }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.level = 1;
        this.score = 0;
        this.life = 100;
        this.shield = 50;
        this.coins = 0;
        this.weaponsActive = [];
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.ship = {
            x: this.width / 2,
            y: this.height - 50,
            width: 40,
            height: 40,
            speed: 3,
            life: 100
        };
        
        this.initGame();
    }
    
    initGame() {
        this.enemyTimer = setInterval(() => this.createEnemy(), 1000);
        window.addEventListener('keydown', this.handleKeydown.bind(this));
        window.addEventListener('keyup', this.handleKeyup.bind(this));
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 16);
    }
    
    handleKeydown(e) {
        keys[e.key.toLowerCase()] = true;
        if (e.key >= '1' && e.key <= '6') {
            const weaponId = parseInt(e.key);
            const weapon = weapons[weaponId];
            if (weapon) {
                weapon.active = !weapon.active;
                if (weapon.active) {
                    this.weaponsActive.push(weaponId);
                } else {
                    this.weaponsActive = this.weaponsActive.filter(id => id !== weaponId);
                }
                this.updateUI();
            }
        }
    }
    
    handleKeyup(e) {
        keys[e.key.toLowerCase()] = false;
    }
    
    update() {
        this.handleShipMovement();
        this.shootBullets();
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerups();
        this.checkCollisions();
        this.updateGameData();
        this.checkLevel();
    }
    
    handleShipMovement() {
        if (keys['w'] || keys['arrowup']) this.ship.y -= this.ship.speed;
        if (keys['s'] || keys['arrowdown']) this.ship.y += this.ship.speed;
        if (keys['a'] || keys['arrowleft']) this.ship.x -= this.ship.speed;
        if (keys['d'] || keys['arrowright']) this.ship.x += this.ship.speed;
        
        this.ship.x = Math.max(0, Math.min(this.width - this.ship.width, this.ship.x));
        this.ship.y = Math.max(0, Math.min(this.height - this.ship.height, this.ship.y));
    }
    
    shootBullets() {
        if (keys[' '] || keys['enter']) {
            if (this.weaponsActive.length > 0) {
                for (const weaponId of this.weaponsActive) {
                    const weapon = weapons[weaponId];
                    if (weapon.active && weapon.charge >= 100 / weapon.speed) {
                        this.bullets.push(...this.fire(weapon));
                        weapon.charge = 0;
                    } else {
                        weapon.charge += 10;
                    }
                }
            }
        }
    }
    
    fire(weapon) {
        const bullets = [];
        switch (weapon.type) {
            case 'normal':
                bullets.push({
                    x: this.ship.x + 20,
                    y: this.ship.y - 10,
                    speed: 8,
                    width: 5,
                    height: 5,
                    damage: weapon.damage,
                    type: weapon.type
                });
                break;
            case 'double':
                bullets.push({
                    x: this.ship.x + 10,
                    y: this.ship.y - 10,
                    speed: 8,
                    width: 5,
                    height: 5,
                    damage: weapon.damage,
                    type: weapon.type
                });
                bullets.push({
                    x: this.ship.x + 30,
                    y: this.ship.y - 10,
                    speed: 8,
                    width: 5,
                    height: 5,
                    damage: weapon.damage,
                    type: weapon.type
                });
                break;
            case 'spread':
                for (let i = -1; i <= 1; i++) {
                    bullets.push({
                        x: this.ship.x + 20 + i * 10,
                        y: this.ship.y - 10,
                        speed: 8,
                        width: 5,
                        height: 5,
                        damage: weapon.damage,
                        type: weapon.type,
                        angle: i * 0.2
                    });
                }
                break;
            case 'laser':
                bullets.push({
                    x: this.ship.x + 20,
                    y: this.ship.y - 15,
                    speed: 12,
                    width: 8,
                    height: 20,
                    damage: weapon.damage,
                    type: weapon.type
                });
                break;
            case 'missile':
                bullets.push({
                    x: this.ship.x + 20,
                    y: this.ship.y - 10,
                    speed: 6,
                    width: 8,
                    height: 12,
                    damage: weapon.damage,
                    type: weapon.type,
                    homing: true
                });
                break;
            case 'machine':
                bullets.push({
                    x: this.ship.x + 20,
                    y: this.ship.y - 10,
                    speed: 10,
                    width: 4,
                    height: 4,
                    damage: weapon.damage,
                    type: weapon.type
                });
                break;
        }
        return bullets;
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            if (bullet.angle) {
                bullet.x += Math.sin(bullet.angle) * 2;
            }
            if (bullet.homing) {
                const enemy = this.enemies.find(e => e.life > 0);
                if (enemy) {
                    const dx = enemy.x + enemy.width/2 - bullet.x;
                    const dy = enemy.y + enemy.height/2 - bullet.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 100) {
                        bullet.x += dx/dist * 2;
                        bullet.y += dy/dist * 2;
                    }
                }
            }
            return bullet.y > -10;
        });
    }
    
    createEnemy() {
        const x = Math.random() * (this.width - 40);
        this.enemies.push({
            x,
            y: -50,
            width: 40,
            height: 30,
            speed: this.level * 1.2,
            life: 3,
            type: 'normal'
        });
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            return enemy.y < this.height;
        });
    }
    
    updatePowerups() {
        this.powerups = this.powerups.filter(powerup => {
            powerup.y += 2;
            const distX = Math.abs(powerup.x + 20 - this.ship.x - 20);
            const distY = Math.abs(powerup.y + 20 - this.ship.y - 20);
            if (distX < 30 && distY < 30) {
                this.collectPowerup(powerup);
                return false;
            }
            return powerup.y < this.height;
        });
    }
    
    collectPowerup(powerup) {
        switch (powerup.type) {
            case 'heart':
                this.life = Math.min(100, this.life + 20);
                break;
            case 'shield':
                this.shield = Math.min(100, this.shield + 20);
                break;
            case 'coins':
                this.coins += 10;
                break;
            case 'weapon1':
                weapons[1].active = true;
                if (!this.weaponsActive.includes(1)) this.weaponsActive.push(1);
                break;
            case 'weapon2':
                weapons[2].active = true;
                if (!this.weaponsActive.includes(2)) this.weaponsActive.push(2);
                break;
            case 'weapon3':
                weapons[3].active = true;
                if (!this.weaponsActive.includes(3)) this.weaponsActive.push(3);
                break;
        }
        this.updateUI();
    }
    
    checkCollisions() {
        this.bullets = this.bullets.filter(bullet => {
            const hit = this.enemies.some(enemy => {
                const hitX = bullet.x > enemy.x && bullet.x < enemy.x + enemy.width;
                const hitY = bullet.y > enemy.y && bullet.y < enemy.y + enemy.height;
                if (hitX && hitY) {
                    enemy.life -= bullet.damage;
                    if (enemy.life <= 0) {
                        this.score += 10;
                        this.spawnPowerup(enemy.x, enemy.y);
                    }
                    return true;
                }
                return false;
            });
            return !hit;
        });
    }
    
    spawnPowerup(x, y) {
        const types = ['heart', 'shield', 'coins'];
        if (Math.random() < 0.3) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push({x, y, type});
        }
    }
    
    checkLevel() {
        if (this.level % 5 === 0) {
            if (this.enemies.length === 0) {
                this.level++;
                this.createBoss();
            }
        }
    }
    
    createBoss() {
        this.enemies.push({
            x: this.width / 2 - 50,
            y: -100,
            width: 100,
            height: 100,
            speed: 1,
            life: 50,
            type: 'boss'
        });
    }
    
    updateGameData() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('life').textContent = `${this.life}%`;
        document.getElementById('shield').textContent = `${this.shield}%`;
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.ship.x, this.ship.y, this.ship.width, this.ship.height);
        
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.type === 'boss' ? '#f00' : '#0ff';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        this.powerups.forEach(powerup => {
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(powerup.x, powerup.y, 40, 40);
        });
    }
}

const game = new Game();