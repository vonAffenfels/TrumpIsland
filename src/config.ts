export class Config {
    static gameName: String = "TrumbIsland";

    static increaseThresholds: Array<number> = [
        1000,
        2000,
        4000,
        7000,
        11000
    ];

    static baseWidth: number = 750;
    static baseHeight: number = 1334;
    static maxWidth: number = 768;

    static hitBoxHeight: number = 250;

    static musicOn: boolean = false;

    /**
     * The final score is multiplied by this number.
     *
     * @type {number}
     */
    static scoreGain: number = 10;
    static gameTime: number = 90;
    static maxMisses: number = 15;
    static missPenalty: number = 5;
    static slowPoint: number = 10;
    static mediumPoint: number = 20;
    static fastPoint: number = 30;

    static fishesToSpawn: number = 100;

    /**
     * Time in milliseconds
     *
     * @type {number}
     */
    static shieldDuration: number = 5000;
    static shieldHitpoints: number = 5;
}