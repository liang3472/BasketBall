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