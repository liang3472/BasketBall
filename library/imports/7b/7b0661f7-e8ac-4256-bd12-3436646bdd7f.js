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