import MicroQRVersion from '../../../../core/microqr/decoder/MicroQRVersion';

describe('MicroQRVersion', () => {

    it('should return correct dimensions for each version', () => {
        // M1=11, M2=13, M3=15, M4=17
        expect(MicroQRVersion.getVersionForIndicator(0).getDimensionForVersion()).toBe(11);
        expect(MicroQRVersion.getVersionForIndicator(1).getDimensionForVersion()).toBe(13);
        expect(MicroQRVersion.getVersionForIndicator(3).getDimensionForVersion()).toBe(15);
        expect(MicroQRVersion.getVersionForIndicator(5).getDimensionForVersion()).toBe(17);
    });

    it('should return correct version numbers for each indicator', () => {
        expect(MicroQRVersion.getVersionForIndicator(0).getVersionNumber()).toBe(1); // M1
        expect(MicroQRVersion.getVersionForIndicator(1).getVersionNumber()).toBe(2); // M2-L
        expect(MicroQRVersion.getVersionForIndicator(2).getVersionNumber()).toBe(2); // M2-M
        expect(MicroQRVersion.getVersionForIndicator(3).getVersionNumber()).toBe(3); // M3-L
        expect(MicroQRVersion.getVersionForIndicator(4).getVersionNumber()).toBe(3); // M3-M
        expect(MicroQRVersion.getVersionForIndicator(5).getVersionNumber()).toBe(4); // M4-L
        expect(MicroQRVersion.getVersionForIndicator(6).getVersionNumber()).toBe(4); // M4-M
        expect(MicroQRVersion.getVersionForIndicator(7).getVersionNumber()).toBe(4); // M4-Q
    });

    it('should return correct EC level labels', () => {
        expect(MicroQRVersion.getVersionForIndicator(0).getECLevelLabel()).toBeNull(); // M1
        expect(MicroQRVersion.getVersionForIndicator(1).getECLevelLabel()).toBe('L');  // M2-L
        expect(MicroQRVersion.getVersionForIndicator(2).getECLevelLabel()).toBe('M');  // M2-M
        expect(MicroQRVersion.getVersionForIndicator(3).getECLevelLabel()).toBe('L');  // M3-L
        expect(MicroQRVersion.getVersionForIndicator(4).getECLevelLabel()).toBe('M');  // M3-M
        expect(MicroQRVersion.getVersionForIndicator(5).getECLevelLabel()).toBe('L');  // M4-L
        expect(MicroQRVersion.getVersionForIndicator(6).getECLevelLabel()).toBe('M');  // M4-M
        expect(MicroQRVersion.getVersionForIndicator(7).getECLevelLabel()).toBe('Q');  // M4-Q
    });

    it('should return correct total codewords', () => {
        expect(MicroQRVersion.getVersionForIndicator(0).getTotalCodewords()).toBe(5);  // M1: 3+2
        expect(MicroQRVersion.getVersionForIndicator(1).getTotalCodewords()).toBe(10); // M2-L: 5+5
        expect(MicroQRVersion.getVersionForIndicator(2).getTotalCodewords()).toBe(10); // M2-M: 4+6
        expect(MicroQRVersion.getVersionForIndicator(3).getTotalCodewords()).toBe(17); // M3-L: 11+6
        expect(MicroQRVersion.getVersionForIndicator(4).getTotalCodewords()).toBe(17); // M3-M: 9+8
        expect(MicroQRVersion.getVersionForIndicator(5).getTotalCodewords()).toBe(24); // M4-L: 16+8
        expect(MicroQRVersion.getVersionForIndicator(6).getTotalCodewords()).toBe(24); // M4-M: 14+10
        expect(MicroQRVersion.getVersionForIndicator(7).getTotalCodewords()).toBe(24); // M4-Q: 10+14
    });

    it('should return correct data codewords', () => {
        expect(MicroQRVersion.getVersionForIndicator(0).getNumDataCodewords()).toBe(3);  // M1
        expect(MicroQRVersion.getVersionForIndicator(1).getNumDataCodewords()).toBe(5);  // M2-L
        expect(MicroQRVersion.getVersionForIndicator(2).getNumDataCodewords()).toBe(4);  // M2-M
        expect(MicroQRVersion.getVersionForIndicator(3).getNumDataCodewords()).toBe(11); // M3-L
        expect(MicroQRVersion.getVersionForIndicator(4).getNumDataCodewords()).toBe(9);  // M3-M
        expect(MicroQRVersion.getVersionForIndicator(5).getNumDataCodewords()).toBe(16); // M4-L
        expect(MicroQRVersion.getVersionForIndicator(6).getNumDataCodewords()).toBe(14); // M4-M
        expect(MicroQRVersion.getVersionForIndicator(7).getNumDataCodewords()).toBe(10); // M4-Q
    });

    it('should return correct mode indicator bits', () => {
        expect(MicroQRVersion.getVersionForIndicator(0).getModeIndicatorBits()).toBe(0); // M1
        expect(MicroQRVersion.getVersionForIndicator(1).getModeIndicatorBits()).toBe(1); // M2
        expect(MicroQRVersion.getVersionForIndicator(3).getModeIndicatorBits()).toBe(2); // M3
        expect(MicroQRVersion.getVersionForIndicator(5).getModeIndicatorBits()).toBe(3); // M4
    });

    it('should map dimensions back to versions', () => {
        expect(MicroQRVersion.getVersionForDimension(11).getVersionNumber()).toBe(1);
        expect(MicroQRVersion.getVersionForDimension(13).getVersionNumber()).toBe(2);
        expect(MicroQRVersion.getVersionForDimension(15).getVersionNumber()).toBe(3);
        expect(MicroQRVersion.getVersionForDimension(17).getVersionNumber()).toBe(4);
    });

    it('should throw for invalid dimension', () => {
        expect(() => MicroQRVersion.getVersionForDimension(12)).toThrow();
        expect(() => MicroQRVersion.getVersionForDimension(21)).toThrow();
    });

    it('should throw for invalid version indicator', () => {
        expect(() => MicroQRVersion.getVersionForIndicator(-1)).toThrow();
        expect(() => MicroQRVersion.getVersionForIndicator(8)).toThrow();
    });

    it('should build a function pattern of correct size', () => {
        for (let vi = 0; vi < 8; vi += 2) {
            const v = MicroQRVersion.getVersionForIndicator(vi);
            const fp = v.buildFunctionPattern();
            const dim = v.getDimensionForVersion();
            expect(fp.getWidth()).toBe(dim);
            expect(fp.getHeight()).toBe(dim);

            // 9×9 upper-left should be all function modules
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    expect(fp.get(x, y)).toBe(true);
                }
            }
            // Col 0 and row 0 from col/row 9+ should be function modules (timing)
            for (let k = 9; k < dim; k++) {
                expect(fp.get(k, 0)).toBe(true); // row 0 timing
                expect(fp.get(0, k)).toBe(true); // col 0 timing
            }
        }
    });
});
