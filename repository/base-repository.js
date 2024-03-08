const fs = require('fs');
module.exports = class BaseRepository {
    #configService
    constructor(configService) {
        this.#configService = configService;
    }

    readDBFile() {
        const dbFile = this.#configService.getDatabaseFile();
        const fileContent = fs.readFileSync(dbFile, 'utf-8')
        return JSON.parse(fileContent);
    }
    writeDBToFile(dbJson) {
        const dbFile = this.#configService.getDatabaseFile();
        fs.writeFileSync(dbFile, JSON.stringify(dbJson));
    }
}