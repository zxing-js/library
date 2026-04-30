/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/test/**/*.spec.ts'],
  moduleNameMapper: {
    '^@zxing/library$': '<rootDir>/src/index.ts',
    '^@zxing/library/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/output/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Abstract base class with no tests
    '<rootDir>/src/test/core/pdf417/decoder/ec/AbstractErrorCorrection.spec.ts',
    // Tests commented out pending implementation
    '<rootDir>/src/test/core/oned/Ean13BlackBox1.spec.ts',
    '<rootDir>/src/test/core/qrcode/QRCodeBlackBox.3.spec.ts',
    '<rootDir>/src/test/core/qrcode/QRCodeBlackBox.4.spec.ts',
    '<rootDir>/src/test/core/pdf417/PDF417BlackBox.4.spec.ts',
  ],
  setupFiles: ['<rootDir>/src/test/jest.setup.ts'],
  testTimeout: 200000,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
};
