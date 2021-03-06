import * as Utils from '../utils/utils';
import * as Assets from '../assets';
import App from '../app';
import { Config } from "../config";

export default class Boot extends Phaser.State {

    private get app(): App {
        return this.game as App;
    }

    public preload(): void {
        // Load any assets you need for your preloader state here.
        this.game.load.image(Assets.Images.ImagesLoading.getName(), Assets.Images.ImagesLoading.getPNG());
    }

    public create(): void {
        // Do anything here that you need to be setup immediately, before the game actually starts doing anything.

        // Uncomment the following to disable multitouch
        // this.input.maxPointers = 1;

        this.game.scale.scaleMode = Phaser.ScaleManager[SCALE_MODE];

        if (SCALE_MODE === 'USER_SCALE') {
            let screenMetrics: Utils.ScreenMetrics = Utils.ScreenUtils.screenMetrics;

            this.game.scale.setUserScale(screenMetrics.scaleX, screenMetrics.scaleY);
        }

        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        // Scale the game
        let curHeight = this.game.height;
        let curWidth = this.game.width;
        let baseHeight = Config.baseHeight;
        let baseWidth = Config.baseWidth;
        let vScale = curHeight / baseHeight;
        let widthDiff = Math.ceil((curWidth - baseWidth * vScale) / vScale);

        this.scale.setGameSize(Math.min(baseWidth + widthDiff, Config.maxWidth), baseHeight);
        this.scale.setUserScale(vScale, vScale, 0, 0, false, false);

        // Keep game running if it loses the focus
        this.game.stage.disableVisibilityChange = true;

        if (this.game.device.desktop) {
            // Any desktop specific stuff here
        } else {
            // Any mobile specific stuff here

            // Comment the following and uncomment the line after that to force portrait mode instead of landscape
            // this.game.scale.forceOrientation(true, false);
            this.game.scale.forceOrientation(false, true);

            // this.scale.enterIncorrectOrientation.add((this.game as App).onEnterIncorrectOrientation, this.game);
            // this.scale.leaveIncorrectOrientation.add((this.game as App).onLeaveIncorrectOrientation, this.game);

        }

        // Use DEBUG to wrap code that should only be included in a DEBUG build of the game
        // DEFAULT_GAME_WIDTH is the safe area width of the game
        // DEFAULT_GAME_HEIGHT is the safe area height of the game
        // MAX_GAME_WIDTH is the max width of the game
        // MAX_GAME_HEIGHT is the max height of the game
        // game.width is the actual width of the game
        // game.height is the actual height of the game
        // GOOGLE_WEB_FONTS are the fonts to be loaded from Google Web Fonts
        // SOUND_EXTENSIONS_PREFERENCE is the most preferred to least preferred order to look for audio sources
        console.log(
            `DEBUG....................... ${DEBUG}
           \nSCALE_MODE.................. ${SCALE_MODE}
           \nDEFAULT_GAME_WIDTH.......... ${DEFAULT_GAME_WIDTH}
           \nDEFAULT_GAME_HEIGHT......... ${DEFAULT_GAME_HEIGHT}
           \nMAX_GAME_WIDTH.............. ${MAX_GAME_WIDTH}
           \nMAX_GAME_HEIGHT............. ${MAX_GAME_HEIGHT}
           \ngame.width.................. ${this.game.width}
           \ngame.height................. ${this.game.height}
           \nGOOGLE_WEB_FONTS............ ${GOOGLE_WEB_FONTS}
           \nSOUND_EXTENSIONS_PREFERENCE. ${SOUND_EXTENSIONS_PREFERENCE}`
        );

        this.app.saveService.load().then((score: number) => {
            console.log(`Highscore loaded: ${score}`);
            this.game.state.start('preloader');
        });

    }
}
