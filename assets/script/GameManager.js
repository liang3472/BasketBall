var Ball = require('Ball');
var flush = require('flush');
var Basket = require('Basket');

cc.Class({
    extends: cc.Component,

    properties: {
        ball: Ball,
        flushBtn: flush,
        basket: Basket
    },

    onLoad: function () {
        this.collisionManager = cc.director.getCollisionManager();
        this.ball.init(this);
        this.flushBtn.init(this);
        this.basket.init(this);

        //this.collisionManager.enabledDebugDraw = true// 开启debug绘制
    },

    switchCollision: function(flag){
        this.collisionManager.enabled = flag;
    },

    update: function (dt) {

    },
});
