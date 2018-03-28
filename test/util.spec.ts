import { expect } from 'chai';

import { intToHex, isHexPrefixed, padToEven, stripHexPrefix } from '../src/util';

describe('util', () => {
    describe('isHexPrefixed()', () => {
        it('should return true for a prefix of 0x', () => {
            expect(isHexPrefixed('0xFF')).to.be.true;
        });

        it('should return false if not prefixed with 0x', () => {
            expect(isHexPrefixed('FF')).to.be.false;
        });
    });

    describe('padToEven()', () => {
        it('should return the orignal hex string for even length', () => {
            expect(padToEven('FF')).to.equal('FF');
        });

        it('should pad/prepend the hex string with 0 for odd length', () => {
            expect(padToEven('F')).to.equal('0F');
        });
    });

    describe('intToHex()', () => {
        it('should transform to hex string and pad', () => {
            expect(intToHex(1)).to.equal('01');
        });
    });

    describe('stripHexPrefix()', () => {
        it('should strip a hex prefix if present, and pad', () => {
            expect(stripHexPrefix('0xF')).to.equal('0F');
        });

        it('should preserve the hex string if not prefixed, and pad', () => {
            expect(stripHexPrefix('F')).to.equal('0F');
        });
    });
});
