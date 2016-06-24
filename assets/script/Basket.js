cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    init: function (game) {
        var moveRight = cc.moveBy(3, cc.p(200, 0));
        var moveLeft = cc.moveBy(3, cc.p(-200, 0));

        var repeat = cc.repeatForever(cc.sequence(moveRight, moveLeft, moveLeft, moveRight));
        this.node.runAction(repeat);
    },

});
