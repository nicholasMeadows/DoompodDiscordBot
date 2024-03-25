import LogLevel from "./model/enum/log-level";

export default class Log {
    static LOG_LEVEL: LogLevel;

    private instance: object;

    constructor(instance: object) {
        this.instance = instance;
    }

    debug(args: any) {
        if (!this.checkLogLevel(LogLevel.DEBUG))
            return;
        this.printMessage(LogLevel.DEBUG, args)
    }

    info(args: any) {
        if (!this.checkLogLevel(LogLevel.INFO))
            return;
        this.printMessage(LogLevel.INFO, args)
    }

    warn(args: any) {
        if (!this.checkLogLevel(LogLevel.WARN))
            return;
        this.printMessage(LogLevel.WARN, args)
    }

    error(args: any) {
        if (!this.checkLogLevel(LogLevel.ERROR))
            return;
        this.printMessage(LogLevel.ERROR, args)
    }

    fatal(args: any) {
        if (!this.checkLogLevel(LogLevel.FATAL))
            return;
        this.printMessage(LogLevel.FATAL, args)
    }

    private printMessage(requestedLogLevel: LogLevel, args: any) {
        let colorStr = '';
        switch (requestedLogLevel) {
            case LogLevel.DEBUG:
                colorStr = '\x1b[32m'
                break;
            case LogLevel.INFO:
                colorStr = '\x1b[34m'
                break;
            case LogLevel.WARN:
                colorStr = '\x1b[33m'
                break;
            case LogLevel.ERROR:
                colorStr = '\x1b[35m'
                break;
            case LogLevel.FATAL:
                colorStr = '\x1b[31m'
                break;
        }
        console.log(`${colorStr}%s${colorStr}`, `${this.createDateStr()}-${Log.LOG_LEVEL}-${this.instance.constructor.name}:`, args, "\x1b[0m");
    }

    private checkLogLevel(requestedLogLevelMessage: LogLevel) {
        // if (requestedLogLevelMessage === LogLevel.DEBUG) {
        //     return Log.LOG_LEVEL === LogLevel.DEBUG || Log.LOG_LEVEL === LogLevel.INFO || Log.LOG_LEVEL === LogLevel.WARN || Log.LOG_LEVEL === LogLevel.ERROR || Log.LOG_LEVEL === LogLevel.FATAL;
        // } else if (requestedLogLevelMessage === LogLevel.INFO) {
        //     return Log.LOG_LEVEL === LogLevel.INFO || Log.LOG_LEVEL === LogLevel.WARN || Log.LOG_LEVEL === LogLevel.ERROR || Log.LOG_LEVEL === LogLevel.FATAL;
        // } else if (requestedLogLevelMessage === LogLevel.WARN) {
        //     return Log.LOG_LEVEL === LogLevel.WARN || Log.LOG_LEVEL === LogLevel.ERROR || Log.LOG_LEVEL === LogLevel.FATAL;
        // } else if (requestedLogLevelMessage === LogLevel.ERROR) {
        //     return Log.LOG_LEVEL === LogLevel.ERROR || Log.LOG_LEVEL === LogLevel.FATAL;
        // } else if (requestedLogLevelMessage === LogLevel.FATAL) {
        //     return Log.LOG_LEVEL === LogLevel.FATAL;
        // }


        if (requestedLogLevelMessage === LogLevel.DEBUG) {
            return Log.LOG_LEVEL === LogLevel.DEBUG;
        } else if (requestedLogLevelMessage === LogLevel.INFO) {
            return Log.LOG_LEVEL === LogLevel.DEBUG || Log.LOG_LEVEL === LogLevel.INFO;
        } else if (requestedLogLevelMessage === LogLevel.WARN) {
            return Log.LOG_LEVEL === LogLevel.DEBUG || Log.LOG_LEVEL === LogLevel.INFO || Log.LOG_LEVEL === LogLevel.WARN;
        } else if (requestedLogLevelMessage === LogLevel.ERROR) {
            return Log.LOG_LEVEL === LogLevel.DEBUG || Log.LOG_LEVEL === LogLevel.INFO || Log.LOG_LEVEL === LogLevel.WARN || Log.LOG_LEVEL === LogLevel.ERROR;
        } else if (requestedLogLevelMessage === LogLevel.FATAL) {
            return Log.LOG_LEVEL === LogLevel.DEBUG || Log.LOG_LEVEL === LogLevel.INFO || Log.LOG_LEVEL === LogLevel.WARN || Log.LOG_LEVEL === LogLevel.ERROR || Log.LOG_LEVEL === LogLevel.FATAL;
        }

        return false;
    }

    private createDateStr() {
        const date = new Date();
        let day = '';
        switch (date.getDay()) {
            case 0:
                day = 'Sun'
                break;
            case 1:
                day = 'Mon'
                break;
            case 2:
                day = 'Tues'
                break;
            case 3:
                day = 'Wend'
                break;
            case 4:
                day = 'Thur'
                break;
            case 5:
                day = 'Fri'
                break;
            case 6:
                day = 'Sat'
                break;
        }

        let month = ''
        switch (date.getMonth()) {
            case 0:
                month = 'Jan'
                break;
            case 1:
                month = 'Feb'
                break;
            case 2:
                month = 'Mar'
                break;
            case 3:
                month = 'Apr'
                break;
            case 4:
                month = 'May'
                break;
            case 5:
                month = 'Jun'
                break;
            case 6:
                month = 'Jul'
                break;
            case 7:
                month = 'Aug'
                break;
            case 8:
                month = 'Sep'
                break;
            case 9:
                month = 'Oct'
                break;
            case 10:
                month = 'Nov'
                break;
            case 11:
                month = 'Dec'
                break;
        }

        return `${day} ${month} ${date.getDate()} ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    }
}