/* eslint-disable */
export default {
  displayName: 'api',
  globals: { navigator: { userAgent: 'node.js' } },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^generated/(.*)$': '<rootDir>/generated/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/',
  workerIdleMemoryLimit: '0.2',
  maxWorkers: '50%',
};
