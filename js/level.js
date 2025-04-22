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
        
        // Move to the platform's position
        this.game.ctx.translate(this.x, this.y);
        this.game.ctx.rotate(this.angle);
        
        // Draw the platform
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
        const platformWidth = 520;
        const platformHeight = 16;
        const platformOffset = 100;
        const canvasWidth = this.game.canvas.width;
        const baseY = 600;
        const minVerticalGap = 80;

        // Create alternating inclined platforms with custom spacing
        for (let i = 0; i < 4; i++) {
            const angle = i % 2 === 0 ? Math.PI / 24 : -Math.PI / 24;
            const x = i % 2 === 0 ? platformOffset : canvasWidth - platformOffset - platformWidth;
            
            // Calculate the maximum height difference caused by the incline
            const maxHeightDiff = Math.abs(Math.sin(angle) * platformWidth);
            
            // Custom spacing for each platform
            let spacing;
            switch(i) {
                case 0: // Platform 1 - keep as is
                    spacing = maxHeightDiff + minVerticalGap + 20;
                    break;
                case 1: // Platform 2 - closer to platform 1
                    spacing = maxHeightDiff + minVerticalGap + 20 + 30; // Reduced from 50 to 30
                    break;
                case 2: // Platform 3 - closer to platform 2
                    spacing = maxHeightDiff + minVerticalGap + 20 + 20; // Reduced from 20 to 20
                    break;
                case 3: // Platform 4 - closer to platform 3
                    spacing = maxHeightDiff + minVerticalGap + 20 + 30; // Reduced from 60 to 30
                    break;
            }
            
            // Calculate y position with custom spacing
            const y = baseY - (i + 1) * spacing;
            
            // Create the platform
            const platform = new Platform(this.game, x, y, platformWidth, angle);
            
            // Add the platform
            this.platforms.push(platform);
        }

        // Create Donkey Kong at the top left
        this.donkeyKong = new DonkeyKong(this.game);
        this.donkeyKong.x = 50;
        this.donkeyKong.y = 100;
    }

    // Helper method to check if two platforms intersect
    checkPlatformIntersection(platform1, platform2) {
        // Get the corners of both platforms
        const corners1 = this.getPlatformCorners(platform1);
        const corners2 = this.getPlatformCorners(platform2);
        
        // Check if any corner of platform1 is inside platform2's bounds
        for (const corner of corners1) {
            if (this.isPointInPlatform(corner, platform2)) {
                return true;
            }
        }
        
        // Check if any corner of platform2 is inside platform1's bounds
        for (const corner of corners2) {
            if (this.isPointInPlatform(corner, platform1)) {
                return true;
            }
        }
        
        return false;
    }

    // Helper method to get platform corners
    getPlatformCorners(platform) {
        const corners = [];
        const cos = Math.cos(platform.angle);
        const sin = Math.sin(platform.angle);
        
        // Calculate all four corners
        corners.push({
            x: platform.x,
            y: platform.y
        });
        
        corners.push({
            x: platform.x + platform.width * cos,
            y: platform.y + platform.width * sin
        });
        
        corners.push({
            x: platform.x + platform.width * cos - platform.height * sin,
            y: platform.y + platform.width * sin + platform.height * cos
        });
        
        corners.push({
            x: platform.x - platform.height * sin,
            y: platform.y + platform.height * cos
        });
        
        return corners;
    }

    // Helper method to check if a point is inside a platform
    isPointInPlatform(point, platform) {
        const dx = point.x - platform.x;
        const dy = point.y - platform.y;
        const rotatedX = dx * Math.cos(-platform.angle) - dy * Math.sin(-platform.angle);
        const rotatedY = dx * Math.sin(-platform.angle) + dy * Math.cos(-platform.angle);
        
        return (
            rotatedX >= 0 &&
            rotatedX <= platform.width &&
            rotatedY >= 0 &&
            rotatedY <= platform.height
        );
    }

    update(player, deltaTime) {
        // Update Donkey Kong
        if (this.donkeyKong) {
            this.donkeyKong.update(deltaTime);
        }

        // Temporarily stop barrel updates
        // for (let i = this.barrels.length - 1; i >= 0; i--) {
        //     const barrel = this.barrels[i];
        //     barrel.update();

        //     // Check player collision with barrels
        //     if (barrel.checkPlayerCollision(player)) {
        //         // Handle player death
        //         player.reset();
        //     }
        // }

        // Check platform collisions
        let onPlatform = false;
        for (const platform of this.platforms) {
            if (platform.checkCollision(player)) {
                // Calculate the exact y position on the inclined platform
                const dx = player.x - platform.x;
                const rotatedY = dx * Math.sin(platform.angle);
                player.y = platform.y - player.height + rotatedY;
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

    renderPlatformNumber(platform, number) {
        this.game.ctx.save();
        this.game.ctx.font = '24px Arial';
        this.game.ctx.fillStyle = 'white';
        this.game.ctx.textAlign = 'center';
        
        // Calculate the center position of the platform
        const centerX = platform.x + platform.width / 2;
        const centerY = platform.y - 20; // Position above the platform
        
        this.game.ctx.fillText(number.toString(), centerX, centerY);
        this.game.ctx.restore();
    }

    renderCoordinateSystem() {
        this.game.ctx.save();
        this.game.ctx.font = '16px Arial';
        this.game.ctx.fillStyle = 'white';
        
        // Draw coordinate system indicators
        this.game.ctx.fillText('↑ Y (Up)', 20, 30);
        this.game.ctx.fillText('↓ Y (Down)', 20, this.game.canvas.height - 20);
        this.game.ctx.fillText('← X (Left)', 20, this.game.canvas.height / 2);
        this.game.ctx.fillText('→ X (Right)', this.game.canvas.width - 60, this.game.canvas.height / 2);
        
        this.game.ctx.restore();
    }

    render() {
        // Render coordinate system
        this.renderCoordinateSystem();
        
        // Render all platforms
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            platform.render();
            this.renderPlatformNumber(platform, i + 1);
        }

        // Temporarily hide Donkey Kong
        // if (this.donkeyKong) {
        //     this.donkeyKong.render();
        // }

        // Temporarily stop barrel rendering
        // for (const barrel of this.barrels) {
        //     barrel.render();
        // }
    }
} 