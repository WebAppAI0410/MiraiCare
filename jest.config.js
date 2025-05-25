module.exports = {
  preset: 'react-native',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapping: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation)/)'
  ]
};