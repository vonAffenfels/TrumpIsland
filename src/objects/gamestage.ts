import 'phaser';
import * as Assets from '../assets';
import Math = Phaser.Math;

export enum GameSpeed {
    SLOW = 1000,
    MEDIUM = 900,
    FAST = 800,
    VERYFAST = 700,
    LIGHTSPEED = 600
}

export enum FishSpeed {
    SLOW = 150,
    MEDIUM = 130,
    HIGH = 120
}

export interface FishPos {
    x: number;
    y: number;
    angle: number;
}

export class Gamestage extends Phaser.Group {

    // ---------------------
    // Public API
    // ---------------------

    public endSignal: Phaser.Signal = new Phaser.Signal();
    public powerUpSignal: Phaser.Signal = new Phaser.Signal();
    public hitSignal: Phaser.Signal = new Phaser.Signal();
    public scoreHitSignal: Phaser.Signal = new Phaser.Signal();
    public fishMissedSignal: Phaser.Signal = new Phaser.Signal();

    // ---------------------
    // Gui
    // ---------------------

    private fishGroup: Phaser.Group;
    private attackingFishGroup: Phaser.Group;
    private hitboxGroup: Phaser.Group;
    private missedHitBox: Phaser.Sprite;
    private submarine: Phaser.Sprite;
    private bmd: Phaser.BitmapData;


    // ---------------------
    // Misc
    // ---------------------

    private subShowTime: number = 0;
    private currentSpeed: GameSpeed = GameSpeed.SLOW;
    private currentFishSpeed: FishSpeed = FishSpeed.SLOW;
    private speeds: Array<GameSpeed>;
    private fishSpeeds: Array<FishSpeed>;
    private spawnTimer: Phaser.Timer;
    private attackingFish: Array<Phaser.Sprite> = [];
    private attackingFishPositions: Map<Phaser.Sprite, Array<FishPos>> = new Map();

    constructor(game: Phaser.Game, private speedToPoints: Map<GameSpeed, number>, private hitBoxHeight: number = 100) {
        super(game);

        this.initStage();
    }

    public render() {
        if (DEBUG) {
            // if (this.missedHitBox) {
            //     this.game.debug.body(this.missedHitBox);
            // }
            //
            // if (this.fishGroup) {
            //     this.fishGroup.forEach((fish) => {
            //         this.game.debug.body(fish);
            //     }, this, true);
            // }
            //
            if (this.attackingFish && this.attackingFish.length) {
                this.attackingFish.forEach((fish) => {
                    this.game.debug.body(fish);
                });
            }

        }
    }

    public update() {
        if (this.attackingFish && this.attackingFish.length) {
            this.attackingFish.forEach((fish: Phaser.Sprite) => {
                let points: Array<FishPos> = this.attackingFishPositions.get(fish);
                if (points && points.length) {
                    let newPoint = points.shift();
                    fish.x = newPoint.x;
                    fish.y = newPoint.y;
                    fish.rotation = newPoint.angle;
                }
                else if (this.attackingFishPositions.has(fish)) {
                    this.attackingFishPositions.delete(fish);
                }

                this.game.physics.arcade.overlap(fish, this.missedHitBox, (fish, box) => {
                    this.missedFish(fish);
                });
            });

        }
    }

    public start(fishCount: number = 20): void {
        // this.hitboxGroup.visible = true;
        this.subShowTime = this.game.rnd.between(15, 45);
        this.bmd.clear();


        // this.fishMap = new Map<StagePosition, Array<Phaser.Sprite>>();
        let vPos = this.game.world.height - 150;
        this.fillOcean(fishCount, vPos);
        // this.createSubmarine();

        this.speeds = [
            GameSpeed.SLOW,
            GameSpeed.MEDIUM,
            GameSpeed.FAST,
            GameSpeed.VERYFAST,
            GameSpeed.LIGHTSPEED,
        ];

        this.fishSpeeds = [
            FishSpeed.SLOW,
            FishSpeed.MEDIUM,
            FishSpeed.MEDIUM,
            FishSpeed.HIGH,
            FishSpeed.HIGH
        ];


        this.currentSpeed = this.speeds.shift();
        this.updateSpawnTimer();

        this.fishGroup.visible = true;
        this.attackingFishGroup.visible = true;
    }

    public stop(): void {
        if (this.spawnTimer) {
            this.spawnTimer.stop(true);
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }

        this.fishGroup.visible = false;
        this.fishGroup.removeAll(true);

        this.attackingFishGroup.visible = false;
        this.attackingFishGroup.removeAll(true);
    }

