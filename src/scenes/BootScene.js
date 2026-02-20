class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // 创建像素纹理
        this.createPixelTextures();
        
        // 创建子弹纹理
        this.createBulletTexture();
        
        // 创建粒子纹理
        this.createParticleTexture();
        
        // 创建背景纹理
        this.createBackgroundTexture();
    }
    
    createPixelTextures() {
        // 创建角色占位符纹理 - 适中尺寸
        const characters = ['vison', 'matt', 'vina', 'coco', 'cola', 'andy', 'rocky'];
        const colors = [0xFF6B6B, 0x4ECDC4, 0xFF8B94, 0xFFA07A, 0x98FB98, 0x87CEEB, 0xDDA0DD];
        const size = 45; // 从 60 改小到 45
        
        characters.forEach((char, index) => {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            
            // 绘制像素风格的角色 - 适中尺寸
            graphics.fillStyle(colors[index], 1);
            graphics.fillRect(0, 0, size, size);
            
            // 添加像素细节
            graphics.fillStyle(0xFFFFFF, 0.5);
            const eyeSize = Math.floor(size * 0.2);
            const eyeOffset = Math.floor(size * 0.13);
            const mouthY = Math.floor(size * 0.63);
            const mouthW = Math.floor(size * 0.5);
            const mouthH = Math.floor(size * 0.2);
            
            graphics.fillRect(eyeOffset, eyeOffset, eyeSize, eyeSize);
            graphics.fillRect(size - eyeOffset - eyeSize, eyeOffset, eyeSize, eyeSize);
            graphics.fillRect(Math.floor(size * 0.25), mouthY, mouthW, mouthH);
            
            // 边框
            graphics.lineStyle(2, 0x000000, 0.3);
            graphics.strokeRect(0, 0, size, size);
            
            graphics.generateTexture('char_' + char, size, size);
        });
    }
    
    createBulletTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('bullet', 16, 16);
    }
    
    createParticleTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillRect(0, 0, 8, 8);
        graphics.generateTexture('particle', 8, 8);
    }
    
    createBackgroundTexture() {
        // 创建像素风格背景 - 动态尺寸
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // 深色背景
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRect(0, 0, 960, 640);
        
        // 网格线
        graphics.lineStyle(1, 0x333333, 0.5);
        for (let x = 0; x < 960; x += 40) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 640);
        }
        for (let y = 0; y < 640; y += 40) {
            graphics.moveTo(0, y);
            graphics.lineTo(960, y);
        }
        graphics.strokePath();
        
        // 装饰性的像素星星
        graphics.fillStyle(0xFFFFFF, 0.8);
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 960;
            const y = Math.random() * 640;
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('background', 960, 640);
    }
    
    create() {
        // 添加加载动画
        const width = this.scale.width;
        const height = this.scale.height;
        
        const loadingText = this.add.text(width/2, height/2, 'Loading...', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: loadingText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.scene.start('MenuScene');
            }
        });
    }
}
