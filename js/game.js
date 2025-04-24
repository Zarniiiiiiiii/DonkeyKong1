class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 600;
        this.canvas.height = 800;
        
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
        // Create level
        this.level = new Level(this);
        
        // Create player
        this.player = new Player(this);
    }
    
    update(deltaTime) {
        // Update level (handles platform and ladder collisions)
        this.level.update(this.player, deltaTime);
        
        // Update player
        this.player.update();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 722, this.canvas.width, 75);
        
        // Render level (platforms and ladders)
        this.level.render();
        
        // Render player
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