class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, characterData) {
        // 创建一个临时图形作为精灵 - 适中尺寸
        const size = 45; // 从 60 改小到 45
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(characterData.color, 1);
        graphics.fillRect(0, 0, size, size);
        graphics.generateTexture('player_' + characterData.id, size, size);
        
        super(scene, x, y, 'player_' + characterData.id);
        
        this.characterData = characterData;
        this.maxHp = characterData.hp;
        this.hp = characterData.hp;
        this.speed = characterData.speed;
        this.isPlayer = true;
        
        // 技能冷却
        this.skillCooldown = characterData.skill.cooldown;
        this.lastSkillTime = 0;
        this.isInvincible = false;
        this.isStunned = false;
        
        // 添加emoji标识 - 适中尺寸
        this.emojiText = scene.add.text(0, -38, characterData.emoji, {
            fontSize: '28px'
        }).setOrigin(0.5);
        
        // 添加名字 - 适中尺寸
        this.nameText = scene.add.text(0, -60, characterData.name, {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 血条背景 - 适中尺寸
        this.hpBg = scene.add.rectangle(0, -75, 55, 10, 0x333333);
        // 血条
        this.hpBar = scene.add.rectangle(-27.5, -75, 55, 10, 0x00ff00);
        this.hpBar.setOrigin(0, 0.5);
        
        // 技能冷却指示器 - 适中尺寸
        this.skillIndicator = scene.add.circle(32, -75, 6, 0x00ff00);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.body.setDrag(500);
        
        // 更新UI位置
        this.updateUIPosition();
        
        // 发光效果
        this.preFX.addGlow(characterData.color, 2, 0, false, 0.1, 5);
    }
    
    updateUIPosition() {
        this.emojiText.setPosition(this.x, this.y - 38);
        this.nameText.setPosition(this.x, this.y - 60);
        this.hpBg.setPosition(this.x, this.y - 75);
        this.hpBar.setPosition(this.x - 27.5, this.y - 75);
        this.skillIndicator.setPosition(this.x + 32, this.y - 75);
    }
    
    updateHpBar() {
        const ratio = this.hp / this.maxHp;
        this.hpBar.width = 55 * ratio;
        
        // 根据血量改变颜色
        if (ratio > 0.6) {
            this.hpBar.fillColor = 0x00ff00;
        } else if (ratio > 0.3) {
            this.hpBar.fillColor = 0xffff00;
        } else {
            this.hpBar.fillColor = 0xff0000;
        }
    }
    
    updateSkillIndicator(time) {
        const canUseSkill = time - this.lastSkillTime >= this.skillCooldown;
        this.skillIndicator.fillColor = canUseSkill ? 0x00ff00 : 0xff0000;
    }
    
    takeDamage(damage) {
        if (this.isInvincible) {
            // 反弹效果
            return 'reflected';
        }
        
        this.hp -= damage;
        this.updateHpBar();
        
        // 受伤闪烁
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
        
        if (this.hp <= 0) {
            this.die();
        }
        
        return 'damaged';
    }
    
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
        this.updateHpBar();
    }
    
