import 'phaser';
import * as Assets from '../assets';

export enum StagePosition {
    LEFT = 1,
    RIGHT,
    CENTER
}

export enum GameSpeed {
    SLOW = 1100,
    MEDIUM = 1000,
    FAST = 800,
    VERYFAST = 600,
    LIGHTSPEED = 400
}

export enum FishSpeed {
    SLOW = 700,
    MEDIUM = 900,
    HIGH = 1000
}

export class Gamestage extends Phaser.Group {

    // ---------------------
    // Public API
    // ---------------------

    public hitSignal: Phaser.Signal = new Phaser.Signal();
    public scoreHitSignal: Phaser.Signal = new Phaser.Signal();
    public fishMissedSignal: Phaser.Signal = new Phaser.Signal();

    // ---------------------
    // Gui
    // ---------------------

    private fishGroup: Phaser.Group;
    private hitboxGroup: Phaser.Group;
    private clickAreaGroup: Phaser.Group;
    private missedHitBox: Phaser.Sprite;

    private clickAreas: Map<StagePosition, Phaser.Sprite>;
    private hitboxMap: Map<StagePosition, Phaser.Sprite>;
    private fishMap: Map<StagePosition, Array<Phaser.Sprite>>;

    // ---------------------
    // Misc
    // ---------------------

    private currentSpeed: GameSpeed = GameSpeed.SLOW;
    private currentFishSpeed: FishSpeed = FishSpeed.SLOW;
    private speeds: Array<GameSpeed>;
    private fishSpeeds: Array<FishSpeed>;
    private timer: Phaser.Timer;
    private spawnTimer: Phaser.Timer;
    private timeLeft: number;
    private changeSpeedInterval: number;
    private positions: Array<StagePosition> = [
        StagePosition.LEFT, StagePosition.CENTER, StagePosition.RIGHT
    ];

    constructor(game: Phaser.Game, private speedToPoints: Map<GameSpeed, number>, private hitBoxHeight: number = 100) {
        super(game);

        this.clickAreas = new Map<StagePosition, Phaser.Sprite>();
        this.hitboxMap = new Map<StagePosition, Phaser.Sprite>();

        this.initStage();
    }

    public render() {
        if (this.hitboxMap) {
            for (let sprite of this.hitboxMap.values()) {
                this.game.debug.body(sprite);
            }
        }
        if (this.missedHitBox) {
            this.game.debug.body(this.missedHitBox);
        }
        if (this.fishMap) {
            for (let fishList of this.fishMap.values()) {
                fishList.forEach((fish) => {
                    this.game.debug.body(fish);
                });
            }
        }
    }

    public update() {
        if (this.fishMap && this.missedHitBox) {
            for (let position of this.fishMap.keys()) {
                let fishList: Array<Phaser.Sprite> = this.fishMap.get(position);

                fishList.forEach((fish) => {
                    this.game.physics.arcade.overlap(fish, this.missedHitBox, (fish, box) => {
                        this.missedFish(fish, position);
                    });
                });
            }

        }
    }

    public start(gameTime: number): void {
        this.hitboxGroup.visible = true;
        this.timeLeft = gameTime;

        this.fishMap = new Map<StagePosition, Array<Phaser.Sprite>>();

        this.speeds = [
            GameSpeed.SLOW,
            GameSpeed.MEDIUM,
            GameSpeed.FAST,
            GameSpeed.VERYFAST,
            GameSpeed.LIGHTSPEED
        ];

        this.fishSpeeds = [
            FishSpeed.SLOW,
            FishSpeed.MEDIUM,
            FishSpeed.MEDIUM,
            FishSpeed.HIGH,
            FishSpeed.HIGH
        ];

        this.changeSpeedInterval = Math.floor(gameTime / this.speeds.length);
        this.timer = this.game.time.create(false);
        this.timer.loop(Phaser.Timer.SECOND, () => {
            this.timeLeft--;
            this.handleTime();
        }, this);

        this.currentSpeed = this.speeds.shift();
        this.timer.start();
        this.updateSpawnTimer();

        this.fishGroup.visible = true;
    }

