cc.Class({
    extends: cc.Component,

    init: function(game){
        this.game = game;
    },

    reload: function(){
        cc.director.loadScene('Game');
    },

    
});
