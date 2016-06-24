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