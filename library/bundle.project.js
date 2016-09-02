require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Ball":[function(require,module,exports){
"use strict";
cc._RFpush(module, '05d6195d99B06zz0IIi6csv', 'Ball');
// script/Ball.js

var TouchStatus = cc.Enum({
    BEGEN: -1, // 按下
    ENDED: -1, // 结束
    CANCEL: -1 // 取消
});

var BallStatus = cc.Enum({
    FLY: -1, // 飞
    DOWN: -1, // 落
    NONE: -1 // 静止
});

cc.Class({
    'extends': cc.Component,

    properties: {
        emitSpeed: 0, // 发射速度
        gravity: 0, // 重力速度
        scale: 0, // 缩放系数
        showTime: 0, // 生成篮球显示动画时间
        ballRatio: 0 },

    // 球弹力
    init: function init(game) {
        this.game = game;
        this.registerInput();
        this.enableInput(true);
        this.showAnim();
        this.valid = false;
        this.status = TouchStatus.CANCEL;
        this.currentHorSpeed = 0;
        this.currentVerSpeed = 0;
        this.target = cc.p(0, 0);
        this.node.setScale(1);
        this.node.rotation = 0;
        this.hitIn = false;
    },

    // 显示动画
    showAnim: function showAnim() {
        this.node.opacity = 0;
        var fade = cc.fadeIn(this.showTime);
        this.node.runAction(fade);
    },

    // 注册事件监听
    registerInput: function registerInput() {
        this.listener = {
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: (function (touch, event) {
                // 触摸事件开始
                this.began = touch.getLocation();
                this.status = TouchStatus.BEGEN;
                return true;
            }).bind(this),

            onTouchEnded: (function (touch, event) {
                // 触摸事件结束
                this.ended = touch.getLocation();
                var distance = cc.pDistance(this.began, this.ended);

                if (distance > 100 && this.began.y < this.ended.y) {
                    this.status = TouchStatus.ENDED;
                    this.enableInput(false);

                    this.currentVerSpeed = this.emitSpeed;
                    this.target = this.node.parent.convertToNodeSpaceAR(this.ended); // 记录最后触摸点,根据触摸点偏移计算速度
                    this.currentHorSpeed = this.target.x * 2;

                    this.game.soundMng.playFlySound();

                    this.doAnim();
                    this.game.newBall();
                    if (this.shadow) {
                        this.shadow.dimiss();
                    }
                } else {
                    this.status = TouchStatus.CANCEL;
                }
            }).bind(this),

            onTouchCancelled: (function (touch, event) {
                // 触摸事件取消
                this.status = TouchStatus.CANCEL;
            }).bind(this)
        }, cc.eventManager.addListener(this.listener, this.node);
    },

    // 控制事件是否生效
    enableInput: function enableInput(enable) {
        if (enable) {
            cc.eventManager.resumeTarget(this.node);
        } else {
            cc.eventManager.pauseTarget(this.node);
        }
    },

    // 篮球动画
    doAnim: function doAnim() {
        var scaleAnim = cc.scaleTo(1, this.scale);
        var rotateValue = cc.randomMinus1To1();
        var rotateAnim = cc.rotateBy(2, 3 * 360 * rotateValue);
        var anim = cc.spawn(scaleAnim, rotateAnim);
        this.node.runAction(anim);
    },

    update: function update(dt) {
        if (this.status != TouchStatus.ENDED) {
            return;
        }

        this._updatePosition(dt);
        this._checkValid();
    },

    _checkValid: function _checkValid() {
        if (this.ballStatus !== BallStatus.DOWN || this.valid) {
            return;
        }

        var parent = this.node.parent;
        if (parent != null) {
            var basket = this.game.basket;
            var left = basket.left;
            var right = basket.right;
            var ballRadius = this.node.getBoundingBoxToWorld().width / 2;

            /** 统一转换成世界坐标计算进球逻辑 */
            // 篮球的边界和中心
            var ballLeft = parent.convertToWorldSpaceAR(this.node.getPosition()).x - ballRadius;
            var ballRight = parent.convertToWorldSpaceAR(this.node.getPosition()).x + ballRadius;
            var ballX = parent.convertToWorldSpaceAR(this.node.getPosition()).x;
            var ballY = parent.convertToWorldSpaceAR(this.node.getPosition()).y;

            // 有效进球范围
            var validTop = parent.convertToWorldSpaceAR(basket.linePreNode.getPosition()).y - ballRadius;
            var validLeft = basket.node.convertToWorldSpaceAR(left.getPosition()).x;
            var validRight = basket.node.convertToWorldSpaceAR(right.getPosition()).x;
            var validBot = basket.node.convertToWorldSpaceAR(left.getPosition()).y - ballRadius * 2;

            if (ballY < validTop && ballY > validBot && ballX > validLeft && ballX < validRight) {
                this.valid = true;
                this.game.score.addScore();
                this.game.basket.playNetAnim();
                if (this.hitIn) {
                    this.game.soundMng.playHitBoardInSound();
                } else {
                    this.game.soundMng.playBallInSound();
                }
            }
        }
    },

    // 篮球绑定自己的影子
    bindShadow: function bindShadow(shadow) {
        this.shadow = shadow;
    },

    // 更新篮球位置
    _updatePosition: function _updatePosition(dt) {
        this.node.x += dt * this.currentHorSpeed;

        this.currentVerSpeed -= dt * this.gravity;
        this.node.y += dt * this.currentVerSpeed;

        this._changeBallStatus(this.currentVerSpeed);

        if (this.ballStatus === BallStatus.NONE && this._isOutScreen()) {
            // if(!this.valid){ // 没进球将分数重置
            //     this.game.score.setScore(0);
            // }

            this.node.stopAllActions();
            this.node.removeFromParent();
            this.valid = false;
            cc.pool.putInPool(this);
            // this.game.newBall();
            return;
        }
    },

    _isOutScreen: function _isOutScreen() {
        return this.node.y < -800;
    },

    // 更改篮球状态
    _changeBallStatus: function _changeBallStatus(speed) {
        if (speed === 0 || this._isOutScreen()) {
            this.ballStatus = BallStatus.NONE;
        } else if (speed > 0) {
            this.ballStatus = BallStatus.FLY;
            this.game.basket.switchMaskLineShow(false);
        } else {
            this.ballStatus = BallStatus.DOWN;
            this.game.basket.switchMaskLineShow(true);
        }
    },

    onCollisionEnter: function onCollisionEnter(other, self) {
        if (this.ballStatus === BallStatus.FLY) {
            // 篮球上升过程中不进行碰撞检测
            return;
        }

        var box = other.node.getComponent('CollisionBox');
        var left = box.getLeft();
        var right = box.getRight();

        // 碰撞系统会计算出碰撞组件在世界坐标系下的相关的值，并放到 world 这个属性里面
        var world = self.world;
        var radius = world.radius;

        // 换算物体世界坐标系坐标
        var selfWorldPot = this.node.parent.convertToWorldSpaceAR(self.node.getPosition());
        var otherWorldPot = this.game.basket.node.convertToWorldSpaceAR(other.node.getPosition());
        var ratioHor = 0; // 横向弹性系数
        var ratioVer = 0; // 纵向弹性系数

        // 计算竖直偏移系数，即竖直方向弹性系数
        ratioVer = (selfWorldPot.y - otherWorldPot.y) / radius;
        // 计算水平偏移系数，即水平方向弹性系数
        ratioHor = Math.abs(otherWorldPot.x - selfWorldPot.x) / radius;
        // 水平方向碰撞初速度
        var horV = this.currentHorSpeed / Math.abs(this.currentHorSpeed) * 150;

        // 篮球碰到篮筐内，改变篮球横向速度为反方向
        if (other.node.name === 'right' && this.node.x <= left || other.node.name === 'left' && this.node.x >= right) {
            if (!this.hitIn) {
                this.currentHorSpeed = this.currentHorSpeed * -1 * this.ballRatio * ratioHor + horV;
                this.hitIn = true;
            } else {
                this.currentHorSpeed = this.currentHorSpeed * this.ballRatio * ratioHor + horV;
            }
        }

        // 篮球碰到篮筐外，增大横向速度
        if (other.node.name === 'right' && this.node.x > right || other.node.name === 'left' && this.node.x < left) {
            this.currentHorSpeed = this.currentHorSpeed * this.ballRatio * ratioHor + horV;
        }
        this.currentVerSpeed = this.currentVerSpeed * -1 * ratioVer * 0.8;
        this.game.soundMng.playHitBoardSound();

        // 碰撞组件的 aabb 碰撞框
        var aabb = world.aabb;

        // 上一次计算的碰撞组件的 aabb 碰撞框
        var preAabb = world.preAabb;

        // 碰撞框的世界矩阵
        var t = world.transform;

        // 以下属性为圆形碰撞组件特有属性
        var r = world.radius;
        var p = world.position;
    }

});

