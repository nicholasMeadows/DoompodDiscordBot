import {Collection, GridFSBucket, ObjectId} from "mongodb";
import Capybara from "../entity/capybara";

export default class CapybaraRepository {
    declare _capybaraCollection: Collection<Capybara>;
    declare _capybaraGridFSBucket: GridFSBucket;

    constructor(capybaraCollection: Collection<Capybara>, capybaraGridFSBucket: GridFSBucket) {
        this._capybaraCollection = capybaraCollection;
        this._capybaraGridFSBucket = capybaraGridFSBucket;
    }

    async saveCapybara(capybara: Capybara) {
        let result = await this._capybaraCollection.updateOne(
            {
                imageUrl: capybara.imageUrl,
                createdOn: capybara.createdOn
            },
            {
                $set: capybara
            }
        );

        if (result.matchedCount === 0) {
            await this._capybaraCollection.insertOne(capybara);
        }
    }

    saveCapybaraImage(fileName: string, img: Buffer): ObjectId {
        const stream = this._capybaraGridFSBucket.openUploadStream(fileName);
        stream.write(img);
        stream.end();
        return stream.id;
    }

    findCapybaraImageByObjectId(id: ObjectId) {
        return new Promise<Buffer | undefined>((resolve, reject) => {
            let bufferArray: Uint8Array[] = [];
            const downloadStream = this._capybaraGridFSBucket.openDownloadStream(id);

            downloadStream.on('data', (chunk) => {
                bufferArray.push(chunk);
            });
            downloadStream.on('error', (error) => {
                resolve(undefined);
            });
            downloadStream.on('end', () => {
                resolve(Buffer.concat(bufferArray));
            });
        })
    }

    findCapybaraByCreatedOn(startDate: Date, endDate: Date) {
        return this._capybaraCollection.aggregate<Capybara>([
            {
                $match: {
                    createdOn: {
                        $gt: startDate,
                        $lt: endDate
                    }
                }
            }
        ])
    }
}