cc.Class({
    extends: cc.Component,

    properties: {
    },

    getLeft: function(){
        return this.node.x - this.node.width/2;
    },

    getRight: function(){
        return this.node.x + this.node.width/2;
    },

});
