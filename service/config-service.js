module.exports = class ConfigService {
    #token;
    #clientId;
    #randomActuallyReplyPercentage;
    #databaseFile;

    constructor() {
    }

    loadUpdatedConfig(config) {
        this.#token = config.token;
        this.#clientId = config.clientId;
        this.#randomActuallyReplyPercentage = config.randomActuallyReplyPercentage;
        this.#databaseFile = config.databaseFile;
    }

    getToken() {
        return this.#token;
    }
    getClientId() {
        return this.#clientId;
    }

    getRandomActuallyReplyPercentage() {
        return this.#randomActuallyReplyPercentage;
    }

    getDatabaseFile() {
        return this.#databaseFile;
    }
}