cc.Class({
    'extends': cc.Component,

    init: function init(game) {
        this.game = game;
    },

    reload: function reload() {
        cc.director.loadScene('Game');
    }

});