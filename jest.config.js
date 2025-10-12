export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'config/**/*.js',
    '!node_modules/**',
    '!tests/**',
    '!coverage/**',
    '!tracker/**'
  ],
  coverageReporters: ['text', 'lcov'],
};
