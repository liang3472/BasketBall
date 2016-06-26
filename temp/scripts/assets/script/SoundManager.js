"use strict";
cc._RFpush(module, '3495eBx+i1PlrOKcbTaqUD6', 'SoundManager');
// script/SoundManager.js

cc.Class({
    "extends": cc.Component,

    properties: {
        toggleAudio: true,

        scoreAudio: {
            "default": null,
            url: cc.AudioClip
        },

        ballInAudio: {
            "default": null,
            url: cc.AudioClip
        },

        hitBoardInAudio: {
            "default": null,
            url: cc.AudioClip
        },

        hitBoardAudio: {
            "default": null,
            url: cc.AudioClip
        },

        flyAudio: {
            "default": null,
            url: cc.AudioClip
        }
    },

    init: function init(game) {},

    // 播放得分音效
    playScoreSound: function playScoreSound() {
        this.playSound(this.scoreAudio);
    },

    // 播放直接进球音效
    playBallInSound: function playBallInSound() {
        this.playSound(this.ballInAudio);
    },

    // 播放打框音效
    playHitBoardSound: function playHitBoardSound() {
        this.playSound(this.hitBoardAudio);
    },

    // 播放打框进球音效
    playHitBoardInSound: function playHitBoardInSound() {
        this.playSound(this.hitBoardInAudio);
    },

    // 播放投掷音效
    playFlySound: function playFlySound() {
        this.playSound(this.flyAudio);
    },

    // 播放音效(不循环)
    playSound: function playSound(sound) {
        if (this.toggleAudio) {
            cc.audioEngine.playEffect(sound, false);
        }
    }
});

cc._RFpop();