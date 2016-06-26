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