class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init(data) {
        this.selectedCharacter = data.selectedCharacter;
        this.gameTime = 180; // 3分钟倒计时
        this.isGameOver = false;
        
        // 虚拟摇杆状态
        this.joystick = {
            active: false,
            pointer: null,
            centerX: 0,
            centerY: 0,
            deltaX: 0,
            deltaY: 0,
            maxDistance: 60
        };
        
        // 触摸射击状态
        this.touchShoot = {
            active: false,
            pointer: null
        };
    }
    
    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 背景 - 使用tileSprite实现无限滚动效果
        this.bg = this.add.tileSprite(width/2, height/2, width, height, 'background');
        this.bg.setScrollFactor(0);
        
        // 物理世界边界
        this.physics.world.setBounds(0, 0, width, height);
        
        // 创建玩家
        this.createPlayer();
        
        // 创建敌人
        this.createEnemies();
        
        // 创建UI
        this.createUI();
        
        // 创建虚拟摇杆
        this.createVirtualJoystick();
        
        // 创建射击按钮
        this.createShootButton();
        
        // 创建技能按钮
        this.createSkillButton();
        
        // 创建碰撞
        this.createCollisions();
        
        // 开始倒计时
        this.startTimer();
        
        // 游戏开始提示
        this.showStartHint();
    }
    
    createPlayer() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 玩家在底部中央（竖屏）
        this.player = new Player(this, width/2, height * 0.65, this.selectedCharacter);
        this.player.setDepth(10);
        
        // 出生特效 - 更大
        const spawnEffect = this.add.circle(this.player.x, this.player.y, 70, 0xFFFFFF, 0.8);
        this.tweens.add({
            targets: spawnEffect,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => spawnEffect.destroy()
        });
    }
    
    createEnemies() {
        this.enemies = this.physics.add.group();
        
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 获取其他6个角色
        const allChars = getAllCharacters();
        const enemyChars = allChars.filter(c => c.id !== this.selectedCharacter.id);
        
        // 随机位置生成敌人（上半部分 - 竖屏布局）
        enemyChars.forEach((char, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = width * 0.25 + col * (width * 0.5) + Phaser.Math.Between(-40, 40);
            const y = height * 0.12 + row * (height * 0.12) + Phaser.Math.Between(-20, 20);
            
            const enemy = new Enemy(this, x, y, char, this.player);
            enemy.setDepth(10);
            this.enemies.add(enemy);
            
            // 出生特效
            const spawnEffect = this.add.circle(x, y, 50, char.color, 0.6);
            this.tweens.add({
                targets: spawnEffect,
                scale: 1.5,
                alpha: 0,
                duration: 400,
                onComplete: () => spawnEffect.destroy()
            });
        });
    }
    
    createUI() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 倒计时
        this.timerText = this.add.text(width/2, height * 0.06, '3:00', {
            fontSize: height * 0.06 + 'px',
            fill: '#FFD93D',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 倒计时标签
        this.add.text(width/2, height * 0.10, '秒', {
            fontSize: height * 0.02 + 'px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // 剩余敌人
        this.enemyText = this.add.text(width * 0.05, height * 0.06, `敌人: ${this.enemies.countActive()}`, {
            fontSize: height * 0.025 + 'px',
            fill: '#FF6B6B',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // 技能提示
        this.skillHint = this.add.text(width/2, height * 0.95, `【技能】${this.selectedCharacter.skill.name}`, {
            fontSize: height * 0.02 + 'px',
            fill: '#4ECDC4',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // 玩家血条（右上角）
        const hpX = width * 0.85;
        const hpY = height * 0.06;
        this.playerHpBg = this.add.rectangle(hpX, hpY, width * 0.12, height * 0.025, 0x333333);
        this.playerHpBar = this.add.rectangle(hpX - width * 0.06, hpY, width * 0.12, height * 0.025, 0x00FF00);
        this.playerHpBar.setOrigin(0, 0.5);
        
        this.playerHpText = this.add.text(hpX, hpY + height * 0.035, `${this.player.hp}/${this.player.maxHp}`, {
            fontSize: height * 0.018 + 'px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
    
    createVirtualJoystick() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 摇杆位置 - 左下角 (竖屏)
        const joystickX = width * 0.22;
        const joystickY = height * 0.88;

        // 摇杆底座 - 更大
        this.joystickBase = this.add.circle(joystickX, joystickY, 90, 0x333333, 0.5);
        this.joystickBase.setStrokeStyle(3, 0x666666);
        this.joystickBase.setDepth(100);
        this.joystickBase.setScrollFactor(0);

        // 摇杆按钮 - 更大
        this.joystickThumb = this.add.circle(joystickX, joystickY, 45, 0x4ECDC4, 0.8);
        this.joystickThumb.setStrokeStyle(2, 0xFFFFFF);
        this.joystickThumb.setDepth(101);
        this.joystickThumb.setScrollFactor(0);

        // 摇杆提示
        this.joystickHint = this.add.text(joystickX, joystickY + 115, '移动', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        this.joystickHint.setDepth(100);
        this.joystickHint.setScrollFactor(0);

        // 摇杆交互区域 - 更大，使用自定义 hit area 支持多点触控
        this.joystickZone = this.add.circle(joystickX, joystickY, 130, 0x000000, 0.01);
        this.joystickZone.setDepth(99);
        this.joystickZone.setScrollFactor(0);
        this.joystickZone.setInteractive({ draggable: true });

        // 摇杆触摸事件 - 修复多点触控问题
        this.joystickZone.on('pointerdown', (pointer, localX, localY, event) => {
            // 阻止默认行为，防止页面滚动
            if (event) event.stopPropagation();

            this.joystick.active = true;
            this.joystick.pointer = pointer;
            this.joystick.pointerId = pointer.id; // 保存 pointer ID 用于识别
            this.joystick.centerX = joystickX;
            this.joystick.centerY = joystickY;
        });

        // 用全局 input 事件追踪手指，即使滑出 zone 也能继续
        this.input.on('pointermove', (pointer) => {
            if (this.joystick.active && this.joystick.pointerId === pointer.id) {
                const dx = pointer.x - this.joystick.centerX;
                const dy = pointer.y - this.joystick.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const maxDist = this.joystick.maxDistance;
                const clampedDist = Math.min(distance, maxDist);
                const angle = Math.atan2(dy, dx);

                this.joystick.deltaX = Math.cos(angle) * clampedDist;
                this.joystick.deltaY = Math.sin(angle) * clampedDist;

                this.joystickThumb.x = this.joystick.centerX + this.joystick.deltaX;
                this.joystickThumb.y = this.joystick.centerY + this.joystick.deltaY;
            }
        });

        // 全局 pointerup 处理摇杆释放（无论手指在哪松开）
        this.input.on('pointerup', (pointer) => {
            if (this.joystick.pointerId === pointer.id) {
                this.joystick.active = false;
                this.joystick.pointer = null;
                this.joystick.pointerId = null;
                this.joystick.deltaX = 0;
                this.joystick.deltaY = 0;

                this.tweens.add({
                    targets: this.joystickThumb,
                    x: this.joystick.centerX || joystickX,
                    y: this.joystick.centerY || joystickY,
                    duration: 150,
                    ease: 'Power2'
                });
            }
        });
    }
    
    createShootButton() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 射击按钮位置 - 右下角 (竖屏)
        const btnX = width * 0.78;
        const btnY = height * 0.88;

        // 射击按钮背景 - 更大
        this.shootBtnBg = this.add.circle(btnX, btnY, 70, 0xFF6B6B, 0.8);
        this.shootBtnBg.setStrokeStyle(3, 0xFFFFFF);
        this.shootBtnBg.setDepth(100);
        this.shootBtnBg.setScrollFactor(0);

        // 射击按钮文字 - 更大
        this.shootBtnText = this.add.text(btnX, btnY, '🔫', {
            fontSize: '48px'
        }).setOrigin(0.5);
        this.shootBtnText.setDepth(101);
        this.shootBtnText.setScrollFactor(0);

        // 射击提示
        this.shootHint = this.add.text(btnX, btnY + 95, '射击', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        this.shootHint.setDepth(100);
        this.shootHint.setScrollFactor(0);

        // 射击按钮交互 - 使用独立的事件，支持多点触控
        this.shootBtnZone = this.add.circle(btnX, btnY, 90, 0x000000, 0.01);
        this.shootBtnZone.setDepth(99);
        this.shootBtnZone.setScrollFactor(0);
        this.shootBtnZone.setInteractive();

        // 自动射击辅助函数
        const fireAtNearest = () => {
            if (this.isGameOver || !this.player.active) return;

            let targetX = this.player.x;
            let targetY = this.player.y - 200;
            let nearestDist = Infinity;

            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        targetX = enemy.x;
                        targetY = enemy.y;
                    }
                }
            });

            this.player.fire(targetX, targetY);
        };

        // 按住持续射击
        this.shootBtnZone.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();

            fireAtNearest();

            // 按钮按下效果
            this.tweens.add({
                targets: this.shootBtnBg,
                scale: 0.9,
                duration: 50,
                yoyo: true
            });

            // 持续射击定时器
            this.autoFireTimer = this.time.addEvent({
                delay: this.selectedCharacter.weapon.fireRate,
                callback: fireAtNearest,
                loop: true
            });
        });

        // 松手停止射击
        const stopFire = (pointer) => {
            if (this.autoFireTimer) {
                this.autoFireTimer.remove();
                this.autoFireTimer = null;
            }
        };
        this.shootBtnZone.on('pointerup', stopFire);
        this.shootBtnZone.on('pointerupoutside', stopFire);
    }
    
    createSkillButton() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 技能按钮位置 - 射击按钮上方 (竖屏布局)
        const btnX = width * 0.78;
        const btnY = height * 0.72;

        // 技能按钮背景 - 更大
        this.skillBtnBg = this.add.circle(btnX, btnY, 55, 0xFFD93D, 0.8);
        this.skillBtnBg.setStrokeStyle(3, 0xFFFFFF);
        this.skillBtnBg.setDepth(100);
        this.skillBtnBg.setScrollFactor(0);

        // 技能按钮图标 - 更大
        const skillIcon = this.selectedCharacter.skill.effect === 'slow' ? '🥧' :
                         this.selectedCharacter.skill.effect === 'teleport' ? '💻' :
                         this.selectedCharacter.skill.effect === 'stun' ? '🧋' :
                         this.selectedCharacter.skill.effect === 'knockback' ? '😺' :
                         this.selectedCharacter.skill.effect === 'aoe' ? '🥤' :
                         this.selectedCharacter.skill.effect === 'blackout' ? '🐛' : '🪨';

        this.skillBtnText = this.add.text(btnX, btnY, skillIcon, {
            fontSize: '40px'
        }).setOrigin(0.5);
        this.skillBtnText.setDepth(101);
        this.skillBtnText.setScrollFactor(0);

        // 技能提示
        this.skillBtnHint = this.add.text(btnX, btnY + 75, '技能', {
            fontSize: '18px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        this.skillBtnHint.setDepth(100);
        this.skillBtnHint.setScrollFactor(0);

        // 冷却遮罩 - 更大
        this.skillCooldownMask = this.add.arc(btnX, btnY, 55, -90, 270, false, 0x000000, 0.6);
        this.skillCooldownMask.setDepth(102);
        this.skillCooldownMask.setScrollFactor(0);
        this.skillCooldownMask.visible = false;

        // 技能按钮交互 - 支持多点触控
        this.skillBtnZone = this.add.circle(btnX, btnY, 75, 0x000000, 0.01);
        this.skillBtnZone.setDepth(99);
        this.skillBtnZone.setScrollFactor(0);
        this.skillBtnZone.setInteractive();

        this.skillBtnZone.on('pointerdown', (pointer, localX, localY, event) => {
            // 阻止事件冒泡
            if (event) event.stopPropagation();

            if (!this.isGameOver && this.player.active) {
                let targetX = this.player.x;
                let targetY = this.player.y - 200;

                // 找到最近的敌人作为目标
                let nearestEnemy = null;
                let nearestDist = Infinity;

                this.enemies.getChildren().forEach(enemy => {
                    if (enemy.active) {
                        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestEnemy = enemy;
                        }
                    }
                });

                if (nearestEnemy) {
                    targetX = nearestEnemy.x;
                    targetY = nearestEnemy.y;
                }

                const success = this.player.useSkill(targetX, targetY);

                if (success) {
                    // 按钮按下效果
                    this.tweens.add({
                        targets: this.skillBtnBg,
                        scale: 0.9,
                        duration: 50,
                        yoyo: true
                    });
                }
            }
        });
    }
    
    updateUI() {
        // 更新敌人数量
        const aliveEnemies = this.enemies.countActive();
        this.enemyText.setText(`敌人: ${aliveEnemies}`);
        
        // 更新玩家血条
        const hpRatio = this.player.hp / this.player.maxHp;
        this.playerHpBar.width = this.scale.width * 0.12 * hpRatio;
        this.playerHpText.setText(`${Math.max(0, this.player.hp)}/${this.player.maxHp}`);
        
        // 改变血条颜色
        if (hpRatio > 0.6) {
            this.playerHpBar.fillColor = 0x00FF00;
        } else if (hpRatio > 0.3) {
            this.playerHpBar.fillColor = 0xFFFF00;
        } else {
            this.playerHpBar.fillColor = 0xFF0000;
        }
        
        // 更新技能冷却显示
        const time = this.time.now;
        const skill = this.selectedCharacter.skill;
        const cooldownProgress = Math.min(1, (time - this.player.lastSkillTime) / skill.cooldown);
        
        if (cooldownProgress < 1) {
            this.skillCooldownMask.visible = true;
            this.skillCooldownMask.startAngle = -90;
            this.skillCooldownMask.endAngle = -90 + (1 - cooldownProgress) * 360;
        } else {
            this.skillCooldownMask.visible = false;
        }
        
        // 检查胜利条件
        if (aliveEnemies === 0 && !this.isGameOver) {
            this.gameWin();
        }
    }
    
    createCollisions() {
        // 先创建子弹组（必须先创建再设置碰撞）
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
        
        this.enemyBullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
        
        // 玩家子弹击中敌人
        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            this.hitEnemy,
            null,
            this
        );
        
        // 敌人子弹击中玩家
        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            this.hitPlayer,
            null,
            this
        );
        
        // 敌人和敌人之间碰撞
        this.physics.add.collider(this.enemies, this.enemies);
        
        // 敌人和玩家碰撞
        this.physics.add.collider(this.enemies, this.player);
    }
    
    startTimer() {
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameTime--;
                // 格式化为分:秒
                const minutes = Math.floor(this.gameTime / 60);
                const seconds = this.gameTime % 60;
                this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                
                // 时间警告
                if (this.gameTime <= 30) {
                    this.timerText.setFill('#FF0000');
                    this.tweens.add({
                        targets: this.timerText,
                        scale: 1.2,
                        duration: 200,
                        yoyo: true
                    });
                }
                
                // 时间到
                if (this.gameTime <= 0 && !this.isGameOver) {
                    this.gameLose('timeout');
                }
            },
            loop: true
        });
    }
    
    showStartHint() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        const hint = this.add.text(width/2, height/2, '战斗开始!', {
            fontSize: height * 0.08 + 'px',
            fill: '#FFD93D',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        hint.setScale(0);
        
        this.tweens.add({
            targets: hint,
            scale: 1,
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: hint,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => hint.destroy()
                    });
                });
            }
        });
    }
    
    hitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;

        // 保存属性（destroy 后不可靠）
        const bx = bullet.x;
        const by = bullet.y;
        const damage = bullet.damage;
        const color = bullet.tintTopLeft || 0xFFFFFF;

        enemy.takeDamage(damage);
        bullet.destroy();

        this.createHitEffect(bx, by, color);
    }

    hitPlayer(enemyBullet, player) {
        // Phaser overlap(group, sprite) 回调顺序：(groupMember, sprite)
        // 所以第一个参数是 enemyBullet，第二个是 player
        if (!enemyBullet.active || !player.active) return;

        const bx = enemyBullet.x;
        const by = enemyBullet.y;
        const damage = enemyBullet.damage;

        const result = player.takeDamage(damage);
        enemyBullet.destroy();

        this.createHitEffect(bx, by, 0xFF0000);

        if (player.hp <= 0 && !this.isGameOver) {
            this.gameLose('death');
        }
    }
    
    createHitEffect(x, y, color) {
        // 爆炸粒子
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            const particle = this.add.circle(x, y, 4, color);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    gameWin() {
        this.isGameOver = true;
        this.timerEvent.remove();
        
        // 胜利特效
        this.createVictoryEffect();
        
        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', {
                result: 'win',
                character: this.selectedCharacter,
                timeLeft: this.gameTime
            });
        });
    }
    
    gameLose(reason) {
        this.isGameOver = true;
        this.timerEvent.remove();
        
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 失败提示
        const loseText = this.add.text(width/2, height/2, 
            reason === 'timeout' ? '时间到!' : '你挂了!', {
            fontSize: height * 0.1 + 'px',
            fill: '#FF0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: loseText,
            scale: { from: 0.5, to: 1.2 },
            duration: 300,
            ease: 'Back.out'
        });
        
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', {
                result: 'lose',
                character: this.selectedCharacter,
                reason: reason
            });
        });
    }
    
    createVictoryEffect() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 彩花效果
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
        
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const color = Phaser.Utils.Array.GetRandom(colors);
            
            const confetti = this.add.rectangle(x, y, 10, 10, color);
            confetti.rotation = Math.random() * Math.PI;
            
            this.tweens.add({
                targets: confetti,
                y: y + 200,
                rotation: confetti.rotation + Math.PI * 2,
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => confetti.destroy()
            });
        }
        
        // 胜利文字
        const victoryText = this.add.text(width/2, height/2, '胜利!', {
            fontSize: height * 0.12 + 'px',
            fill: '#FFD93D',
            fontStyle: 'bold',
            stroke: '#00FF00',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        victoryText.setScale(0);
        this.tweens.add({
            targets: victoryText,
            scale: 1,
            duration: 500,
            ease: 'Elastic.out'
        });
    }
    
    update() {
        if (this.isGameOver || !this.player.active) return;
        
        // 玩家移动 - 虚拟摇杆控制
        const speed = this.player.speed;
        let vx = 0;
        let vy = 0;
        
        if (this.joystick.active) {
            const maxDist = this.joystick.maxDistance;
            vx = (this.joystick.deltaX / maxDist) * speed;
            vy = (this.joystick.deltaY / maxDist) * speed;
        }
        
        this.player.body.velocity.x = vx;
        this.player.body.velocity.y = vy;
        
        // 更新UI
        this.updateUI();
        
        // 保持UI元素在屏幕固定位置
        this.updateUIPositions();
    }
    
    updateUIPositions() {
        // 当屏幕尺寸变化时更新UI位置
        const width = this.scale.width;
        const height = this.scale.height;
        
        // 背景适配
        this.bg.setSize(width, height);
        this.bg.setPosition(width/2, height/2);
    }
}
