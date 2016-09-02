cc.Class({
    'extends': cc.Component,

    properties: {
        maxTime: 0,
        timeToMove: 0
    },

    init: function init(game) {
        this.game = game;
        this.time = this.maxTime;
        this.isTimeToMove = false;
    },

    _callback: function _callback() {
        this.counting = false;
        this.game.basket.count.string = '00  00';
        this.game.stopMoveBasket();
        this.game.gameOver();
    },

    stopCounting: function stopCounting() {
        this.unschedule(this._callback);
        this.time = this.maxTime;
    },

    oneSchedule: function oneSchedule() {
        this.stopCounting();
        this.scheduleOnce(this._callback, this.maxTime);
        this.counting = true;
    },

    // called every frame
    update: function update(dt) {
        if (this.counting && this.time > 0) {
            this.time -= dt;
            if (this.maxTime - this.timeToMove >= this.time && !this.isTimeToMove) {
                this.isTimeToMove = true;
                this.game.startMoveBasket();
            }

            var text = this.time.toFixed(2);
            if (text.length === 4) {
                text = '0' + text;
            }
            this.game.basket.count.string = text.replace('.', '  ');
        }
    }
});