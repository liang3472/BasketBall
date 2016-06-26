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
        showTime: 0 },

    // 生成篮球显示动画时间
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
                this.status = TouchStatus.BEGEN;
                return true;
            }).bind(this),

            onTouchEnded: (function (touch, event) {
                // 触摸事件结束
                this.status = TouchStatus.ENDED;
                this.enableInput(false);

                this.currentVerSpeed = this.emitSpeed;
                this.target = this.node.parent.convertToNodeSpaceAR(touch.getLocation()); // 记录最后触摸点,根据触摸点偏移计算速度
                this.currentHorSpeed = this.target.x * 1.2;

                this.game.soundMng.playFlySound();

                this.doAnim();
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
        var rotateAnim = cc.rotateBy(2, 360 * rotateValue);
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
                if (this.hitIn) {
                    this.game.soundMng.playHitBoardInSound();
                } else {
                    this.game.soundMng.playBallInSound();
                }
            }
        }
    },

    // 更新篮球位置
    _updatePosition: function _updatePosition(dt) {
        this.node.x += dt * this.currentHorSpeed;

        this.currentVerSpeed -= dt * this.gravity;
        this.node.y += dt * this.currentVerSpeed;

        this._changeBallStatus(this.currentVerSpeed);

        if (this.ballStatus === BallStatus.NONE && this._isOutScreen()) {
            if (!this.valid) {
                // 没进球将分数重置
                this.game.score.setScore(0);
            }

            this.node.stopAllActions();
            this.node.removeFromParent();
            this.valid = false;
            cc.pool.putInPool(this);
            this.game.newBall();
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

        // 篮球碰到篮筐内，改变篮球横向速度为反方向
        if (other.node.name === 'right' && this.node.x < left || other.node.name === 'left' && this.node.x > right) {
            this.currentHorSpeed = this.currentHorSpeed * -1 * 1.5;
            this.hitIn = true;
        }

        // 篮球碰到篮筐外，增大横向速度
        if (other.node.name === 'right' && this.node.x > right || other.node.name === 'left' && this.node.x < left) {
            this.currentHorSpeed = this.currentHorSpeed * 1.5;
        }
        this.currentVerSpeed = this.currentVerSpeed * -1 * 1.2;

        this.game.soundMng.playHitBoardSound();

        // 碰撞系统会计算出碰撞组件在世界坐标系下的相关的值，并放到 world 这个属性里面
        var world = self.world;

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
    "extends": cc.Component,

    properties: {
        line: cc.Node,
        left: cc.Node,
        right: cc.Node,
        linePre: cc.Prefab
    },

    init: function init(game) {
        this.game = game;
        this._doMoveAnim();
        this._createMaskLine();
    },

    // 篮筐移动动画
    _doMoveAnim: function _doMoveAnim() {
        var moveRight = cc.moveBy(3, cc.p(200, 0));
        var moveLeft = cc.moveBy(3, cc.p(-200, 0));
        var repeat = cc.repeatForever(cc.sequence(moveRight, moveLeft, moveLeft, moveRight));
        this.node.runAction(repeat);
    },

    update: function update(dt) {
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
var Score = require('Score');
var SoundManager = require('SoundManager');

cc.Class({
    'extends': cc.Component,

    properties: {
        ball: cc.Prefab,
        basket: Basket,
        startPosition: cc.Vec2,
        score: Score,
        soundMng: SoundManager
    },

    onLoad: function onLoad() {
        this.newBall();
        this.initCollisionSys();
        this.basket.init(this);
        this.score.init(this);

        this.score.setScore(0);
    },

    // 初始化碰撞系统
    initCollisionSys: function initCollisionSys() {
        this.collisionManager = cc.director.getCollisionManager();
        this.collisionManager.enabled = true;
        //this.collisionManager.enabledDebugDraw = true// 开启debug绘制
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
        child.getComponent('Ball').init(this); // 启动篮球逻辑
    }

});

cc._RFpop();
},{"Ball":"Ball","Basket":"Basket","Score":"Score","SoundManager":"SoundManager"}],"Line":[function(require,module,exports){
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
},{}]},{},["Line","Ball","Score","SoundManager","GameManager","CollisionBox","Basket"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcGxpY2F0aW9ucy9Db2Nvc0NyZWF0b3IuYXBwL0NvbnRlbnRzL1Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYXNzZXRzL3NjcmlwdC9CYWxsLmpzIiwiYXNzZXRzL3NjcmlwdC9CYXNrZXQuanMiLCJhc3NldHMvc2NyaXB0L0NvbGxpc2lvbkJveC5qcyIsImFzc2V0cy9zY3JpcHQvR2FtZU1hbmFnZXIuanMiLCJhc3NldHMvc2NyaXB0L0xpbmUuanMiLCJhc3NldHMvc2NyaXB0L1Njb3JlLmpzIiwiYXNzZXRzL3NjcmlwdC9Tb3VuZE1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMDVkNjE5NWQ5OUIwNnp6MElJaTZjc3YnLCAnQmFsbCcpO1xuLy8gc2NyaXB0L0JhbGwuanNcblxudmFyIFRvdWNoU3RhdHVzID0gY2MuRW51bSh7XG4gICAgQkVHRU46IC0xLCAvLyDmjInkuItcbiAgICBFTkRFRDogLTEsIC8vIOe7k+adn1xuICAgIENBTkNFTDogLTEgLy8g5Y+W5raIXG59KTtcblxudmFyIEJhbGxTdGF0dXMgPSBjYy5FbnVtKHtcbiAgICBGTFk6IC0xLCAvLyDpo55cbiAgICBET1dOOiAtMSwgLy8g6JC9XG4gICAgTk9ORTogLTEgLy8g6Z2Z5q2iXG59KTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBlbWl0U3BlZWQ6IDAsIC8vIOWPkeWwhOmAn+W6plxuICAgICAgICBncmF2aXR5OiAwLCAvLyDph43lipvpgJ/luqZcbiAgICAgICAgc2NhbGU6IDAsIC8vIOe8qeaUvuezu+aVsFxuICAgICAgICBzaG93VGltZTogMCB9LFxuXG4gICAgLy8g55Sf5oiQ56+u55CD5pi+56S65Yqo55S75pe26Ze0XG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJJbnB1dCgpO1xuICAgICAgICB0aGlzLmVuYWJsZUlucHV0KHRydWUpO1xuICAgICAgICB0aGlzLnNob3dBbmltKCk7XG4gICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBUb3VjaFN0YXR1cy5DQU5DRUw7XG4gICAgICAgIHRoaXMuY3VycmVudEhvclNwZWVkID0gMDtcbiAgICAgICAgdGhpcy5jdXJyZW50VmVyU3BlZWQgPSAwO1xuICAgICAgICB0aGlzLnRhcmdldCA9IGNjLnAoMCwgMCk7XG4gICAgICAgIHRoaXMubm9kZS5zZXRTY2FsZSgxKTtcbiAgICAgICAgdGhpcy5oaXRJbiA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyDmmL7npLrliqjnlLtcbiAgICBzaG93QW5pbTogZnVuY3Rpb24gc2hvd0FuaW0oKSB7XG4gICAgICAgIHRoaXMubm9kZS5vcGFjaXR5ID0gMDtcbiAgICAgICAgdmFyIGZhZGUgPSBjYy5mYWRlSW4odGhpcy5zaG93VGltZSk7XG4gICAgICAgIHRoaXMubm9kZS5ydW5BY3Rpb24oZmFkZSk7XG4gICAgfSxcblxuICAgIC8vIOazqOWGjOS6i+S7tuebkeWQrFxuICAgIHJlZ2lzdGVySW5wdXQ6IGZ1bmN0aW9uIHJlZ2lzdGVySW5wdXQoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSB7XG4gICAgICAgICAgICBldmVudDogY2MuRXZlbnRMaXN0ZW5lci5UT1VDSF9PTkVfQllfT05FLFxuICAgICAgICAgICAgb25Ub3VjaEJlZ2FuOiAoZnVuY3Rpb24gKHRvdWNoLCBldmVudCkge1xuICAgICAgICAgICAgICAgIC8vIOinpuaRuOS6i+S7tuW8gOWni1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gVG91Y2hTdGF0dXMuQkVHRU47XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpLFxuXG4gICAgICAgICAgICBvblRvdWNoRW5kZWQ6IChmdW5jdGlvbiAodG91Y2gsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgLy8g6Kem5pG45LqL5Lu257uT5p2fXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSBUb3VjaFN0YXR1cy5FTkRFRDtcbiAgICAgICAgICAgICAgICB0aGlzLmVuYWJsZUlucHV0KGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFZlclNwZWVkID0gdGhpcy5lbWl0U3BlZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0aGlzLm5vZGUucGFyZW50LmNvbnZlcnRUb05vZGVTcGFjZUFSKHRvdWNoLmdldExvY2F0aW9uKCkpOyAvLyDorrDlvZXmnIDlkI7op6bmkbjngrks5qC55o2u6Kem5pG454K55YGP56e76K6h566X6YCf5bqmXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9yU3BlZWQgPSB0aGlzLnRhcmdldC54ICogMS4yO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lLnNvdW5kTW5nLnBsYXlGbHlTb3VuZCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kb0FuaW0oKTtcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcyksXG5cbiAgICAgICAgICAgIG9uVG91Y2hDYW5jZWxsZWQ6IChmdW5jdGlvbiAodG91Y2gsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgLy8g6Kem5pG45LqL5Lu25Y+W5raIXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSBUb3VjaFN0YXR1cy5DQU5DRUw7XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpXG4gICAgICAgIH0sIGNjLmV2ZW50TWFuYWdlci5hZGRMaXN0ZW5lcih0aGlzLmxpc3RlbmVyLCB0aGlzLm5vZGUpO1xuICAgIH0sXG5cbiAgICAvLyDmjqfliLbkuovku7bmmK/lkKbnlJ/mlYhcbiAgICBlbmFibGVJbnB1dDogZnVuY3Rpb24gZW5hYmxlSW5wdXQoZW5hYmxlKSB7XG4gICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgIGNjLmV2ZW50TWFuYWdlci5yZXN1bWVUYXJnZXQodGhpcy5ub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNjLmV2ZW50TWFuYWdlci5wYXVzZVRhcmdldCh0aGlzLm5vZGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOevrueQg+WKqOeUu1xuICAgIGRvQW5pbTogZnVuY3Rpb24gZG9BbmltKCkge1xuICAgICAgICB2YXIgc2NhbGVBbmltID0gY2Muc2NhbGVUbygxLCB0aGlzLnNjYWxlKTtcbiAgICAgICAgdmFyIHJvdGF0ZVZhbHVlID0gY2MucmFuZG9tTWludXMxVG8xKCk7XG4gICAgICAgIHZhciByb3RhdGVBbmltID0gY2Mucm90YXRlQnkoMiwgMzYwICogcm90YXRlVmFsdWUpO1xuICAgICAgICB2YXIgYW5pbSA9IGNjLnNwYXduKHNjYWxlQW5pbSwgcm90YXRlQW5pbSk7XG5cbiAgICAgICAgdGhpcy5ub2RlLnJ1bkFjdGlvbihhbmltKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9IFRvdWNoU3RhdHVzLkVOREVEKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl91cGRhdGVQb3NpdGlvbihkdCk7XG4gICAgICAgIHRoaXMuX2NoZWNrVmFsaWQoKTtcbiAgICB9LFxuXG4gICAgX2NoZWNrVmFsaWQ6IGZ1bmN0aW9uIF9jaGVja1ZhbGlkKCkge1xuICAgICAgICBpZiAodGhpcy5iYWxsU3RhdHVzICE9PSBCYWxsU3RhdHVzLkRPV04gfHwgdGhpcy52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMubm9kZS5wYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGJhc2tldCA9IHRoaXMuZ2FtZS5iYXNrZXQ7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IGJhc2tldC5sZWZ0O1xuICAgICAgICAgICAgdmFyIHJpZ2h0ID0gYmFza2V0LnJpZ2h0O1xuICAgICAgICAgICAgdmFyIGJhbGxSYWRpdXMgPSB0aGlzLm5vZGUuZ2V0Qm91bmRpbmdCb3hUb1dvcmxkKCkud2lkdGggLyAyO1xuXG4gICAgICAgICAgICAvKiog57uf5LiA6L2s5o2i5oiQ5LiW55WM5Z2Q5qCH6K6h566X6L+b55CD6YC76L6RICovXG4gICAgICAgICAgICAvLyDnr67nkIPnmoTovrnnlYzlkozkuK3lv4NcbiAgICAgICAgICAgIHZhciBiYWxsTGVmdCA9IHBhcmVudC5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIodGhpcy5ub2RlLmdldFBvc2l0aW9uKCkpLnggLSBiYWxsUmFkaXVzO1xuICAgICAgICAgICAgdmFyIGJhbGxSaWdodCA9IHBhcmVudC5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIodGhpcy5ub2RlLmdldFBvc2l0aW9uKCkpLnggKyBiYWxsUmFkaXVzO1xuICAgICAgICAgICAgdmFyIGJhbGxYID0gcGFyZW50LmNvbnZlcnRUb1dvcmxkU3BhY2VBUih0aGlzLm5vZGUuZ2V0UG9zaXRpb24oKSkueDtcbiAgICAgICAgICAgIHZhciBiYWxsWSA9IHBhcmVudC5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIodGhpcy5ub2RlLmdldFBvc2l0aW9uKCkpLnk7XG5cbiAgICAgICAgICAgIC8vIOacieaViOi/m+eQg+iMg+WbtFxuICAgICAgICAgICAgdmFyIHZhbGlkVG9wID0gcGFyZW50LmNvbnZlcnRUb1dvcmxkU3BhY2VBUihiYXNrZXQubGluZVByZU5vZGUuZ2V0UG9zaXRpb24oKSkueSAtIGJhbGxSYWRpdXM7XG4gICAgICAgICAgICB2YXIgdmFsaWRMZWZ0ID0gYmFza2V0Lm5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKGxlZnQuZ2V0UG9zaXRpb24oKSkueDtcbiAgICAgICAgICAgIHZhciB2YWxpZFJpZ2h0ID0gYmFza2V0Lm5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKHJpZ2h0LmdldFBvc2l0aW9uKCkpLng7XG4gICAgICAgICAgICB2YXIgdmFsaWRCb3QgPSBiYXNrZXQubm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIobGVmdC5nZXRQb3NpdGlvbigpKS55IC0gYmFsbFJhZGl1cyAqIDI7XG5cbiAgICAgICAgICAgIGlmIChiYWxsWSA8IHZhbGlkVG9wICYmIGJhbGxZID4gdmFsaWRCb3QgJiYgYmFsbFggPiB2YWxpZExlZnQgJiYgYmFsbFggPCB2YWxpZFJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lLnNjb3JlLmFkZFNjb3JlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGl0SW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lLnNvdW5kTW5nLnBsYXlIaXRCb2FyZEluU291bmQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuc291bmRNbmcucGxheUJhbGxJblNvdW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOabtOaWsOevrueQg+S9jee9rlxuICAgIF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24gX3VwZGF0ZVBvc2l0aW9uKGR0KSB7XG4gICAgICAgIHRoaXMubm9kZS54ICs9IGR0ICogdGhpcy5jdXJyZW50SG9yU3BlZWQ7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50VmVyU3BlZWQgLT0gZHQgKiB0aGlzLmdyYXZpdHk7XG4gICAgICAgIHRoaXMubm9kZS55ICs9IGR0ICogdGhpcy5jdXJyZW50VmVyU3BlZWQ7XG5cbiAgICAgICAgdGhpcy5fY2hhbmdlQmFsbFN0YXR1cyh0aGlzLmN1cnJlbnRWZXJTcGVlZCk7XG5cbiAgICAgICAgaWYgKHRoaXMuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1cy5OT05FICYmIHRoaXMuX2lzT3V0U2NyZWVuKCkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy52YWxpZCkge1xuICAgICAgICAgICAgICAgIC8vIOayoei/m+eQg+WwhuWIhuaVsOmHjee9rlxuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5zY29yZS5zZXRTY29yZSgwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5ub2RlLnN0b3BBbGxBY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLm5vZGUucmVtb3ZlRnJvbVBhcmVudCgpO1xuICAgICAgICAgICAgdGhpcy52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgY2MucG9vbC5wdXRJblBvb2wodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmdhbWUubmV3QmFsbCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9pc091dFNjcmVlbjogZnVuY3Rpb24gX2lzT3V0U2NyZWVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLnkgPCAtODAwO1xuICAgIH0sXG5cbiAgICAvLyDmm7TmlLnnr67nkIPnirbmgIFcbiAgICBfY2hhbmdlQmFsbFN0YXR1czogZnVuY3Rpb24gX2NoYW5nZUJhbGxTdGF0dXMoc3BlZWQpIHtcbiAgICAgICAgaWYgKHNwZWVkID09PSAwIHx8IHRoaXMuX2lzT3V0U2NyZWVuKCkpIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMuTk9ORTtcbiAgICAgICAgfSBlbHNlIGlmIChzcGVlZCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMuRkxZO1xuICAgICAgICAgICAgdGhpcy5nYW1lLmJhc2tldC5zd2l0Y2hNYXNrTGluZVNob3coZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1cy5ET1dOO1xuICAgICAgICAgICAgdGhpcy5nYW1lLmJhc2tldC5zd2l0Y2hNYXNrTGluZVNob3codHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Db2xsaXNpb25FbnRlcjogZnVuY3Rpb24gb25Db2xsaXNpb25FbnRlcihvdGhlciwgc2VsZikge1xuICAgICAgICBpZiAodGhpcy5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzLkZMWSkge1xuICAgICAgICAgICAgLy8g56+u55CD5LiK5Y2H6L+H56iL5Lit5LiN6L+b6KGM56Kw5pKe5qOA5rWLXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYm94ID0gb3RoZXIubm9kZS5nZXRDb21wb25lbnQoJ0NvbGxpc2lvbkJveCcpO1xuICAgICAgICB2YXIgbGVmdCA9IGJveC5nZXRMZWZ0KCk7XG4gICAgICAgIHZhciByaWdodCA9IGJveC5nZXRSaWdodCgpO1xuXG4gICAgICAgIC8vIOevrueQg+eisOWIsOevruetkOWGhe+8jOaUueWPmOevrueQg+aoquWQkemAn+W6puS4uuWPjeaWueWQkVxuICAgICAgICBpZiAob3RoZXIubm9kZS5uYW1lID09PSAncmlnaHQnICYmIHRoaXMubm9kZS54IDwgbGVmdCB8fCBvdGhlci5ub2RlLm5hbWUgPT09ICdsZWZ0JyAmJiB0aGlzLm5vZGUueCA+IHJpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3JTcGVlZCA9IHRoaXMuY3VycmVudEhvclNwZWVkICogLTEgKiAxLjU7XG4gICAgICAgICAgICB0aGlzLmhpdEluID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOevrueQg+eisOWIsOevruetkOWklu+8jOWinuWkp+aoquWQkemAn+W6plxuICAgICAgICBpZiAob3RoZXIubm9kZS5uYW1lID09PSAncmlnaHQnICYmIHRoaXMubm9kZS54ID4gcmlnaHQgfHwgb3RoZXIubm9kZS5uYW1lID09PSAnbGVmdCcgJiYgdGhpcy5ub2RlLnggPCBsZWZ0KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3JTcGVlZCA9IHRoaXMuY3VycmVudEhvclNwZWVkICogMS41O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudFZlclNwZWVkID0gdGhpcy5jdXJyZW50VmVyU3BlZWQgKiAtMSAqIDEuMjtcblxuICAgICAgICB0aGlzLmdhbWUuc291bmRNbmcucGxheUhpdEJvYXJkU291bmQoKTtcblxuICAgICAgICAvLyDnorDmkp7ns7vnu5/kvJrorqHnrpflh7rnorDmkp7nu4Tku7blnKjkuJbnlYzlnZDmoIfns7vkuIvnmoTnm7jlhbPnmoTlgLzvvIzlubbmlL7liLAgd29ybGQg6L+Z5Liq5bGe5oCn6YeM6Z2iXG4gICAgICAgIHZhciB3b3JsZCA9IHNlbGYud29ybGQ7XG5cbiAgICAgICAgLy8g56Kw5pKe57uE5Lu255qEIGFhYmIg56Kw5pKe5qGGXG4gICAgICAgIHZhciBhYWJiID0gd29ybGQuYWFiYjtcblxuICAgICAgICAvLyDkuIrkuIDmrKHorqHnrpfnmoTnorDmkp7nu4Tku7bnmoQgYWFiYiDnorDmkp7moYZcbiAgICAgICAgdmFyIHByZUFhYmIgPSB3b3JsZC5wcmVBYWJiO1xuXG4gICAgICAgIC8vIOeisOaSnuahhueahOS4lueVjOefqemYtVxuICAgICAgICB2YXIgdCA9IHdvcmxkLnRyYW5zZm9ybTtcblxuICAgICAgICAvLyDku6XkuIvlsZ7mgKfkuLrlnIblvaLnorDmkp7nu4Tku7bnibnmnInlsZ7mgKdcbiAgICAgICAgdmFyIHIgPSB3b3JsZC5yYWRpdXM7XG4gICAgICAgIHZhciBwID0gd29ybGQucG9zaXRpb247XG4gICAgfVxuXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2FjOWZkRnlwNDlHVktIVWdrOS9GVmxpJywgJ0Jhc2tldCcpO1xuLy8gc2NyaXB0L0Jhc2tldC5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgbGluZTogY2MuTm9kZSxcbiAgICAgICAgbGVmdDogY2MuTm9kZSxcbiAgICAgICAgcmlnaHQ6IGNjLk5vZGUsXG4gICAgICAgIGxpbmVQcmU6IGNjLlByZWZhYlxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KGdhbWUpIHtcbiAgICAgICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICAgICAgdGhpcy5fZG9Nb3ZlQW5pbSgpO1xuICAgICAgICB0aGlzLl9jcmVhdGVNYXNrTGluZSgpO1xuICAgIH0sXG5cbiAgICAvLyDnr67nrZDnp7vliqjliqjnlLtcbiAgICBfZG9Nb3ZlQW5pbTogZnVuY3Rpb24gX2RvTW92ZUFuaW0oKSB7XG4gICAgICAgIHZhciBtb3ZlUmlnaHQgPSBjYy5tb3ZlQnkoMywgY2MucCgyMDAsIDApKTtcbiAgICAgICAgdmFyIG1vdmVMZWZ0ID0gY2MubW92ZUJ5KDMsIGNjLnAoLTIwMCwgMCkpO1xuICAgICAgICB2YXIgcmVwZWF0ID0gY2MucmVwZWF0Rm9yZXZlcihjYy5zZXF1ZW5jZShtb3ZlUmlnaHQsIG1vdmVMZWZ0LCBtb3ZlTGVmdCwgbW92ZVJpZ2h0KSk7XG4gICAgICAgIHRoaXMubm9kZS5ydW5BY3Rpb24ocmVwZWF0KTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHtcbiAgICAgICAgLy8g5L+u5pS56YGu572p5L2N572u77yM5YWI6L+b6KGM5Z2Q5qCH6L2s5o2iICAgICAgIFxuICAgICAgICB2YXIgd29ybGRQb3QgPSB0aGlzLm5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKHRoaXMubGluZS5nZXRQb3NpdGlvbigpKTtcbiAgICAgICAgdmFyIG5vZGVQb3QgPSB0aGlzLm5vZGUucGFyZW50LmNvbnZlcnRUb05vZGVTcGFjZUFSKHdvcmxkUG90KTtcbiAgICAgICAgdGhpcy5saW5lUHJlTm9kZS5zZXRQb3NpdGlvbihjYy5wKHRoaXMubm9kZS54LCBub2RlUG90LnkpKTtcbiAgICB9LFxuXG4gICAgLy8g5Yib5bu656+u562Q6YGu572pXG4gICAgX2NyZWF0ZU1hc2tMaW5lOiBmdW5jdGlvbiBfY3JlYXRlTWFza0xpbmUoKSB7XG4gICAgICAgIHRoaXMubGluZVByZU5vZGUgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmxpbmVQcmUpO1xuICAgICAgICB0aGlzLmdhbWUubm9kZS5hZGRDaGlsZCh0aGlzLmxpbmVQcmVOb2RlKTtcbiAgICB9LFxuXG4gICAgLy8g5YiH5o2i56+u562Q6YGu572p5bGC57qnXG4gICAgc3dpdGNoTWFza0xpbmVTaG93OiBmdW5jdGlvbiBzd2l0Y2hNYXNrTGluZVNob3coZmxhZykge1xuICAgICAgICBpZiAoZmxhZykge1xuICAgICAgICAgICAgdGhpcy5saW5lUHJlTm9kZS5zZXRMb2NhbFpPcmRlcigxMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saW5lUHJlTm9kZS5zZXRMb2NhbFpPcmRlcigwKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnN2M0YzZSd2k0dElDNFVNQmdZTDQyMzEnLCAnQ29sbGlzaW9uQm94Jyk7XG4vLyBzY3JpcHQvQ29sbGlzaW9uQm94LmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge30sXG5cbiAgICAvLyDojrflj5bliJrkvZPlt6bovrnnlYxcbiAgICBnZXRMZWZ0OiBmdW5jdGlvbiBnZXRMZWZ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLnggLSB0aGlzLm5vZGUud2lkdGggLyAyO1xuICAgIH0sXG5cbiAgICAvLyDojrflj5bliJrkvZPlj7PovrnnlYxcbiAgICBnZXRSaWdodDogZnVuY3Rpb24gZ2V0UmlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUueCArIHRoaXMubm9kZS53aWR0aCAvIDI7XG4gICAgfSxcblxuICAgIC8vIOiOt+WPluWImuS9k+eahOS4lueVjOWdkOagh1xuICAgIGdldFdvcmxkUG9pbnQ6IGZ1bmN0aW9uIGdldFdvcmxkUG9pbnQodGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQuY29udmVydFRvV29ybGRTcGFjZUFSKHRoaXMubm9kZS5nZXRQb3NpdGlvbigpKTtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnN2IwNjZIMzZLeENWcjBTTkRaa2E5MS8nLCAnR2FtZU1hbmFnZXInKTtcbi8vIHNjcmlwdC9HYW1lTWFuYWdlci5qc1xuXG52YXIgQmFza2V0ID0gcmVxdWlyZSgnQmFza2V0Jyk7XG52YXIgQmFsbCA9IHJlcXVpcmUoJ0JhbGwnKTtcbnZhciBTY29yZSA9IHJlcXVpcmUoJ1Njb3JlJyk7XG52YXIgU291bmRNYW5hZ2VyID0gcmVxdWlyZSgnU291bmRNYW5hZ2VyJyk7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgYmFsbDogY2MuUHJlZmFiLFxuICAgICAgICBiYXNrZXQ6IEJhc2tldCxcbiAgICAgICAgc3RhcnRQb3NpdGlvbjogY2MuVmVjMixcbiAgICAgICAgc2NvcmU6IFNjb3JlLFxuICAgICAgICBzb3VuZE1uZzogU291bmRNYW5hZ2VyXG4gICAgfSxcblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLm5ld0JhbGwoKTtcbiAgICAgICAgdGhpcy5pbml0Q29sbGlzaW9uU3lzKCk7XG4gICAgICAgIHRoaXMuYmFza2V0LmluaXQodGhpcyk7XG4gICAgICAgIHRoaXMuc2NvcmUuaW5pdCh0aGlzKTtcblxuICAgICAgICB0aGlzLnNjb3JlLnNldFNjb3JlKDApO1xuICAgIH0sXG5cbiAgICAvLyDliJ3lp4vljJbnorDmkp7ns7vnu59cbiAgICBpbml0Q29sbGlzaW9uU3lzOiBmdW5jdGlvbiBpbml0Q29sbGlzaW9uU3lzKCkge1xuICAgICAgICB0aGlzLmNvbGxpc2lvbk1hbmFnZXIgPSBjYy5kaXJlY3Rvci5nZXRDb2xsaXNpb25NYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uTWFuYWdlci5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgLy90aGlzLmNvbGxpc2lvbk1hbmFnZXIuZW5hYmxlZERlYnVnRHJhdyA9IHRydWUvLyDlvIDlkK9kZWJ1Z+e7mOWItlxuICAgIH0sXG5cbiAgICAvLyDnlJ/miJDnr67nkINcbiAgICBuZXdCYWxsOiBmdW5jdGlvbiBuZXdCYWxsKCkge1xuICAgICAgICB2YXIgY2hpbGQgPSBudWxsO1xuICAgICAgICBpZiAoY2MucG9vbC5oYXNPYmplY3QoQmFsbCkpIHtcbiAgICAgICAgICAgIGNoaWxkID0gY2MucG9vbC5nZXRGcm9tUG9vbChCYWxsKS5ub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2hpbGQgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmJhbGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hpbGQuc2V0TG9jYWxaT3JkZXIoMSk7XG4gICAgICAgIHRoaXMubm9kZS5hZGRDaGlsZChjaGlsZCk7XG4gICAgICAgIGNoaWxkLnNldFBvc2l0aW9uKHRoaXMuc3RhcnRQb3NpdGlvbik7XG4gICAgICAgIGNoaWxkLmdldENvbXBvbmVudCgnQmFsbCcpLmluaXQodGhpcyk7IC8vIOWQr+WKqOevrueQg+mAu+i+kVxuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcwMGRjYnk1RmNaSWg1UDEwd1BjZlZHdCcsICdMaW5lJyk7XG4vLyBzY3JpcHQvTGluZS5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgLy8gZm9vOiB7XG4gICAgICAgIC8vICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgIC8vICAgIHVybDogY2MuVGV4dHVyZTJELCAgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgdHlwZW9mIGRlZmF1bHRcbiAgICAgICAgLy8gICAgc2VyaWFsaXphYmxlOiB0cnVlLCAvLyBvcHRpb25hbCwgZGVmYXVsdCBpcyB0cnVlXG4gICAgICAgIC8vICAgIHZpc2libGU6IHRydWUsICAgICAgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgdHJ1ZVxuICAgICAgICAvLyAgICBkaXNwbGF5TmFtZTogJ0ZvbycsIC8vIG9wdGlvbmFsXG4gICAgICAgIC8vICAgIHJlYWRvbmx5OiBmYWxzZSwgICAgLy8gb3B0aW9uYWwsIGRlZmF1bHQgaXMgZmFsc2VcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLy8gLi4uXG4gICAgfSxcblxuICAgIC8vIHVzZSB0aGlzIGZvciBpbml0aWFsaXphdGlvblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge31cblxufSk7XG4vLyBjYWxsZWQgZXZlcnkgZnJhbWUsIHVuY29tbWVudCB0aGlzIGZ1bmN0aW9uIHRvIGFjdGl2YXRlIHVwZGF0ZSBjYWxsYmFja1xuLy8gdXBkYXRlOiBmdW5jdGlvbiAoZHQpIHtcbi8vICAgICBjYy5sb2coJ2xpbmUgeD0nK3RoaXMubm9kZS54KycseT0nK3RoaXMubm9kZS55KTtcbi8vIH0sXG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICcwZGJhZDhudU1CSzhMNFlXbGE1MFJqVCcsICdTY29yZScpO1xuLy8gc2NyaXB0L1Njb3JlLmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBzY29yZVRleHQ6IGNjLkxhYmVsXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoZ2FtZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICB0aGlzLl9zY29yZSA9IDA7XG4gICAgfSxcblxuICAgIC8vIOiOt+WPluWIhuaVsFxuICAgIGdldFNjb3JlOiBmdW5jdGlvbiBnZXRTY29yZSgpIHtcbiAgICAgICAgcmV0dXJuIF9zY29yZTtcbiAgICB9LFxuXG4gICAgLy8g6K6+572u5YiG5pWwXG4gICAgc2V0U2NvcmU6IGZ1bmN0aW9uIHNldFNjb3JlKHNjb3JlKSB7XG4gICAgICAgIHRoaXMuX3Njb3JlID0gc2NvcmU7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVNjb3JlKCk7XG4gICAgfSxcblxuICAgIC8vIOWinuWKoOWIhuaVsFxuICAgIGFkZFNjb3JlOiBmdW5jdGlvbiBhZGRTY29yZSgpIHtcbiAgICAgICAgdGhpcy5fc2NvcmUgKz0gMTtcbiAgICAgICAgdGhpcy5fdXBkYXRlU2NvcmUoKTtcblxuICAgICAgICAvL3RoaXMuZ2FtZS5zb3VuZE1uZy5wbGF5U2NvcmVTb3VuZCgpO1xuICAgIH0sXG5cbiAgICAvLyDmm7TmlrDliIbmlbBcbiAgICBfdXBkYXRlU2NvcmU6IGZ1bmN0aW9uIF91cGRhdGVTY29yZSgpIHtcbiAgICAgICAgdGhpcy5zY29yZVRleHQuc3RyaW5nID0gdGhpcy5fc2NvcmU7XG4gICAgfVxuXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzM0OTVlQngraTFQbHJPS2NiVGFxVUQ2JywgJ1NvdW5kTWFuYWdlcicpO1xuLy8gc2NyaXB0L1NvdW5kTWFuYWdlci5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgdG9nZ2xlQXVkaW86IHRydWUsXG5cbiAgICAgICAgc2NvcmVBdWRpbzoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IG51bGwsXG4gICAgICAgICAgICB1cmw6IGNjLkF1ZGlvQ2xpcFxuICAgICAgICB9LFxuXG4gICAgICAgIGJhbGxJbkF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGl0Qm9hcmRJbkF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGl0Qm9hcmRBdWRpbzoge1xuICAgICAgICAgICAgXCJkZWZhdWx0XCI6IG51bGwsXG4gICAgICAgICAgICB1cmw6IGNjLkF1ZGlvQ2xpcFxuICAgICAgICB9LFxuXG4gICAgICAgIGZseUF1ZGlvOiB7XG4gICAgICAgICAgICBcImRlZmF1bHRcIjogbnVsbCxcbiAgICAgICAgICAgIHVybDogY2MuQXVkaW9DbGlwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7fSxcblxuICAgIC8vIOaSreaUvuW+l+WIhumfs+aViFxuICAgIHBsYXlTY29yZVNvdW5kOiBmdW5jdGlvbiBwbGF5U2NvcmVTb3VuZCgpIHtcbiAgICAgICAgdGhpcy5wbGF5U291bmQodGhpcy5zY29yZUF1ZGlvKTtcbiAgICB9LFxuXG4gICAgLy8g5pKt5pS+55u05o6l6L+b55CD6Z+z5pWIXG4gICAgcGxheUJhbGxJblNvdW5kOiBmdW5jdGlvbiBwbGF5QmFsbEluU291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuYmFsbEluQXVkaW8pO1xuICAgIH0sXG5cbiAgICAvLyDmkq3mlL7miZPmoYbpn7PmlYhcbiAgICBwbGF5SGl0Qm9hcmRTb3VuZDogZnVuY3Rpb24gcGxheUhpdEJvYXJkU291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuaGl0Qm9hcmRBdWRpbyk7XG4gICAgfSxcblxuICAgIC8vIOaSreaUvuaJk+ahhui/m+eQg+mfs+aViFxuICAgIHBsYXlIaXRCb2FyZEluU291bmQ6IGZ1bmN0aW9uIHBsYXlIaXRCb2FyZEluU291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuaGl0Qm9hcmRJbkF1ZGlvKTtcbiAgICB9LFxuXG4gICAgLy8g5pKt5pS+5oqV5o636Z+z5pWIXG4gICAgcGxheUZseVNvdW5kOiBmdW5jdGlvbiBwbGF5Rmx5U291bmQoKSB7XG4gICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuZmx5QXVkaW8pO1xuICAgIH0sXG5cbiAgICAvLyDmkq3mlL7pn7PmlYgo5LiN5b6q546vKVxuICAgIHBsYXlTb3VuZDogZnVuY3Rpb24gcGxheVNvdW5kKHNvdW5kKSB7XG4gICAgICAgIGlmICh0aGlzLnRvZ2dsZUF1ZGlvKSB7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHNvdW5kLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuY2MuX1JGcG9wKCk7Il19
