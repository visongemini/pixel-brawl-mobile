// 检测是否为移动设备
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 游戏配置 - 竖屏模式
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        MenuScene,
        GameScene,
        GameOverScene
    ],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: Phaser.Scale.Orientation.PORTRAIT
    },
    input: {
        activePointers: 3  // 支持多点触控
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 防止右键菜单
document.addEventListener('contextmenu', event => {
    event.preventDefault();
});

// 防止默认触摸行为
document.addEventListener('touchstart', event => {
    if (event.target.tagName !== 'INPUT') {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', event => {
    event.preventDefault();
}, { passive: false });

// Phaser Scale.RESIZE 模式已自动处理窗口尺寸变化
