export default class Config {

    private declare readonly _token: string;
    private declare readonly _clientId: string;
    private declare readonly _dbName: string;
    private declare readonly _dbUsername: string;
    private declare readonly _dbPassword: string;
    private declare readonly _dbPort: number;
    private declare readonly _dbHost: string;
    private declare readonly _ownerGuildDiscordId: string | undefined

    constructor(token: string, clientId: string, dbName: string,
                dbUsername: string, dbPassword: string, dbPort: number, dbHost: string, ownerGuildDiscordId: string | undefined) {
        this._token = token;
        this._clientId = clientId;
        this._dbName = dbName;
        this._dbUsername = dbUsername;
        this._dbPassword = dbPassword;
        this._dbPort = dbPort;
        this._dbHost = dbHost
        this._ownerGuildDiscordId = ownerGuildDiscordId;
    }


    get token(): string {
        return this._token;
    }

    get clientId(): string {
        return this._clientId;
    }

    get dbName(): string {
        return this._dbName;
    }

    get dbUsername(): string {
        return this._dbUsername;
    }

    get dbPassword(): string {
        return this._dbPassword;
    }

    get dbPort(): number {
        return this._dbPort;
    }

    get dbHost(): string {
        return this._dbHost;
    }

    get ownerGuildDiscordId(): string | undefined {
        return this._ownerGuildDiscordId;
    }
}
