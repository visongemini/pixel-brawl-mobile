class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 背景
        this.bg = this.add.image(width/2, height/2, 'background');
        this.bg.setDisplaySize(width, height);
        
        // 标题
        this.createTitle();
        
        // 角色选择
        this.createCharacterSelection();
        
        // 选中角色
        this.selectedCharacter = null;
        
        // 开始按钮
        this.createStartButton();
    }
    
    createTitle() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 主标题
        const title = this.add.text(width/2, height * 0.1, '像素大乱斗', {
            fontSize: height * 0.08 + 'px',
            fill: '#FFD93D',
            fontStyle: 'bold',
            stroke: '#FF6B6B',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // 副标题
        const subtitle = this.add.text(width/2, height * 0.18, '谁能活到最后？', {
            fontSize: height * 0.04 + 'px',
            fill: '#4ECDC4',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 标题动画
        this.tweens.add({
            targets: title,
            scale: { from: 0.8, to: 1 },
            duration: 500,
            ease: 'Back.out'
        });
        
        // 发光效果
        title.preFX.addGlow(0xFFD93D, 4, 0, false, 0.1, 10);
    }
    
    createCharacterSelection() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        const characters = getAllCharacters();
        const cols = 3;
        const rows = 3;
        const startX = width * 0.2;
        const startY = height * 0.28;
        const spacingX = width * 0.3;
        const spacingY = height * 0.18;
        
        this.characterSlots = [];
        
        characters.forEach((char, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;
            
            // 创建选择框
            const slot = this.add.container(x, y);
            
            // 背景框
            const slotSize = Math.min(width * 0.25, height * 0.15);
            const bg = this.add.rectangle(0, 0, slotSize, slotSize * 1.1, 0x000000, 0.5);
            bg.setStrokeStyle(2, 0x444444);
            slot.add(bg);
            
            // 角色图像
            const charSprite = this.add.image(0, -slotSize * 0.1, 'char_' + char.id);
            charSprite.setScale(slotSize / 60);  // 从 80 改为 60，适应 45px 纹理
            slot.add(charSprite);
            
            // Emoji
            const emoji = this.add.text(0, -slotSize * 0.35, char.emoji, {
                fontSize: slotSize * 0.25 + 'px'
            }).setOrigin(0.5);
            slot.add(emoji);
            
            // 名字
            const name = this.add.text(0, slotSize * 0.15, char.name, {
                fontSize: slotSize * 0.12 + 'px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            slot.add(name);
            
            // 血量指示
            const hpText = this.add.text(0, slotSize * 0.32, `❤️${char.hp}`, {
                fontSize: slotSize * 0.1 + 'px',
                fill: '#ff6b6b'
            }).setOrigin(0.5);
            slot.add(hpText);
            
            // 交互
            bg.setInteractive({ useHandCursor: true });
            
            bg.on('pointerover', () => {
                this.tweens.add({ targets: slot, scale: 1.1, duration: 100 });
                bg.setStrokeStyle(3, 0xFFD93D);
            });

            bg.on('pointerout', () => {
                this.tweens.add({ targets: slot, scale: 1, duration: 100 });
                if (this.selectedCharacter !== char) {
                    bg.setStrokeStyle(2, 0x444444);
                }
            });

            bg.on('pointerdown', () => {
                // 移动端触觉反馈（hover 在触屏上无效）
                this.tweens.add({ targets: slot, scale: 1.1, duration: 50 });
                bg.setStrokeStyle(3, 0xFFD93D);
                this.selectCharacter(char, bg, slot);
            });

            bg.on('pointerup', () => {
                if (this.selectedCharacter !== char) {
                    this.tweens.add({ targets: slot, scale: 1, duration: 50 });
                    bg.setStrokeStyle(2, 0x444444);
                }
            });
            
            slot.charData = char;
            this.characterSlots.push({ slot, bg });
        });
    }
    
    selectCharacter(char, bg, slot) {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 重置所有选中状态
        this.characterSlots.forEach(({ bg }) => {
            bg.setStrokeStyle(2, 0x444444);
        });
        
        // 选中当前
        bg.setStrokeStyle(4, 0x00FF00);
        this.selectedCharacter = char;
        
        // 显示角色信息
        this.showCharacterInfo(char);
        
        // 选中动画
        this.tweens.add({
            targets: bg,
            alpha: 0.7,
            duration: 100,
            yoyo: true
        });
    }
    
    showCharacterInfo(char) {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 移除旧的信息面板
        if (this.infoPanel) {
            this.infoPanel.destroy();
        }
        
        // 创建信息面板
        this.infoPanel = this.add.container(width/2, height * 0.75);
        
        const weapon = char.weapon;
        const skill = char.skill;
        
        const infoText = this.add.text(0, 0, 
            `${char.emoji} ${char.name}\n\n` +
            `武器: ${weapon.name}\n` +
            `💥伤害: ${weapon.damage}  ⚡攻速: ${(1000/weapon.fireRate).toFixed(1)}/s\n\n` +
            `技能: ${skill.name}\n` +
            `⏱️冷却: ${skill.cooldown/1000}s`, {
            fontSize: height * 0.025 + 'px',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5);
        
        this.infoPanel.add(infoText);
    }
    
    createStartButton() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        this.startButton = this.add.container(width/2, height * 0.9);
        
        const btnWidth = width * 0.4;
        const btnHeight = height * 0.08;
        
        const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0xFF6B6B);
        bg.setStrokeStyle(3, 0xFFFFFF);
        
        const text = this.add.text(0, 0, '开始游戏', {
            fontSize: height * 0.04 + 'px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.startButton.add([bg, text]);
        
        bg.setInteractive({ useHandCursor: true });
        
        bg.on('pointerover', () => {
            this.tweens.add({ targets: this.startButton, scale: 1.1, duration: 100 });
            bg.setFillStyle(0xFF8B94);
        });

        bg.on('pointerout', () => {
            this.tweens.add({ targets: this.startButton, scale: 1, duration: 100 });
            bg.setFillStyle(0xFF6B6B);
        });

        bg.on('pointerdown', () => {
            // 移动端触觉反馈
            this.tweens.add({ targets: this.startButton, scale: 1.1, duration: 50 });
            bg.setFillStyle(0xFF8B94);
            if (this.selectedCharacter) {
                this.startGame();
            } else {
                // 未选择角色提示
                const hint = this.add.text(width/2, height * 0.6, '请先选择一个角色!', {
                    fontSize: height * 0.03 + 'px',
                    fill: '#FF6B6B',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                
                this.tweens.add({
                    targets: hint,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => hint.destroy()
                });
            }
        });

        bg.on('pointerup', () => {
            this.tweens.add({ targets: this.startButton, scale: 1, duration: 50 });
            bg.setFillStyle(0xFF6B6B);
        });
    }

    startGame() {
        // 过渡动画
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene', {
                selectedCharacter: this.selectedCharacter
            });
        });
    }
}