    public increaseSpeed(): void {
        if (this.speeds.length > 0) {
            this.currentSpeed = this.speeds.shift();
            this.currentFishSpeed = this.fishSpeeds.shift();

            if (this.speeds.length === 1) {
                this.createSubmarine();
            }

            this.updateSpawnTimer();
        }
    }

    // ---------------------
    // Internal Methods
    // ---------------------

    private fillOcean(count: number, vPos: number, variation: number = 100): void {
        let fishH: number = Assets.Spritesheets.SpritesheetsFishBig230841.getFrameHeight() + Assets.Spritesheets.SpritesheetsFishBig230841.getFrameHeight() * 0.75;
        let fishW: number = Assets.Spritesheets.SpritesheetsFishBig230841.getFrameWidth();
        let xOffset: number = (fishW / 2) - (fishH / 2);

        for (let i = 0; i < count; i++) {
            let initY = this.game.rnd.between((vPos - variation), (vPos + variation));
            let initX = this.game.rnd.between(0, this.game.world.width - fishW);

            let fishBig: Phaser.Sprite = this.game.add.sprite(initX, initY, Assets.Spritesheets.SpritesheetsFishBig230841.getName(), null, this.fishGroup);
            fishBig.animations.add('swim');
            fishBig.animations.play('swim', 8, true);
            fishBig.anchor.setTo(0.5, 0.5);

            fishBig.body.setSize(fishH, fishH, xOffset, -50);

            fishBig.checkWorldBounds = true;
            fishBig.inputEnabled = true;

            // randomize fish direction
            fishBig.scale.x = this.game.rnd.pick([1, -1]);

            // reset fish to world bounds
            fishBig.events.onOutOfBounds.add((fish: Phaser.Sprite) => {
                // fish.scale.x = fish.scale.x * -1;

                if (fish.scale.x < 0) {
                    // width ist bei scale -1 auch negativ
                    fish.x = this.game.world.width - fish.width;
                }
                else {
                    fish.x = -fishW;

                }

                fish.y = this.game.rnd.between((vPos - variation), (vPos + variation));
                let vel: number = 50 + Math.random(0, 1) * variation;

                if (fishBig.scale.x < 0) {
                    vel = vel * -1;
                }

                fish.body.velocity.x = vel;
            });
            let initVel = 50 + Math.random(0, 1) * variation;

            if (fishBig.scale.x < 0) {
                initVel = initVel * -1;
            }

            fishBig.body.velocity.x = initVel;
        }

        this.fishGroup.visible = true;

    }

    private initStage() {
        this.bmd = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
        this.bmd.addToWorld();

        let stage: Phaser.Sprite = this.game.add.sprite(0, this.game.world.height / 3, null, null, this);
        stage.inputEnabled = true;
        stage.width = this.game.world.width;
        stage.height = this.game.world.height - this.game.world.height / 3;
        stage.events.onInputDown.add(() => {
            this.hitSignal.dispatch();
        });
        this.createFishLayer();
        this.createHitBoxes();
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
        this.fishGroup.enableBody = true;
        this.fishGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.fishGroup.visible = false;

        this.attackingFishGroup = this.game.add.group(this);
        this.attackingFishGroup.enableBody = true;
        this.attackingFishGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.attackingFishGroup.visible = false;
    }


    private createSubmarine() {
        let wHeight: number = this.game.world.height;
        let wBottom: number = wHeight - wHeight / 3;
        let startY: number = wBottom - 100;
        let endY: number = wBottom + 100;
        let startX: number = -(Assets.Spritesheets.SpritesheetsUboot2251641.getFrameWidth());

        this.submarine = this.game.add.sprite(startX, this.game.rnd.between(startY, endY), Assets.Spritesheets.SpritesheetsUboot2251641.getName(), null, this);
        this.submarine.bringToTop();
        this.submarine.scale.x = -1;
        this.submarine.inputEnabled = true;
        this.submarine.events.onInputDown.addOnce(() => {
            this.activatePowerup();
            this.submarine.body.velocity.x = 1000;
        });
        this.game.physics.arcade.enable(this.submarine);
        this.submarine.body.enable = true;
        this.submarine.body.velocity.x = 200;

        this.submarine.animations.add("swim");
        this.submarine.animations.play("swim", 5, true);
    }

