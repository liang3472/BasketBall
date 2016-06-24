var TouchStatus = cc.Enum({
    BEGEN:  -1, // 按下
    ENDED:  -1, // 结束
    CANCEL: -1  // 取消
});

var BallStatus = cc.Enum({
    FLY:  -1, // 飞
    DOWN: -1, // 落
    NONE: -1  // 静止
});

cc.Class({
    extends: cc.Component,

    properties: {
        emitSpeed: 0,
        gravity: 0,
        scale: 0,
        startPosition: cc.Vec2
    },

    init: function(game){
        this.game = game;
        this.reset();
        this.registerInput();
    },

    registerInput: function(){
        this.listener = {
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: function(touch, event) {
                this.status = TouchStatus.BEGEN;
                return true;
            }.bind(this),

            onTouchMoved: function (touch, event) {
            }.bind(this),

            onTouchEnded: function (touch, event) {

                this.status = TouchStatus.ENDED;
                this.enableInput(false);
                this.currentVerSpeed = this.emitSpeed;
                this.target =  this.node.convertToNodeSpaceAR(touch.getLocation());
                cc.log('touch x='+this.target.x+', y='+this.target.y);
                this.currentHorSpeed = this.target.x;

                this.doAnim();
            }.bind(this),

            onTouchCancelled: function (touch, event) {
                this.status = TouchStatus.CANCEL;
            }.bind(this)
        },
        cc.eventManager.addListener(this.listener, this.node);
    },

    enableInput: function (enable) {
        if (enable) {
            cc.eventManager.resumeTarget(this.node);
        } else {
            cc.eventManager.pauseTarget(this.node);
        }
    },

    doAnim: function(){
        var scaleAnim = cc.scaleTo(1, this.scale);
        var rotateAnim = cc.rotateBy(2, 360);
        var anim = cc.spawn(scaleAnim,rotateAnim);
        
        this.node.runAction(anim);
    },

    update: function (dt) {
        if(this.status != TouchStatus.ENDED){
            return;
        }

        this._updatePosition(dt);
    },

    _updatePosition: function(dt){
        this.node.x += dt * this.currentHorSpeed;
         
        this.currentVerSpeed -= dt * this.gravity;
        this.changeBallStatus(this.currentVerSpeed);
        this.node.y += dt * this.currentVerSpeed;

        if(this.ballStatus === BallStatus.DOWN && this.node.y < 0){
            this.node.stopAllActions();
            this.reset();
            return;
        }
    },

    // 更改篮球状态
    changeBallStatus: function(speed){
        if(speed === 0){
            this.ballStatus = BallStatus.NONE;
            this.game.switchCollision(false);
        } else if(speed > 0) {
            this.ballStatus = BallStatus.FLY;
            this.game.switchCollision(false);
        } else {
            this.ballStatus = BallStatus.DOWN;
            this.game.switchCollision(true);
        }
    },

    onCollisionEnter: function (other, self) {
        console.log('发生了碰撞' + other);

        var box = other.node.getComponent('CollisionBox');;
        var left = box.getLeft();
        var right = box.getRight();

        if((other.node.name === 'right' && this.node.x < left) || (other.node.name === 'left' && this.node.x > right)){
            this.currentHorSpeed = this.currentHorSpeed * -1 * 1.5;
        }

        if((other.node.name === 'right' && this.node.x > right) || (other.node.name === 'left' && this.node.x < left)){
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

    reset: function(){
    },
});