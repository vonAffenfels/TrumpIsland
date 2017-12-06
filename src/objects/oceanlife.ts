import 'phaser';
import * as Assets from '../assets';

export default class Oceanlife extends Phaser.Group {

    private fishSmallGroup: Phaser.Group;
    private fishMediumGroup: Phaser.Group;
    private subTimer: Phaser.Timer;
    private subShowTime: number = 0;
    private submarine: Phaser.Sprite;

    constructor(game: Phaser.Game) {
        super(game);
    }

    public fill(): void {
        this.subShowTime = this.game.rnd.between(15, 45);

        let third = this.game.world.height / 3;
        let lower = this.game.world.height - third;
        // this.createSmallFish(10, lower, third - 50);
        // this.createMediumFish(8, lower, third - 100, 4500);
        this.createSubmarine();
    }

    public clear(): void {
        if (this.fishSmallGroup) {
            this.fishSmallGroup.removeAll(true);
        }
        if (this.fishMediumGroup) {
            this.fishMediumGroup.removeAll(true);
        }

        this.subTimer.stop(true);
        this.subTimer.destroy();
        this.subTimer = null;

        this.removeAll(true);
    }


    private createSmallFish(count: number, vPos: number, variation: number = 200, speed: number = 3500): void {
        this.fishSmallGroup = this.game.add.group(this);
        this.fishSmallGroup.enableBody = true;

        for (let i = 0; i < count; i++) {

            let initX = this.game.world.width + this.game.rnd.between(0, variation);

            let fishBig: Phaser.Sprite = this.game.add.sprite(initX, this.game.rnd.between((vPos - variation), (vPos + variation)), Assets.Spritesheets.SpritesheetsFishSmall230841.getName(), null, this.fishSmallGroup);
            fishBig.animations.add('swim');
            fishBig.animations.play('swim', 8, true);

            fishBig.body.moveTo(this.game.rnd.between(speed - variation, speed + variation), -(initX + Assets.Spritesheets.SpritesheetsFishSmall230841.getFrameWidth()));
            fishBig.body.onMoveComplete.add(() => {
                fishBig.y = this.game.rnd.between((vPos - variation), (vPos + variation));
                fishBig.scale.x = fishBig.scale.x * -1;
                fishBig.body.moveTo(this.game.rnd.between(speed - variation, speed + variation), -(this.game.world.width + Assets.Spritesheets.SpritesheetsFishSmall230841.getFrameWidth()));
            });
        }

    }

    private createMediumFish(count: number, vPos: number, variation: number = 200, speed: number = 3000): void {
        this.fishMediumGroup = this.game.add.group(this);
        this.fishMediumGroup.enableBody = true;

        for (let i = 0; i < count; i++) {

            let initX = -(this.game.rnd.between(0, variation));

            let fishBig: Phaser.Sprite = this.game.add.sprite(initX, this.game.rnd.between((vPos - variation), (vPos + variation)), Assets.Spritesheets.SpritesheetsFishMiddle230841.getName(), null, this.fishMediumGroup);
            fishBig.animations.add('swim');
            fishBig.animations.play('swim', 5, true);
            fishBig.scale.x = -1;

            fishBig.body.moveTo(this.game.rnd.between(speed - variation, speed + variation), this.game.world.width + Assets.Spritesheets.SpritesheetsFishMiddle230841.getFrameWidth());
            fishBig.body.onMoveComplete.add(() => {
                fishBig.y = this.game.rnd.between((vPos - variation), (vPos + variation));
                fishBig.scale.x = fishBig.scale.x * -1;
                fishBig.body.moveTo(this.game.rnd.between(speed - variation, speed + variation), -(this.game.world.width + Assets.Spritesheets.SpritesheetsFishMiddle230841.getFrameWidth()));
            });
        }

    }

    private createSubmarine() {
        this.subTimer = this.game.time.create(false);
        this.subTimer.loop(Phaser.Timer.SECOND, () => {
            this.subShowTime--;
            let startY: number = this.game.world.centerY - 150;
            let endY: number = this.game.world.centerY + 150;
            let endX: number = this.game.world.width + Assets.Spritesheets.SpritesheetsUboot2251641.getFrameWidth();
            let startX: number = -(Assets.Spritesheets.SpritesheetsUboot2251641.getFrameWidth());

            if (this.subShowTime === 0) {
                this.submarine = this.game.add.sprite(startX, this.game.rnd.between(startY, endY), Assets.Spritesheets.SpritesheetsUboot2251641.getName(), null, this);
                this.submarine.scale.x = -1;
                this.game.physics.arcade.enable(this.submarine);
                this.submarine.body.enable = true;
                this.submarine.body.moveTo(15000, endX);

                this.submarine.animations.add("swim");
                this.submarine.animations.play("swim", 5, true);
            }
        });
        this.subTimer.start();
    }
}