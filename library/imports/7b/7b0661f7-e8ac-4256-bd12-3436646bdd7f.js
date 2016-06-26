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