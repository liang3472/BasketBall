"use strict";
cc._RFpush(module, 'a4f69u3MpVLKpn1uoE0day/', 'flush');
// script/flush.js

cc.Class({
    'extends': cc.Component,

    init: function init(game) {
        this.game = game;
    },

    reload: function reload() {
        cc.director.loadScene('Game');
    }

});

cc._RFpop();