const BaseRepository = require('./base-repository')
module.exports = class MessageRepository extends BaseRepository {
    constructor(configService) {
        super(configService);
    }

    findByMessageId(messageId) {
        const messages = super.readDBFile().messages;
        return messages.find(message => message.messageId === messageId);
    }

    save(messageEntity) {
        const db = super.readDBFile();
        const messages = db.messages;
        const messageIndex = messages.findIndex(message => message.messageId === messageEntity.messageId);
        if(messageIndex !== -1) {
            messages.splice(messageIndex, 1);
        }

        messages.push(messageEntity);
        super.writeDBToFile(db);
    }
}