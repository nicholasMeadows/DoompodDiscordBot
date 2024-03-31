import {Collection, UpdateResult} from "mongodb";
import BotCommand from "../entity/bot-command";

export default class BotCommandRepository {
    private _botCommandCollection: Collection<BotCommand>;

    constructor(botCommandCollection: Collection<BotCommand>) {
        this._botCommandCollection = botCommandCollection;
    }

    saveBotCommand(botCommand: BotCommand): Promise<UpdateResult<BotCommand>> {
        return new Promise<UpdateResult<BotCommand>>(async (resolve) => {
            const result = await this._botCommandCollection.updateOne({
                discordId: botCommand.discordId
            }, {
                $set: {
                    commandName: botCommand.commandName,
                    commandDescription: botCommand.commandDescription,
                    discordId: botCommand.discordId
                }
            });
            if (result.matchedCount === 0) {
                await this._botCommandCollection.insertOne(botCommand);
            }
            resolve(result);
        })
    }
}