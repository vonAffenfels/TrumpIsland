import 'phaser';

export enum StagePosition {
    LEFT,
    RIGHT,
    CENTER
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

    constructor(game: Phaser.Game) {
        super(game);

        this.clickAreas = new Map<StagePosition, Phaser.Sprite>();
        this.hitboxMap = new Map<StagePosition, Phaser.Sprite>();

        this.initStage();
    }

    private initStage(): void {
        this.createFishLayer();
        this.createHitBoxes();
        this.createClickAreas();

    }

    public start(): void {

    }

    private createFishLayer(): void {
        this.fishGroup = this.game.add.group(this);
        this.fishGroup.visible = false;
    }

    private createHitBoxes(): void {
        this.hitboxGroup = this.game.add.group(this);

        let yPos: number = this.game.world.height / 3;

        let boxWidth: number = this.game.world.width / 3;
        let boxHeight: number = 100;

        let leftBox: Phaser.Sprite = this.game.add.sprite(0, yPos, "bla", null, this.hitboxGroup);
        leftBox.width = boxWidth;
        leftBox.height = boxHeight;

        let bg: Phaser.Graphics = new Phaser.Graphics(this.game);
        bg.beginFill(0xff0000, 0.5);
        bg.drawRect(0, 0, 10, boxHeight);
        bg.endFill();

        leftBox.addChild(bg);

        this.hitboxMap.set(StagePosition.LEFT, leftBox);

        let centerBox: Phaser.Sprite = this.game.add.sprite(boxWidth, yPos, null, null, this.hitboxGroup);
        centerBox.width = boxWidth;
        centerBox.height = boxHeight;


        let bgC: Phaser.Graphics = new Phaser.Graphics(this.game);
        bgC.beginFill(0x00ff00, 0.5);
        bgC.drawRect(0, 0, 10, boxHeight);
        bgC.endFill();

        centerBox.addChild(bgC);

        this.hitboxMap.set(StagePosition.CENTER, centerBox);

        let rightBox: Phaser.Sprite = this.game.add.sprite(boxWidth * 2, yPos, null, null, this.hitboxGroup);
        rightBox.width = boxWidth;
        rightBox.height = boxHeight;

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

    // ---------------------
    // Click Handler
    // ---------------------

    private onStageClick(position: StagePosition): void {
        this.hitSignal.dispatch(position);
    }
}