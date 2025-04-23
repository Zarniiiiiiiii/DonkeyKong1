class DonkeyKong {
    constructor(game) {
        this.game = game;
        this.width = 64;
        this.height = 64;
        this.x = 50;
        this.y = 100;
        this.throwTimer = 0;
        this.throwInterval = 10000000; // Throw a barrel every 2 seconds
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
    }

    update(deltaTime) {
        // Update throw timer
        this.throwTimer += deltaTime;
        if (this.throwTimer >= this.throwInterval) {
            this.throwBarrel();
            this.throwTimer = 0;
        }

        // Update animation
        this.animationFrame += this.animationSpeed;
        if (this.animationFrame >= 2) {
            this.animationFrame = 0;
        }
    }

    throwBarrel() {
        const barrel = new Barrel(this.game, this.x + this.width/2, this.y + this.height);
        this.game.level.barrels.push(barrel);
    }

    render() {
        // Draw Donkey Kong's body
        this.game.ctx.fillStyle = '#8B0000'; // Dark red
        this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw face
        this.game.ctx.fillStyle = '#000';
        this.game.ctx.fillRect(this.x + 20, this.y + 20, 24, 24);
        
        // Draw arms
        this.game.ctx.fillStyle = '#8B0000';
        this.game.ctx.fillRect(this.x - 10, this.y + 20, 10, 20);
        this.game.ctx.fillRect(this.x + this.width, this.y + 20, 10, 20);
        
        // Draw legs
        this.game.ctx.fillRect(this.x + 10, this.y + this.height, 15, 20);
        this.game.ctx.fillRect(this.x + this.width - 25, this.y + this.height, 15, 20);
    }
}

class Barrel {
    constructor(game, x, y) {
        this.game = game;
        this.width = 24;
        this.height = 24;
        this.x = x;
        this.y = y;
        this.speed = 2;
        this.direction = 1; // 1 for right, -1 for left
        this.velocityY = 0;
        this.gravity = 1.5;
        this.rotation = 0;
        this.rotationSpeed = 0.1;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.onPlatform = false;
        this.currentPlatform = null;
    }

    update() {
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Update rotation
        this.rotation += this.rotationSpeed;

        // Check platform collisions
        this.onPlatform = false;
        for (const platform of this.game.level.platforms) {
            if (this.checkPlatformCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onPlatform = true;
                this.currentPlatform = platform;

                // Calculate movement along the inclined platform
                const platformAngle = platform.angle;
                const moveX = Math.cos(platformAngle) * this.speed * this.direction;
                const moveY = Math.sin(platformAngle) * this.speed * this.direction;
                
                this.x += moveX;
                this.y += moveY;

                // Change direction at platform edges
                if (this.x <= platform.x || this.x + this.width >= platform.x + platform.width) {
                    this.direction *= -1;
                    this.bounceCount++;
                }
            }
        }

        // Remove if out of bounds or after max bounces
        if (this.y > this.game.canvas.height || this.bounceCount >= this.maxBounces) {
            const index = this.game.level.barrels.indexOf(this);
            if (index !== -1) {
                this.game.level.barrels.splice(index, 1);
            }
        }
    }

    checkPlatformCollision(platform) {
        // Transform barrel coordinates to platform space
        const dx = this.x - platform.x;
        const dy = this.y - platform.y;
        const rotatedX = dx * Math.cos(-platform.angle) - dy * Math.sin(-platform.angle);
        const rotatedY = dx * Math.sin(-platform.angle) + dy * Math.cos(-platform.angle);
        
        return (
            rotatedX < platform.width &&
            rotatedX + this.width > 0 &&
            rotatedY + this.height > 0 &&
            rotatedY < platform.height &&
            this.velocityY > 0
        );
    }

    checkPlayerCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y + this.height > player.y &&
            this.y < player.y + player.height
        );
    }

    render() {
        // Save the current context state
        this.game.ctx.save();
        
        // Move to the center of the barrel
        this.game.ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotate the barrel
        this.game.ctx.rotate(this.rotation);
        
        // Draw the barrel
        this.game.ctx.fillStyle = '#8B4513'; // Brown
        this.game.ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw barrel details
        this.game.ctx.fillStyle = '#A0522D';
        this.game.ctx.fillRect(-this.width/2, -this.height/2, this.width, 4);
        this.game.ctx.fillRect(-this.width/2, -this.height/2 + 8, this.width, 4);
        this.game.ctx.fillRect(-this.width/2, -this.height/2 + 16, this.width, 4);
        
        // Restore the context state
        this.game.ctx.restore();
    }
} 