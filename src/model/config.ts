import fs from "fs";
import {JSON} from "sequelize";

export default class Config {

    private declare readonly _token: string;
    private declare readonly _clientId: string;
    private declare readonly _databaseName: string;
    private declare readonly _schemaName: string;
    private declare readonly _dbUser: string;
    private declare readonly _dbPassword: string;
    private declare readonly _dbHost: string;

    constructor(token: string, clientId: string, databaseName: string, schemaName: string, dbUser: string, dbPassword: string, dbHost: string) {
        this._token = token;
        this._clientId = clientId;
        this._databaseName = databaseName;
        this._schemaName = schemaName;
        this._dbUser = dbUser;
        this._dbPassword = dbPassword;
        this._dbHost = dbHost;
    }


    get token(): string {
        return this._token;
    }

    get clientId(): string {
        return this._clientId;
    }

    get databaseName(): string {
        return this._databaseName;
    }

    get schemaName(): string {
        return this._schemaName;
    }

    get dbUser(): string {
        return this._dbUser;
    }

    get dbPassword(): string {
        return this._dbPassword;
    }

    get dbHost(): string {
        return this._dbHost;
    }
}