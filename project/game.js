// 游戏控制逻辑
const mazeSize = 400;
const gridSize = 20;
let robotPos = { x: 0, y: 0 };
let gameActive = false;
let timer = 60;
let intervalId;

// 加载音效元素
const clickSound = document.getElementById("clickSound");

// 给所有按钮添加点击音效
document.querySelectorAll(".menuBtn").forEach(btn => {
    btn.addEventListener("click", () => {
        clickSound.currentTime = 0; // 重置播放时间
        clickSound.play();
    });
});

// DOM元素引用
const elements = {
    mainMenu: document.getElementById('mainMenu'),
    gameContainer: document.getElementById('gameContainer'),
    instructionsModal: document.getElementById('instructionsModal'),
    timer: document.getElementById('timer'),
    maze: document.getElementById('maze'),
    status: document.getElementById('status'),
    startGameBtn: document.getElementById('startGameBtn'),
    instructionsBtn: document.getElementById('instructionsBtn'),
    closeBtn: document.querySelector('.closeBtn')
};

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    elements.startGameBtn.addEventListener('click', startGame);
    elements.instructionsBtn.addEventListener('click', showInstructions);
    elements.closeBtn.addEventListener('click', closeInstructions);
});

// 游戏初始化
function startGame() {
    elements.mainMenu.style.display = 'none';
    elements.gameContainer.style.display = 'block';
    initGame();
}

// 游戏说明弹窗控制
function showInstructions() {
    elements.instructionsModal.style.display = 'block';
}

function closeInstructions() {
    elements.instructionsModal.style.display = 'none';
}
function drawRobot(ctx, x, y, cellSize) { // 绘制机器人
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
    ctx.fill();
}


// 游戏核心逻辑
function initGame() {
    initMaze();
    resetTimer();
    startVoiceControl();
    startTimer();
}

function initMaze() {
    const ctx = elements.maze.getContext('2d');
    const rows = 21; // 奇数行数
    const cols = 21; // 奇数列数
    const cellSize = 20; // 每格像素
    elements.maze.width = cols * cellSize;
    elements.maze.height = rows * cellSize;

    // 初始化迷宫数组（全部设为墙 1）
    const maze = Array.from({ length: rows }, () => Array(cols).fill(1));

    // 方向：上右下左
    const directions = [
        [0, -2], [2, 0], [0, 2], [-2, 0]
    ];

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function carve(x, y) {
        maze[y][x] = 0;
        shuffle(directions);
        for (const [dx, dy] of directions) {
            const nx = x + dx, ny = y + dy;
            if (ny > 0 && ny < rows - 1 && nx > 0 && nx < cols - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0; // 打通中间墙
                carve(nx, ny); // 递归
            }
        }
    }

    // 从 (1,1) 开始生成路径
    carve(1, 1);

    // 设置入口和出口
    maze[0][1] = 0; // 入口
    maze[rows - 1][cols - 2] = 0; // 出口

    // 绘制迷宫
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            ctx.fillStyle = maze[i][j] ? '#8B4513' : 'black';
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }

    // 设定机器人初始位置在入口（左上）
    robotPos = { x: 1, y: 0 };

    // 绘制机器人
    drawRobot(ctx, robotPos.x, robotPos.y, cellSize);
}


// 语音控制功能
function startVoiceControl() {
    /*const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
     recognition.lang = 'zh-CN';
     recognition.continuous = true;
 
     recognition.onresult = async (event) => {
         const command = event.results[event.results.length - 1][0].transcript;
         elements.status.textContent = `识别到指令: ${command}`;
 
         const response = await fetch('/command', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ command })
         });
 
         const result = await response.json();
         if (result.success) {
             moveRobot(result.direction);
         }
     };
 
     recognition.start();*/
}

// 计时器控制
function resetTimer() {
    timer = 60;
    elements.timer.textContent = `剩余时间: ${timer} 秒`;
}

function startTimer() {
    intervalId = setInterval(() => {
        timer--;
        elements.timer.textContent = `剩余时间: ${timer} 秒`;
        if (timer <= 0) gameOver();
    }, 1000);
}

function gameOver() {
    clearInterval(intervalId);
    alert('时间到！游戏结束');
    location.reload();
}

// 机器人移动逻辑
function moveRobot(direction) {
    /*const step = 20;
    const newPos = calculateNewPosition(robotPos, direction);

    if (isValidMove(newPos)) {
        robotPos = newPos;
        updateRobotPosition();
        checkWinCondition();
    }*/
}

function calculateNewPosition(current, dir) {
    switch (dir) {
        case 'up': return { ...current, y: current.y - step };
        case 'down': return { ...current, y: current.y + step };
        case 'left': return { ...current, x: current.x - step };
        case 'right': return { ...current, x: current.x + step };
        default: return current;
    }
}

function isValidMove(position) {
    // 实现碰撞检测逻辑
    return true;
}

function updateRobotPosition() {
    // 实现机器人位置更新
}

function checkWinCondition() {
    // 实现胜利条件检测
}