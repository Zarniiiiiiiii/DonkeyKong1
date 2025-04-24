class DonkeyKong {
    constructor(game) {
        this.game = game;
        this.width = 64;
        this.height = 64;
        this.x = 50;
        this.y = 50;
        this.throwTimer = 0;
        this.throwInterval = 2000; // 2 seconds initial interval
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
    }

    update(deltaTime) {
        // Update throw timer
        this.throwTimer += deltaTime;
        
        // Throw barrel at regular intervals
        if (this.throwTimer >= this.throwInterval) {
            this.throwBarrel();
            this.throwTimer = 0;
            // Set new random interval between 2 and 4.5 seconds
            this.throwInterval = 2000 + Math.random() * 2500;
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
        this.width = 18;
        this.height = 18;
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
        this.isActive = true; // New property to track if barrel is still in play
    }

    update() {
        if (!this.isActive) return;

        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Update rotation
        this.rotation += this.rotationSpeed;

        // Check if barrel is on a platform
        let onPlatform = false;
        for (const platform of this.game.level.platforms) {
            if (this.checkPlatformCollision(platform)) {
                // Get the platform surface y-coordinate at the barrel's x position
                const surfaceY = platform.getSurfaceY(this.x + this.width/2);
                
                // Place barrel on the platform surface
                this.y = surfaceY - this.height;
                this.velocityY = 0;
                onPlatform = true;
                this.currentPlatform = platform;

                // Move along the platform
                this.x += this.speed * this.direction;

                // Check if barrel is at platform edge
                if (this.x <= platform.x || this.x + this.width >= platform.x + platform.width) {
                    // Let the barrel fall off the edge
                    onPlatform = false;
                    this.currentPlatform = null;
                }
            }
        }

        // If not on any platform, let gravity take effect
        if (!onPlatform) {
            this.currentPlatform = null;
        }

        // Check canvas wall collisions
        if (this.x <= 0) {
            this.x = 0;
            this.direction = 1; // Change direction to right
        } else if (this.x + this.width >= this.game.canvas.width) {
            this.x = this.game.canvas.width - this.width;
            this.direction = -1; // Change direction to left
        }

        // Only remove barrel if it's completely off-screen and not on any platform
        if (this.y > this.game.canvas.height + this.height) {
            this.isActive = false;
            const index = this.game.level.barrels.indexOf(this);
            if (index !== -1) {
                this.game.level.barrels.splice(index, 1);
            }
        }
    }

    checkPlatformCollision(platform) {
        // Check if barrel is within platform's x-range
        if (this.x + this.width < platform.x || this.x > platform.x + platform.width) {
            return false;
        }

        // Get the platform surface y-coordinate at the barrel's x position
        const surfaceY = platform.getSurfaceY(this.x + this.width/2);
        
        // Check if barrel is above the platform and moving downward
        return (
            this.velocityY > 0 && 
            this.y + this.height > surfaceY && 
            this.y + this.height < surfaceY + 20
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
        
        // Draw the circular barrel
        this.game.ctx.beginPath();
        this.game.ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        this.game.ctx.fillStyle = '#8B4513'; // Brown
        this.game.ctx.fill();
        
        // Draw barrel details (circular bands)
        this.game.ctx.strokeStyle = '#A0522D';
        this.game.ctx.lineWidth = 2;
        
        // Draw three circular bands
        for (let i = -1; i <= 1; i++) {
            this.game.ctx.beginPath();
            this.game.ctx.arc(0, i * 4, this.width/2 - 2, 0, Math.PI * 2);
            this.game.ctx.stroke();
        }
        
        // Restore the context state
        this.game.ctx.restore();
    }
} 