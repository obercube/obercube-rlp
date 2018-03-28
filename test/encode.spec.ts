import { Buffer } from 'buffer';
import { expect } from 'chai';

import { Encodable, encode } from '../src/encode';

describe('encode()', () => {
    let sut: Buffer;

    describe('typeof undefined', () => {
        it('should handle', () => {
            sut = encode(undefined);

            expect(sut).to.have.lengthOf(1);
            expect(sut[0]).to.equal(0x80);
        });
    });

    describe('typeof number', () => {
        it('should throw for a non-integer value', () => {
            expect(() => encode(Math.PI)).to.throw();
        });

        it('should handle a value of 0', () => {
            sut = encode(0);

            expect(sut).to.have.lengthOf(1);
            expect(sut[0]).to.equal(0x80);
        });

        it('should handle values < 0x80, with an ODD hex length', () => {
            const value = 0x1;

            sut = encode(value);

            expect(sut).to.have.lengthOf(1);
            expect(sut[0]).to.equal(value);
        });

        it('should handle values < 0x80, with an EVEN hex length', () => {
            const value = 0x7F;

            sut = encode(value);

            expect(sut).to.have.lengthOf(1);
            expect(sut[0]).to.equal(value);
        });

        // NOTE: native js ints have a max safe byte length of 7 (i.e. no more than 53 bits),
        // thus no need to test for bytes > 56

        it('should handle values >= 0x80, with an EVEN hex length', () => {
            const bytes = 1;
            const value = 0x80;

            sut = encode(value);

            expect(sut).to.have.lengthOf(1 + bytes);
            expect(sut[0]).to.equal(0x80 + bytes);
            expect(sut[1]).to.equal(value);
        });

        it('should handle values >= 0x80, with an ODD hex length', () => {
            const bytes = 2;
            const value = 0x8FF;

            sut = encode(value);

            expect(sut).to.have.lengthOf(1 + bytes);
            expect(sut[0]).to.equal(0x80 + bytes);
            expect(sut[1]).to.equal(0x08);
            expect(sut[2]).to.equal(0xFF);
        });
    });

    describe('typeof string', () => {
        it('should handle a single utf8 char with value < 0x80', () => {
            const value = 'a';

            sut = encode(value);

            expect(sut).to.have.lengthOf(1);
            expect(sut.toString()).to.equal(value);
        });

        // NOTE: unable to test single utf8 char with value >= 0x80, as they become two bytes at that point

        it('should handle lengths < 56', () => {
            const length = 55;
            const value = 'a'.repeat(length);

            sut = encode(value);

            expect(sut).to.have.lengthOf(1 + length);
            expect(sut[0]).to.equal(0x80 + length);
            expect(sut.slice(1).toString()).to.equal(value);
        });

        it('should handle lengths >= 56, that are EVEN in hex', () => {
            const length = 56;
            const lengthByteCount = 1;
            const lengthHex = 0x38;

            const value = 'a'.repeat(length);

            sut = encode(value);

            expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
            expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
            expect(sut[1]).to.equal(lengthHex);
            expect(sut.slice(2).toString()).to.equal(value);
        });

        it('should handle lengths >= 56, that are ODD in hex', () => {
            const length = 256;
            const lengthByteCount = 2;
            const lengthHex = 0x100;

            const value = 'a'.repeat(length);

            sut = encode(value);

            expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
            expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
            expect(sut[1]).to.equal(0x01);
            expect(sut[2]).to.equal(0x00);
            expect(sut.slice(3).toString()).to.equal(value);
        });

        describe('is hex prefixed', () => {
            it('should handle ODD length chars, with values < 0x80', () => {
                sut = encode('0x1');

                expect(sut).to.have.lengthOf(1);
                expect(sut[0]).to.equal(0x1);
            });

            it('should handle EVEN length chars, with values < 0x80', () => {
                sut = encode('0x7F');

                expect(sut).to.have.lengthOf(1);
                expect(sut[0]).to.equal(0x7F);
            });

            it('should handle EVEN length chars, with byte length < 56', () => {
                const length = 1;
                const value = '0x80';

                sut = encode(value);

                expect(sut).to.have.lengthOf(1 + length);
                expect(sut[0]).to.equal(0x80 + length);
                expect(sut[1]).to.equal(0x80);
            });

            it('should handle ODD length chars, with byte length < 56', () => {
                const length = 2;
                const value = '0xFF0';

                sut = encode(value);

                expect(sut).to.have.lengthOf(1 + length);
                expect(sut[0]).to.equal(0x80 + length);
                expect(sut[1]).to.equal(0x0F);
                expect(sut[2]).to.equal(0xF0);
            });

            it('should handle EVEN length chars, with byte length >= 56 that is EVEN in hex', () => {
                const length = 56;
                const lengthByteCount = 1;
                const lengthHex = 0x38;

                const value = `0x${'80'.repeat(length)}`;

                sut = encode(value);

                expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
                expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
                expect(sut[1]).to.equal(lengthHex);
                sut.slice(2).forEach(v => expect(v).to.equal(0x80));
            });

            it('should handle EVEN length chars, with byte length >= 56 that is ODD in hex', () => {
                const length = 256;
                const lengthByteCount = 2;
                const lengthHex = 0x100;

                const value = `0x${'80'.repeat(length)}`;

                sut = encode(value);

                expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
                expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
                expect(sut[1]).to.equal(0x01);
                expect(sut[2]).to.equal(0x00);
                sut.slice(3).forEach(v => expect(v).to.equal(0x80));
            });

            it('should handle ODD length chars, with byte length >= 56 that is EVEN in hex', () => {
                const length = 56;
                const lengthByteCount = 1;
                const lengthHex = 0x38;

                const value = `0xF${'80'.repeat(length - 1)}`;

                sut = encode(value);

                expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
                expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
                expect(sut[1]).to.equal(lengthHex);
                expect(sut[2]).to.equal(0x0F);
                sut.slice(3).forEach(v => expect(v).to.equal(0x80));
            });

            it('should handle ODD length chars, with byte length >= 56 that is ODD in hex', () => {
                const length = 256;
                const lengthByteCount = 2;
                const lengthHex = 0x100;

                const value = `0xF${'80'.repeat(length - 1)}`;

                sut = encode(value);

                expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
                expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
                expect(sut[1]).to.equal(0x01);
                expect(sut[2]).to.equal(0x00);
                expect(sut[3]).to.equal(0x0F);
                sut.slice(4).forEach(v => expect(v).to.equal(0x80));
            });
        });
    });

    describe('typeof object', () => {
        it('should handle a value of null', () => {
            sut = encode(null);

            expect(sut).to.have.lengthOf(1);
            expect(sut[0]).to.equal(0x80);
        });

        it('should throw for a value that is not encodable', () => {
            expect(() => encode({} as any)).to.throw();
        });

        ['Buffer', 'EncodableObject'].forEach(obj => {
            describe(obj, () => {
                function createObject(value: number[]): Encodable {
                    const buffer = new Buffer(value);
                    return (obj === 'Buffer') ? buffer : { toBuffer: () => buffer };
                }

                it('should handle a single byte with value < 0x80', () => {
                    const value = [0x79];
                    const object = createObject(value);

                    sut = encode(object);

                    expect(sut).to.have.lengthOf(1);
                    expect(sut[0]).to.equal(value[0]);
                });

                it('should handle lengths < 56', () => {
                    const length = 55;

                    const value = Array.from({ length }, i => 0xFF);
                    const object = createObject(value);

                    sut = encode(object);

                    expect(sut).to.have.lengthOf(1 + length);
                    expect(sut[0]).to.equal(0x80 + length);
                    expect(sut.slice(1).equals(new Buffer(value))).to.be.true;
                });

                it('should handle lengths >= 56, that are ODD in hex', () => {
                    const length = 56;
                    const lengthByteCount = 1;
                    const lengthHex = 0x38;

                    const value = Array.from({ length }, i => 0xFF);
                    const object = createObject(value);

                    sut = encode(object);

                    expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
                    expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
                    expect(sut[1]).to.equal(lengthHex);
                    expect(sut.slice(2).equals(new Buffer(value))).to.be.true;
                });

                it('should handle lengths >= 56, that are EVEN in hex', () => {
                    const length = 256;
                    const lengthByteCount = 2;
                    const lengthHex = 0x100;

                    const value = Array.from({ length }, i => 0xFF);
                    const object = createObject(value);

                    sut = encode(object);

                    expect(sut).to.have.lengthOf(1 + lengthByteCount + length);
                    expect(sut[0]).to.equal(0x80 + 55 + lengthByteCount);
                    expect(sut[1]).to.equal(0x01);
                    expect(sut[2]).to.equal(0x00);
                    expect(sut.slice(3).equals(new Buffer(value))).to.be.true;
                });
            });
        });
    });

    describe('instanceof Array', () => {
        it('should handle a single array', () => {
            const value: Encodable = [];

            sut = encode(value);

            expect(sut).to.have.lengthOf(1);
            expect(sut[0]).to.equal(0xC0);
        });

        it('should handle a nested array', () => {
            const value = [[]];

            sut = encode(value);

            expect(sut).to.have.lengthOf(2);
            expect(sut[0]).to.equal(0xC1);
            expect(sut[1]).to.equal(0xC0);
        });

        it('should handle multiple nested arrays', () => {
            const value = [[], [[]]];

            sut = encode(value);

            expect(sut).to.have.lengthOf(4);
            expect(sut[0]).to.equal(0xC3);
            expect(sut[1]).to.equal(0xC0);
            expect(sut[2]).to.equal(0xC1);
            expect(sut[3]).to.equal(0xC0);
        });

        it('should handle an array of all possible EncodableValue types', () => {
            const value = [
                undefined,
                null,
                0,
                'a',
                new Buffer([0x01]),
                { toBuffer: () => new Buffer([0x7F]) }
            ];

            sut = encode(value);

            expect(sut).to.have.lengthOf(7);
            expect(sut[0]).to.equal(0xC6);
            expect(sut[1]).to.equal(0x80);
            expect(sut[2]).to.equal(0x80);
            expect(sut[3]).to.equal(0x80);
            expect(sut[4]).to.equal('a'.charCodeAt(0));
            expect(sut[5]).to.equal(0x01);
            expect(sut[6]).to.equal(0x7F);
        });
    });
});
