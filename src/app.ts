import 'p2';
import 'pixi';
import 'phaser';

import * as WebFontLoader from 'webfontloader';

import Boot from './states/boot';
import Preloader from './states/preloader';
import Title from './states/title';
import * as Utils from './utils/utils';
import * as Assets from './assets';
import { Config } from "./config";
import { GameSave } from "./gamesave";

export default class App extends Phaser.Game {
    private gameSave: GameSave;

    public orientated: boolean = false;

    constructor(config: Phaser.IGameConfig) {
        super(config);

        this.state.add('boot', Boot);
        this.state.add('preloader', Preloader);
        this.state.add('title', Title);

        this.orientated = true;

        this.state.start('boot');
    }

    public onEnterIncorrectOrientation(): void {
        this.orientated = false;
        document.getElementById('orientation').style.display = 'block';
    }

    public onLeaveIncorrectOrientation(): void {
        this.orientated = false;
        document.getElementById('orientation').style.display = 'none';
    }

    public get saveService(): GameSave {
        if (!this.gameSave) {
            this.gameSave = new GameSave(Config.gameName);
        }

        return this.gameSave;
    }
}

function startApp(): void {
    let gameWidth: number = DEFAULT_GAME_WIDTH;
    let gameHeight: number = DEFAULT_GAME_HEIGHT;

    if (SCALE_MODE === 'USER_SCALE') {
        let screenMetrics: Utils.ScreenMetrics = Utils.ScreenUtils.calculateScreenMetrics(gameWidth, gameHeight, Utils.ScreenOrientation.PORTRAIT);

        gameWidth = screenMetrics.gameWidth;
        gameHeight = screenMetrics.gameHeight;
    }

    // There are a few more options you can set if needed, just take a look at Phaser.IGameConfig
    let gameConfig: Phaser.IGameConfig = {
        width: "100%",
        height: "100%",
        renderer: Phaser.CANVAS,
        parent: '',
        resolution: 1
    };

    let app = new App(gameConfig);
}

window.onload = () => {
    let webFontLoaderOptions: any = null;
    let webFontsToLoad: string[] = GOOGLE_WEB_FONTS;

    if (webFontsToLoad.length > 0) {
        webFontLoaderOptions = (webFontLoaderOptions || {});

        webFontLoaderOptions.google = {
            families: webFontsToLoad
        };
    }

    if (Object.keys(Assets.CustomWebFonts).length > 0) {
        webFontLoaderOptions = (webFontLoaderOptions || {});

        webFontLoaderOptions.custom = {
            families: [],
            urls: []
        };

        for (let font in Assets.CustomWebFonts) {
            webFontLoaderOptions.custom.families.push(Assets.CustomWebFonts[font].getFamily());
            webFontLoaderOptions.custom.urls.push(Assets.CustomWebFonts[font].getCSS());
        }
    }

    if (webFontLoaderOptions === null) {
        // Just start the game, we don't need any additional fonts
        startApp();
    } else {
        // Load the fonts defined in webFontsToLoad from Google Web Fonts, and/or any Local Fonts then start the game knowing the fonts are available
        webFontLoaderOptions.active = startApp;

        WebFontLoader.load(webFontLoaderOptions);
    }
};
