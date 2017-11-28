import 'phaser';
import * as Assets from '../assets';

export default class Oceanlife extends Phaser.Group {


    private fishBig: Phaser.Sprite = null;
    private fishSmallGroup: Phaser.Group;

    constructor(game: Phaser.Game) {
        super(game);
    }

    public fill(): void {
        let third = this.game.world.height / 3;
        let lower = this.game.world.height - third;
        this.createSmallFish(10, lower, third);
        this.createBigFish();
    }

    public clear(): void {
        if (this.fishSmallGroup) {
            this.fishSmallGroup.removeAll();
        }

        this.removeAll();
    }

    private createBigFish() {
        this.fishBig = this.game.add.sprite(this.game.world.width, this.game.world.centerY + 160, Assets.Spritesheets.SpritesheetsFishBig230841.getName(), null, this);
        this.fishBig.animations.add('swim');
        this.fishBig.animations.play('swim', 5, true);

        this.game.physics.arcade.enable(this.fishBig);

        this.fishBig.body.velocity.x = -100;
        this.fishBig.body.bounce.y = 0.2;
    }

    private createSmallFish(count: number, vPos: number, variation: number = 300, speed: number = 3000): void {
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
}