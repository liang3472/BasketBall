cc.Class({
    "extends": cc.Component,

    properties: {
        scoreText: cc.Label
    },

    init: function init(game) {
        this.game = game;
        this._score = 0;
    },

    // 获取分数
    getScore: function getScore() {
        return _score;
    },

    // 设置分数
    setScore: function setScore(score) {
        this._score = score;
        this._updateScore();
    },

    // 增加分数
    addScore: function addScore() {
        this._score += 1;
        this._updateScore();

        //this.game.soundMng.playScoreSound();
    },

    // 更新分数
    _updateScore: function _updateScore() {
        this.scoreText.string = this._score;
    }

});