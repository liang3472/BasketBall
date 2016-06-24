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
        emitSpeed: 0,
        gravity: 0,
        scale: 0
    },

    init: function init(game) {
        this.game = game;
        this.registerInput();

        this.showAnim();
    },

    showAnim: function showAnim() {
        this.node.opacity = 0;
        var fade = cc.fadeIn(0.3);
        this.node.runAction(fade);
    },

    registerInput: function registerInput() {
        this.listener = {
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: (function (touch, event) {
                this.status = TouchStatus.BEGEN;
                return true;
            }).bind(this),

            onTouchMoved: (function (touch, event) {}).bind(this),

            onTouchEnded: (function (touch, event) {
                this.status = TouchStatus.ENDED;
                this.enableInput(false);
                this.currentVerSpeed = this.emitSpeed;
                this.target = this.node.convertToNodeSpaceAR(touch.getLocation());
                cc.log('touch x=' + this.target.x + ', y=' + this.target.y);
                this.currentHorSpeed = this.target.x * 1.2;

                this.doAnim();
            }).bind(this),

            onTouchCancelled: (function (touch, event) {
                this.status = TouchStatus.CANCEL;
            }).bind(this)
        }, cc.eventManager.addListener(this.listener, this.node);
    },

    enableInput: function enableInput(enable) {
        if (enable) {
            cc.eventManager.resumeTarget(this.node);
        } else {
            cc.eventManager.pauseTarget(this.node);
        }
    },

    doAnim: function doAnim() {
        var scaleAnim = cc.scaleTo(1, this.scale);
        var rotateAnim = cc.rotateBy(2, 360);
        var anim = cc.spawn(scaleAnim, rotateAnim);

        this.node.runAction(anim);
    },

    getNode: function getNode() {
        return this.node;
    },

    update: function update(dt) {
        if (this.status != TouchStatus.ENDED) {
            return;
        }

        this._updatePosition(dt);
    },

    _updatePosition: function _updatePosition(dt) {
        this.node.x += dt * this.currentHorSpeed;

        this.currentVerSpeed -= dt * this.gravity;
        this.changeBallStatus(this.currentVerSpeed);
        this.node.y += dt * this.currentVerSpeed;

        if (this.ballStatus === BallStatus.DOWN && this.node.y < -800) {
            this.node.stopAllActions();
            this.node.removeFromParent();
            cc.pool.putInPool(this);
            this.game.newBall();
            return;
        }
    },

    // 更改篮球状态
    changeBallStatus: function changeBallStatus(speed) {
        if (speed === 0) {
            this.ballStatus = BallStatus.NONE;
        } else if (speed > 0) {
            this.ballStatus = BallStatus.FLY;
        } else {
            this.ballStatus = BallStatus.DOWN;
        }
    },

    onCollisionEnter: function onCollisionEnter(other, self) {
        if (this.ballStatus === BallStatus.FLY) {
            return;
        }

        var box = other.node.getComponent('CollisionBox');;
        var left = box.getLeft();
        var right = box.getRight();

        if (other.node.name === 'right' && this.node.x < left || other.node.name === 'left' && this.node.x > right) {
            this.currentHorSpeed = this.currentHorSpeed * -1 * 1.5;
        }

        if (other.node.name === 'right' && this.node.x > right || other.node.name === 'left' && this.node.x < left) {
            this.currentHorSpeed = this.currentHorSpeed * 1.5;
        }
        this.currentVerSpeed = this.currentVerSpeed * -1 * 1.2;

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

    properties: {},

    init: function init(game) {
        var moveRight = cc.moveBy(3, cc.p(200, 0));
        var moveLeft = cc.moveBy(3, cc.p(-200, 0));

        var repeat = cc.repeatForever(cc.sequence(moveRight, moveLeft, moveLeft, moveRight));
        this.node.runAction(repeat);
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

    getLeft: function getLeft() {
        return this.node.x - this.node.width / 2;
    },

    getRight: function getRight() {
        return this.node.x + this.node.width / 2;
    }

});

