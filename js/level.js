class Platform {
    constructor(game, x, leftY, rightY, width) {
        this.game = game;
        this.x = x;
        this.leftY = leftY;
        this.rightY = rightY;
        this.width = width;
        this.height = 8; // Standard platform height
        
        // Calculate angle based on left and right y-coordinates
        const rise = rightY - leftY;
        this.angle = Math.atan2(rise, width);
        
        this.rivetSpacing = 16; // NES sprite rivet spacing
        
        // Calculate end points
        this.endX = x + width;
        this.y = leftY; // Use leftY as the starting y-coordinate
        
        // Calculate axis-aligned bounding box (AABB)
        this.left = Math.min(x, this.endX) - 5; // Add small buffer
        this.right = Math.max(x, this.endX) + 5;
        this.top = Math.min(leftY, rightY) - 5;
        this.bottom = Math.max(leftY, rightY) + 5;
    }

    // Improved collision detection
    collidesWith(other) {
        // Fast AABB check first
        if (this.right < other.left || 
            this.left > other.right || 
            this.bottom < other.top || 
            this.top > other.bottom) {
            return false;
        }
        
        // Precise line intersection check
        return this.linesIntersect(
            this.x, this.y, this.endX, this.endY,
            other.x, other.y, other.endX, other.endY
        );
    }

    linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Line intersection math
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return false; // Parallel lines
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    isValidPlacement(existingPlatforms) {
        return existingPlatforms.every(platform => !this.collidesWith(platform));
    }

    render(debug = false) {
        this.game.ctx.save();
        
        // Move to the platform's position
        this.game.ctx.translate(this.x, this.y);
        this.game.ctx.rotate(this.angle);
        
        // Draw the platform base (steel gray)
        this.game.ctx.fillStyle = '#C0C0C0';
        this.game.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw rivets
        this.game.ctx.fillStyle = '#808080';
        for (let i = 0; i < this.width; i += this.rivetSpacing) {
            this.game.ctx.beginPath();
            this.game.ctx.arc(i, this.height/2, 2, 0, Math.PI * 2);
            this.game.ctx.fill();
        }

        // Draw debug visualization if enabled
        if (debug) {
            this.game.ctx.restore();
            this.game.ctx.save();
            
            // Draw platform endpoints
            this.game.ctx.fillStyle = 'red';
            this.game.ctx.beginPath();
            this.game.ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            this.game.ctx.arc(this.endX, this.endY, 4, 0, Math.PI * 2);
            this.game.ctx.fill();

            // Draw AABB
            this.game.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            this.game.ctx.strokeRect(
                this.left, this.top,
                this.right - this.left, this.bottom - this.top
            );
        }
        
        this.game.ctx.restore();
    }

    // Gets platform surface coordinates for collision
    getSurfaceY(xPos) {
        return this.y + Math.tan(this.angle) * (xPos - this.x);
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

class Ladder {
    constructor(game, x, y, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = height;
        this.rungSpacing = 12;
    }

    render() {
        this.game.ctx.save();
        
        // Draw ladder sides
        this.game.ctx.strokeStyle = '#8B4513';
        this.game.ctx.lineWidth = 2;
        
        // Left side
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(this.x, this.y);
        this.game.ctx.lineTo(this.x, this.y + this.height);
        this.game.ctx.stroke();
        
        // Right side
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(this.x + this.width, this.y);
        this.game.ctx.lineTo(this.x + this.width, this.y + this.height);
        this.game.ctx.stroke();
        
        // Draw rungs
        for (let y = 0; y < this.height; y += this.rungSpacing) {
            this.game.ctx.beginPath();
            this.game.ctx.moveTo(this.x, this.y + y);
            this.game.ctx.lineTo(this.x + this.width, this.y + y);
            this.game.ctx.stroke();
        }
        
        this.game.ctx.restore();
    }
}

class Level {
    constructor(game) {
        this.game = game;
        this.platforms = [];
        this.ladders = [];
        this.barrels = [];
        this.donkeyKong = null;
        this.debug = true;
        this.createLevel();
    }

    createLevel() {
        // Platform parameters with left and right y-coordinates
        const platformParams = [
            // 1
            { x: 0, leftY: 60, rightY: 80, width: 550 },
            // 2
            { x: 50, leftY: 150, rightY: 130, width: 550 },
            // 3
            { x: 0, leftY: 200, rightY: 220, width: 550 },
            // 4
            { x: 50, leftY: 290, rightY: 270, width: 550 },
            // 5
            { x: 0, leftY: 340, rightY: 360, width: 550 },
            // 6
            { x: 50, leftY: 430, rightY: 410, width: 550 },
            // 7
            //{ x: 100, leftY: 460, rightY: 470, width: 500 }
        ];

        // Clear existing platforms
        this.platforms = [];

        // Create platforms with validation
        platformParams.forEach(params => {
            let platform;
            let attempts = 0;
            const maxAttempts = 5;
            let success = false;
            
            do {
                platform = new Platform(
                    this.game,
                    params.x,
                    params.leftY + (attempts * 30),
                    params.rightY + (attempts * 30),
                    params.width
                );
                
                if (platform.isValidPlacement(this.platforms)) {
                    this.platforms.push(platform);
                    success = true;
                    break;
            }
            
                attempts++;
            } while (attempts < maxAttempts);

            if (!success) {
                console.warn("Failed to place platform after", maxAttempts, "attempts. Using fallback position.");
                // Use a fallback position with more spacing
                platform = new Platform(
                    this.game,
                    params.x,
                    params.leftY + 150,
                    params.rightY + 150,
                    params.width
                );
                this.platforms.push(platform);
            }
        });

        // Only create ladders if we have at least 2 platforms
        if (this.platforms.length >= 99999) {
            this.createLadders();
        } else {
            console.error("Not enough platforms to create ladders");
        }

        // Create Donkey Kong at the top left
        this.donkeyKong = new DonkeyKong(this.game);
        this.donkeyKong.x = 50;
        this.donkeyKong.y = 100;
    }

    createLadders() {
        // Clear existing ladders
        this.ladders = [];
        
        // Define ladder connection points (relative to platform ends)
        const ladderConnections = [
            // Top to middle-right
            { 
                topPlatform: 0, 
                bottomPlatform: 1,
                topOffset: 0.95,
                bottomOffset: 0.05
            },
            // Middle-right to lower-left
            { 
                topPlatform: 1, 
                bottomPlatform: 2,
                topOffset: 0.05,
                bottomOffset: 0.95
            },
            // Lower-left to bottom-right
            { 
                topPlatform: 2, 
                bottomPlatform: 3,
                topOffset: 0.95,
                bottomOffset: 0.05
            }
        ];

        ladderConnections.forEach(conn => {
            // Skip if either platform is undefined
            if (!this.platforms[conn.topPlatform] || !this.platforms[conn.bottomPlatform]) {
                console.warn("Skipping ladder creation - missing platform");
                return;
            }

            const top = this.platforms[conn.topPlatform];
            const bottom = this.platforms[conn.bottomPlatform];
            
            // Calculate connection points
            const topConnectX = top.x + (top.width * conn.topOffset * Math.cos(top.angle));
            const topConnectY = top.y + (top.width * conn.topOffset * Math.sin(top.angle));
            
            const bottomConnectX = bottom.x + (bottom.width * conn.bottomOffset * Math.cos(bottom.angle));
            const bottomConnectY = bottom.y + (bottom.width * conn.bottomOffset * Math.sin(bottom.angle));
            
            // Place ladder at midpoint
            const ladderX = (topConnectX + bottomConnectX) / 2 - 8;
            const ladderHeight = bottomConnectY - topConnectY;
            
            if (ladderHeight > 20) { // Minimum ladder height
                this.ladders.push(new Ladder(
                    this.game,
                    ladderX,
                    topConnectY,
                    ladderHeight
                ));
            } else {
                console.warn("Skipping ladder - height too small:", ladderHeight);
            }
        });
    }

    renderPlatformGuides() {
        this.game.ctx.save();
        this.game.ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        this.game.ctx.lineWidth = 2;
        
        // Draw vertical alignment guides
        const leftGuideX = 100;
        const rightGuideX = 400;
        
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(leftGuideX, 0);
        this.game.ctx.lineTo(leftGuideX, this.game.canvas.height);
        this.game.ctx.moveTo(rightGuideX, 0);
        this.game.ctx.lineTo(rightGuideX, this.game.canvas.height);
        this.game.ctx.stroke();
        
        this.game.ctx.restore();
    }

    renderPlatformConnections() {
        this.game.ctx.save();
        this.game.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        
        for (let i = 0; i < this.platforms.length - 1; i++) {
            const current = this.platforms[i];
            const next = this.platforms[i + 1];
            
            this.game.ctx.beginPath();
            this.game.ctx.moveTo(
                current.x + current.width * Math.cos(current.angle),
                current.y + current.width * Math.sin(current.angle)
            );
            this.game.ctx.lineTo(
                next.x,
                next.y
            );
            this.game.ctx.stroke();
        }
        
        this.game.ctx.restore();
    }

    render() {
        // Render debug guides
        if (this.debug) {
            this.renderPlatformGuides();
            this.renderPlatformConnections();
        }
        
        // Render coordinate system
        this.renderCoordinateSystem();
        
        // Render all platforms
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            platform.render(this.debug);
            this.renderPlatformNumber(platform, i + 1);
        }

        // Render ladders
        for (const ladder of this.ladders) {
            ladder.render();
        }

        // Render Donkey Kong
        if (this.donkeyKong) {
            this.donkeyKong.render();
        }

        // Render barrels
        for (const barrel of this.barrels) {
            barrel.render();
        }
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

    update(player, deltaTime) {
        // Update Donkey Kong
        if (this.donkeyKong) {
            this.donkeyKong.update(deltaTime);
        }

        // Update barrels
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const barrel = this.barrels[i];
            barrel.update();

            // Remove barrels that fall off screen
            if (barrel.y > this.game.canvas.height) {
                this.barrels.splice(i, 1);
                continue;
            }

            // Check player collision with barrels
            if (barrel.checkPlayerCollision(player)) {
                player.reset();
            }
        }

        // Check platform collisions
        let onPlatform = false;
        for (const platform of this.platforms) {
            if (platform.checkCollision(player)) {
                const surfaceY = platform.getSurfaceY(player.x);
                player.y = surfaceY - player.height;
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
} 