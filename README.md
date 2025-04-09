**前端html+css，后端python flask**
*部署暂定heroku*
单机界面仅包含：
（1）开始游戏。
（2）游戏说明。
//极简极简，但需要美观大气。
初始化游戏部分需要编写以下函数：
  initMaze();
  resetTimer();
  startVoiceControl();
  startTimer();
游戏运行部分需要编写以下函数：
  gameover();
  moveRobot();//移动机器人
  calculateNewPosition();//计算位置
  isValidMove(); //是否碰撞
  checkWinCondition() //检查是否到终点

*ps:目前语音识别部分先采用api，后续可以研究算法*