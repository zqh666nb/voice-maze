// 游戏控制逻辑
const mazeSize = 400;
const gridSize = 20;
let robotPos = { x: 0, y: 0 };
let gameActive = false;
let timer = 120;
let intervalId;
let mazeArr; // 新增全局变量保存迷宫

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
    closeBtn: document.querySelector('.closeBtn'),
    voiceOutput: document.getElementById('voiceOutput')
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

    mazeArr = maze; // 保存到全局变量

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

// 常见方向字及其常见误识别字的拼音映射
const directionPinyinMap = {
    'up': ['上', '尚', '伤', 'shang'],
    'down': ['下', '夏', '吓', '侠', 'xia'],
    'left': ['左', '作', '佐', '做', '坐', 'zuo', '佐', '着', '走'],
    'right': ['右', '友', '有', '又', '由', 'yo', 'you', '悠', '呦'],
};

// 新增：快捷命令映射
const quickMoveMap = {
    'down till end': ['下底', '夏地', '下头', '下墙', '效劳'],
    'up till end': ['上底', '上地', '上头', '上墙']
};

// 检查是否为快捷命令
function getQuickMoveDirection(text) {
    for (const dir in quickMoveMap) {
        for (const phrase of quickMoveMap[dir]) {
            if (text.includes(phrase)) {
                return dir;
            }
        }
    }
    return null;
}

// 新增：一直移动到障碍
function moveRobotToWall(direction) {
    let moved = false;
    while (true) {
        const { x, y } = robotPos;
        let nx = x, ny = y;
        switch (direction) {
            case 'up till end': ny -= 1; break;
            case 'down till end': ny += 1; break;
        }
        if (
            ny >= 0 && ny < mazeArr.length &&
            nx >= 0 && nx < mazeArr[0].length &&
            mazeArr[ny][nx] === 0
        ) {
            robotPos = { x: nx, y: ny };
            moved = true;
        } else {
            break;
        }
    }
    if (moved) {
        updateRobotPosition();
        checkWinCondition();
    }
}

function getDirectionsByApproximate(text) {
    // 返回所有命中的方向（顺序与出现顺序一致）
    let directions = [];
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        for (const dir in directionPinyinMap) {
            if (directionPinyinMap[dir].includes(char)) {
                directions.push(dir);
                break;
            }
        }
    }
    return directions;
}

function startVoiceControl() {
    const voiceOutput = document.getElementById('voiceOutput');
    setInterval(() => {
        fetch('/status')
            .then(res => res.json())
            .then(data => {
                if (data.command) {

                    voiceOutput.textContent = "语音内容：" + data.command;
                    elements.status.textContent = "识别到：" + data.command;

                    // 新增：检测快捷命令
                    let quickDir = getQuickMoveDirection(data.command);
                    if (quickDir) {
                        moveRobotToWall(quickDir);
                        return;
                    }

                    // 近似比对优先，逐字符执行
                    let dirs = getDirectionsByApproximate(data.command);

                    for (const dir of dirs) {
                        moveRobot(dir);
                    }
                    if (dirs.length > 0) return;

                }
            })
            .catch(err => {
                console.error("获取语音识别指令失败：", err);
            });
    }, 1000);
}

// 计时器控制
function resetTimer() {
    timer = 120;
    elements.timer.textContent = `剩余时间: ${timer} 秒`;
}

function startTimer() {
    intervalId = setInterval(() => {
        timer--;
        elements.timer.textContent = `剩余时间: ${timer} 秒`;
        if (timer <= 0) gameOver();
    }, 1000);
}

// 全局弹窗显示函数
function showGlobalModal(msg) {
    const modal = document.getElementById('globalModal');
    const msgSpan = document.getElementById('globalModalMsg');
    msgSpan.textContent = msg;
    modal.style.display = 'flex';
}

function gameOver() {
    clearInterval(intervalId);
    showGlobalModal('时间到！游戏结束');
}

// 机器人移动逻辑
function moveRobot(direction) {
    const cellSize = 20;
    let { x, y } = robotPos;
    let nx = x, ny = y;
    switch (direction) {
        case 'up': ny -= 1; break;
        case 'down': ny += 1; break;
        case 'left': nx -= 1; break;
        case 'right': nx += 1; break;
        default:
            console.log('【调试】未知方向，忽略');
            return;
    }
    // 判断是否越界和是否为通路
    if (
        ny >= 0 && ny < mazeArr.length &&
        nx >= 0 && nx < mazeArr[0].length &&
        mazeArr[ny][nx] === 0
    ) {
        console.log('【调试】移动前位置：', robotPos, '移动后位置：', { x: nx, y: ny });
        robotPos = { x: nx, y: ny };
        updateRobotPosition();
        checkWinCondition();
    } else {
        console.log('【调试】目标位置不可达或越界：', { x: nx, y: ny });
    }
}

function updateRobotPosition() {
    const ctx = elements.maze.getContext('2d');
    const cellSize = 20;
    // 先重绘迷宫
    for (let i = 0; i < mazeArr.length; i++) {
        for (let j = 0; j < mazeArr[0].length; j++) {
            ctx.fillStyle = mazeArr[i][j] ? '#8B4513' : 'black';
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    // 再画机器人
    drawRobot(ctx, robotPos.x, robotPos.y, cellSize);
}

function checkWinCondition() {
    // 判断是否到达出口
    if (robotPos.y === mazeArr.length - 1 && robotPos.x === mazeArr[0].length - 2) {
        clearInterval(intervalId);
        showGlobalModal('恭喜你走出迷宫！');
    }
}

// 录音并上传到 /recognize
let mediaRecorder, audioChunks = [];
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'record.wav');
            fetch('/recognize', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    console.log('识别结果：', data.text);
                });
        };
        setTimeout(() => mediaRecorder.stop(), 2000); // 录2秒
    });
}