cc._RFpop();
},{}],"Basket":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'ac9fdFyp49GVKHUgk9/FVli', 'Basket');
// script/Basket.js

cc.Class({
    'extends': cc.Component,

    properties: {
        line: cc.Node,
        left: cc.Node,
        right: cc.Node,
        linePre: cc.Prefab,
        count: cc.Label
    },

    init: function init(game) {
        this.game = game;
        //this._doMoveAnim();
        this._createMaskLine();
    },

    startMove: function startMove() {
        this._doMoveAnim();
    },

    stopMove: function stopMove() {
        this.node.stopAllActions();
        this._resetPosition();
    },

    _resetPosition: function _resetPosition() {
        this.node.setPositionX(0);
    },

    // 篮筐移动动画
    _doMoveAnim: function _doMoveAnim() {
        var moveRight = cc.moveBy(3, cc.p(200, 0));
        var moveLeft = cc.moveBy(3, cc.p(-200, 0));
        var repeat = cc.repeatForever(cc.sequence(moveRight, moveLeft, moveLeft, moveRight));
        this.node.runAction(repeat);
    },

    update: function update(dt) {
        if (this.line) {}
        // 修改遮罩位置，先进行坐标转换       
        var worldPot = this.node.convertToWorldSpaceAR(this.line.getPosition());
        var nodePot = this.node.parent.convertToNodeSpaceAR(worldPot);
        this.linePreNode.setPosition(cc.p(this.node.x, nodePot.y));
    },

    // 创建篮筐遮罩
    _createMaskLine: function _createMaskLine() {
        this.linePreNode = cc.instantiate(this.linePre);
        this.game.node.addChild(this.linePreNode);
    },

    // 切换篮筐遮罩层级
    switchMaskLineShow: function switchMaskLineShow(flag) {
        if (flag) {
            this.linePreNode.setLocalZOrder(100);
        } else {
            this.linePreNode.setLocalZOrder(0);
        }
    },

    // 球网动画
    playNetAnim: function playNetAnim() {
        if (this.linePreNode) {
            var scaleLong = cc.scaleTo(0.1, 1, 1.1);
            var scaleShort = cc.scaleTo(0.3, 1, 0.9);
            var scaleNomal = cc.scaleTo(0.2, 1, 1);

            var anim = cc.sequence(scaleLong, scaleShort, scaleNomal);
            this.linePreNode.getChildByName('net').runAction(anim);
        }
    }
});

cc._RFpop();
},{}],"CollisionBox":[function(require,module,exports){
"use strict";
cc._RFpush(module, '7c4c6Rwi4tIC4UMBgYL4231', 'CollisionBox');
// script/CollisionBox.js

cc.Class({
    "extends": cc.Component,

    properties: {},

    // 获取刚体左边界
    getLeft: function getLeft() {
        return this.node.x - this.node.width / 2;
    },

    // 获取刚体右边界
    getRight: function getRight() {
        return this.node.x + this.node.width / 2;
    },

    // 获取刚体的世界坐标
    getWorldPoint: function getWorldPoint(target) {
        return target.convertToWorldSpaceAR(this.node.getPosition());
    }

});

cc._RFpop();
},{}],"GameManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, '7b066H36KxCVr0SNDZka91/', 'GameManager');
// script/GameManager.js

var Basket = require('Basket');
var Ball = require('Ball');
var Shadow = require('Shadow');
var Score = require('Score');
var SoundManager = require('SoundManager');
var TimeManager = require('TimeManager');

cc.Class({
    'extends': cc.Component,

    properties: {
        ball: cc.Prefab,
        shadow: cc.Prefab,
        basket: Basket,
        startPosition: cc.Vec2,
        score: Score,
        soundMng: SoundManager,
        timeMng: TimeManager
    },

    onLoad: function onLoad() {
        this.newBall();
        this.initCollisionSys();
        this.basket.init(this);
        this.score.init(this);
        this.timeMng.init(this);

        this.timeMng.oneSchedule();

        this.score.setScore(0);
    },

    // 初始化碰撞系统
    initCollisionSys: function initCollisionSys() {
        this.collisionManager = cc.director.getCollisionManager();
        this.collisionManager.enabled = true;
        //this.collisionManager.enabledDebugDraw = true// 开启debug绘制

        cc.director.setDisplayStats(true);
    },

    // 生成篮球
    newBall: function newBall() {
        var child = null;
        if (cc.pool.hasObject(Ball)) {
            child = cc.pool.getFromPool(Ball).node;
        } else {
            child = cc.instantiate(this.ball);
        }

        child.setLocalZOrder(1);
        this.node.addChild(child);
        child.setPosition(this.startPosition);
        var ballComp = child.getComponent('Ball');
        ballComp.init(this); // 启动篮球逻辑
        this.newShadow(ballComp);
    },

    newShadow: function newShadow(ball) {
        var ballShadow = null;
        if (cc.pool.hasObject(Shadow)) {
            ballShadow = cc.pool.getFromPool(Shadow).node;
        } else {
            ballShadow = cc.instantiate(this.shadow);
        }

        ballShadow.setLocalZOrder(2);
        this.node.addChild(ballShadow);
        ballShadow.setPosition(this.startPosition);
        var shadowComp = ballShadow.getComponent('Shadow');
        ball.bindShadow(shadowComp);
        shadowComp.init(this); // 启动影子逻辑
    },

    startMoveBasket: function startMoveBasket() {
        this.basket.startMove();
    },

    stopMoveBasket: function stopMoveBasket() {
        this.basket.stopMove();
    },

    // 游戏结束
    gameOver: function gameOver() {
        this.score.setScore(0);
    }

});

cc._RFpop();
},{"Ball":"Ball","Basket":"Basket","Score":"Score","Shadow":"Shadow","SoundManager":"SoundManager","TimeManager":"TimeManager"}],"Line":[function(require,module,exports){
"use strict";
cc._RFpush(module, '00dcby5FcZIh5P10wPcfVGt', 'Line');
// script/Line.js

cc.Class({
    "extends": cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {}

});
// called every frame, uncomment this function to activate update callback
// update: function (dt) {
//     cc.log('line x='+this.node.x+',y='+this.node.y);
// },

cc._RFpop();
},{}],"Score":[function(require,module,exports){
"use strict";
cc._RFpush(module, '0dbad8nuMBK8L4YWla50RjT', 'Score');
// script/Score.js

cc.Class({
    "extends": cc.Component,

    properties: {
        scoreText: cc.Label
    },

    init: function init(game) {
        this.game = game;
        this._score = 0;
    },

    // 获取分数
    getScore: function getScore() {
        return _score;
    },

    // 设置分数
    setScore: function setScore(score) {
        this._score = score;
        this._updateScore();
    },

    // 增加分数
    addScore: function addScore() {
        this._score += 1;
        this._updateScore();

        //this.game.soundMng.playScoreSound();
    },

    // 更新分数
    _updateScore: function _updateScore() {
        this.scoreText.string = this._score;
    }

});

cc._RFpop();
},{}],"Shadow":[function(require,module,exports){
"use strict";
cc._RFpush(module, '403b5GGRt5LYYNN87LqlnM7', 'Shadow');
// script/Shadow.js

cc.Class({
    "extends": cc.Component,

    properties: {
        showTime: 0, // 生成篮球显示动画时间
        shadow2: cc.Node
    },

    init: function init(game) {
        this.node.setScale(1);
        this._showAnim();
    },

    // 显示动画
    _showAnim: function _showAnim() {
        this.node.opacity = 0;
        this.shadow2.active = true;
        var fadeAnim = cc.fadeIn(this.showTime);
        this.node.runAction(fadeAnim);
    },

    dimiss: function dimiss() {
        this._dismissAnim();
    },

    _dismissAnim: function _dismissAnim() {
        this.shadow2.active = false;
        var fadeAnim = cc.fadeOut(this.showTime);
        var scaleAnim = cc.scaleTo(this.showTime, 0.5);
        var spawnAnim = cc.spawn(fadeAnim, scaleAnim);
        var func = cc.callFunc(this._callBack.bind(this));

        this.node.runAction(cc.sequence(spawnAnim, func));
    },

    // 动画结束回调
    _callBack: function _callBack() {
        this.node.stopAllActions();
        this.node.removeFromParent();
        cc.pool.putInPool(this);
    }
});

cc._RFpop();
},{}],"SoundManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, '3495eBx+i1PlrOKcbTaqUD6', 'SoundManager');
// script/SoundManager.js

