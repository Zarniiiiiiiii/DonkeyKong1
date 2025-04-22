class Player {
    constructor(game) {
        this.game = game;
        this.width = 32;
        this.height = 32;
        this.x = 100;
        this.y = 500;
        this.speed = 3;
        this.jumpForce = -12;
        this.gravity = 0.5;
        this.velocityY = 0;
        this.isJumping = false;
        this.isClimbing = false;
        this.direction = 'right';
        
        // Player states
        this.state = 'idle'; // idle, running, jumping, climbing
        
        // Input handling
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false
        };
        
        this.setupInput();
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
                    this.keys.jump = true;
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
                    this.keys.jump = false;
                    break;
            }
        });
    }
    
    update() {
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
        
        // Handle jumping
        if (this.keys.jump && !this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            this.state = 'jumping';
        }
        
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        // Simple ground collision
        if (this.y > 500) {
            this.y = 500;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Keep player in bounds
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.canvas.width - this.width) {
            this.x = this.game.canvas.width - this.width;
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