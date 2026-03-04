class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.result = data.result;
        this.character = data.character;
        this.timeLeft = data.timeLeft || 0;
        this.reason = data.reason || '';
    }
    
    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 背景
        this.bg = this.add.image(width/2, height/2, 'background');
        this.bg.setDisplaySize(width, height);
        
        // 根据结果显示不同内容
        if (this.result === 'win') {
            this.createVictoryScreen();
        } else {
            this.createDefeatScreen();
        }
        
        // 创建按钮
        this.createButtons();
    }
    
    createVictoryScreen() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 大标题
        const title = this.add.text(width/2, height * 0.15, '🎉 胜利! 🎉', {
            fontSize: height * 0.08 + 'px',
            fill: '#FFD93D',
            fontStyle: 'bold',
            stroke: '#00FF00',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: title,
            scale: { from: 0.5, to: 1 },
            duration: 500,
            ease: 'Elastic.out'
        });
        
        // 角色展示
        const charSprite = this.add.image(width/2, height * 0.35, 'char_' + this.character.id);
        charSprite.setScale(height * 0.003);
        
        // 发光效果
        const glow = this.add.circle(width/2, height * 0.35, height * 0.1, 0xFFD93D, 0.3);
        this.tweens.add({
            targets: glow,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            repeat: -1
        });
        
        // 角色名字
        this.add.text(width/2, height * 0.48, `${this.character.emoji} ${this.character.name}`, {
            fontSize: height * 0.04 + 'px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 胜利信息
        this.add.text(width/2, height * 0.55, `剩余时间: ${this.timeLeft}秒`, {
            fontSize: height * 0.03 + 'px',
            fill: '#4ECDC4'
        }).setOrigin(0.5);
        
        // 评价
        let rating = '⭐⭐⭐';
        let comment = '完美! 你是像素大乱斗之王!';
        
        if (this.timeLeft > 40) {
            rating = '⭐⭐⭐⭐⭐';
            comment = '神级操作! 碾压全场!';
        } else if (this.timeLeft > 20) {
            rating = '⭐⭐⭐⭐';
            comment = '精彩表现! 实至名归!';
        } else if (this.timeLeft > 5) {
            comment = '不错的战斗! 再接再厉!';
        } else {
            rating = '⭐⭐';
            comment = '险胜! 下次要更加小心!';
        }
        
        this.add.text(width/2, height * 0.62, rating, {
            fontSize: height * 0.05 + 'px'
        }).setOrigin(0.5);
        
        this.add.text(width/2, height * 0.70, comment, {
            fontSize: height * 0.025 + 'px',
            fill: '#FF8B94',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }
    
    createDefeatScreen() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 大标题
        const title = this.add.text(width/2, height * 0.15, '💀 失败 💀', {
            fontSize: height * 0.08 + 'px',
            fill: '#FF6B6B',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: title,
            y: height * 0.16,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        // 角色展示（灰度）
        const charSprite = this.add.image(width/2, height * 0.35, 'char_' + this.character.id);
        charSprite.setScale(height * 0.003);
        charSprite.setTint(0x666666);
        
        // 角色名字
        this.add.text(width/2, height * 0.48, `${this.character.emoji} ${this.character.name}`, {
            fontSize: height * 0.04 + 'px',
            fill: '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 失败原因
        const reasonText = this.reason === 'timeout' 
            ? '⏰ 时间到! 还有敌人存活'
            : '💔 你的血量耗尽了';
        
        this.add.text(width/2, height * 0.55, reasonText, {
            fontSize: height * 0.03 + 'px',
            fill: '#FF6B6B'
        }).setOrigin(0.5);
        
        // 鼓励的话
        const encouragements = [
            '别灰心，下次再来!',
            '失败是成功之母!',
            '换个角色试试?',
            '熟能生巧，继续练习!',
            '你的敌人太狡猾了!'
        ];
        
        const comment = Phaser.Utils.Array.GetRandom(encouragements);
        
        this.add.text(width/2, height * 0.62, comment, {
            fontSize: height * 0.025 + 'px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        
        // 死亡统计
        this.add.text(width/2, height * 0.70, '建议: 多使用技能，注意躲避', {
            fontSize: height * 0.02 + 'px',
            fill: '#4ECDC4'
        }).setOrigin(0.5);
    }
    
    createButtons() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 再来一局按钮
        const restartBtn = this.add.container(width * 0.3, height * 0.85);
        
        const btnWidth = width * 0.35;
        const btnHeight = height * 0.07;
        
        const restartBg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x4ECDC4);
        restartBg.setStrokeStyle(3, 0xFFFFFF);
        
        const restartText = this.add.text(0, 0, '🔄 再来一局', {
            fontSize: height * 0.03 + 'px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        restartBtn.add([restartBg, restartText]);
        
        restartBg.setInteractive({ useHandCursor: true });
        
        restartBg.on('pointerover', () => {
            this.tweens.add({ targets: restartBtn, scale: 1.1, duration: 100 });
            restartBg.setFillStyle(0x5EDDD4);
        });
        restartBg.on('pointerout', () => {
            this.tweens.add({ targets: restartBtn, scale: 1, duration: 100 });
            restartBg.setFillStyle(0x4ECDC4);
        });
        restartBg.on('pointerdown', () => {
            this.tweens.add({ targets: restartBtn, scale: 1.1, duration: 50 });
            restartBg.setFillStyle(0x5EDDD4);
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });
        restartBg.on('pointerup', () => {
            this.tweens.add({ targets: restartBtn, scale: 1, duration: 50 });
            restartBg.setFillStyle(0x4ECDC4);
        });
        
        // 选择角色按钮
        const menuBtn = this.add.container(width * 0.7, height * 0.85);
        
        const menuBg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0xFF6B6B);
        menuBg.setStrokeStyle(3, 0xFFFFFF);
        
        const menuText = this.add.text(0, 0, '🎮 主菜单', {
            fontSize: height * 0.03 + 'px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        menuBtn.add([menuBg, menuText]);
        
        menuBg.setInteractive({ useHandCursor: true });
        
        menuBg.on('pointerover', () => {
            this.tweens.add({ targets: menuBtn, scale: 1.1, duration: 100 });
            menuBg.setFillStyle(0xFF8B8B);
        });
        menuBg.on('pointerout', () => {
            this.tweens.add({ targets: menuBtn, scale: 1, duration: 100 });
            menuBg.setFillStyle(0xFF6B6B);
        });
        menuBg.on('pointerdown', () => {
            this.tweens.add({ targets: menuBtn, scale: 1.1, duration: 50 });
            menuBg.setFillStyle(0xFF8B8B);
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });
        menuBg.on('pointerup', () => {
            this.tweens.add({ targets: menuBtn, scale: 1, duration: 50 });
            menuBg.setFillStyle(0xFF6B6B);
        });
    }
}