cc.Class({
    "extends": cc.Component,

    properties: {
        toggleAudio: true,

        scoreAudio: {
            "default": null,
            url: cc.AudioClip
        },

        ballInAudio: {
            "default": null,
            url: cc.AudioClip
        },

        hitBoardInAudio: {
            "default": null,
            url: cc.AudioClip
        },

        hitBoardAudio: {
            "default": null,
            url: cc.AudioClip
        },

        flyAudio: {
            "default": null,
            url: cc.AudioClip
        }
    },

    init: function init(game) {},

    // 播放得分音效
    playScoreSound: function playScoreSound() {
        this.playSound(this.scoreAudio);
    },

    // 播放直接进球音效
    playBallInSound: function playBallInSound() {
        this.playSound(this.ballInAudio);
    },

    // 播放打框音效
    playHitBoardSound: function playHitBoardSound() {
        this.playSound(this.hitBoardAudio);
    },

    // 播放打框进球音效
    playHitBoardInSound: function playHitBoardInSound() {
        this.playSound(this.hitBoardInAudio);
    },

    // 播放投掷音效
    playFlySound: function playFlySound() {
        this.playSound(this.flyAudio);
    },

    // 播放音效(不循环)
    playSound: function playSound(sound) {
        if (this.toggleAudio) {
            cc.audioEngine.playEffect(sound, false);
        }
    }
});

cc._RFpop();
},{}],"TimeManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'f81cdY3hlNAza/JwLtsWk2O', 'TimeManager');
// script/TimeManager.js

cc.Class({
    'extends': cc.Component,

    properties: {
        maxTime: 0,
        timeToMove: 0
    },

    init: function init(game) {
        this.game = game;
        this.time = this.maxTime;
        this.isTimeToMove = false;
    },

    _callback: function _callback() {
        this.counting = false;
        this.game.basket.count.string = '00  00';
        this.game.stopMoveBasket();
        this.game.gameOver();
    },

    stopCounting: function stopCounting() {
        this.unschedule(this._callback);
        this.time = this.maxTime;
    },

    oneSchedule: function oneSchedule() {
        this.stopCounting();
        this.scheduleOnce(this._callback, this.maxTime);
        this.counting = true;
    },

    // called every frame
    update: function update(dt) {
        if (this.counting && this.time > 0) {
            this.time -= dt;
            if (this.maxTime - this.timeToMove >= this.time && !this.isTimeToMove) {
                this.isTimeToMove = true;
                this.game.startMoveBasket();
            }

            var text = this.time.toFixed(2);
            if (text.length === 4) {
                text = '0' + text;
            }
            this.game.basket.count.string = text.replace('.', '  ');
        }
    }
});