    public stop(): void {
        this.timer.stop(true);
        this.timer.destroy();
        this.timer = null;

        this.spawnTimer.stop(true);
        this.spawnTimer.destroy();
        this.spawnTimer = null;

        this.fishGroup.visible = false;
        this.fishGroup.removeAll(true);
        this.fishMap.clear();
    }

    private handleTime() {
        if (this.timeLeft % this.changeSpeedInterval === 0) {
            this.currentSpeed = this.speeds.shift();
            this.currentFishSpeed = this.fishSpeeds.shift();

            this.updateSpawnTimer();
        }
    }

    private initStage() {
        this.createFishLayer();
        this.createHitBoxes();
        this.createClickAreas();
    }


    private showScoreText(fish: Phaser.Sprite, text: string) {

        // change w and h
        let textPosX = fish.x - (fish.height / 2);
        let textPosY = fish.y + (fish.width / 2);

        let txt = this.game.add.bitmapText(textPosX, textPosY, Assets.BitmapFonts.FontsFntVa.getName(), text, 40);
        txt.anchor.setTo(0.5, 1);
        let fallTween = this.game.add.tween(txt);
        fallTween.to({alpha: 0, y: textPosY - 100});
        fallTween.onComplete.add(() => {
            txt.destroy();
        });

        fallTween.start();
    }

    private createFishLayer(): void {
        this.fishGroup = this.game.add.group(this);
        this.fishGroup.visible = false;
    }

    private createHitBoxes(): void {
        this.hitboxGroup = this.game.add.group(this);
        this.hitboxGroup.visible = false;

        let yPos: number = (this.game.world.height / 3) + 150;

        let boxWidth: number = this.game.world.width / 3;
        let boxHeight: number = this.hitBoxHeight;

        let leftBox: Phaser.Sprite = this.game.add.sprite(0, yPos, null, "bla", this.hitboxGroup);
        leftBox.width = boxWidth;
        leftBox.height = boxHeight;
        this.game.physics.arcade.enable(leftBox);
        leftBox.body.enable = true;
        this.hitboxMap.set(StagePosition.LEFT, leftBox);

        let centerBox: Phaser.Sprite = this.game.add.sprite(boxWidth, yPos, null, null, this.hitboxGroup);
        centerBox.width = boxWidth;
        centerBox.height = boxHeight;
        this.game.physics.arcade.enable(centerBox);
        centerBox.body.enable = true;
        this.hitboxMap.set(StagePosition.CENTER, centerBox);


        let rightBox: Phaser.Sprite = this.game.add.sprite(boxWidth * 2, yPos, null, null, this.hitboxGroup);
        rightBox.width = boxWidth;
        rightBox.height = boxHeight;
        this.game.physics.arcade.enable(rightBox);
        rightBox.body.enable = true;
        this.hitboxMap.set(StagePosition.RIGHT, rightBox);

        let missedBoxY = yPos - (Assets.Spritesheets.SpritesheetsFishBig230841.getFrameWidth());
        let missedBox: Phaser.Sprite = this.game.add.sprite(0, missedBoxY, null, null, this.hitboxGroup);
        missedBox.width = this.game.world.width;
        missedBox.height = 30;

        this.game.physics.arcade.enable(missedBox);

        missedBox.body.enable = true;
        this.missedHitBox = missedBox;

    }

