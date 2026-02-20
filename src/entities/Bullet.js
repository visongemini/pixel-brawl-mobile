class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, config) {
        super(scene, x, y, texture);
        
        this.damage = config.damage || 10;
        this.speed = config.speed || 400;
        this.owner = config.owner || null;
        this.isEnemy = config.isEnemy || false;
        this.bulletType = config.bulletType || 'normal';
        this.waveOffset = 0;
        this.waveAmplitude = config.waveAmplitude || 20;
        this.waveFrequency = config.waveFrequency || 0.1;
        this.startX = x;
        this.startY = y;
        this.homingTarget = config.homingTarget || null;
        this.homingStrength = config.homingStrength || 0.05;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置子弹外观
        this.setTint(config.color || 0xFFFFFF);
        this.setScale(config.scale || 1);
        
        // 发光效果
        if (config.glow) {
            this.preFX.addGlow(config.color || 0xFFFFFF, 4, 0, false, 0.1, 10);
        }
        
        // 设置速度
        scene.physics.velocityFromRotation(config.angle, this.speed, this.body.velocity);
        
        // 生命周期
        this.lifespan = config.lifespan || 3000;
        
        // 粒子拖尾效果
        if (config.trail) {
            this.createTrail(scene, config.color);
        }
    }
    
    createTrail(scene, color) {
        // 简化的拖尾效果
        this.trailTimer = scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (this.active) {
                    const trail = scene.add.circle(this.x, this.y, 3, color, 0.5);
                    trail.setDepth(this.depth - 1);
                    scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.5,
                        duration: 300,
                        onComplete: () => trail.destroy()
                    });
                }
            },
            loop: true
        });
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // 波浪弹道
        if (this.bulletType === 'wave') {
            this.waveOffset += this.waveFrequency * delta;
            const perpendicularX = -Math.sin(this.body.velocity.angle());
            const perpendicularY = Math.cos(this.body.velocity.angle());
            const offset = Math.sin(this.waveOffset) * this.waveAmplitude;
            
            this.body.velocity.x = Math.cos(this.body.velocity.angle()) * this.speed + perpendicularX * offset * 0.1;
            this.body.velocity.y = Math.sin(this.body.velocity.angle()) * this.speed + perpendicularY * offset * 0.1;
        }
        
        // 追踪弹
        if (this.bulletType === 'homing' && this.homingTarget && this.homingTarget.active) {
            const angleToTarget = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.homingTarget.x, this.homingTarget.y
            );
            const currentAngle = this.body.velocity.angle();
            const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angleToTarget, this.homingStrength);
            this.scene.physics.velocityFromRotation(newAngle, this.speed, this.body.velocity);
        }
        
        // 生命周期
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
        }
        
        // 边界检查 - 使用动态边界
        const boundsX = this.scene.scale.width;
        const boundsY = this.scene.scale.height;
        if (this.x < 0 || this.x > boundsX || this.y < 0 || this.y > boundsY) {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.trailTimer) {
            this.trailTimer.remove();
        }
        super.destroy();
    }
}
