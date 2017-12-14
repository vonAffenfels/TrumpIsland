import * as Assets from '../assets';
import App from "../app";
import CountdownObject from "../objects/countdown";
import { Config } from "../config";
import { GameSpeed, Gamestage } from "../objects/gamestage";
import PMath = Phaser.Math;

const TRUMP_START_FRAME: number = 1;
const TRUMP_HIT_FRAME: number = 0;
const WATER_MISS_RAISE: number = 13;

export default class Title extends Phaser.State {


    private countdown: CountdownObject;
    private trumpHitSound: Phaser.Sound = null;
    private fishMissSound: Phaser.Sound = null;
    private score: number = 0;
    private timeLeft: number = 0;
    private totalMisses: number = 0;
    private shieldHitCount: number = 0;
    private gameStarted: boolean = false;
    private speedToPoints: Map<GameSpeed, number>;
    private increaseScores: Array<number>;
    private nextIncrease: number;
    private shieldActive: boolean = false;

    // ----------------
    // Sprites
    // ----------------

    private island: Phaser.Sprite = null;
    private trump: Phaser.Sprite = null;
    private trumpPaddel: Phaser.Sprite = null;
    private trumpShield: Phaser.Sprite = null;
    private buttonStart: Phaser.Sprite = null;
    private buttonRestart: Phaser.Sprite = null;

    // ----------------
    // Groups
    // ----------------

    private waterBackgroundGroup: Phaser.Group;
    private waterFrontGroup: Phaser.Group;
    private gamestage: Gamestage;
    private uiElements: Phaser.Group;

    // ----------------
    // Text
    // ----------------

    private achievedScoreText: Phaser.BitmapText;
    private scoreText: Phaser.BitmapText;
    private timerText: Phaser.BitmapText;
    private highscoreText: Phaser.BitmapText;
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
        this.speedToPoints.set(GameSpeed.SLOW, Config.slowPoint * Config.scoreGain);
        this.speedToPoints.set(GameSpeed.MEDIUM, Config.slowPoint * Config.scoreGain);
        this.speedToPoints.set(GameSpeed.FAST, Config.mediumPoint * Config.scoreGain);
        this.speedToPoints.set(GameSpeed.VERYFAST, Config.mediumPoint * Config.scoreGain);
        this.speedToPoints.set(GameSpeed.LIGHTSPEED, Config.fastPoint * Config.scoreGain);

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.createCountdown();
        this.createHighscoreText();
        this.createIsland();
        this.createWaterBackgroundGroup();
        this.createTitle();
        this.createTrump();
        this.createTrumpShield();
        this.createWaterFrontGroup();
        this.createGamestage();

        this.createUiGroup();
        this.createStartButton();
        this.createRestartButton();

        if (Config.musicOn) {
            this.game.sound.play(Assets.Audio.AudioSoundtrack.getName(), 0.2, true);
        }