    private createClickAreas(): void {
        this.clickAreaGroup = this.game.add.group(this);

        let yPos: number = this.game.world.height / 3;

        let boxWidth: number = this.game.world.width / 3;
        let boxHeight: number = this.game.world.height - yPos;

        let leftBox: Phaser.Sprite = this.game.add.sprite(0, yPos, null, null, this.clickAreaGroup);
        leftBox.width = boxWidth;
        leftBox.height = boxHeight;
        leftBox.inputEnabled = true;
        leftBox.events.onInputDown.add(() => {
            this.onStageClick(StagePosition.LEFT);
        });

        this.clickAreas.set(StagePosition.LEFT, leftBox);

        let centerBox: Phaser.Sprite = this.game.add.sprite(boxWidth, yPos, null, null, this.clickAreaGroup);
        centerBox.width = boxWidth;
        centerBox.height = boxHeight;
        centerBox.inputEnabled = true;
        centerBox.events.onInputDown.add(() => {
            this.onStageClick(StagePosition.CENTER);
        });

        this.clickAreas.set(StagePosition.CENTER, centerBox);

        let rightBox: Phaser.Sprite = this.game.add.sprite(boxWidth * 2, yPos, null, null, this.clickAreaGroup);
        rightBox.width = boxWidth;
        rightBox.height = boxHeight;
        rightBox.inputEnabled = true;
        rightBox.events.onInputDown.add(() => {
            this.onStageClick(StagePosition.RIGHT);
        });

        this.clickAreas.set(StagePosition.RIGHT, rightBox);

    }

    private checkHit(position: StagePosition): void {
        let hitBox: Phaser.Sprite = this.hitboxMap.get(position);
        let fishes: Array<Phaser.Sprite> = this.fishMap.get(position);

        if (!fishes) {
            return;
        }

        fishes.forEach((fish: Phaser.Sprite) => {
            this.game.physics.arcade.overlap(hitBox, fish, () => {
                this.showScoreText(fish, "+" + this.getScore(this.currentSpeed));
                this.clearFish(fishes, position);
                this.scoreHitSignal.dispatch(this.currentSpeed, this.currentFishSpeed);
            });
        });
    }

    private clearFish(fishes: Array<Phaser.Sprite>, position: StagePosition): void {
        let posList: Array<Phaser.Sprite> = this.fishMap.get(position);

        for (let i = 0; i < fishes.length; i++) {
            let fish = fishes[i];
            this.fishGroup.remove(fish, true, true);
            posList.splice(posList.indexOf(fish), 1);
        }

    }

    private onStageClick(position: StagePosition): void {
        this.checkHit(position);
        this.hitSignal.dispatch(position);
    }

    private spawnFish(currentSpeed: FishSpeed): void {
        if (!currentSpeed) {
            return;
        }

        let position: StagePosition = this.game.rnd.pick(this.positions);
        let index: number = this.positions.indexOf(position);
        let colWidth: number = this.game.world.width / 3;
        let colCenter: number = colWidth / 2;

        let startX: number = (colWidth * index) + colCenter;

        let fishW = Assets.Spritesheets.SpritesheetsFishBig230841.getFrameWidth();
        let fishH = Assets.Spritesheets.SpritesheetsFishBig230841.getFrameHeight();

        let fish: Phaser.Sprite = this.game.add.sprite(startX + (fishH / 2), this.game.world.height + fishW,
            Assets.Spritesheets.SpritesheetsFishBig230841.getName(),
            null,
            this.fishGroup);
        // fish.anchor.set(0.5, 0);
        fish.angle = 90;
        fish.animations.add('swim');
        fish.animations.play('swim', 5, true);

        this.game.physics.arcade.enable(fish);
        fish.body.enable = true;
        fish.body.setSize(fishH, fishW - 40, -fishH, 30);

        let target = this.hitboxMap.get(position);
        // this.game.physics.arcade.moveToObject(fish, target, currentSpeed.valueOf());

        if (this.fishMap.has(position) === false) {
            this.fishMap.set(position, []);
        }

        this.fishMap.get(position).push(fish);

        fish.body.velocity.y = -(currentSpeed.valueOf());
    }

    private updateSpawnTimer() {
        if (!this.spawnTimer) {
            this.spawnTimer = this.game.time.create(false);
        }

        this.spawnTimer.stop(true);
        this.spawnTimer.loop(this.currentSpeed, () => {
            if (this.timeLeft > 0) {
                this.spawnFish(this.currentFishSpeed);
            }
        });
        this.spawnTimer.start();
    }

    private missedFish(fish: Phaser.Sprite, position: StagePosition): void {
        this.clearFish([fish], position);
        this.fishMissedSignal.dispatch();
    }

    private getScore(currentSpeed: GameSpeed) {
        return this.speedToPoints.get(currentSpeed);
    }
}