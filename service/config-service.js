module.exports = class ConfigService {
    #token;
    #clientId;
    #doompodSuckletCron;
    #itsFridayInCaliforniaCron;
    #ladiesAndGentlemenTheWeekendCron;
    #itsWednesdayMyDudesCron;
    constructor() {
    }

    loadUpdatedConfig(config) {
        this.#token = config.token;
        this.#clientId = config.clientId;
        this.#doompodSuckletCron = config.doompodSuckletCron;
        this.#itsFridayInCaliforniaCron = config.itsFridayInCaliforniaCron;
        this.#ladiesAndGentlemenTheWeekendCron = config.ladiesAndGentlemenTheWeekendCron;
        this.#itsWednesdayMyDudesCron = config.itsWednesdayMyDudesCron;
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

}