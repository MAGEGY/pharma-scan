import { defineConfig } from 'jest';

export default defineConfig({
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatchPatterns: ['**/__tests__/**/*.{test,spec}.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'json'],
  collectCoverageFrom: true,
  testTimeout: 30000,
  verbose: true,
  bail: false,
  maxWorkers: '50%',
  maxConcurrency: 5,
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.next/',
    '<rootDir>/.cache/',
    '<rootDir>/dist/',
  ],
});