cc._RFpop();
},{}]},{},["Line","Ball","Score","SoundManager","Shadow","GameManager","CollisionBox","Basket","TimeManager"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcGxpY2F0aW9ucy9Db2Nvc0NyZWF0b3IuYXBwL0NvbnRlbnRzL1Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYXNzZXRzL3NjcmlwdC9CYWxsLmpzIiwiYXNzZXRzL3NjcmlwdC9CYXNrZXQuanMiLCJhc3NldHMvc2NyaXB0L0NvbGxpc2lvbkJveC5qcyIsImFzc2V0cy9zY3JpcHQvR2FtZU1hbmFnZXIuanMiLCJhc3NldHMvc2NyaXB0L0xpbmUuanMiLCJhc3NldHMvc2NyaXB0L1Njb3JlLmpzIiwiYXNzZXRzL3NjcmlwdC9TaGFkb3cuanMiLCJhc3NldHMvc2NyaXB0L1NvdW5kTWFuYWdlci5qcyIsImFzc2V0cy9zY3JpcHQvVGltZU1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMDVkNjE5NWQ5OUIwNnp6MElJaTZjc3YnLCAnQmFsbCcpO1xuLy8gc2NyaXB0L0JhbGwuanNcblxudmFyIFRvdWNoU3RhdHVzID0gY2MuRW51bSh7XG4gICAgQkVHRU46IC0xLCAvLyDmjInkuItcbiAgICBFTkRFRDogLTEsIC8vIOe7k+adn1xuICAgIENBTkNFTDogLTEgLy8g5Y+W5raIXG59KTtcblxudmFyIEJhbGxTdGF0dXMgPSBjYy5FbnVtKHtcbiAgICBGTFk6IC0xLCAvLyDpo55cbiAgICBET1dOOiAtMSwgLy8g6JC9XG4gICAgTk9ORTogLTEgLy8g6Z2Z5q2iXG59KTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBlbWl0U3BlZWQ6IDAsIC8vIOWPkeWwhOmAn+W6plxuICAgICAgICBncmF2aXR5OiAwLCAvLyDph43lipvpgJ/luqZcbiAgICAgICAgc2NhbGU6IDAsIC8vIOe8qeaUvuezu+aVsFxuICAgICAgICBzaG93VGltZTogMCwgLy8g55Sf5oiQ56+u55CD5pi+56S65Yqo55S75pe26Ze0XG4gICAgICAgIGJhbGxSYXRpbzogMCB9LFxuXG4gICAgLy8g55CD5by55YqbXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJJbnB1dCgpO1xuICAgICAgICB0aGlzLmVuYWJsZUlucHV0KHRydWUpO1xuICAgICAgICB0aGlzLnNob3dBbmltKCk7XG4gICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBUb3VjaFN0YXR1cy5DQU5DRUw7XG4gICAgICAgIHRoaXMuY3VycmVudEhvclNwZWVkID0gMDtcbiAgICAgICAgdGhpcy5jdXJyZW50VmVyU3BlZWQgPSAwO1xuICAgICAgICB0aGlzLnRhcmdldCA9IGNjLnAoMCwgMCk7XG4gICAgICAgIHRoaXMubm9kZS5zZXRTY2FsZSgxKTtcbiAgICAgICAgdGhpcy5ub2RlLnJvdGF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5oaXRJbiA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyDmmL7npLrliqjnlLtcbiAgICBzaG93QW5pbTogZnVuY3Rpb24gc2hvd0FuaW0oKSB7XG4gICAgICAgIHRoaXMubm9kZS5vcGFjaXR5ID0gMDtcbiAgICAgICAgdmFyIGZhZGUgPSBjYy5mYWRlSW4odGhpcy5zaG93VGltZSk7XG4gICAgICAgIHRoaXMubm9kZS5ydW5BY3Rpb24oZmFkZSk7XG4gICAgfSxcblxuICAgIC8vIOazqOWGjOS6i+S7tuebkeWQrFxuICAgIHJlZ2lzdGVySW5wdXQ6IGZ1bmN0aW9uIHJlZ2lzdGVySW5wdXQoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSB7XG4gICAgICAgICAgICBldmVudDogY2MuRXZlbnRMaXN0ZW5lci5UT1VDSF9PTkVfQllfT05FLFxuICAgICAgICAgICAgb25Ub3VjaEJlZ2FuOiAoZnVuY3Rpb24gKHRvdWNoLCBldmVudCkge1xuICAgICAgICAgICAgICAgIC8vIOinpuaRuOS6i+S7tuW8gOWni1xuICAgICAgICAgICAgICAgIHRoaXMuYmVnYW4gPSB0b3VjaC5nZXRMb2NhdGlvbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gVG91Y2hTdGF0dXMuQkVHRU47XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpLFxuXG4gICAgICAgICAgICBvblRvdWNoRW5kZWQ6IChmdW5jdGlvbiAodG91Y2gsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgLy8g6Kem5pG45LqL5Lu257uT5p2fXG4gICAgICAgICAgICAgICAgdGhpcy5lbmRlZCA9IHRvdWNoLmdldExvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdmFyIGRpc3RhbmNlID0gY2MucERpc3RhbmNlKHRoaXMuYmVnYW4sIHRoaXMuZW5kZWQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlID4gMTAwICYmIHRoaXMuYmVnYW4ueSA8IHRoaXMuZW5kZWQueSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cyA9IFRvdWNoU3RhdHVzLkVOREVEO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVuYWJsZUlucHV0KGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRWZXJTcGVlZCA9IHRoaXMuZW1pdFNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHRoaXMubm9kZS5wYXJlbnQuY29udmVydFRvTm9kZVNwYWNlQVIodGhpcy5lbmRlZCk7IC8vIOiusOW9leacgOWQjuinpuaRuOeCuSzmoLnmja7op6bmkbjngrnlgY/np7vorqHnrpfpgJ/luqZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9yU3BlZWQgPSB0aGlzLnRhcmdldC54ICogMjtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuc291bmRNbmcucGxheUZseVNvdW5kKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0FuaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lLm5ld0JhbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2hhZG93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNoYWRvdy5kaW1pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gVG91Y2hTdGF0dXMuQ0FOQ0VMO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmJpbmQodGhpcyksXG5cbiAgICAgICAgICAgIG9uVG91Y2hDYW5jZWxsZWQ6IChmdW5jdGlvbiAodG91Y2gsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgLy8g6Kem5pG45LqL5Lu25Y+W5raIXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSBUb3VjaFN0YXR1cy5DQU5DRUw7XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpXG4gICAgICAgIH0sIGNjLmV2ZW50TWFuYWdlci5hZGRMaXN0ZW5lcih0aGlzLmxpc3RlbmVyLCB0aGlzLm5vZGUpO1xuICAgIH0sXG5cbiAgICAvLyDmjqfliLbkuovku7bmmK/lkKbnlJ/mlYhcbiAgICBlbmFibGVJbnB1dDogZnVuY3Rpb24gZW5hYmxlSW5wdXQoZW5hYmxlKSB7XG4gICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgIGNjLmV2ZW50TWFuYWdlci5yZXN1bWVUYXJnZXQodGhpcy5ub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNjLmV2ZW50TWFuYWdlci5wYXVzZVRhcmdldCh0aGlzLm5vZGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOevrueQg+WKqOeUu1xuICAgIGRvQW5pbTogZnVuY3Rpb24gZG9BbmltKCkge1xuICAgICAgICB2YXIgc2NhbGVBbmltID0gY2Muc2NhbGVUbygxLCB0aGlzLnNjYWxlKTtcbiAgICAgICAgdmFyIHJvdGF0ZVZhbHVlID0gY2MucmFuZG9tTWludXMxVG8xKCk7XG4gICAgICAgIHZhciByb3RhdGVBbmltID0gY2Mucm90YXRlQnkoMiwgMyAqIDM2MCAqIHJvdGF0ZVZhbHVlKTtcbiAgICAgICAgdmFyIGFuaW0gPSBjYy5zcGF3bihzY2FsZUFuaW0sIHJvdGF0ZUFuaW0pO1xuICAgICAgICB0aGlzLm5vZGUucnVuQWN0aW9uKGFuaW0pO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT0gVG91Y2hTdGF0dXMuRU5ERUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKGR0KTtcbiAgICAgICAgdGhpcy5fY2hlY2tWYWxpZCgpO1xuICAgIH0sXG5cbiAgICBfY2hlY2tWYWxpZDogZnVuY3Rpb24gX2NoZWNrVmFsaWQoKSB7XG4gICAgICAgIGlmICh0aGlzLmJhbGxTdGF0dXMgIT09IEJhbGxTdGF0dXMuRE9XTiB8fCB0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5ub2RlLnBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYmFza2V0ID0gdGhpcy5nYW1lLmJhc2tldDtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gYmFza2V0LmxlZnQ7XG4gICAgICAgICAgICB2YXIgcmlnaHQgPSBiYXNrZXQucmlnaHQ7XG4gICAgICAgICAgICB2YXIgYmFsbFJhZGl1cyA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0JveFRvV29ybGQoKS53aWR0aCAvIDI7XG5cbiAgICAgICAgICAgIC8qKiDnu5/kuIDovazmjaLmiJDkuJbnlYzlnZDmoIforqHnrpfov5vnkIPpgLvovpEgKi9cbiAgICAgICAgICAgIC8vIOevrueQg+eahOi+ueeVjOWSjOS4reW/g1xuICAgICAgICAgICAgdmFyIGJhbGxMZWZ0ID0gcGFyZW50LmNvbnZlcnRUb1dvcmxkU3BhY2VBUih0aGlzLm5vZGUuZ2V0UG9zaXRpb24oKSkueCAtIGJhbGxSYWRpdXM7XG4gICAgICAgICAgICB2YXIgYmFsbFJpZ2h0ID0gcGFyZW50LmNvbnZlcnRUb1dvcmxkU3BhY2VBUih0aGlzLm5vZGUuZ2V0UG9zaXRpb24oKSkueCArIGJhbGxSYWRpdXM7XG4gICAgICAgICAgICB2YXIgYmFsbFggPSBwYXJlbnQuY29udmVydFRvV29ybGRTcGFjZUFSKHRoaXMubm9kZS5nZXRQb3NpdGlvbigpKS54O1xuICAgICAgICAgICAgdmFyIGJhbGxZID0gcGFyZW50LmNvbnZlcnRUb1dvcmxkU3BhY2VBUih0aGlzLm5vZGUuZ2V0UG9zaXRpb24oKSkueTtcblxuICAgICAgICAgICAgLy8g5pyJ5pWI6L+b55CD6IyD5Zu0XG4gICAgICAgICAgICB2YXIgdmFsaWRUb3AgPSBwYXJlbnQuY29udmVydFRvV29ybGRTcGFjZUFSKGJhc2tldC5saW5lUHJlTm9kZS5nZXRQb3NpdGlvbigpKS55IC0gYmFsbFJhZGl1cztcbiAgICAgICAgICAgIHZhciB2YWxpZExlZnQgPSBiYXNrZXQubm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIobGVmdC5nZXRQb3NpdGlvbigpKS54O1xuICAgICAgICAgICAgdmFyIHZhbGlkUmlnaHQgPSBiYXNrZXQubm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIocmlnaHQuZ2V0UG9zaXRpb24oKSkueDtcbiAgICAgICAgICAgIHZhciB2YWxpZEJvdCA9IGJhc2tldC5ub2RlLmNvbnZlcnRUb1dvcmxkU3BhY2VBUihsZWZ0LmdldFBvc2l0aW9uKCkpLnkgLSBiYWxsUmFkaXVzICogMjtcblxuICAgICAgICAgICAgaWYgKGJhbGxZIDwgdmFsaWRUb3AgJiYgYmFsbFkgPiB2YWxpZEJvdCAmJiBiYWxsWCA+IHZhbGlkTGVmdCAmJiBiYWxsWCA8IHZhbGlkUmlnaHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUuc2NvcmUuYWRkU2NvcmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUuYmFza2V0LnBsYXlOZXRBbmltKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGl0SW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lLnNvdW5kTW5nLnBsYXlIaXRCb2FyZEluU291bmQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuc291bmRNbmcucGxheUJhbGxJblNvdW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOevrueQg+e7keWumuiHquW3seeahOW9seWtkFxuICAgIGJpbmRTaGFkb3c6IGZ1bmN0aW9uIGJpbmRTaGFkb3coc2hhZG93KSB7XG4gICAgICAgIHRoaXMuc2hhZG93ID0gc2hhZG93O1xuICAgIH0sXG5cbiAgICAvLyDmm7TmlrDnr67nkIPkvY3nva5cbiAgICBfdXBkYXRlUG9zaXRpb246IGZ1bmN0aW9uIF91cGRhdGVQb3NpdGlvbihkdCkge1xuICAgICAgICB0aGlzLm5vZGUueCArPSBkdCAqIHRoaXMuY3VycmVudEhvclNwZWVkO1xuXG4gICAgICAgIHRoaXMuY3VycmVudFZlclNwZWVkIC09IGR0ICogdGhpcy5ncmF2aXR5O1xuICAgICAgICB0aGlzLm5vZGUueSArPSBkdCAqIHRoaXMuY3VycmVudFZlclNwZWVkO1xuXG4gICAgICAgIHRoaXMuX2NoYW5nZUJhbGxTdGF0dXModGhpcy5jdXJyZW50VmVyU3BlZWQpO1xuXG4gICAgICAgIGlmICh0aGlzLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXMuTk9ORSAmJiB0aGlzLl9pc091dFNjcmVlbigpKSB7XG4gICAgICAgICAgICAvLyBpZighdGhpcy52YWxpZCl7IC8vIOayoei/m+eQg+WwhuWIhuaVsOmHjee9rlxuICAgICAgICAgICAgLy8gICAgIHRoaXMuZ2FtZS5zY29yZS5zZXRTY29yZSgwKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgdGhpcy5ub2RlLnN0b3BBbGxBY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLm5vZGUucmVtb3ZlRnJvbVBhcmVudCgpO1xuICAgICAgICAgICAgdGhpcy52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgY2MucG9vbC5wdXRJblBvb2wodGhpcyk7XG4gICAgICAgICAgICAvLyB0aGlzLmdhbWUubmV3QmFsbCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9pc091dFNjcmVlbjogZnVuY3Rpb24gX2lzT3V0U2NyZWVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLnkgPCAtODAwO1xuICAgIH0sXG5cbiAgICAvLyDmm7TmlLnnr67nkIPnirbmgIFcbiAgICBfY2hhbmdlQmFsbFN0YXR1czogZnVuY3Rpb24gX2NoYW5nZUJhbGxTdGF0dXMoc3BlZWQpIHtcbiAgICAgICAgaWYgKHNwZWVkID09PSAwIHx8IHRoaXMuX2lzT3V0U2NyZWVuKCkpIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMuTk9ORTtcbiAgICAgICAgfSBlbHNlIGlmIChzcGVlZCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMuRkxZO1xuICAgICAgICAgICAgdGhpcy5nYW1lLmJhc2tldC5zd2l0Y2hNYXNrTGluZVNob3coZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1cy5ET1dOO1xuICAgICAgICAgICAgdGhpcy5nYW1lLmJhc2tldC5zd2l0Y2hNYXNrTGluZVNob3codHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Db2xsaXNpb25FbnRlcjogZnVuY3Rpb24gb25Db2xsaXNpb25FbnRlcihvdGhlciwgc2VsZikge1xuICAgICAgICBpZiAodGhpcy5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzLkZMWSkge1xuICAgICAgICAgICAgLy8g56+u55CD5LiK5Y2H6L+H56iL5Lit5LiN6L+b6KGM56Kw5pKe5qOA5rWLXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYm94ID0gb3RoZXIubm9kZS5nZXRDb21wb25lbnQoJ0NvbGxpc2lvbkJveCcpO1xuICAgICAgICB2YXIgbGVmdCA9IGJveC5nZXRMZWZ0KCk7XG4gICAgICAgIHZhciByaWdodCA9IGJveC5nZXRSaWdodCgpO1xuXG4gICAgICAgIC8vIOeisOaSnuezu+e7n+S8muiuoeeul+WHuueisOaSnue7hOS7tuWcqOS4lueVjOWdkOagh+ezu+S4i+eahOebuOWFs+eahOWAvO+8jOW5tuaUvuWIsCB3b3JsZCDov5nkuKrlsZ7mgKfph4zpnaJcbiAgICAgICAgdmFyIHdvcmxkID0gc2VsZi53b3JsZDtcbiAgICAgICAgdmFyIHJhZGl1cyA9IHdvcmxkLnJhZGl1cztcblxuICAgICAgICAvLyDmjaLnrpfniankvZPkuJbnlYzlnZDmoIfns7vlnZDmoIdcbiAgICAgICAgdmFyIHNlbGZXb3JsZFBvdCA9IHRoaXMubm9kZS5wYXJlbnQuY29udmVydFRvV29ybGRTcGFjZUFSKHNlbGYubm9kZS5nZXRQb3NpdGlvbigpKTtcbiAgICAgICAgdmFyIG90aGVyV29ybGRQb3QgPSB0aGlzLmdhbWUuYmFza2V0Lm5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKG90aGVyLm5vZGUuZ2V0UG9zaXRpb24oKSk7XG4gICAgICAgIHZhciByYXRpb0hvciA9IDA7IC8vIOaoquWQkeW8ueaAp+ezu+aVsFxuICAgICAgICB2YXIgcmF0aW9WZXIgPSAwOyAvLyDnurXlkJHlvLnmgKfns7vmlbBcblxuICAgICAgICAvLyDorqHnrpfnq5bnm7TlgY/np7vns7vmlbDvvIzljbPnq5bnm7TmlrnlkJHlvLnmgKfns7vmlbBcbiAgICAgICAgcmF0aW9WZXIgPSAoc2VsZldvcmxkUG90LnkgLSBvdGhlcldvcmxkUG90LnkpIC8gcmFkaXVzO1xuICAgICAgICAvLyDorqHnrpfmsLTlubPlgY/np7vns7vmlbDvvIzljbPmsLTlubPmlrnlkJHlvLnmgKfns7vmlbBcbiAgICAgICAgcmF0aW9Ib3IgPSBNYXRoLmFicyhvdGhlcldvcmxkUG90LnggLSBzZWxmV29ybGRQb3QueCkgLyByYWRpdXM7XG4gICAgICAgIC8vIOawtOW5s+aWueWQkeeisOaSnuWInemAn+W6plxuICAgICAgICB2YXIgaG9yViA9IHRoaXMuY3VycmVudEhvclNwZWVkIC8gTWF0aC5hYnModGhpcy5jdXJyZW50SG9yU3BlZWQpICogMTUwO1xuXG4gICAgICAgIC8vIOevrueQg+eisOWIsOevruetkOWGhe+8jOaUueWPmOevrueQg+aoquWQkemAn+W6puS4uuWPjeaWueWQkVxuICAgICAgICBpZiAob3RoZXIubm9kZS5uYW1lID09PSAncmlnaHQnICYmIHRoaXMubm9kZS54IDw9IGxlZnQgfHwgb3RoZXIubm9kZS5uYW1lID09PSAnbGVmdCcgJiYgdGhpcy5ub2RlLnggPj0gcmlnaHQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5oaXRJbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEhvclNwZWVkID0gdGhpcy5jdXJyZW50SG9yU3BlZWQgKiAtMSAqIHRoaXMuYmFsbFJhdGlvICogcmF0aW9Ib3IgKyBob3JWO1xuICAgICAgICAgICAgICAgIHRoaXMuaGl0SW4gPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3JTcGVlZCA9IHRoaXMuY3VycmVudEhvclNwZWVkICogdGhpcy5iYWxsUmF0aW8gKiByYXRpb0hvciArIGhvclY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnr67nkIPnorDliLDnr67nrZDlpJbvvIzlop7lpKfmqKrlkJHpgJ/luqZcbiAgICAgICAgaWYgKG90aGVyLm5vZGUubmFtZSA9PT0gJ3JpZ2h0JyAmJiB0aGlzLm5vZGUueCA+IHJpZ2h0IHx8IG90aGVyLm5vZGUubmFtZSA9PT0gJ2xlZnQnICYmIHRoaXMubm9kZS54IDwgbGVmdCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9yU3BlZWQgPSB0aGlzLmN1cnJlbnRIb3JTcGVlZCAqIHRoaXMuYmFsbFJhdGlvICogcmF0aW9Ib3IgKyBob3JWO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudFZlclNwZWVkID0gdGhpcy5jdXJyZW50VmVyU3BlZWQgKiAtMSAqIHJhdGlvVmVyICogMC44O1xuICAgICAgICB0aGlzLmdhbWUuc291bmRNbmcucGxheUhpdEJvYXJkU291bmQoKTtcblxuICAgICAgICAvLyDnorDmkp7nu4Tku7bnmoQgYWFiYiDnorDmkp7moYZcbiAgICAgICAgdmFyIGFhYmIgPSB3b3JsZC5hYWJiO1xuXG4gICAgICAgIC8vIOS4iuS4gOasoeiuoeeul+eahOeisOaSnue7hOS7tueahCBhYWJiIOeisOaSnuahhlxuICAgICAgICB2YXIgcHJlQWFiYiA9IHdvcmxkLnByZUFhYmI7XG5cbiAgICAgICAgLy8g56Kw5pKe5qGG55qE5LiW55WM55+p6Zi1XG4gICAgICAgIHZhciB0ID0gd29ybGQudHJhbnNmb3JtO1xuXG4gICAgICAgIC8vIOS7peS4i+WxnuaAp+S4uuWchuW9oueisOaSnue7hOS7tueJueacieWxnuaAp1xuICAgICAgICB2YXIgciA9IHdvcmxkLnJhZGl1cztcbiAgICAgICAgdmFyIHAgPSB3b3JsZC5wb3NpdGlvbjtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYWM5ZmRGeXA0OUdWS0hVZ2s5L0ZWbGknLCAnQmFza2V0Jyk7XG4vLyBzY3JpcHQvQmFza2V0LmpzXG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgbGluZTogY2MuTm9kZSxcbiAgICAgICAgbGVmdDogY2MuTm9kZSxcbiAgICAgICAgcmlnaHQ6IGNjLk5vZGUsXG4gICAgICAgIGxpbmVQcmU6IGNjLlByZWZhYixcbiAgICAgICAgY291bnQ6IGNjLkxhYmVsXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoZ2FtZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICAvL3RoaXMuX2RvTW92ZUFuaW0oKTtcbiAgICAgICAgdGhpcy5fY3JlYXRlTWFza0xpbmUoKTtcbiAgICB9LFxuXG4gICAgc3RhcnRNb3ZlOiBmdW5jdGlvbiBzdGFydE1vdmUoKSB7XG4gICAgICAgIHRoaXMuX2RvTW92ZUFuaW0oKTtcbiAgICB9LFxuXG4gICAgc3RvcE1vdmU6IGZ1bmN0aW9uIHN0b3BNb3ZlKCkge1xuICAgICAgICB0aGlzLm5vZGUuc3RvcEFsbEFjdGlvbnMoKTtcbiAgICAgICAgdGhpcy5fcmVzZXRQb3NpdGlvbigpO1xuICAgIH0sXG5cbiAgICBfcmVzZXRQb3NpdGlvbjogZnVuY3Rpb24gX3Jlc2V0UG9zaXRpb24oKSB7XG4gICAgICAgIHRoaXMubm9kZS5zZXRQb3NpdGlvblgoMCk7XG4gICAgfSxcblxuICAgIC8vIOevruetkOenu+WKqOWKqOeUu1xuICAgIF9kb01vdmVBbmltOiBmdW5jdGlvbiBfZG9Nb3ZlQW5pbSgpIHtcbiAgICAgICAgdmFyIG1vdmVSaWdodCA9IGNjLm1vdmVCeSgzLCBjYy5wKDIwMCwgMCkpO1xuICAgICAgICB2YXIgbW92ZUxlZnQgPSBjYy5tb3ZlQnkoMywgY2MucCgtMjAwLCAwKSk7XG4gICAgICAgIHZhciByZXBlYXQgPSBjYy5yZXBlYXRGb3JldmVyKGNjLnNlcXVlbmNlKG1vdmVSaWdodCwgbW92ZUxlZnQsIG1vdmVMZWZ0LCBtb3ZlUmlnaHQpKTtcbiAgICAgICAgdGhpcy5ub2RlLnJ1bkFjdGlvbihyZXBlYXQpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge1xuICAgICAgICBpZiAodGhpcy5saW5lKSB7fVxuICAgICAgICAvLyDkv67mlLnpga7nvankvY3nva7vvIzlhYjov5vooYzlnZDmoIfovazmjaIgICAgICAgXG4gICAgICAgIHZhciB3b3JsZFBvdCA9IHRoaXMubm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIodGhpcy5saW5lLmdldFBvc2l0aW9uKCkpO1xuICAgICAgICB2YXIgbm9kZVBvdCA9IHRoaXMubm9kZS5wYXJlbnQuY29udmVydFRvTm9kZVNwYWNlQVIod29ybGRQb3QpO1xuICAgICAgICB0aGlzLmxpbmVQcmVOb2RlLnNldFBvc2l0aW9uKGNjLnAodGhpcy5ub2RlLngsIG5vZGVQb3QueSkpO1xuICAgIH0sXG5cbiAgICAvLyDliJvlu7rnr67nrZDpga7nvalcbiAgICBfY3JlYXRlTWFza0xpbmU6IGZ1bmN0aW9uIF9jcmVhdGVNYXNrTGluZSgpIHtcbiAgICAgICAgdGhpcy5saW5lUHJlTm9kZSA9IGNjLmluc3RhbnRpYXRlKHRoaXMubGluZVByZSk7XG4gICAgICAgIHRoaXMuZ2FtZS5ub2RlLmFkZENoaWxkKHRoaXMubGluZVByZU5vZGUpO1xuICAgIH0sXG5cbiAgICAvLyDliIfmjaLnr67nrZDpga7nvanlsYLnuqdcbiAgICBzd2l0Y2hNYXNrTGluZVNob3c6IGZ1bmN0aW9uIHN3aXRjaE1hc2tMaW5lU2hvdyhmbGFnKSB7XG4gICAgICAgIGlmIChmbGFnKSB7XG4gICAgICAgICAgICB0aGlzLmxpbmVQcmVOb2RlLnNldExvY2FsWk9yZGVyKDEwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpbmVQcmVOb2RlLnNldExvY2FsWk9yZGVyKDApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOeQg+e9keWKqOeUu1xuICAgIHBsYXlOZXRBbmltOiBmdW5jdGlvbiBwbGF5TmV0QW5pbSgpIHtcbiAgICAgICAgaWYgKHRoaXMubGluZVByZU5vZGUpIHtcbiAgICAgICAgICAgIHZhciBzY2FsZUxvbmcgPSBjYy5zY2FsZVRvKDAuMSwgMSwgMS4xKTtcbiAgICAgICAgICAgIHZhciBzY2FsZVNob3J0ID0gY2Muc2NhbGVUbygwLjMsIDEsIDAuOSk7XG4gICAgICAgICAgICB2YXIgc2NhbGVOb21hbCA9IGNjLnNjYWxlVG8oMC4yLCAxLCAxKTtcblxuICAgICAgICAgICAgdmFyIGFuaW0gPSBjYy5zZXF1ZW5jZShzY2FsZUxvbmcsIHNjYWxlU2hvcnQsIHNjYWxlTm9tYWwpO1xuICAgICAgICAgICAgdGhpcy5saW5lUHJlTm9kZS5nZXRDaGlsZEJ5TmFtZSgnbmV0JykucnVuQWN0aW9uKGFuaW0pO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3YzRjNlJ3aTR0SUM0VU1CZ1lMNDIzMScsICdDb2xsaXNpb25Cb3gnKTtcbi8vIHNjcmlwdC9Db2xsaXNpb25Cb3guanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7fSxcblxuICAgIC8vIOiOt+WPluWImuS9k+W3pui+ueeVjFxuICAgIGdldExlZnQ6IGZ1bmN0aW9uIGdldExlZnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUueCAtIHRoaXMubm9kZS53aWR0aCAvIDI7XG4gICAgfSxcblxuICAgIC8vIOiOt+WPluWImuS9k+WPs+i+ueeVjFxuICAgIGdldFJpZ2h0OiBmdW5jdGlvbiBnZXRSaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS54ICsgdGhpcy5ub2RlLndpZHRoIC8gMjtcbiAgICB9LFxuXG4gICAgLy8g6I635Y+W5Yia5L2T55qE5LiW55WM5Z2Q5qCHXG4gICAgZ2V0V29ybGRQb2ludDogZnVuY3Rpb24gZ2V0V29ybGRQb2ludCh0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIodGhpcy5ub2RlLmdldFBvc2l0aW9uKCkpO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3YjA2NkgzNkt4Q1ZyMFNORFprYTkxLycsICdHYW1lTWFuYWdlcicpO1xuLy8gc2NyaXB0L0dhbWVNYW5hZ2VyLmpzXG5cbnZhciBCYXNrZXQgPSByZXF1aXJlKCdCYXNrZXQnKTtcbnZhciBCYWxsID0gcmVxdWlyZSgnQmFsbCcpO1xudmFyIFNoYWRvdyA9IHJlcXVpcmUoJ1NoYWRvdycpO1xudmFyIFNjb3JlID0gcmVxdWlyZSgnU2NvcmUnKTtcbnZhciBTb3VuZE1hbmFnZXIgPSByZXF1aXJlKCdTb3VuZE1hbmFnZXInKTtcbnZhciBUaW1lTWFuYWdlciA9IHJlcXVpcmUoJ1RpbWVNYW5hZ2VyJyk7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgYmFsbDogY2MuUHJlZmFiLFxuICAgICAgICBzaGFkb3c6IGNjLlByZWZhYixcbiAgICAgICAgYmFza2V0OiBCYXNrZXQsXG4gICAgICAgIHN0YXJ0UG9zaXRpb246IGNjLlZlYzIsXG4gICAgICAgIHNjb3JlOiBTY29yZSxcbiAgICAgICAgc291bmRNbmc6IFNvdW5kTWFuYWdlcixcbiAgICAgICAgdGltZU1uZzogVGltZU1hbmFnZXJcbiAgICB9LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMubmV3QmFsbCgpO1xuICAgICAgICB0aGlzLmluaXRDb2xsaXNpb25TeXMoKTtcbiAgICAgICAgdGhpcy5iYXNrZXQuaW5pdCh0aGlzKTtcbiAgICAgICAgdGhpcy5zY29yZS5pbml0KHRoaXMpO1xuICAgICAgICB0aGlzLnRpbWVNbmcuaW5pdCh0aGlzKTtcblxuICAgICAgICB0aGlzLnRpbWVNbmcub25lU2NoZWR1bGUoKTtcblxuICAgICAgICB0aGlzLnNjb3JlLnNldFNjb3JlKDApO1xuICAgIH0sXG5cbiAgICAvLyDliJ3lp4vljJbnorDmkp7ns7vnu59cbiAgICBpbml0Q29sbGlzaW9uU3lzOiBmdW5jdGlvbiBpbml0Q29sbGlzaW9uU3lzKCkge1xuICAgICAgICB0aGlzLmNvbGxpc2lvbk1hbmFnZXIgPSBjYy5kaXJlY3Rvci5nZXRDb2xsaXNpb25NYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uTWFuYWdlci5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgLy90aGlzLmNvbGxpc2lvbk1hbmFnZXIuZW5hYmxlZERlYnVnRHJhdyA9IHRydWUvLyDlvIDlkK9kZWJ1Z+e7mOWItlxuXG4gICAgICAgIGNjLmRpcmVjdG9yLnNldERpc3BsYXlTdGF0cyh0cnVlKTtcbiAgICB9LFxuXG4gICAgLy8g55Sf5oiQ56+u55CDXG4gICAgbmV3QmFsbDogZnVuY3Rpb24gbmV3QmFsbCgpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gbnVsbDtcbiAgICAgICAgaWYgKGNjLnBvb2wuaGFzT2JqZWN0KEJhbGwpKSB7XG4gICAgICAgICAgICBjaGlsZCA9IGNjLnBvb2wuZ2V0RnJvbVBvb2woQmFsbCkubm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNoaWxkID0gY2MuaW5zdGFudGlhdGUodGhpcy5iYWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkLnNldExvY2FsWk9yZGVyKDEpO1xuICAgICAgICB0aGlzLm5vZGUuYWRkQ2hpbGQoY2hpbGQpO1xuICAgICAgICBjaGlsZC5zZXRQb3NpdGlvbih0aGlzLnN0YXJ0UG9zaXRpb24pO1xuICAgICAgICB2YXIgYmFsbENvbXAgPSBjaGlsZC5nZXRDb21wb25lbnQoJ0JhbGwnKTtcbiAgICAgICAgYmFsbENvbXAuaW5pdCh0aGlzKTsgLy8g5ZCv5Yqo56+u55CD6YC76L6RXG4gICAgICAgIHRoaXMubmV3U2hhZG93KGJhbGxDb21wKTtcbiAgICB9LFxuXG4gICAgbmV3U2hhZG93OiBmdW5jdGlvbiBuZXdTaGFkb3coYmFsbCkge1xuICAgICAgICB2YXIgYmFsbFNoYWRvdyA9IG51bGw7XG4gICAgICAgIGlmIChjYy5wb29sLmhhc09iamVjdChTaGFkb3cpKSB7XG4gICAgICAgICAgICBiYWxsU2hhZG93ID0gY2MucG9vbC5nZXRGcm9tUG9vbChTaGFkb3cpLm5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiYWxsU2hhZG93ID0gY2MuaW5zdGFudGlhdGUodGhpcy5zaGFkb3cpO1xuICAgICAgICB9XG5cbiAgICAgICAgYmFsbFNoYWRvdy5zZXRMb2NhbFpPcmRlcigyKTtcbiAgICAgICAgdGhpcy5ub2RlLmFkZENoaWxkKGJhbGxTaGFkb3cpO1xuICAgICAgICBiYWxsU2hhZG93LnNldFBvc2l0aW9uKHRoaXMuc3RhcnRQb3NpdGlvbik7XG4gICAgICAgIHZhciBzaGFkb3dDb21wID0gYmFsbFNoYWRvdy5nZXRDb21wb25lbnQoJ1NoYWRvdycpO1xuICAgICAgICBiYWxsLmJpbmRTaGFkb3coc2hhZG93Q29tcCk7XG4gICAgICAgIHNoYWRvd0NvbXAuaW5pdCh0aGlzKTsgLy8g5ZCv5Yqo5b2x5a2Q6YC76L6RXG4gICAgfSxcblxuICAgIHN0YXJ0TW92ZUJhc2tldDogZnVuY3Rpb24gc3RhcnRNb3ZlQmFza2V0KCkge1xuICAgICAgICB0aGlzLmJhc2tldC5zdGFydE1vdmUoKTtcbiAgICB9LFxuXG4gICAgc3RvcE1vdmVCYXNrZXQ6IGZ1bmN0aW9uIHN0b3BNb3ZlQmFza2V0KCkge1xuICAgICAgICB0aGlzLmJhc2tldC5zdG9wTW92ZSgpO1xuICAgIH0sXG5cbiAgICAvLyDmuLjmiI/nu5PmnZ9cbiAgICBnYW1lT3ZlcjogZnVuY3Rpb24gZ2FtZU92ZXIoKSB7XG4gICAgICAgIHRoaXMuc2NvcmUuc2V0U2NvcmUoMCk7XG4gICAgfVxuXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzAwZGNieTVGY1pJaDVQMTB3UGNmVkd0JywgJ0xpbmUnKTtcbi8vIHNjcmlwdC9MaW5lLmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyBmb286IHtcbiAgICAgICAgLy8gICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgLy8gICAgdXJsOiBjYy5UZXh0dXJlMkQsICAvLyBvcHRpb25hbCwgZGVmYXVsdCBpcyB0eXBlb2YgZGVmYXVsdFxuICAgICAgICAvLyAgICBzZXJpYWxpemFibGU6IHRydWUsIC8vIG9wdGlvbmFsLCBkZWZhdWx0IGlzIHRydWVcbiAgICAgICAgLy8gICAgdmlzaWJsZTogdHJ1ZSwgICAgICAvLyBvcHRpb25hbCwgZGVmYXVsdCBpcyB0cnVlXG4gICAgICAgIC8vICAgIGRpc3BsYXlOYW1lOiAnRm9vJywgLy8gb3B0aW9uYWxcbiAgICAgICAgLy8gICAgcmVhZG9ubHk6IGZhbHNlLCAgICAvLyBvcHRpb25hbCwgZGVmYXVsdCBpcyBmYWxzZVxuICAgICAgICAvLyB9LFxuICAgICAgICAvLyAuLi5cbiAgICB9LFxuXG4gICAgLy8gdXNlIHRoaXMgZm9yIGluaXRpYWxpemF0aW9uXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7fVxuXG59KTtcbi8vIGNhbGxlZCBldmVyeSBmcmFtZSwgdW5jb21tZW50IHRoaXMgZnVuY3Rpb24gdG8gYWN0aXZhdGUgdXBkYXRlIGNhbGxiYWNrXG4vLyB1cGRhdGU6IGZ1bmN0aW9uIChkdCkge1xuLy8gICAgIGNjLmxvZygnbGluZSB4PScrdGhpcy5ub2RlLngrJyx5PScrdGhpcy5ub2RlLnkpO1xuLy8gfSxcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzBkYmFkOG51TUJLOEw0WVdsYTUwUmpUJywgJ1Njb3JlJyk7XG4vLyBzY3JpcHQvU2NvcmUuanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHNjb3JlVGV4dDogY2MuTGFiZWxcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMuX3Njb3JlID0gMDtcbiAgICB9LFxuXG4gICAgLy8g6I635Y+W5YiG5pWwXG4gICAgZ2V0U2NvcmU6IGZ1bmN0aW9uIGdldFNjb3JlKCkge1xuICAgICAgICByZXR1cm4gX3Njb3JlO1xuICAgIH0sXG5cbiAgICAvLyDorr7nva7liIbmlbBcbiAgICBzZXRTY29yZTogZnVuY3Rpb24gc2V0U2NvcmUoc2NvcmUpIHtcbiAgICAgICAgdGhpcy5fc2NvcmUgPSBzY29yZTtcbiAgICAgICAgdGhpcy5fdXBkYXRlU2NvcmUoKTtcbiAgICB9LFxuXG4gICAgLy8g5aKe5Yqg5YiG5pWwXG4gICAgYWRkU2NvcmU6IGZ1bmN0aW9uIGFkZFNjb3JlKCkge1xuICAgICAgICB0aGlzLl9zY29yZSArPSAxO1xuICAgICAgICB0aGlzLl91cGRhdGVTY29yZSgpO1xuXG4gICAgICAgIC8vdGhpcy5nYW1lLnNvdW5kTW5nLnBsYXlTY29yZVNvdW5kKCk7XG4gICAgfSxcblxuICAgIC8vIOabtOaWsOWIhuaVsFxuICAgIF91cGRhdGVTY29yZTogZnVuY3Rpb24gX3VwZGF0ZVNjb3JlKCkge1xuICAgICAgICB0aGlzLnNjb3JlVGV4dC5zdHJpbmcgPSB0aGlzLl9zY29yZTtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNDAzYjVHR1J0NUxZWU5OODdMcWxuTTcnLCAnU2hhZG93Jyk7XG4vLyBzY3JpcHQvU2hhZG93LmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBzaG93VGltZTogMCwgLy8g55Sf5oiQ56+u55CD5pi+56S65Yqo55S75pe26Ze0XG4gICAgICAgIHNoYWRvdzI6IGNjLk5vZGVcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7XG4gICAgICAgIHRoaXMubm9kZS5zZXRTY2FsZSgxKTtcbiAgICAgICAgdGhpcy5fc2hvd0FuaW0oKTtcbiAgICB9LFxuXG4gICAgLy8g5pi+56S65Yqo55S7XG4gICAgX3Nob3dBbmltOiBmdW5jdGlvbiBfc2hvd0FuaW0oKSB7XG4gICAgICAgIHRoaXMubm9kZS5vcGFjaXR5ID0gMDtcbiAgICAgICAgdGhpcy5zaGFkb3cyLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHZhciBmYWRlQW5pbSA9IGNjLmZhZGVJbih0aGlzLnNob3dUaW1lKTtcbiAgICAgICAgdGhpcy5ub2RlLnJ1bkFjdGlvbihmYWRlQW5pbSk7XG4gICAgfSxcblxuICAgIGRpbWlzczogZnVuY3Rpb24gZGltaXNzKCkge1xuICAgICAgICB0aGlzLl9kaXNtaXNzQW5pbSgpO1xuICAgIH0sXG5cbiAgICBfZGlzbWlzc0FuaW06IGZ1bmN0aW9uIF9kaXNtaXNzQW5pbSgpIHtcbiAgICAgICAgdGhpcy5zaGFkb3cyLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgZmFkZUFuaW0gPSBjYy5mYWRlT3V0KHRoaXMuc2hvd1RpbWUpO1xuICAgICAgICB2YXIgc2NhbGVBbmltID0gY2Muc2NhbGVUbyh0aGlzLnNob3dUaW1lLCAwLjUpO1xuICAgICAgICB2YXIgc3Bhd25BbmltID0gY2Muc3Bhd24oZmFkZUFuaW0sIHNjYWxlQW5pbSk7XG4gICAgICAgIHZhciBmdW5jID0gY2MuY2FsbEZ1bmModGhpcy5fY2FsbEJhY2suYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5ub2RlLnJ1bkFjdGlvbihjYy5zZXF1ZW5jZShzcGF3bkFuaW0sIGZ1bmMpKTtcbiAgICB9LFxuXG4gICAgLy8g5Yqo55S757uT5p2f5Zue6LCDXG4gICAgX2NhbGxCYWNrOiBmdW5jdGlvbiBfY2FsbEJhY2soKSB7XG4gICAgICAgIHRoaXMubm9kZS5zdG9wQWxsQWN0aW9ucygpO1xuICAgICAgICB0aGlzLm5vZGUucmVtb3ZlRnJvbVBhcmVudCgpO1xuICAgICAgICBjYy5wb29sLnB1dEluUG9vbCh0aGlzKTtcbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzM0OTVlQngraTFQbHJPS2NiVGFxVUQ2JywgJ1NvdW5kTWFuYWdlcicpO1xuLy8gc2NyaXB0L1NvdW5kTWFuYWdlci5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgdG9nZ2xlQXVkaW86IHRydWUsXG5cbiAgICAgICAgc2NvcmVBdWRpbzoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IG51bGwsXG4gICAgICAgICAgICB1cmw6IGNjLkF1ZGlvQ2xpcFxuICAgICAgICB9LFxuXG4gICAgICAgIGJhbGxJbkF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGl0Qm9hcmRJbkF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGl0Qm9hcmRBdWRpbzoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IG51bGwsXG4gICAgICAgICAgICB1cmw6IGNjLkF1ZGlvQ2xpcFxuICAgICAgICB9LFxuXG4gICAgICAgIGZseUF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7fSxcblxuICAgIC8vIOaSreaUvuW+l+WIhumfs+aViFxuICAgIHBsYXlTY29yZVNvdW5kOiBmdW5jdGlvbiBwbGF5U2NvcmVTb3VuZCgpIHtcbiAgICAgICAgdGhpcy5wbGF5U291bmQodGhpcy5zY29yZUF1ZGlvKTtcbiAgICB9LFxuXG4gICAgLy8g5pKt5pS+55u05o6l6L+b55CD6Z+z5pWIXG4gICAgcGxheUJhbGxJblNvdW5kOiBmdW5jdGlvbiBwbGF5QmFsbEluU291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuYmFsbEluQXVkaW8pO1xuICAgIH0sXG5cbiAgICAvLyDmkq3mlL7miZPmoYbpn7PmlYhcbiAgICBwbGF5SGl0Qm9hcmRTb3VuZDogZnVuY3Rpb24gcGxheUhpdEJvYXJkU291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuaGl0Qm9hcmRBdWRpbyk7XG4gICAgfSxcblxuICAgIC8vIOaSreaUvuaJk+ahhui/m+eQg+mfs+aViFxuICAgIHBsYXlIaXRCb2FyZEluU291bmQ6IGZ1bmN0aW9uIHBsYXlIaXRCb2FyZEluU291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuaGl0Qm9hcmRJbkF1ZGlvKTtcbiAgICB9LFxuXG4gICAgLy8g5pKt5pS+5oqV5o636Z+z5pWIXG4gICAgcGxheUZseVNvdW5kOiBmdW5jdGlvbiBwbGF5Rmx5U291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuZmx5QXVkaW8pO1xuICAgIH0sXG5cbiAgICAvLyDmkq3mlL7pn7PmlYgo5LiN5b6q546vKVxuICAgIHBsYXlTb3VuZDogZnVuY3Rpb24gcGxheVNvdW5kKHNvdW5kKSB7XG4gICAgICAgIGlmICh0aGlzLnRvZ2dsZUF1ZGlvKSB7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHNvdW5kLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2Y4MWNkWTNobE5BemEvSndMdHNXazJPJywgJ1RpbWVNYW5hZ2VyJyk7XG4vLyBzY3JpcHQvVGltZU1hbmFnZXIuanNcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBtYXhUaW1lOiAwLFxuICAgICAgICB0aW1lVG9Nb3ZlOiAwXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoZ2FtZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICB0aGlzLnRpbWUgPSB0aGlzLm1heFRpbWU7XG4gICAgICAgIHRoaXMuaXNUaW1lVG9Nb3ZlID0gZmFsc2U7XG4gICAgfSxcblxuICAgIF9jYWxsYmFjazogZnVuY3Rpb24gX2NhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNvdW50aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZ2FtZS5iYXNrZXQuY291bnQuc3RyaW5nID0gJzAwICAwMCc7XG4gICAgICAgIHRoaXMuZ2FtZS5zdG9wTW92ZUJhc2tldCgpO1xuICAgICAgICB0aGlzLmdhbWUuZ2FtZU92ZXIoKTtcbiAgICB9LFxuXG4gICAgc3RvcENvdW50aW5nOiBmdW5jdGlvbiBzdG9wQ291bnRpbmcoKSB7XG4gICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9jYWxsYmFjayk7XG4gICAgICAgIHRoaXMudGltZSA9IHRoaXMubWF4VGltZTtcbiAgICB9LFxuXG4gICAgb25lU2NoZWR1bGU6IGZ1bmN0aW9uIG9uZVNjaGVkdWxlKCkge1xuICAgICAgICB0aGlzLnN0b3BDb3VudGluZygpO1xuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZSh0aGlzLl9jYWxsYmFjaywgdGhpcy5tYXhUaW1lKTtcbiAgICAgICAgdGhpcy5jb3VudGluZyA9IHRydWU7XG4gICAgfSxcblxuICAgIC8vIGNhbGxlZCBldmVyeSBmcmFtZVxuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKGR0KSB7XG4gICAgICAgIGlmICh0aGlzLmNvdW50aW5nICYmIHRoaXMudGltZSA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudGltZSAtPSBkdDtcbiAgICAgICAgICAgIGlmICh0aGlzLm1heFRpbWUgLSB0aGlzLnRpbWVUb01vdmUgPj0gdGhpcy50aW1lICYmICF0aGlzLmlzVGltZVRvTW92ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNUaW1lVG9Nb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUuc3RhcnRNb3ZlQmFza2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0ZXh0ID0gdGhpcy50aW1lLnRvRml4ZWQoMik7XG4gICAgICAgICAgICBpZiAodGV4dC5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJzAnICsgdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ2FtZS5iYXNrZXQuY291bnQuc3RyaW5nID0gdGV4dC5yZXBsYWNlKCcuJywgJyAgJyk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7Il19