cc._RFpop();
},{}],"GameManager":[function(require,module,exports){
"use strict";
cc._RFpush(module, '7b066H36KxCVr0SNDZka91/', 'GameManager');
// script/GameManager.js

var flush = require('flush');
var Basket = require('Basket');
var Ball = require('Ball');

cc.Class({
    'extends': cc.Component,

    properties: {
        ball: cc.Prefab,
        flushBtn: flush,
        basket: Basket,
        startPosition: cc.Vec2
    },

    onLoad: function onLoad() {
        this.newBall();
        this.initCollisionSys();
        this.flushBtn.init(this);
        //this.basket.init(this);
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
            var test = cc.pool.getFromPool(Ball);

            child = cc.pool.getFromPool(Ball).getNode();
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
},{"Ball":"Ball","Basket":"Basket","flush":"flush"}],"flush":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'a4f69u3MpVLKpn1uoE0day/', 'flush');
// script/flush.js

cc.Class({
    'extends': cc.Component,

    init: function init(game) {
        this.game = game;
    },

    reload: function reload() {
        cc.director.loadScene('Game');
    }

});

cc._RFpop();
},{}]},{},["Ball","GameManager","CollisionBox","flush","Basket"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcGxpY2F0aW9ucy9Db2Nvc0NyZWF0b3IuYXBwL0NvbnRlbnRzL1Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYXNzZXRzL3NjcmlwdC9CYWxsLmpzIiwiYXNzZXRzL3NjcmlwdC9CYXNrZXQuanMiLCJhc3NldHMvc2NyaXB0L0NvbGxpc2lvbkJveC5qcyIsImFzc2V0cy9zY3JpcHQvR2FtZU1hbmFnZXIuanMiLCJhc3NldHMvc2NyaXB0L2ZsdXNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMDVkNjE5NWQ5OUIwNnp6MElJaTZjc3YnLCAnQmFsbCcpO1xuLy8gc2NyaXB0L0JhbGwuanNcblxudmFyIFRvdWNoU3RhdHVzID0gY2MuRW51bSh7XG4gICAgQkVHRU46IC0xLCAvLyDmjInkuItcbiAgICBFTkRFRDogLTEsIC8vIOe7k+adn1xuICAgIENBTkNFTDogLTEgLy8g5Y+W5raIXG59KTtcblxudmFyIEJhbGxTdGF0dXMgPSBjYy5FbnVtKHtcbiAgICBGTFk6IC0xLCAvLyDpo55cbiAgICBET1dOOiAtMSwgLy8g6JC9XG4gICAgTk9ORTogLTEgLy8g6Z2Z5q2iXG59KTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBlbWl0U3BlZWQ6IDAsXG4gICAgICAgIGdyYXZpdHk6IDAsXG4gICAgICAgIHNjYWxlOiAwXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoZ2FtZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICB0aGlzLnJlZ2lzdGVySW5wdXQoKTtcblxuICAgICAgICB0aGlzLnNob3dBbmltKCk7XG4gICAgfSxcblxuICAgIHNob3dBbmltOiBmdW5jdGlvbiBzaG93QW5pbSgpIHtcbiAgICAgICAgdGhpcy5ub2RlLm9wYWNpdHkgPSAwO1xuICAgICAgICB2YXIgZmFkZSA9IGNjLmZhZGVJbigwLjMpO1xuICAgICAgICB0aGlzLm5vZGUucnVuQWN0aW9uKGZhZGUpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcklucHV0OiBmdW5jdGlvbiByZWdpc3RlcklucHV0KCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0ge1xuICAgICAgICAgICAgZXZlbnQ6IGNjLkV2ZW50TGlzdGVuZXIuVE9VQ0hfT05FX0JZX09ORSxcbiAgICAgICAgICAgIG9uVG91Y2hCZWdhbjogKGZ1bmN0aW9uICh0b3VjaCwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cyA9IFRvdWNoU3RhdHVzLkJFR0VOO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSkuYmluZCh0aGlzKSxcblxuICAgICAgICAgICAgb25Ub3VjaE1vdmVkOiAoZnVuY3Rpb24gKHRvdWNoLCBldmVudCkge30pLmJpbmQodGhpcyksXG5cbiAgICAgICAgICAgIG9uVG91Y2hFbmRlZDogKGZ1bmN0aW9uICh0b3VjaCwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cyA9IFRvdWNoU3RhdHVzLkVOREVEO1xuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlSW5wdXQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFZlclNwZWVkID0gdGhpcy5lbWl0U3BlZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0aGlzLm5vZGUuY29udmVydFRvTm9kZVNwYWNlQVIodG91Y2guZ2V0TG9jYXRpb24oKSk7XG4gICAgICAgICAgICAgICAgY2MubG9nKCd0b3VjaCB4PScgKyB0aGlzLnRhcmdldC54ICsgJywgeT0nICsgdGhpcy50YXJnZXQueSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SG9yU3BlZWQgPSB0aGlzLnRhcmdldC54ICogMS4yO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kb0FuaW0oKTtcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcyksXG5cbiAgICAgICAgICAgIG9uVG91Y2hDYW5jZWxsZWQ6IChmdW5jdGlvbiAodG91Y2gsIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSBUb3VjaFN0YXR1cy5DQU5DRUw7XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpXG4gICAgICAgIH0sIGNjLmV2ZW50TWFuYWdlci5hZGRMaXN0ZW5lcih0aGlzLmxpc3RlbmVyLCB0aGlzLm5vZGUpO1xuICAgIH0sXG5cbiAgICBlbmFibGVJbnB1dDogZnVuY3Rpb24gZW5hYmxlSW5wdXQoZW5hYmxlKSB7XG4gICAgICAgIGlmIChlbmFibGUpIHtcbiAgICAgICAgICAgIGNjLmV2ZW50TWFuYWdlci5yZXN1bWVUYXJnZXQodGhpcy5ub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNjLmV2ZW50TWFuYWdlci5wYXVzZVRhcmdldCh0aGlzLm5vZGUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRvQW5pbTogZnVuY3Rpb24gZG9BbmltKCkge1xuICAgICAgICB2YXIgc2NhbGVBbmltID0gY2Muc2NhbGVUbygxLCB0aGlzLnNjYWxlKTtcbiAgICAgICAgdmFyIHJvdGF0ZUFuaW0gPSBjYy5yb3RhdGVCeSgyLCAzNjApO1xuICAgICAgICB2YXIgYW5pbSA9IGNjLnNwYXduKHNjYWxlQW5pbSwgcm90YXRlQW5pbSk7XG5cbiAgICAgICAgdGhpcy5ub2RlLnJ1bkFjdGlvbihhbmltKTtcbiAgICB9LFxuXG4gICAgZ2V0Tm9kZTogZnVuY3Rpb24gZ2V0Tm9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9IFRvdWNoU3RhdHVzLkVOREVEKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl91cGRhdGVQb3NpdGlvbihkdCk7XG4gICAgfSxcblxuICAgIF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24gX3VwZGF0ZVBvc2l0aW9uKGR0KSB7XG4gICAgICAgIHRoaXMubm9kZS54ICs9IGR0ICogdGhpcy5jdXJyZW50SG9yU3BlZWQ7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50VmVyU3BlZWQgLT0gZHQgKiB0aGlzLmdyYXZpdHk7XG4gICAgICAgIHRoaXMuY2hhbmdlQmFsbFN0YXR1cyh0aGlzLmN1cnJlbnRWZXJTcGVlZCk7XG4gICAgICAgIHRoaXMubm9kZS55ICs9IGR0ICogdGhpcy5jdXJyZW50VmVyU3BlZWQ7XG5cbiAgICAgICAgaWYgKHRoaXMuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1cy5ET1dOICYmIHRoaXMubm9kZS55IDwgLTgwMCkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnN0b3BBbGxBY3Rpb25zKCk7XG4gICAgICAgICAgICB0aGlzLm5vZGUucmVtb3ZlRnJvbVBhcmVudCgpO1xuICAgICAgICAgICAgY2MucG9vbC5wdXRJblBvb2wodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmdhbWUubmV3QmFsbCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOabtOaUueevrueQg+eKtuaAgVxuICAgIGNoYW5nZUJhbGxTdGF0dXM6IGZ1bmN0aW9uIGNoYW5nZUJhbGxTdGF0dXMoc3BlZWQpIHtcbiAgICAgICAgaWYgKHNwZWVkID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzLk5PTkU7XG4gICAgICAgIH0gZWxzZSBpZiAoc3BlZWQgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzLkZMWTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMuRE9XTjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkNvbGxpc2lvbkVudGVyOiBmdW5jdGlvbiBvbkNvbGxpc2lvbkVudGVyKG90aGVyLCBzZWxmKSB7XG4gICAgICAgIGlmICh0aGlzLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXMuRkxZKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYm94ID0gb3RoZXIubm9kZS5nZXRDb21wb25lbnQoJ0NvbGxpc2lvbkJveCcpOztcbiAgICAgICAgdmFyIGxlZnQgPSBib3guZ2V0TGVmdCgpO1xuICAgICAgICB2YXIgcmlnaHQgPSBib3guZ2V0UmlnaHQoKTtcblxuICAgICAgICBpZiAob3RoZXIubm9kZS5uYW1lID09PSAncmlnaHQnICYmIHRoaXMubm9kZS54IDwgbGVmdCB8fCBvdGhlci5ub2RlLm5hbWUgPT09ICdsZWZ0JyAmJiB0aGlzLm5vZGUueCA+IHJpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3JTcGVlZCA9IHRoaXMuY3VycmVudEhvclNwZWVkICogLTEgKiAxLjU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3RoZXIubm9kZS5uYW1lID09PSAncmlnaHQnICYmIHRoaXMubm9kZS54ID4gcmlnaHQgfHwgb3RoZXIubm9kZS5uYW1lID09PSAnbGVmdCcgJiYgdGhpcy5ub2RlLnggPCBsZWZ0KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3JTcGVlZCA9IHRoaXMuY3VycmVudEhvclNwZWVkICogMS41O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudFZlclNwZWVkID0gdGhpcy5jdXJyZW50VmVyU3BlZWQgKiAtMSAqIDEuMjtcblxuICAgICAgICAvLyDnorDmkp7ns7vnu5/kvJrorqHnrpflh7rnorDmkp7nu4Tku7blnKjkuJbnlYzlnZDmoIfns7vkuIvnmoTnm7jlhbPnmoTlgLzvvIzlubbmlL7liLAgd29ybGQg6L+Z5Liq5bGe5oCn6YeM6Z2iXG4gICAgICAgIHZhciB3b3JsZCA9IHNlbGYud29ybGQ7XG5cbiAgICAgICAgLy8g56Kw5pKe57uE5Lu255qEIGFhYmIg56Kw5pKe5qGGXG4gICAgICAgIHZhciBhYWJiID0gd29ybGQuYWFiYjtcblxuICAgICAgICAvLyDkuIrkuIDmrKHorqHnrpfnmoTnorDmkp7nu4Tku7bnmoQgYWFiYiDnorDmkp7moYZcbiAgICAgICAgdmFyIHByZUFhYmIgPSB3b3JsZC5wcmVBYWJiO1xuXG4gICAgICAgIC8vIOeisOaSnuahhueahOS4lueVjOefqemYtVxuICAgICAgICB2YXIgdCA9IHdvcmxkLnRyYW5zZm9ybTtcblxuICAgICAgICAvLyDku6XkuIvlsZ7mgKfkuLrlnIblvaLnorDmkp7nu4Tku7bnibnmnInlsZ7mgKdcbiAgICAgICAgdmFyIHIgPSB3b3JsZC5yYWRpdXM7XG4gICAgICAgIHZhciBwID0gd29ybGQucG9zaXRpb247XG4gICAgfVxuXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2FjOWZkRnlwNDlHVktIVWdrOS9GVmxpJywgJ0Jhc2tldCcpO1xuLy8gc2NyaXB0L0Jhc2tldC5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHt9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7XG4gICAgICAgIHZhciBtb3ZlUmlnaHQgPSBjYy5tb3ZlQnkoMywgY2MucCgyMDAsIDApKTtcbiAgICAgICAgdmFyIG1vdmVMZWZ0ID0gY2MubW92ZUJ5KDMsIGNjLnAoLTIwMCwgMCkpO1xuXG4gICAgICAgIHZhciByZXBlYXQgPSBjYy5yZXBlYXRGb3JldmVyKGNjLnNlcXVlbmNlKG1vdmVSaWdodCwgbW92ZUxlZnQsIG1vdmVMZWZ0LCBtb3ZlUmlnaHQpKTtcbiAgICAgICAgdGhpcy5ub2RlLnJ1bkFjdGlvbihyZXBlYXQpO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3YzRjNlJ3aTR0SUM0VU1CZ1lMNDIzMScsICdDb2xsaXNpb25Cb3gnKTtcbi8vIHNjcmlwdC9Db2xsaXNpb25Cb3guanNcblxuY2MuQ2xhc3Moe1xuICAgIFwiZXh0ZW5kc1wiOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7fSxcblxuICAgIGdldExlZnQ6IGZ1bmN0aW9uIGdldExlZnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUueCAtIHRoaXMubm9kZS53aWR0aCAvIDI7XG4gICAgfSxcblxuICAgIGdldFJpZ2h0OiBmdW5jdGlvbiBnZXRSaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS54ICsgdGhpcy5ub2RlLndpZHRoIC8gMjtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnN2IwNjZIMzZLeENWcjBTTkRaa2E5MS8nLCAnR2FtZU1hbmFnZXInKTtcbi8vIHNjcmlwdC9HYW1lTWFuYWdlci5qc1xuXG52YXIgZmx1c2ggPSByZXF1aXJlKCdmbHVzaCcpO1xudmFyIEJhc2tldCA9IHJlcXVpcmUoJ0Jhc2tldCcpO1xudmFyIEJhbGwgPSByZXF1aXJlKCdCYWxsJyk7XG5cbmNjLkNsYXNzKHtcbiAgICAnZXh0ZW5kcyc6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgYmFsbDogY2MuUHJlZmFiLFxuICAgICAgICBmbHVzaEJ0bjogZmx1c2gsXG4gICAgICAgIGJhc2tldDogQmFza2V0LFxuICAgICAgICBzdGFydFBvc2l0aW9uOiBjYy5WZWMyXG4gICAgfSxcblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLm5ld0JhbGwoKTtcbiAgICAgICAgdGhpcy5pbml0Q29sbGlzaW9uU3lzKCk7XG4gICAgICAgIHRoaXMuZmx1c2hCdG4uaW5pdCh0aGlzKTtcbiAgICAgICAgLy90aGlzLmJhc2tldC5pbml0KHRoaXMpO1xuICAgIH0sXG5cbiAgICAvLyDliJ3lp4vljJbnorDmkp7ns7vnu59cbiAgICBpbml0Q29sbGlzaW9uU3lzOiBmdW5jdGlvbiBpbml0Q29sbGlzaW9uU3lzKCkge1xuICAgICAgICB0aGlzLmNvbGxpc2lvbk1hbmFnZXIgPSBjYy5kaXJlY3Rvci5nZXRDb2xsaXNpb25NYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uTWFuYWdlci5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgLy90aGlzLmNvbGxpc2lvbk1hbmFnZXIuZW5hYmxlZERlYnVnRHJhdyA9IHRydWUvLyDlvIDlkK9kZWJ1Z+e7mOWItlxuICAgIH0sXG5cbiAgICAvLyDnlJ/miJDnr67nkINcbiAgICBuZXdCYWxsOiBmdW5jdGlvbiBuZXdCYWxsKCkge1xuICAgICAgICB2YXIgY2hpbGQgPSBudWxsO1xuICAgICAgICBpZiAoY2MucG9vbC5oYXNPYmplY3QoQmFsbCkpIHtcbiAgICAgICAgICAgIHZhciB0ZXN0ID0gY2MucG9vbC5nZXRGcm9tUG9vbChCYWxsKTtcblxuICAgICAgICAgICAgY2hpbGQgPSBjYy5wb29sLmdldEZyb21Qb29sKEJhbGwpLmdldE5vZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNoaWxkID0gY2MuaW5zdGFudGlhdGUodGhpcy5iYWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoaWxkLnNldExvY2FsWk9yZGVyKDEpO1xuICAgICAgICB0aGlzLm5vZGUuYWRkQ2hpbGQoY2hpbGQpO1xuICAgICAgICBjaGlsZC5zZXRQb3NpdGlvbih0aGlzLnN0YXJ0UG9zaXRpb24pO1xuICAgICAgICBjaGlsZC5nZXRDb21wb25lbnQoJ0JhbGwnKS5pbml0KHRoaXMpOyAvLyDlkK/liqjnr67nkIPpgLvovpFcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYTRmNjl1M01wVkxLcG4xdW9FMGRheS8nLCAnZmx1c2gnKTtcbi8vIHNjcmlwdC9mbHVzaC5qc1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KGdhbWUpIHtcbiAgICAgICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB9LFxuXG4gICAgcmVsb2FkOiBmdW5jdGlvbiByZWxvYWQoKSB7XG4gICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZSgnR2FtZScpO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyJdfQ==