    die() {
        // 死亡特效
        const particles = this.scene.add.particles(this.x, this.y, 'player_' + this.characterData.id, {
            speed: { min: 50, max: 200 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 20,
            tint: this.characterData.color
        });
        
        this.scene.time.delayedCall(500, () => particles.destroy());
        
        this.emojiText.destroy();
        this.nameText.destroy();
        this.hpBg.destroy();
        this.hpBar.destroy();
        this.skillIndicator.destroy();
        
        this.destroy();
    }
    
    fire(targetX, targetY) {
        const weapon = this.characterData.weapon;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        
        // 双发
        if (weapon.doubleShot) {
            const offset1 = angle + 0.1;
            const offset2 = angle - 0.1;
            this.createBullet(offset1);
            this.createBullet(offset2);
        }
        // 散射
        else if (weapon.scatter) {
            for (let i = -2; i <= 2; i++) {
                this.createBullet(angle + i * 0.15);
            }
        }
        else {
            this.createBullet(angle);
        }
        
        // 后坐力效果
        this.scene.tweens.add({
            targets: this,
            x: this.x - Math.cos(angle) * 5,
            y: this.y - Math.sin(angle) * 5,
            duration: 50,
            yoyo: true
        });
    }
    
    createBullet(angle) {
        const weapon = this.characterData.weapon;
        const bullet = new Bullet(this.scene, this.x, this.y, null, {
            damage: weapon.damage,
            speed: weapon.bulletSpeed,
            color: weapon.bulletColor,
            scale: weapon.bulletSize / 10,
            angle: angle,
            glow: true,
            trail: true,
            owner: this,
            bulletType: weapon.wave ? 'wave' : weapon.homing ? 'homing' : 'normal'
        });
        
        // 圆形碰撞体
        bullet.body.setCircle(weapon.bulletSize / 2);
        
        return bullet;
    }
    
    useSkill(targetX, targetY) {
        const time = this.scene.time.now;
        if (time - this.lastSkillTime < this.skillCooldown) {
            return false;
        }
        
        this.lastSkillTime = time;
        const skill = this.characterData.skill;
        
        switch(skill.effect) {
            case 'slow':
                this.skillSlow(targetX, targetY);
                break;
            case 'teleport':
                this.skillTeleport(targetX, targetY);
                break;
            case 'stun':
                this.skillStun();
                break;
            case 'knockback':
                this.skillKnockback();
                break;
            case 'aoe':
                this.skillAOE();
                break;
            case 'blackout':
                this.skillBlackout(targetX, targetY);
                break;
            case 'invincible':
                this.skillInvincible();
                break;
        }
        
        return true;
    }
    
    // Vison - 画大饼
    skillSlow(targetX, targetY) {
        const skill = this.characterData.skill;
        
        // 大饼特效
        const pie = this.scene.add.circle(targetX, targetY, 80, skill.color, 0.8);
        pie.setStrokeStyle(4, 0xFFFFFF);
        
        this.scene.tweens.add({
            targets: pie,
            scale: { from: 0, to: 1 },
            alpha: { from: 0.8, to: 0.3 },
            duration: 300,
            ease: 'Back.out'
        });
        
        // 范围伤害和减速
        this.scene.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y);
            if (dist < 80) {
                enemy.takeDamage(skill.damage);
                enemy.applySlow(skill.duration);
            }
        });
        
        this.scene.time.delayedCall(skill.duration, () => {
            this.scene.tweens.add({
                targets: pie,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => pie.destroy()
            });
        });
    }
    
    // Matt - 删库跑路
    skillTeleport(targetX, targetY) {
        const skill = this.characterData.skill;
        
        // 原地爆炸特效（报错弹窗）
        const errorWindow = this.scene.add.rectangle(this.x, this.y, 100, 60, 0xC0C0C0);
        errorWindow.setStrokeStyle(2, 0x000000);
        
        const errorText = this.scene.add.text(this.x, this.y - 15, '❌ ERROR', {
            fontSize: '16px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const errorMsg = this.scene.add.text(this.x, this.y + 10, 'System32 Deleted!', {
            fontSize: '12px',
            fill: '#ff0000'
        }).setOrigin(0.5);
        
        // 爆炸伤害
        this.scene.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < 100) {
                enemy.takeDamage(skill.damage);
            }
        });
        
        // 闪现
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const newX = this.x + Math.cos(angle) * skill.range;
        const newY = this.y + Math.sin(angle) * skill.range;
        
        this.setPosition(newX, newY);
        
        // 清理报错窗口
        this.scene.time.delayedCall(500, () => {
            errorWindow.destroy();
            errorText.destroy();
            errorMsg.destroy();
        });
    }
    
    // Vina - 奶茶轰炸
    skillStun() {
        const skill = this.characterData.skill;
        
        // 三杯奶茶从天而降
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                const targetX = Phaser.Math.Between(200, 760);
                const targetY = Phaser.Math.Between(100, 300);
                
                // 奶茶下落
                const bubbleTea = this.scene.add.text(targetX, -50, '🧋', {
                    fontSize: '48px'
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: bubbleTea,
                    y: targetY,
                    duration: 500,
                    ease: 'Bounce.out',
                    onComplete: () => {
                        // 溅射效果
                        const splash = this.scene.add.circle(targetX, targetY, 60, 0x8B4513, 0.5);
                        
                        // 范围眩晕
                        this.scene.enemies.getChildren().forEach(enemy => {
                            const dist = Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y);
                            if (dist < 60) {
                                enemy.takeDamage(skill.damage / 3);
                                enemy.applyStun(skill.duration);
                            }
                        });
                        
                        this.scene.time.delayedCall(300, () => {
                            bubbleTea.destroy();
                            splash.destroy();
                        });
                    }
                });
            });
        }
    }
    
    // Coco - 萌力咆哮
    skillKnockback() {
        const skill = this.characterData.skill;
        
        // 咆哮特效
        const roar = this.scene.add.text(this.x, this.y - 50, '😺', {
            fontSize: '64px'
        }).setOrigin(0.5);
        
        // 声波扩散
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const wave = this.scene.add.circle(this.x, this.y, 50 + i * 50, 0xFFFFFF, 0.3);
                wave.setStrokeStyle(3, 0xFFC0CB);
                
                this.scene.tweens.add({
                    targets: wave,
                    scale: 2,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => wave.destroy()
                });
            });
        }
        
        // 震退和伤害
        this.scene.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < skill.range) {
                enemy.takeDamage(skill.damage);
                
                // 击退
                const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                enemy.body.velocity.x += Math.cos(angle) * 300;
                enemy.body.velocity.y += Math.sin(angle) * 300;
            }
        });
        
        this.scene.time.delayedCall(500, () => roar.destroy());
    }
    
    // Cola - 曼妥思大爆炸
    skillAOE() {
        const skill = this.characterData.skill;
        
        // 自损
        this.takeDamage(skill.selfDamage);
        
        // 可乐喷射特效
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const endX = this.x + Math.cos(angle) * skill.range;
            const endY = this.y + Math.sin(angle) * skill.range;
            
            const beam = this.scene.add.line(this.x, this.y, 0, 0, 
                Math.cos(angle) * skill.range, 
                Math.sin(angle) * skill.range, 
                0x00FF7F, 0.8
            );
            beam.setLineWidth(8);
            
            this.scene.tweens.add({
                targets: beam,
                alpha: 0,
                duration: 300,
                onComplete: () => beam.destroy()
            });
        }
        
        // 全屏AOE伤害
        this.scene.enemies.getChildren().forEach(enemy => {
            enemy.takeDamage(skill.damage);
        });
        
        // 爆炸粒子
        const particles = this.scene.add.particles(this.x, this.y, null, {
            x: this.x,
            y: this.y,
            speed: { min: 100, max: 400 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            quantity: 30,
            emitting: false
        });
        
        // 手动创建粒子
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 300;
            const particle = this.scene.add.circle(
                this.x, this.y, 
                3 + Math.random() * 5, 
                0x00FF7F
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * speed,
                y: this.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 600,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // Andy - 强行重启
    skillBlackout(targetX, targetY) {
        const skill = this.characterData.skill;
        
        // 找到最近的敌人
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        this.scene.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });
        
        if (nearestEnemy && nearestDist < 200) {
            // 黑屏特效
            const blackScreen = this.scene.add.rectangle(
                nearestEnemy.x, nearestEnemy.y, 60, 60, 0x000000
            );
            
            nearestEnemy.applyStun(skill.duration);
            
            this.scene.time.delayedCall(skill.duration, () => {
                blackScreen.destroy();
            });
        }
    }
    
    // Rocky - 坚如磐石
    skillInvincible() {
        const skill = this.characterData.skill;
        
        this.isInvincible = true;
        
        // 变石头特效
        this.setTint(0x808080);
        const glasses = this.scene.add.text(this.x, this.y - 10, '🕶️', {
            fontSize: '20px'
        }).setOrigin(0.5);
        
        // 护盾光环
        const shield = this.scene.add.circle(this.x, this.y, 35, 0xFFFFFF, 0.3);
        shield.setStrokeStyle(3, 0x808080);
        
        // 更新护盾位置
        const updateShield = () => {
            if (shield.active && this.active) {
                shield.x = this.x;
                shield.y = this.y;
                glasses.x = this.x;
                glasses.y = this.y - 10;
            }
        };
        
        this.scene.events.on('update', updateShield);
        
        this.scene.time.delayedCall(skill.duration, () => {
            this.isInvincible = false;
            this.clearTint();
            glasses.destroy();
            shield.destroy();
            this.scene.events.off('update', updateShield);
        });
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        this.updateUIPosition();
        this.updateSkillIndicator(time);
        
        // 玩家限制在底部区域 - 竖屏适配，给控制按钮留出空间
        const screenH = this.scene.scale.height;
        const topLimit = screenH * 0.45;  // 上方限制
        const bottomLimit = screenH * 0.78;  // 下方限制（给按钮留空间）
        
        if (this.y < topLimit) {
            this.y = topLimit;
            this.body.velocity.y = 0;
        }
        if (this.y > bottomLimit) {
            this.y = bottomLimit;
            this.body.velocity.y = 0;
        }
    }
}
