import 'phaser';

export default class CountdownObject extends Phaser.Group {

    public onCountdownEnd: Phaser.Signal;

    private startPosition: number;
    private countdown: Phaser.BitmapText;
    private tween: Phaser.Tween;

    constructor(game: Phaser.Game,
                x: number,
                y: number,
                private countdownPosition: number = 3,
                private beginSize: number = 96,
                private endSize: number = 12
    ) {
        super(game);

        this.x = x;
        this.y = y;

        this.onCountdownEnd = new Phaser.Signal();

        this.beginSize = beginSize || 96;
        this.endSize = endSize || 12;
        this.startPosition = this.countdownPosition;

        // Draw Countdown
        this.countdown = this.game.add.bitmapText(0, 0, "fnt_va", String(this.countdownPosition), this.beginSize, this);
        this.countdown.anchor.setTo(0.5);
        this.add(this.countdown);

        // Countdown Tween
        this.tween = this.game.add.tween(this.countdown);
        this.tween.to({fontSize: this.endSize, alpha: 0}, 1000, Phaser.Easing.Linear.None);
        this.tween.onComplete.add(this.tweenEnd, this);
    }

    start() {
        this.countdownPosition = this.startPosition;
        this.tween.start();
    }

    stop() {
        this.tween.stop();
    }

    private tweenEnd() {
        this.countdownPosition--;

        if (this.countdownPosition > -1) {
            // Countdown still running
            this.countdown.setText(this.countdownPosition > 0 ? String(this.countdownPosition) : "START");
            this.countdown.alpha = 1;
            this.countdown.fontSize = this.beginSize;
            this.tween.start();
        } else {
            // Countdown finished
            this.onCountdownEnd.dispatch();
        }
    }
}