import {Message, PartialMessage} from "discord.js";
import User from "../entity/user";

export default class UserConverter {
    convert(discordId: string) {
        const user = new User();
        user.discordId = discordId;
        return user;
    }
}