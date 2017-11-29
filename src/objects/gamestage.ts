import 'phaser';
import * as Assets from '../assets';

export enum StagePosition {
    LEFT = 1,
    RIGHT,
    CENTER
}

export enum GameSpeed {
    SLOW = 200,
    MEDIUM = 300,
    HIGH = 500
}

export class Gamestage extends Phaser.Group {

    // ---------------------
    // Public API
    // ---------------------

    public hitSignal: Phaser.Signal = new Phaser.Signal();
    public scoreHitSignal: Phaser.Signal = new Phaser.Signal();

    // ---------------------
    // Gui
    // ---------------------

    private fishGroup: Phaser.Group;
    private hitboxGroup: Phaser.Group;
    private clickAreaGroup: Phaser.Group;

    private clickAreas: Map<StagePosition, Phaser.Sprite>;
    private hitboxMap: Map<StagePosition, Phaser.Sprite>;
    private fishMap: Map<StagePosition, Array<Phaser.Sprite>>;

    // ---------------------
    // Misc
    // ---------------------

    private currentSpeed: GameSpeed = GameSpeed.SLOW;
    private speeds: Array<GameSpeed>;
    private timer: Phaser.Timer;
    private timeLeft: number;
    private changeSpeedInterval: number;
    private positions: Array<StagePosition> = [
        StagePosition.LEFT, StagePosition.CENTER, StagePosition.RIGHT
    ];

    constructor(game: Phaser.Game) {
        super(game);

        this.clickAreas = new Map<StagePosition, Phaser.Sprite>();
        this.hitboxMap = new Map<StagePosition, Phaser.Sprite>();

        this.initStage();
    }

    public start(gameTime: number): void {
        this.timeLeft = gameTime;

        this.fishMap = new Map<StagePosition, Array<Phaser.Sprite>>();

        this.speeds = [
            GameSpeed.SLOW,
            GameSpeed.MEDIUM,
            GameSpeed.HIGH
        ];

        this.changeSpeedInterval = Math.floor(gameTime / this.speeds.length);
        this.timer = this.game.time.create(false);
        this.timer.loop(Phaser.Timer.SECOND, () => {
            this.timeLeft--;
            this.handleTime();
        }, this);

        this.currentSpeed = this.speeds.shift();
        this.timer.start();

        this.fishGroup.visible = true;
    }

    public stop(): void {
        this.timer.stop(true);
        this.timer.destroy();
        this.timer = null;

        this.fishGroup.visible = false;
    }

    private handleTime() {
        if (this.timeLeft % this.changeSpeedInterval === 0) {
            this.currentSpeed = this.speeds.shift();
        }

        if (this.timeLeft > 0) {
            this.spawnFish(this.currentSpeed);
        }
    }

    private initStage() {
        this.createFishLayer();
        this.createHitBoxes();
        this.createClickAreas();
    }


    private createFishLayer(): void {
        this.fishGroup = this.game.add.group(this);
        this.fishGroup.visible = false;
    }

    private createHitBoxes(): void {
        this.hitboxGroup = this.game.add.group(this);

        let yPos: number = (this.game.world.height / 3) + 50;

        let boxWidth: number = this.game.world.width / 3;
        let boxHeight: number = 150;

        let leftBox: Phaser.Sprite = this.game.add.sprite(0, yPos, null, "bla", this.hitboxGroup);
        leftBox.width = boxWidth;
        leftBox.height = boxHeight;

        this.game.physics.arcade.enable(leftBox);

        leftBox.body.enable = true;
        this.hitboxMap.set(StagePosition.LEFT, leftBox);

        let centerBox: Phaser.Sprite = this.game.add.sprite(boxWidth, yPos, null, "bla", this.hitboxGroup);
        centerBox.width = boxWidth;
        centerBox.height = boxHeight;
        this.game.physics.arcade.enable(centerBox);
        centerBox.body.enable = true;
        this.hitboxMap.set(StagePosition.CENTER, centerBox);


        let rightBox: Phaser.Sprite = this.game.add.sprite(boxWidth * 2, yPos, null, "bla", this.hitboxGroup);
        rightBox.width = boxWidth;
        this.game.physics.arcade.enable(rightBox);
        rightBox.body.enable = true;
        this.hitboxMap.set(StagePosition.RIGHT, rightBox);
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

        for (let i = 0; i < fishes.length; i++) {
            let fish = fishes[i];

            let overlap: boolean = this.game.physics.arcade.overlap(hitBox, fish);
            // DEBUG
            console.log("overlap:", overlap);
        }
        //
        fishes = fishes.filter((fish: Phaser.Sprite) => {
            return this.game.physics.arcade.overlap(hitBox, fish);
        });

        if (fishes.length) {
            // DEBUG
            console.log("fish is hit", fishes.length, position);
            this.scoreHitSignal.dispatch(this.currentSpeed);
            this.clearFish(fishes, position);
        }
    }

    private clearFish(fishes: Array<Phaser.Sprite>, position: StagePosition): void {
        let posList: Array<Phaser.Sprite> = this.fishMap.get(position);

        for (let i = 0; i < fishes.length; i++) {
            let fish = fishes[i];
            this.fishGroup.remove(fish, true, true);
            posList.splice(posList.indexOf(fish), 1);
        }

    }

    // ---------------------
    // Click Handler
    // ---------------------

    private onStageClick(position: StagePosition): void {
        this.hitSignal.dispatch(position);

        this.checkHit(position);
    }

    private spawnFish(currentSpeed: GameSpeed): void {
        if (!currentSpeed) {
            return;
        }

        let position: StagePosition = this.game.rnd.pick(this.positions);
        let index: number = this.positions.indexOf(position);
        let colWidth: number = this.game.world.width / 3;
        let colCenter: number = colWidth / 2;

        let startX: number = (colWidth * index) + colCenter;

        let fish: Phaser.Sprite = this.game.add.sprite(startX, this.game.world.height + Assets.Spritesheets.SpritesheetsFishBig230841.getFrameWidth(),
            Assets.Spritesheets.SpritesheetsFishBig230841.getName(),
            null,
            this.fishGroup);
        fish.anchor.set(0.5, 0.5);
        fish.angle = 90;
        fish.animations.add('swim');
        fish.animations.play('swim', 5, true);

        this.game.physics.arcade.enable(fish);
        fish.body.enable = true;

        let target = this.hitboxMap.get(position);
        // this.game.physics.arcade.moveToObject(fish, target, currentSpeed.valueOf());

        if (this.fishMap.has(position) === false) {
            this.fishMap.set(position, []);
        }

        this.fishMap.get(position).push(fish);

        fish.body.velocity.y = -(currentSpeed.valueOf());
    }
}