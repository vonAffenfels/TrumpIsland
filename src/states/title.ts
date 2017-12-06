import * as Assets from '../assets';
import App from "../app";
import CountdownObject from "../objects/countdown";
import Oceanlife from "../objects/oceanlife";
import { Config } from "../config";
import { GameSpeed, Gamestage, StagePosition } from "../objects/gamestage";

export default class Title extends Phaser.State {


    private WATER_MISS_RAISE: number = 13;
    private countdown: CountdownObject;
    private trumpHitSound: Phaser.Sound = null;
    private fishMissSound: Phaser.Sound = null;
    private score: number = 0;
    private timeLeft: number = 0;
    private totalMisses: number = 0;
    private gameStarted: boolean = false;
    private timer: Phaser.Timer;
    private speedToPoints: Map<GameSpeed, number>;

    // ----------------
    // Sprites
    // ----------------

    private island: Phaser.Sprite = null;
    private trump: Phaser.Sprite = null;
    private buttonStart: Phaser.Sprite = null;
    private buttonRestart: Phaser.Sprite = null;

    // ----------------
    // Groups
    // ----------------

    private waterBackgroundGroup: Phaser.Group;
    private waterFrontGroup: Phaser.Group;
    private oceanGroup: Oceanlife;
    private gamestage: Gamestage;
    private uiElements: Phaser.Group;

    // ----------------
    // Text
    // ----------------

    private achievedScoreText: Phaser.BitmapText;
    private scoreText: Phaser.BitmapText;
    private timerText: Phaser.BitmapText;
    private highscoreText: Phaser.BitmapText;
    private finishText: Phaser.BitmapText;
    private newHighscoreText: Phaser.BitmapText;
    private title: Phaser.BitmapText = null;


    private get app(): App {
        return this.game as App;
    }


    // ----------------
    // Framwork Methods
    // ----------------

    public create(): void {
        this.speedToPoints = new Map<GameSpeed, number>();
        this.speedToPoints.set(GameSpeed.SLOW, Config.slowPoint);
        this.speedToPoints.set(GameSpeed.MEDIUM, Config.mediumPoint);
        this.speedToPoints.set(GameSpeed.HIGH, Config.fastPoint);

        // this.backgroundTemplateSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBackgroundTemplate.getName());
        // this.backgroundTemplateSprite.anchor.setTo(0.5);

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.createCountdown();
        this.createHighscoreText();
        this.createIsland();
        this.createWaterBackgroundGroup();
        this.createTitle();
        this.createTrump();
        this.createOceanGroup();
        this.createWaterFrontGroup();
        this.createGamestage();

        this.createUiGroup();
        this.createStartButton();
        this.createRestartButton();

        // this.game.sound.play(Assets.Audio.AudioSoundtrack.getName(), 0.2, true);

        // this.backgroundTemplateSprite.inputEnabled = true;
        // this.backgroundTemplateSprite.events.onInputDown.add(() => {
        //     this.trumpHitSound.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds));
        // });

        this.game.camera.flash(0x000000, 1000);
    }

    public update() {
        this.showTimeLeft();

        this.updateScore();
        if (this.gamestage) {
            this.gamestage.update();
        }
    }

    // public render() {
    //     if (this.gamestage) {
    //         this.gamestage.render();
    //     }
    // }

    // ----------------
    // Internal Methods
    // ----------------

    private createGamestage(): void {
        this.gamestage = new Gamestage(this.game);
        this.gamestage.hitSignal.add((position: StagePosition) => {
            this.doTrumpHit(position);
        });
        this.gamestage.scoreHitSignal.add((speed: GameSpeed) => {
            this.scoreHit(speed);
        });
        this.gamestage.fishMissedSignal.add(() => {
            this.missedFish();
        });
        this.gamestage.visible = false;
    }

    private createWaterBackgroundGroup(): void {
        this.waterBackgroundGroup = this.game.add.group();
    }

    private createOceanGroup(): void {
        this.oceanGroup = new Oceanlife(this.game);
    }

    private createWaterFrontGroup(): void {
        this.waterFrontGroup = this.game.add.group();
    }

    private createRestartButton() {
        let yPos: number = this.game.world.height - this.game.world.height / 4;
        this.buttonRestart = this.game.add.sprite(this.game.world.centerX, yPos, Assets.Images.ImagesButtonNeustart.getName(), null, this.uiElements);
        this.buttonRestart.anchor.setTo(0.5);
        this.buttonRestart.scale.setTo(2);
        this.buttonRestart.visible = false;
        this.buttonRestart.events.onInputDown.add(() => {
            this.startCountdown();
        });
    }

