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
        // Calculate the y-coordinate of the platform surface at a given x position
        const relativeX = xPos - this.x;
        const slope = (this.rightY - this.leftY) / this.width;
        return this.leftY + (relativeX * slope);
    }

    checkCollision(player) {
        // Skip collision check if player is climbing
        if (player.isClimbing) {
            return false;
        }

        // Check if player is within the platform's x-range
        if (player.x + player.width < this.x || player.x > this.endX) {
            return false;
        }

        // Get the platform surface y-coordinate at the player's x position
        const surfaceY = this.getSurfaceY(player.x + player.width/2);
        
        // Check if player is above the platform and moving downward
        if (player.velocityY > 0 && 
            player.y + player.height > surfaceY && 
            player.y + player.height < surfaceY + 20) {
            
            // Prevent falling through
            player.y = surfaceY - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            return true;
        }
        
        // Check if player is below the platform and moving upward
        if (player.velocityY < 0 && 
            player.y < surfaceY + this.height && 
            player.y > surfaceY - 20) {
            
            // Prevent jumping through
            player.y = surfaceY + this.height;
            player.velocityY = 0;
            return true;
        }
        
        return false;
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
     // Platform 1 (base)
     { x: 0, leftY: 170, rightY: 190, width: 500 },
     // Platform 2 (leftY +110, rightY +70)
     { x: 80, leftY: 280, rightY: 260, width: 550 },
     // Platform 3 (leftY +70, rightY +110)
     { x: 0, leftY: 350, rightY: 370, width: 500 },
     // Platform 4 (leftY +110, rightY +70)
     { x: 80, leftY: 460, rightY: 440, width: 550 },
     // Platform 5 (leftY +70, rightY +110)
     { x: 0, leftY: 530, rightY: 550, width: 500 },
     // Platform 6 (leftY +110, rightY +70)
     { x: 80, leftY: 660, rightY: 620, width: 550 },
          
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

        // Create ladders after platforms are created
        this.createLadders();

        // Create Donkey Kong at the top left
        this.donkeyKong = new DonkeyKong(this.game);
        this.donkeyKong.x = 50;
        this.donkeyKong.y = 50;
    }

    createLadders() {
        // Clear existing ladders
        this.ladders = [];
        
        // Create ladders with fixed positions
        // Ladder 1: Between platform 0 and 1 (left side)
        this.ladders.push(new Ladder(
            this.game,
            150,  // x position
            175,  // y position (top of ladder)
            110   // height (distance between platforms)
        ));

        // Ladder 2: Between platform 1 and 2 (right side)
        this.ladders.push(new Ladder(
            this.game,
            400,  // x position
            275,  // y position (top of ladder)
            95    // height (distance between platforms)
        ));

        // Ladder 3: Between platform 2 and 3 (left side)
        this.ladders.push(new Ladder(
            this.game,
            150,  // x position
            358,  // y position (top of ladder)
            105   // height (distance between platforms)
        ));

        // Ladder 4: Between platform 3 and 4 (right side)
        this.ladders.push(new Ladder(
            this.game,
            400,  // x position
            450,  // y position (top of ladder)
            105    // height (distance between platforms)
        ));

        // Ladder 5: Between platform 4 and 5 (left side)
        this.ladders.push(new Ladder(
            this.game,
            150,  // x position
            540,  // y position (top of ladder)
            120   // height (distance between platforms)
        ));
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
                onPlatform = true;
                break;
            }
        }

        // If not on a platform and not climbing, apply gravity
        if (!onPlatform && !player.isClimbing) {
            player.velocityY += player.gravity;
        }
    }
} 