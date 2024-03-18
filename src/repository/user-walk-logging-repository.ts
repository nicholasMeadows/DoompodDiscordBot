import UserWalkLogging from "../entity/user-walk-logging";
import {Op} from "sequelize";
import {Sequelize} from "sequelize-typescript";

export default class UserWalkLoggingRepository {
    save(userWalkLogging: UserWalkLogging) {
        return userWalkLogging.save();
    }

    findUserWalkLogsTotalsByGuildIdMonthAndYearLimit3(guildId: number, year: number, month: number) {
        return UserWalkLogging.findAll({
            where:[{
                guildId: guildId,
                [Op.and] : [
                    Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year),
                    Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month)
                ]
            }],
            attributes: [
                'userId',
                [Sequelize.fn('sum', Sequelize.col('milesLogged')), 'total'],
            ],
            order: [['total', 'DESC']],
            group: ['userId'],
            limit:3
        })
    }


    findUserWalkLogsTotalsByGuildIdUserIdMonthAndYearLimit1(guildId: number, userId: number, year: number, month: number) {
        return UserWalkLogging.findAll({
            where:[{
                guildId: guildId,
                userId: userId,
                [Op.and] : [
                    Sequelize.fn('EXTRACT(YEAR from "createdAt") =', year),
                    Sequelize.fn('EXTRACT(MONTH from "createdAt") =', month)
                ]
            }],
            attributes: [
                'userId',
                [Sequelize.fn('sum', Sequelize.col('milesLogged')), 'total'],
            ],
            order: [['total', 'DESC']],
            group: ['userId'],
            limit:1
        })
    }
}