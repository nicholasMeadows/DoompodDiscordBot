const BaseRepository = require('./base-repository');
module.exports = class CronRepository extends BaseRepository{
    constructor(configService) {
        super(configService);
    }

    findAllCrons() {
        const db = super.readDBFile();
        return db.crons
    }
}