import * as Assets from '../assets';
import * as AssetUtils from '../utils/assetUtils';

export default class Preloader extends Phaser.State {
    private preloadBarSprite: Phaser.Sprite = null;

    public preload(): void {

        this.preloadBarSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesLoading.getName());
        this.preloadBarSprite.anchor.setTo(0, 0.5);

        this.game.load.setPreloadSprite(this.preloadBarSprite);

        AssetUtils.Loader.loadAllAssets(this.game, this.waitForSoundDecoding, this);
    }

    public create(): void {
        this.game.stage.backgroundColor = "#ffffff";
    }

    private waitForSoundDecoding(): void {
        AssetUtils.Loader.waitForSoundDecoding(this.startGame, this);
    }

    private startGame(): void {
        this.game.camera.onFadeComplete.addOnce(this.loadTitle, this);
        this.game.camera.fade(0xffffff, 500);
    }

    private loadTitle(): void {
        this.game.state.start('title');
    }
}
