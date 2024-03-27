import Log from "./log";
import {HTTP_RETRIES, HTTP_WAIT_BETWEEN_RETRIES_MS} from "./constants";

export default class HttpClient {
    private logger = new Log(this);

    constructor() {
    }

    request<T>(url: string, requestInit?: RequestInit): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            for (let requestCount = 0; requestCount < HTTP_RETRIES; requestCount++) {
                try {
                    const response = await fetch(url, requestInit);
                    const responseText = await response.text();
                    resolve(JSON.parse(responseText));
                } catch (e) {
                    if (requestCount + 1 === HTTP_RETRIES) {
                        this.logger.warn(`HTTP Request ${requestInit === undefined ? 'GET' : requestInit.method} to ${url} could not be completed.`, e);
                        reject(e);
                        return;
                    }
                    this.logger.warn(`Request number ${requestCount + 1}. HTTP Request ${requestInit === undefined ? 'GET' : requestInit.method} to ${url} failed. Trying again in ${HTTP_WAIT_BETWEEN_RETRIES_MS / 1000} seconds`, e);
                    await this.wait(HTTP_WAIT_BETWEEN_RETRIES_MS);
                }
            }
            reject('HTTP Request failed...');
        })
    }

    private async wait(ms: number) {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000));
    }
}