import { Buffer } from 'buffer';

import { intToHex, isHexPrefixed, stripHexPrefix } from './util';

export interface EncodableObject {
    toBuffer(): Buffer;
}

type EncodableValue = undefined | null | number | string | Buffer | EncodableObject;
interface EncodableArray extends Array<EncodableValue | EncodableArray> {}

export type Encodable = EncodableValue | EncodableArray;

export function encode(input: Encodable): Buffer {
    let buffer: Buffer;
    let offset: number;

    if (input instanceof Array) {
        buffer = Buffer.concat(input.map(encode));
        offset = 0xC0;
    } else {
        buffer = toBuffer(input);
        offset = 0x80;

        if (buffer.length === 1 && buffer[0] < 0x80) {
            return buffer;
        }
    }

    return Buffer.concat([encodeLength(buffer.length, offset), buffer]);
}

function encodeLength(length: number, offset: number): Buffer {
    if (length < 56) {
        return Buffer.from([offset + length]);
    } else {
        const lengthHex = intToHex(length);
        const lengthByteCount = lengthHex.length / 2;

        const firstByte = intToHex(offset + 55 + lengthByteCount);

        return Buffer.from(firstByte + lengthHex, 'hex');
    }
}

function toBuffer(value: EncodableValue): Buffer {
    if (!value) { // 0, undefined, null => yields [0x80]
        return Buffer.from([]);
    } else if (typeof value === 'number') {
        if (!Number.isInteger(value)) {
            throw new Error(`Unable to encode value: ${value}`);
        }

        return Buffer.from(intToHex(value), 'hex');
    } else if (typeof value === 'string') {
        if (isHexPrefixed(value)) {
            return Buffer.from(stripHexPrefix(value), 'hex');
        } else {
            return Buffer.from(value, 'utf8');
        }
    } else if (Buffer.isBuffer(value)) {
        return value;
    } else if (value.toBuffer) {
        return value.toBuffer();
    } else {
        throw new Error(`Unable to encode value: ${value}`);
    }
}
