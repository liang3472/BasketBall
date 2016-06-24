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
        scale: 0,
        startPosition: cc.Vec2
    },

    init: function init(game) {
        this.game = game;
        this.reset();
        this.registerInput();
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
                this.currentHorSpeed = this.target.x;

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

        if (this.ballStatus === BallStatus.DOWN && this.node.y < 0) {
            this.node.stopAllActions();
            this.reset();
            return;
        }
    },

    // 更改篮球状态
    changeBallStatus: function changeBallStatus(speed) {
        if (speed === 0) {
            this.ballStatus = BallStatus.NONE;
            this.game.switchCollision(false);
        } else if (speed > 0) {
            this.ballStatus = BallStatus.FLY;
            this.game.switchCollision(false);
        } else {
            this.ballStatus = BallStatus.DOWN;
            this.game.switchCollision(true);
        }
    },

    onCollisionEnter: function onCollisionEnter(other, self) {
        console.log('发生了碰撞' + other);

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
    },

    reset: function reset() {}
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

var Ball = require('Ball');
var flush = require('flush');
var Basket = require('Basket');

cc.Class({
    'extends': cc.Component,

    properties: {
        ball: Ball,
        flushBtn: flush,
        basket: Basket
    },

    onLoad: function onLoad() {
        this.collisionManager = cc.director.getCollisionManager();
        this.ball.init(this);
        this.flushBtn.init(this);
        this.basket.init(this);

        //this.collisionManager.enabledDebugDraw = true// 开启debug绘制
    },

    switchCollision: function switchCollision(flag) {
        this.collisionManager.enabled = flag;
    },

    update: function update(dt) {}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcGxpY2F0aW9ucy9Db2Nvc0NyZWF0b3IuYXBwL0NvbnRlbnRzL1Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYXNzZXRzL3NjcmlwdC9CYWxsLmpzIiwiYXNzZXRzL3NjcmlwdC9CYXNrZXQuanMiLCJhc3NldHMvc2NyaXB0L0NvbGxpc2lvbkJveC5qcyIsImFzc2V0cy9zY3JpcHQvR2FtZU1hbmFnZXIuanMiLCJhc3NldHMvc2NyaXB0L2ZsdXNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnMDVkNjE5NWQ5OUIwNnp6MElJaTZjc3YnLCAnQmFsbCcpO1xuLy8gc2NyaXB0L0JhbGwuanNcblxudmFyIFRvdWNoU3RhdHVzID0gY2MuRW51bSh7XG4gICAgQkVHRU46IC0xLCAvLyDmjInkuItcbiAgICBFTkRFRDogLTEsIC8vIOe7k+adn1xuICAgIENBTkNFTDogLTEgLy8g5Y+W5raIXG59KTtcblxudmFyIEJhbGxTdGF0dXMgPSBjYy5FbnVtKHtcbiAgICBGTFk6IC0xLCAvLyDpo55cbiAgICBET1dOOiAtMSwgLy8g6JC9XG4gICAgTk9ORTogLTEgLy8g6Z2Z5q2iXG59KTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBlbWl0U3BlZWQ6IDAsXG4gICAgICAgIGdyYXZpdHk6IDAsXG4gICAgICAgIHNjYWxlOiAwLFxuICAgICAgICBzdGFydFBvc2l0aW9uOiBjYy5WZWMyXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoZ2FtZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJJbnB1dCgpO1xuICAgIH0sXG5cbiAgICByZWdpc3RlcklucHV0OiBmdW5jdGlvbiByZWdpc3RlcklucHV0KCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0ge1xuICAgICAgICAgICAgZXZlbnQ6IGNjLkV2ZW50TGlzdGVuZXIuVE9VQ0hfT05FX0JZX09ORSxcbiAgICAgICAgICAgIG9uVG91Y2hCZWdhbjogKGZ1bmN0aW9uICh0b3VjaCwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cyA9IFRvdWNoU3RhdHVzLkJFR0VOO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSkuYmluZCh0aGlzKSxcblxuICAgICAgICAgICAgb25Ub3VjaE1vdmVkOiAoZnVuY3Rpb24gKHRvdWNoLCBldmVudCkge30pLmJpbmQodGhpcyksXG5cbiAgICAgICAgICAgIG9uVG91Y2hFbmRlZDogKGZ1bmN0aW9uICh0b3VjaCwgZXZlbnQpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gVG91Y2hTdGF0dXMuRU5ERUQ7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmFibGVJbnB1dChmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VmVyU3BlZWQgPSB0aGlzLmVtaXRTcGVlZDtcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHRoaXMubm9kZS5jb252ZXJ0VG9Ob2RlU3BhY2VBUih0b3VjaC5nZXRMb2NhdGlvbigpKTtcbiAgICAgICAgICAgICAgICBjYy5sb2coJ3RvdWNoIHg9JyArIHRoaXMudGFyZ2V0LnggKyAnLCB5PScgKyB0aGlzLnRhcmdldC55KTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRIb3JTcGVlZCA9IHRoaXMudGFyZ2V0Lng7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRvQW5pbSgpO1xuICAgICAgICAgICAgfSkuYmluZCh0aGlzKSxcblxuICAgICAgICAgICAgb25Ub3VjaENhbmNlbGxlZDogKGZ1bmN0aW9uICh0b3VjaCwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cyA9IFRvdWNoU3RhdHVzLkNBTkNFTDtcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcylcbiAgICAgICAgfSwgY2MuZXZlbnRNYW5hZ2VyLmFkZExpc3RlbmVyKHRoaXMubGlzdGVuZXIsIHRoaXMubm9kZSk7XG4gICAgfSxcblxuICAgIGVuYWJsZUlucHV0OiBmdW5jdGlvbiBlbmFibGVJbnB1dChlbmFibGUpIHtcbiAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgY2MuZXZlbnRNYW5hZ2VyLnJlc3VtZVRhcmdldCh0aGlzLm5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2MuZXZlbnRNYW5hZ2VyLnBhdXNlVGFyZ2V0KHRoaXMubm9kZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZG9BbmltOiBmdW5jdGlvbiBkb0FuaW0oKSB7XG4gICAgICAgIHZhciBzY2FsZUFuaW0gPSBjYy5zY2FsZVRvKDEsIHRoaXMuc2NhbGUpO1xuICAgICAgICB2YXIgcm90YXRlQW5pbSA9IGNjLnJvdGF0ZUJ5KDIsIDM2MCk7XG4gICAgICAgIHZhciBhbmltID0gY2Muc3Bhd24oc2NhbGVBbmltLCByb3RhdGVBbmltKTtcblxuICAgICAgICB0aGlzLm5vZGUucnVuQWN0aW9uKGFuaW0pO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShkdCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT0gVG91Y2hTdGF0dXMuRU5ERUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKGR0KTtcbiAgICB9LFxuXG4gICAgX3VwZGF0ZVBvc2l0aW9uOiBmdW5jdGlvbiBfdXBkYXRlUG9zaXRpb24oZHQpIHtcbiAgICAgICAgdGhpcy5ub2RlLnggKz0gZHQgKiB0aGlzLmN1cnJlbnRIb3JTcGVlZDtcblxuICAgICAgICB0aGlzLmN1cnJlbnRWZXJTcGVlZCAtPSBkdCAqIHRoaXMuZ3Jhdml0eTtcbiAgICAgICAgdGhpcy5jaGFuZ2VCYWxsU3RhdHVzKHRoaXMuY3VycmVudFZlclNwZWVkKTtcbiAgICAgICAgdGhpcy5ub2RlLnkgKz0gZHQgKiB0aGlzLmN1cnJlbnRWZXJTcGVlZDtcblxuICAgICAgICBpZiAodGhpcy5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzLkRPV04gJiYgdGhpcy5ub2RlLnkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUuc3RvcEFsbEFjdGlvbnMoKTtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmm7TmlLnnr67nkIPnirbmgIFcbiAgICBjaGFuZ2VCYWxsU3RhdHVzOiBmdW5jdGlvbiBjaGFuZ2VCYWxsU3RhdHVzKHNwZWVkKSB7XG4gICAgICAgIGlmIChzcGVlZCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1cy5OT05FO1xuICAgICAgICAgICAgdGhpcy5nYW1lLnN3aXRjaENvbGxpc2lvbihmYWxzZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3BlZWQgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzLkZMWTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5zd2l0Y2hDb2xsaXNpb24oZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1cy5ET1dOO1xuICAgICAgICAgICAgdGhpcy5nYW1lLnN3aXRjaENvbGxpc2lvbih0cnVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkNvbGxpc2lvbkVudGVyOiBmdW5jdGlvbiBvbkNvbGxpc2lvbkVudGVyKG90aGVyLCBzZWxmKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCflj5HnlJ/kuobnorDmkp4nICsgb3RoZXIpO1xuXG4gICAgICAgIHZhciBib3ggPSBvdGhlci5ub2RlLmdldENvbXBvbmVudCgnQ29sbGlzaW9uQm94Jyk7O1xuICAgICAgICB2YXIgbGVmdCA9IGJveC5nZXRMZWZ0KCk7XG4gICAgICAgIHZhciByaWdodCA9IGJveC5nZXRSaWdodCgpO1xuXG4gICAgICAgIGlmIChvdGhlci5ub2RlLm5hbWUgPT09ICdyaWdodCcgJiYgdGhpcy5ub2RlLnggPCBsZWZ0IHx8IG90aGVyLm5vZGUubmFtZSA9PT0gJ2xlZnQnICYmIHRoaXMubm9kZS54ID4gcmlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhvclNwZWVkID0gdGhpcy5jdXJyZW50SG9yU3BlZWQgKiAtMSAqIDEuNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvdGhlci5ub2RlLm5hbWUgPT09ICdyaWdodCcgJiYgdGhpcy5ub2RlLnggPiByaWdodCB8fCBvdGhlci5ub2RlLm5hbWUgPT09ICdsZWZ0JyAmJiB0aGlzLm5vZGUueCA8IGxlZnQpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEhvclNwZWVkID0gdGhpcy5jdXJyZW50SG9yU3BlZWQgKiAxLjU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50VmVyU3BlZWQgPSB0aGlzLmN1cnJlbnRWZXJTcGVlZCAqIC0xICogMS4yO1xuXG4gICAgICAgIC8vIOeisOaSnuezu+e7n+S8muiuoeeul+WHuueisOaSnue7hOS7tuWcqOS4lueVjOWdkOagh+ezu+S4i+eahOebuOWFs+eahOWAvO+8jOW5tuaUvuWIsCB3b3JsZCDov5nkuKrlsZ7mgKfph4zpnaJcbiAgICAgICAgdmFyIHdvcmxkID0gc2VsZi53b3JsZDtcblxuICAgICAgICAvLyDnorDmkp7nu4Tku7bnmoQgYWFiYiDnorDmkp7moYZcbiAgICAgICAgdmFyIGFhYmIgPSB3b3JsZC5hYWJiO1xuXG4gICAgICAgIC8vIOS4iuS4gOasoeiuoeeul+eahOeisOaSnue7hOS7tueahCBhYWJiIOeisOaSnuahhlxuICAgICAgICB2YXIgcHJlQWFiYiA9IHdvcmxkLnByZUFhYmI7XG5cbiAgICAgICAgLy8g56Kw5pKe5qGG55qE5LiW55WM55+p6Zi1XG4gICAgICAgIHZhciB0ID0gd29ybGQudHJhbnNmb3JtO1xuXG4gICAgICAgIC8vIOS7peS4i+WxnuaAp+S4uuWchuW9oueisOaSnue7hOS7tueJueacieWxnuaAp1xuICAgICAgICB2YXIgciA9IHdvcmxkLnJhZGl1cztcbiAgICAgICAgdmFyIHAgPSB3b3JsZC5wb3NpdGlvbjtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge31cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYWM5ZmRGeXA0OUdWS0hVZ2s5L0ZWbGknLCAnQmFza2V0Jyk7XG4vLyBzY3JpcHQvQmFza2V0LmpzXG5cbmNjLkNsYXNzKHtcbiAgICBcImV4dGVuZHNcIjogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge30sXG5cbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KGdhbWUpIHtcbiAgICAgICAgdmFyIG1vdmVSaWdodCA9IGNjLm1vdmVCeSgzLCBjYy5wKDIwMCwgMCkpO1xuICAgICAgICB2YXIgbW92ZUxlZnQgPSBjYy5tb3ZlQnkoMywgY2MucCgtMjAwLCAwKSk7XG5cbiAgICAgICAgdmFyIHJlcGVhdCA9IGNjLnJlcGVhdEZvcmV2ZXIoY2Muc2VxdWVuY2UobW92ZVJpZ2h0LCBtb3ZlTGVmdCwgbW92ZUxlZnQsIG1vdmVSaWdodCkpO1xuICAgICAgICB0aGlzLm5vZGUucnVuQWN0aW9uKHJlcGVhdCk7XG4gICAgfVxuXG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJzdjNGM2UndpNHRJQzRVTUJnWUw0MjMxJywgJ0NvbGxpc2lvbkJveCcpO1xuLy8gc2NyaXB0L0NvbGxpc2lvbkJveC5qc1xuXG5jYy5DbGFzcyh7XG4gICAgXCJleHRlbmRzXCI6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHt9LFxuXG4gICAgZ2V0TGVmdDogZnVuY3Rpb24gZ2V0TGVmdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS54IC0gdGhpcy5ub2RlLndpZHRoIC8gMjtcbiAgICB9LFxuXG4gICAgZ2V0UmlnaHQ6IGZ1bmN0aW9uIGdldFJpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLnggKyB0aGlzLm5vZGUud2lkdGggLyAyO1xuICAgIH1cblxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICc3YjA2NkgzNkt4Q1ZyMFNORFprYTkxLycsICdHYW1lTWFuYWdlcicpO1xuLy8gc2NyaXB0L0dhbWVNYW5hZ2VyLmpzXG5cbnZhciBCYWxsID0gcmVxdWlyZSgnQmFsbCcpO1xudmFyIGZsdXNoID0gcmVxdWlyZSgnZmx1c2gnKTtcbnZhciBCYXNrZXQgPSByZXF1aXJlKCdCYXNrZXQnKTtcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBiYWxsOiBCYWxsLFxuICAgICAgICBmbHVzaEJ0bjogZmx1c2gsXG4gICAgICAgIGJhc2tldDogQmFza2V0XG4gICAgfSxcblxuICAgIG9uTG9hZDogZnVuY3Rpb24gb25Mb2FkKCkge1xuICAgICAgICB0aGlzLmNvbGxpc2lvbk1hbmFnZXIgPSBjYy5kaXJlY3Rvci5nZXRDb2xsaXNpb25NYW5hZ2VyKCk7XG4gICAgICAgIHRoaXMuYmFsbC5pbml0KHRoaXMpO1xuICAgICAgICB0aGlzLmZsdXNoQnRuLmluaXQodGhpcyk7XG4gICAgICAgIHRoaXMuYmFza2V0LmluaXQodGhpcyk7XG5cbiAgICAgICAgLy90aGlzLmNvbGxpc2lvbk1hbmFnZXIuZW5hYmxlZERlYnVnRHJhdyA9IHRydWUvLyDlvIDlkK9kZWJ1Z+e7mOWItlxuICAgIH0sXG5cbiAgICBzd2l0Y2hDb2xsaXNpb246IGZ1bmN0aW9uIHN3aXRjaENvbGxpc2lvbihmbGFnKSB7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uTWFuYWdlci5lbmFibGVkID0gZmxhZztcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoZHQpIHt9XG59KTtcblxuY2MuX1JGcG9wKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5jYy5fUkZwdXNoKG1vZHVsZSwgJ2E0ZjY5dTNNcFZMS3BuMXVvRTBkYXkvJywgJ2ZsdXNoJyk7XG4vLyBzY3JpcHQvZmx1c2guanNcblxuY2MuQ2xhc3Moe1xuICAgICdleHRlbmRzJzogY2MuQ29tcG9uZW50LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChnYW1lKSB7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgfSxcblxuICAgIHJlbG9hZDogZnVuY3Rpb24gcmVsb2FkKCkge1xuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoJ0dhbWUnKTtcbiAgICB9XG5cbn0pO1xuXG5jYy5fUkZwb3AoKTsiXX0=
