import Api = require("adventskalender-js-api");

export class GameSave {
    private name: String;
    private api: Api;

    public highscore: number = 0;

    constructor(name: String) {
        this.name = name;

        this.api = new Api();
        this.api.init(window, name);
    }

    public save(score: number): void {
        this.highscore = score;
        this.api.saveHighscore(score);
    }

    public load(): Promise<number> {
        return this.api.getHighscore().then((score: number) => {
            if (score) {
                this.highscore = score;
            }

            return score;
        }).catch((err: any) => {
            console.log(err);
        });
    }

}