        this.game.camera.flash(0x000000, 1000);
    }

    public update() {
        this.showTimeLeft();

        this.updateScore();
        if (this.gamestage) {
            this.gamestage.update();
        }

        // if (this.trumpPaddel) {
        //     this.trumpPaddel.rotation = this.game.physics.arcade.angleToPointer(this.trumpPaddel);
        // }
    }

    public render() {
        if (this.gamestage) {
            this.gamestage.render();
        }
    }

    // ----------------
    // Internal Methods
    // ----------------

    private createGamestage(): void {
        this.gamestage = new Gamestage(this.game, this.speedToPoints, Config.hitBoxHeight);
        this.gamestage.hitSignal.add(() => {
            this.doTrumpHit();
        });
        this.gamestage.endSignal.add(() => {
            if (this.gameStarted) {
                this.stopGame();
            }
        });
        this.gamestage.powerUpSignal.add(() => {
            this.activateShield();
        });
        this.gamestage.scoreHitSignal.add((speed: GameSpeed) => {
            this.scoreHit(speed);
        });
        this.gamestage.fishMissedSignal.add((speed: GameSpeed) => {
            this.missedFish(speed);
        });
        this.gamestage.visible = false;
    }

    private createWaterBackgroundGroup(): void {
        this.waterBackgroundGroup = this.game.add.group();
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

        this.trump = this.game.add.sprite(this.game.world.centerX, 350, Assets.Spritesheets.SpritesheetsSpriteTrump3806061.getName());
        this.game.physics.arcade.enable(this.trump);
        this.trump.body.enable = true;
        this.trump.anchor.set(0.5);
        // this.trump.animations.add("hitCenter", [1, 0, 1], 30);
        this.trump.animations.add("sink", [3, 4, 5], 5, true);
        this.trump.frame = TRUMP_START_FRAME;

        this.trumpPaddel = this.game.add.sprite(this.game.world.centerX + 2, 323, Assets.Images.ImagesPaddel.getName());
        this.trumpPaddel.anchor.set(0.05);
        this.trumpPaddel.visible = false;

    }

    private createTrumpShield(): void {

        this.trumpShield = this.game.add.sprite(this.game.world.centerX, 350, Assets.Spritesheets.SpritesheetsSpriteTrump3806061.getName());
        this.trumpShield.anchor.set(0.5);
        this.trumpShield.frame = 2;
        this.trumpShield.visible = false;
    }


    private startCountdown(): void {
        if (this.title) {
            this.title.visible = false;
        }
        if (this.newHighscoreText) {
            this.newHighscoreText.visible = false;
        }
        if (this.achievedScoreText) {
            this.achievedScoreText.visible = false;
        }

        this.trump.reset(this.game.world.centerX, 350);

        this.trump.frame = TRUMP_START_FRAME;
        this.highscoreText.visible = false;
        this.countdown.visible = true;

        this.timeLeft = Config.gameTime;
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

        this.increaseScores = [...Config.increaseThresholds];
        this.nextIncrease = this.increaseScores.shift();

        this.highscoreText.visible = false;

        this.uiElements.visible = false;

        this.waterBackgroundGroup.position.y = 0;
        this.waterFrontGroup.position.y = 0;

        this.createScoreText();
        this.createWaterBackground();
        this.createWaterFront();
        this.gamestage.visible = true;

        this.score = 0;
        this.totalMisses = 0;
        this.gameStarted = true;
        this.gamestage.start(Config.fishesToSpawn);
    }

    private stopGame(): void {
        this.timeLeft = 0;

        if (this.totalMisses < Config.maxMisses) {
            this.title.text = "The island was saved :-(";
            this.title.visible = true;
        }

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
        this.scoreText.visible = false;
        this.waterBackgroundGroup.visible = false;
        this.waterFrontGroup.visible = false;
        this.trumpShield.visible = false;

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

        let waterBackground = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 180, Assets.Spritesheets.SpritesheetsWasserNogap75015001.getName(), null, this.waterBackgroundGroup);
        waterBackground.anchor.setTo(0.5);
        waterBackground.animations.add('waves');
        waterBackground.animations.play('waves', 3, true);
    }

    private createWaterFront(): void {
        this.waterFrontGroup.removeAll();
        this.waterFrontGroup.visible = true;

        let waterBackground = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 160, Assets.Spritesheets.SpritesheetsWasserTransparentNogap75015001.getName(), null, this.waterFrontGroup);
        waterBackground.anchor.setTo(0.5);
        waterBackground.frame = 2;
        waterBackground.animations.add('waves', [1, 0, 2]);
        waterBackground.animations.play('waves', 3, true);
    }

    private doTrumpHit() {
        if (this.trump && this.gameStarted) {
            this.trumpPaddel.visible = true;
            this.trumpPaddel.rotation = this.game.physics.arcade.angleToPointer(this.trumpPaddel);
            this.trump.frame = TRUMP_HIT_FRAME;

            let timer: Phaser.Timer = this.game.time.create(true);
            timer.add(Phaser.Timer.SECOND / 4, () => {
                this.trumpPaddel.visible = false;
                this.trump.frame = TRUMP_START_FRAME;
            });
            timer.start();
            this.trumpHitSound.play();
        }
    }

    private createUiGroup(): void {
        this.uiElements = this.game.add.group();
    }

    private scoreHit(speed: GameSpeed): void {
        this.score += this.speedToPoints.get(speed);
        this.doTrumpHit();

        if (this.score > this.nextIncrease) {
            this.nextIncrease = this.increaseScores.shift();
            this.gamestage.increaseSpeed();
        }
    }

    private updateScore() {
        if (this.gameStarted) {
            this.scoreText.text = "SCORE: " + this.score;
        }
    }

    private missedFish(speed: GameSpeed) {
        if (this.shieldHitCount === Config.shieldHitpoints) {
            this.shieldActive = false;
            this.trumpShield.visible = false;
        }

        if (!this.shieldActive) {
            this.totalMisses++;

            if (this.score > 0) {
                let penalty = Config.missPenalty * Config.scoreGain;
                this.score -= penalty;
                this.showScoreText("-" + penalty);
            }
            this.fishMissSound.play();
            this.raiseWater();

            if (this.totalMisses === Config.maxMisses) {
                this.sinkTrump();
            }
        }
        else {
            this.shieldHitCount++;
        }
    }

    private showScoreText(text: string) {

        // change w and h
        let textPosX = this.game.world.centerX;
        let textPosY = this.trump.y - 200;

        let txt = this.game.add.bitmapText(textPosX, textPosY, Assets.BitmapFonts.FontsFntVa.getName(), text, 40);
        txt.anchor.setTo(0.5, 1);
        let fallTween = this.game.add.tween(txt);
        fallTween.to({alpha: 0, y: textPosY - 100});
        fallTween.onComplete.add(() => {
            txt.destroy();
        });

        fallTween.start();
    }

    private raiseWater() {
        this.waterBackgroundGroup.position.y -= WATER_MISS_RAISE;
        this.waterFrontGroup.position.y -= WATER_MISS_RAISE;
    }

    private sinkTrump() {

        this.gameStarted = false;

        this.gamestage.stop();
        this.scoreText.visible = false;
        this.createSunkenText();

        this.trump.animations.play("sink");
        this.trump.body.gravity.y = 100;
        this.trump.checkWorldBounds = true;

        this.trump.events.onOutOfBounds.addOnce(() => {
            this.trump.animations.stop();
            this.stopGame();
            this.trump.checkWorldBounds = false;
            this.trump.body.gravity.y = 0;
        }, this);
    }

    private createSunkenText() {
        this.title.text = "An island sunken in the water!";
        this.title.visible = true;
    }

    private activateShield() {
        if (this.gameStarted) {
            this.trumpShield.visible = true;
            this.shieldActive = true;
            this.shieldHitCount = 0;
        }
    }
}
