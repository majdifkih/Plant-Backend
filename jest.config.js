/** @type {import('ts-jest').JestConfigWithTsJest} **/
process.env.NODE_ENV = 'test';
module.exports = {
  roots: ["<rootDir>/tests"],
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  preset: 'ts-jest',
  testMatch: ['**/tests/**/*.test.ts'],
};