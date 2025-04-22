class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Game state
        this.gameState = 'running'; // running, paused, gameOver
        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000/60; // 60 FPS
        
        // Initialize game objects
        this.init();
        
        // Start game loop
        this.gameLoop(0);
    }
    
    init() {
        // Create player
        this.player = new Player(this);
    }
    
    update(deltaTime) {
        // Update game objects
        this.player.update();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 532, this.canvas.width, 68);
        
        // Render game objects
        this.player.render();
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        
        this.render();
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
}); 