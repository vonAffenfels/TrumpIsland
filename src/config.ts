export class Config {
    static gameName: String = "TrumbIsland";

    static baseWidth: number = 750;
    static baseHeight: number = 1334;
    static maxWidth: number = 768;

    /**
     * The final score is multiplied by this number.
     *
     * @type {number}
     */
    static scoreGain: number = 10;
    static gameTime: number = 90;
    static maxMisses: number = 15;
    static slowPoint: number = 10;
    static mediumPoint: number = 20;
    static fastPoint: number = 30;
}