    private createHitBoxes(): void {
        this.hitboxGroup = this.game.add.group(this);
        this.hitboxGroup.visible = false;

        let yPos: number = (this.game.world.height / 3) - 100;

        let boxWidth: number = 100;
        let boxHeight: number = this.hitBoxHeight;


        let missedBoxY = yPos;
        let missedBox: Phaser.Sprite = this.game.add.sprite(this.game.world.centerX, missedBoxY, null, null, this.hitboxGroup);
        missedBox.width = boxWidth;
        missedBox.height = boxHeight;
        missedBox.anchor.setTo(0.5);

        this.game.physics.arcade.enable(missedBox);

        missedBox.body.enable = true;
        this.missedHitBox = missedBox;
    }


    /**
     * Clears a fish from the game. Kills from view and the various groups and maps.
     *
     * @param {Phaser.Sprite} fish
     */
    private clearFish(fish: Phaser.Sprite): void {
        this.attackingFishGroup.remove(fish, true, true);
        this.attackingFish.splice(this.attackingFish.indexOf(fish), 1);
        this.attackingFishPositions.delete(fish);

        if (!this.fishGroup.length && !this.attackingFishGroup.length) {
            this.endSignal.dispatch();
        }
    }


    private updateSpawnTimer() {
        if (!this.spawnTimer) {
            this.spawnTimer = this.game.time.create(false);
        }

        this.spawnTimer.stop(true);
        this.spawnTimer.loop(this.currentSpeed, () => {
            if (this.fishGroup.length) {
                this.attack();
            }
        });
        this.spawnTimer.start();
    }

    private missedFish(fish: Phaser.Sprite): void {
        this.fishMissedSignal.dispatch(this.currentSpeed);
        this.clearFish(fish);
    }

    private getScore(currentSpeed: GameSpeed) {
        return this.speedToPoints.get(currentSpeed);
    }

    private attack() {
        const variation = 150;
        let fish: Phaser.Sprite = this.fishGroup.getClosestTo({
            x: this.game.rnd.between(this.game.world.centerX - variation, this.game.world.centerX + variation),
            y: this.game.world.height - 150
        });

        console.log("in world:", fish.inWorld, fish.x);

        this.fishGroup.remove(fish, false, true);
        this.attackingFishGroup.add(fish);

        let pointsX: Array<number>;
        let pointsY: Array<number> = [fish.y, fish.y, this.game.rnd.between(this.game.world.centerY - variation, this.game.world.centerY + variation), this.missedHitBox.centerY];

        if (fish.scale.x < 0) {
            pointsX = [fish.x, fish.x + fish.width, fish.x - this.game.rnd.between(this.game.world.centerX - variation, this.game.world.centerX + variation), this.missedHitBox.centerX];
        }
        else {
            pointsX = [fish.x, fish.x + fish.width, fish.x + this.game.rnd.between(this.game.world.centerX - variation, this.game.world.centerX + variation), this.missedHitBox.centerX];
        }

        this.attackingFishPositions.set(fish, this.plot(this.currentFishSpeed, pointsX, pointsY, fish.scale.x < 0));

        // clear event, not needed any more
        fish.events.onOutOfBounds.removeAll();

        fish.events.onInputDown.addOnce(() => {
            this.showScoreText(fish, "+" + this.getScore(this.currentSpeed));
            this.hitSignal.dispatch();
            this.scoreHitSignal.dispatch(this.currentSpeed);
            this.clearFish(fish);
        });
        this.attackingFish.push(fish);
    }

    private plot(speed: FishSpeed, pointsX: number[], pointsY: number[], reversed: boolean): Array<FishPos> {
        let path: Array<FishPos> = [];
        let x = 1 / speed;
        let ix = 0;
        for (let i = 0; i <= 1; i += x) {

            let px = Phaser.Math.bezierInterpolation(pointsX, i);
            let py = Phaser.Math.bezierInterpolation(pointsY, i);

            let pos: FishPos = {x: px, y: py, angle: 0};

            if (ix > 0) {
                let prevPos = path[ix - 1];
                pos.angle = Math.angleBetweenPoints(new Phaser.Point(prevPos.x, prevPos.y), new Phaser.Point(pos.x, pos.y));
                if (reversed) {
                    pos.angle = Math.reverseAngle(pos.angle);
                }
            }

            path.push(pos);
            ix++;

            if (DEBUG) {
                // show path
                this.bmd.rect(px, py, 1, 1, 'rgba(0, 0, 0, 1)');
            }
        }

        if (DEBUG) {
            // show beziere points
            for (let p = 0; p < pointsX.length; p++) {
                this.bmd.rect(pointsX[p] - 3, pointsY[p] - 3, 6, 6, 'rgba(255, 0, 0, 1)');
            }

        }

        return path;
    }

    private activatePowerup() {
        this.powerUpSignal.dispatch();
    }
}