class Player {
    constructor(game) {
        this.game = game;
        this.width = 24;
        this.height = 24;
        this.reset();
        
        // Player states
        this.state = 'idle'; // idle, running, jumping, climbing
        this.isJumping = false;
        this.isClimbing = false;
        this.direction = 'right';
        this.spaceKeyPressed = false; // Track if space was just pressed
        
        // Input handling
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        this.setupInput();
    }

    reset() {
        this.x = 100;
        this.y = 700;
        this.speed = 3;
        this.jumpForce = -13.2;
        this.gravity = 0.4;
        this.velocityY = 0;
        this.state = 'idle';
        this.isJumping = false;
        this.isClimbing = false;
        this.spaceKeyPressed = false;
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    this.direction = 'left';
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    this.direction = 'right';
                    break;
                case 'ArrowUp':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                    this.keys.down = true;
                    break;
                case ' ':
                    if (!this.spaceKeyPressed && !this.isJumping && !this.isClimbing) {
                        this.velocityY = this.jumpForce;
                        this.isJumping = true;
                        this.state = 'jumping';
                        this.spaceKeyPressed = true;
                    }
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                    this.keys.down = false;
                    break;
                case ' ':
                    this.spaceKeyPressed = false;
                    break;
            }
        });
    }
    
    checkLadderCollision() {
        for (const ladder of this.game.level.ladders) {
            // Check if player is within the ladder's x-range (with some tolerance)
            if (this.x + this.width > ladder.x - 10 && 
                this.x < ladder.x + ladder.width + 10) {
                
                // Check if player is within the ladder's y-range (with some tolerance)
                if (this.y + this.height > ladder.y - 10 && 
                    this.y < ladder.y + ladder.height + 10) {
                    
                    // If player is pressing up or down, start climbing
                    if (this.keys.up || this.keys.down) {
                        // Only start climbing if we're actually on the ladder
                        if (this.x + this.width > ladder.x && 
                            this.x < ladder.x + ladder.width) {
                            this.isClimbing = true;
                            this.velocityY = 0;
                            // Center player on ladder with a small offset
                            this.x = ladder.x + (ladder.width - this.width) / 2;
                            return true;
                        }
                    }
                }
            }
        }
        this.isClimbing = false;
        return false;
    }
    
    update() {
        // Check for ladder collision first
        const onLadder = this.checkLadderCollision();
        
        // Handle climbing movement
        if (this.isClimbing) {
            this.state = 'climbing';
            const climbSpeed = 2; // Slower climbing speed
            
            // Find the current ladder
            const currentLadder = this.game.level.ladders.find(ladder => 
                this.x + this.width > ladder.x && 
                this.x < ladder.x + ladder.width
            );
            
            if (currentLadder) {
                // Keep player centered on ladder
                this.x = currentLadder.x + (currentLadder.width - this.width) / 2;
                
                // Handle climbing movement
                if (this.keys.up) {
                    this.y = Math.max(currentLadder.y, this.y - climbSpeed);
                }
                if (this.keys.down) {
                    this.y = Math.min(
                        currentLadder.y + currentLadder.height - this.height,
                        this.y + climbSpeed
                    );
                }
                
                // Stop climbing if we reach the top or bottom
                if (this.y <= currentLadder.y || 
                    this.y + this.height >= currentLadder.y + currentLadder.height) {
                    this.isClimbing = false;
                }
                
                return; // Skip normal movement and gravity when climbing
            } else {
                this.isClimbing = false;
            }
        }
        
        // Handle horizontal movement
        if (this.keys.left) {
            this.x -= this.speed;
            this.state = 'running';
        } else if (this.keys.right) {
            this.x += this.speed;
            this.state = 'running';
        } else {
            this.state = 'idle';
        }
        
        // Apply gravity if not climbing
        if (!onLadder) {
            this.velocityY += this.gravity;
            this.y += this.velocityY;
        }
        
        // Simple ground collision
        if (this.y > 700) {
            this.y = 700;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Keep player in bounds
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.canvas.width - this.width) {
            this.x = this.game.canvas.width - this.width;
        }
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.canvas.height - this.height) {
            this.y = this.game.canvas.height - this.height;
        }
    }
    
    render() {
        this.game.ctx.fillStyle = 'red';
        this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw direction indicator
        this.game.ctx.fillStyle = 'white';
        this.game.ctx.fillRect(
            this.direction === 'right' ? this.x + this.width - 5 : this.x,
            this.y + this.height/2 - 2,
            5,
            4
        );
    }
} 