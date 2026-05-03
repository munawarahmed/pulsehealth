/**
 * Jest config — targets pure logic only.
 *
 * Pure modules under src/logic/ and src/services/llmMiddleware.ts are
 * platform-agnostic, so we run them in Node without the React Native
 * preset. This keeps the test loop fast (~1s) and avoids dragging in
 * Metro / Babel-Jest transformations.
 *
 * If you want to test screens or stores later, add a separate `jest-rn`
 * project under projects[]; don't pollute this config.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: { jsx: 'react', esModuleInterop: true, module: 'commonjs' },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
};