    private createStartButton() {
        let yPos: number = this.game.world.height - this.game.world.height / 4;

        this.buttonStart = this.game.add.sprite(this.game.world.centerX, yPos, Assets.Images.ImagesButtonStart.getName(), null, this.uiElements);
        this.buttonStart.anchor.setTo(0.5);
        this.buttonStart.scale.setTo(2);
        this.buttonStart.inputEnabled = true;
        this.buttonStart.events.onInputDown.add(() => {
            this.startCountdown();
        });
    }

    private createScoreText() {
        if (!this.scoreText) {
            this.scoreText = this.game.add.bitmapText(20, 20, "fnt_va", "Score: " + this.score, 35);
        }

        this.scoreText.visible = true;
    }

    private createTimeText() {
        if (!this.timerText) {
            this.timerText = this.game.add.bitmapText(this.game.world.width - 20, 20, "fnt_va", "99:99", 35);
            this.timerText.anchor.setTo(1, 0);
        }

        this.timerText.visible = true;
    }

    private createHighscoreText() {
        if (!this.highscoreText) {
            this.highscoreText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY, "fnt_va", "HIGHSCORE: " + this.app.saveService.highscore, 60);
            this.highscoreText.anchor.setTo(0.5);
        }

        this.highscoreText.visible = true;
    }

    private createTitle() {
        if (!this.title) {
            this.title = this.game.add.bitmapText(this.game.world.centerX, 40, Assets.BitmapFonts.FontsFntVa.getName(), 'Trump Island!', 50);
            this.title.anchor.setTo(0.5);
        }

        this.title.visible = true;
    }


    private createIsland() {
        if (!this.island) {
            this.island = this.game.add.sprite(this.game.world.centerX, 400, Assets.Images.ImagesInsel.getName());
            this.island.anchor.set(0.5);
        }

        this.island.visible = true;
    }

    private createTrump(): void {
        this.trumpHitSound = this.game.add.audio(Assets.Audio.AudioPaddel.getName());
        this.fishMissSound = this.game.add.audio(Assets.Audio.AudioRatzFail.getName());

        this.trump = this.game.add.sprite(this.game.world.centerX, 400, Assets.Spritesheets.SpritesheetsPruegelTrump3805091.getName());
        this.trump.anchor.set(0.5);
        this.trump.animations.add("hitCenter", [3, 1, 3], 10);
        this.trump.animations.add("hitLeft", [3, 0, 3], 10);
        this.trump.animations.add("hitRight", [3, 2, 3], 10);
        this.trump.frame = 3;
    }


    private startCountdown(): void {
        if (this.finishText) {
            this.finishText.visible = false;
        }
        if (this.newHighscoreText) {
            this.newHighscoreText.visible = false;
        }
        if (this.achievedScoreText) {
            this.achievedScoreText.visible = false;
        }
        this.highscoreText.visible = false;
        this.countdown.visible = true;

        this.timeLeft = Config.gameTime;
        //
        // this.timerText.visible = true;
        this.uiElements.visible = false;
        // this.buttonStart.visible = false;
        // this.buttonRestart.visible = false;

        this.countdown.start();
    }

    private createCountdown(): void {
        // Countdown
        this.countdown = new CountdownObject(this.game, this.game.world.centerX, this.game.world.centerY, 3, 164);
        this.countdown.onCountdownEnd.add(() => {
            this.startGame();
        }, this);
        this.countdown.visible = false;
    }

    private startGame(): void {
        this.title.visible = false;

        if (this.finishText) {
            this.finishText.visible = false;
        }

        this.highscoreText.visible = false;

        this.uiElements.visible = false;

        this.waterBackgroundGroup.position.y = 0;
        this.waterFrontGroup.position.y = 0;

        this.createScoreText();
        this.createTimeText();
        this.createWaterBackground();
        this.oceanGroup.fill();
        this.createWaterFront();
        this.gamestage.visible = true;

        this.score = 0;
        this.totalMisses = 0;
        this.gameStarted = true;
        this.gamestage.start(Config.gameTime);

        this.timer = this.game.time.create(false);
        this.timer.loop(Phaser.Timer.SECOND, () => {
            this.timeLeft--;
            this.handleTime();
        }, this);

        this.timer.start();
    }

    private handleTime(): void {
        if (this.timeLeft <= 0) {
            this.stopGame();
        }
    }

    private stopGame(): void {
        this.timeLeft = 0;
        this.createFinishText();

        this.highscoreText.text = String(this.score);
        this.highscoreText.visible = true;

        // Check Score agains Highscore
        if (this.score > this.app.saveService.highscore) {
            this.app.saveService.save(this.score);
            this.createNewHighScoreText();
        }
        else {
            this.createAchievedScoreText();
        }

        this.cleanUp();

        this.uiElements.visible = true;
        this.buttonRestart.visible = true;

        this.gameStarted = false;

        this.timer.stop(true);
        this.timer.destroy();
        this.timer = null;
    }

    private createFinishText(): void {
        if (!this.finishText) {
            this.finishText = this.game.add.bitmapText(this.game.world.centerX, 10, "fnt_va", "ENDE", 148);
            this.finishText.anchor.setTo(0.5, 0);
        }

        this.finishText.visible = true;
    }

    private createNewHighScoreText(): void {
        if (!this.newHighscoreText) {
            this.newHighscoreText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY - 70, "fnt_va", "NEUER HIGHSCORE", 64);
            this.newHighscoreText.anchor.setTo(0.5);
        }

        this.newHighscoreText.visible = true;
    }

    private createAchievedScoreText(): void {
        if (!this.achievedScoreText) {
            this.achievedScoreText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY - 70, "fnt_va", "ERREICHTE PUNKTE", 64);
            this.achievedScoreText.anchor.setTo(0.5);
        }

        this.achievedScoreText.visible = true;
    }

    private cleanUp(): void {
        this.timerText.visible = false;
        this.scoreText.visible = false;
        this.waterBackgroundGroup.visible = false;
        this.waterFrontGroup.visible = false;
        this.oceanGroup.clear();

        this.gamestage.stop();
        this.gamestage.visible = false;
    }

    private showTimeLeft(): void {
        let min: number = Math.floor(this.timeLeft / 60);
        let sec = this.timeLeft % 60;

        if (this.timerText) {
            this.timerText.text = min.toString().padStart(2, "0") + ":" + sec.toString().padStart(2, "0");
        }
    }

    private createWaterBackground(): void {
        this.waterBackgroundGroup.removeAll();
        this.waterBackgroundGroup.visible = true;

        let waterBackground = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 150, Assets.Spritesheets.SpritesheetsWasserNogap75015001.getName(), null, this.waterBackgroundGroup);
        waterBackground.anchor.setTo(0.5);
        waterBackground.animations.add('waves');
        waterBackground.animations.play('waves', 3, true);
    }

    private createWaterFront(): void {
        this.waterFrontGroup.removeAll();
        this.waterFrontGroup.visible = true;

        let waterBackground = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 130, Assets.Spritesheets.SpritesheetsWasserTransparentNogap75015001.getName(), null, this.waterFrontGroup);
        waterBackground.anchor.setTo(0.5);
        waterBackground.frame = 2;
        waterBackground.animations.add('waves', [1, 0, 2]);
        waterBackground.animations.play('waves', 3, true);
    }

    private doTrumpHit(position: StagePosition) {
        if (this.trump && this.gameStarted) {
            let hitAni: string;

            switch (position) {
                case StagePosition.LEFT: {
                    hitAni = "hitLeft";
                    break;
                }
                case StagePosition.CENTER: {
                    hitAni = "hitCenter";
                    break;
                }
                case StagePosition.RIGHT: {
                    hitAni = "hitRight";
                    break;
                }

            }

            this.trump.animations.play(hitAni);
            this.trumpHitSound.play();
        }
    }

    private createUiGroup(): void {
        this.uiElements = this.game.add.group();
    }

    private scoreHit(speed: GameSpeed): void {
        this.score += this.speedToPoints.get(speed) * Config.scoreGain;
    }

    private updateScore() {
        if (this.gameStarted) {
            this.scoreText.text = "SCORE: " + this.score;
        }
    }

    private missedFish() {
        this.totalMisses++;
        this.fishMissSound.play();
        this.raiseWater();

        if (this.totalMisses === Config.maxMisses) {
            this.stopGame();
        }
    }

    private raiseWater() {
        this.waterBackgroundGroup.position.y -= this.WATER_MISS_RAISE;
        this.waterFrontGroup.position.y -= this.WATER_MISS_RAISE;
    }
}
