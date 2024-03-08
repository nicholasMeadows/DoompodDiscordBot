module.exports = class ConfigService {
    #token;
    #clientId;
    #doompodSuckletCron;
    #itsFridayInCaliforniaCron;
    #ladiesAndGentlemenTheWeekendCron;
    #itsWednesdayMyDudesCron;
    #randomActuallyReplyPercentage;
    #databaseFile;

    constructor() {
    }

    loadUpdatedConfig(config) {
        this.#token = config.token;
        this.#clientId = config.clientId;
        this.#doompodSuckletCron = config.doompodSuckletCron;
        this.#itsFridayInCaliforniaCron = config.itsFridayInCaliforniaCron;
        this.#ladiesAndGentlemenTheWeekendCron = config.ladiesAndGentlemenTheWeekendCron;
        this.#itsWednesdayMyDudesCron = config.itsWednesdayMyDudesCron;
        this.#randomActuallyReplyPercentage = config.randomActuallyReplyPercentage;
        this.#databaseFile = config.databaseFile;
    }

    getToken() {
        return this.#token;
    }
    getClientId() {
        return this.#clientId;
    }
    getDoompodSuckletCron() {
        return this.#doompodSuckletCron;
    }
    getItsFridayInCaliforniaCron() {
        return this.#itsFridayInCaliforniaCron;
    }
    getLadiesAndGentlemenTheWeekendCron() {
        return this.#ladiesAndGentlemenTheWeekendCron;
    }
    getItsWednesdayMyDudesCron() {
        return this.#itsWednesdayMyDudesCron;
    }

    getRandomActuallyReplyPercentage() {
        return this.#randomActuallyReplyPercentage;
    }

    getDatabaseFile() {
        return this.#databaseFile;
    }
}