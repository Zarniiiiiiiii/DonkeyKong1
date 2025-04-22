class Platform {
    constructor(game, x, y, width, angle = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 16;
        this.angle = angle;
    }

    render() {
        this.game.ctx.save();
        this.game.ctx.translate(this.x, this.y);
        this.game.ctx.rotate(this.angle);
        
        this.game.ctx.fillStyle = '#8B4513'; // Brown color for platforms
        this.game.ctx.fillRect(0, 0, this.width, this.height);
        
        this.game.ctx.restore();
    }

    checkCollision(player) {
        // Transform player coordinates to platform space
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const rotatedX = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
        const rotatedY = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
        
        return (
            rotatedX < this.width &&
            rotatedX + player.width > 0 &&
            rotatedY + player.height > 0 &&
            rotatedY < this.height &&
            player.velocityY > 0 // Only collide when falling
        );
    }
}

class Level {
    constructor(game) {
        this.game = game;
        this.platforms = [];
        this.barrels = [];
        this.donkeyKong = null;
        this.createLevel();
    }

    createLevel() {
        // Create platforms in a vertical layout with inclines
        const platformWidth = 520; // 30% longer platforms (400 * 1.3)
        const platformHeight = 16;
        const platformSpacing = 120;
        const platformOffset = 100;
        const canvasWidth = this.game.canvas.width;

        // Create alternating inclined platforms
        for (let i = 0; i < 4; i++) {
            const y = 500 - (i + 1) * platformSpacing;
            const angle = i % 2 === 0 ? Math.PI / 24 : -Math.PI / 24; // 7.5 degrees incline
            const x = i % 2 === 0 ? platformOffset : canvasWidth - platformOffset - platformWidth;
            
            // Adjust y position based on incline
            const adjustedY = y - (Math.sin(angle) * platformWidth / 2);
            
            this.platforms.push(new Platform(this.game, x, adjustedY, platformWidth, angle));
        }

        // Create Donkey Kong at the top left
        this.donkeyKong = new DonkeyKong(this.game);
        this.donkeyKong.x = 50;
        this.donkeyKong.y = 100;
    }

    update(player, deltaTime) {
        // Update Donkey Kong
        if (this.donkeyKong) {
            this.donkeyKong.update(deltaTime);
        }

        // Update barrels
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const barrel = this.barrels[i];
            barrel.update();

            // Check player collision with barrels
            if (barrel.checkPlayerCollision(player)) {
                // Handle player death
                player.reset();
            }
        }

        // Check platform collisions
        let onPlatform = false;
        for (const platform of this.platforms) {
            if (platform.checkCollision(player)) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onPlatform = true;
            }
        }

        // Apply gravity if not on platform
        if (!onPlatform) {
            player.velocityY += player.gravity;
        }
    }

    render() {
        // Render all platforms
        for (const platform of this.platforms) {
            platform.render();
        }

        // Render Donkey Kong
        if (this.donkeyKong) {
            this.donkeyKong.render();
        }

        // Render all barrels
        for (const barrel of this.barrels) {
            barrel.render();
        }
    }
} 