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