// Jest settings for the MemoCare FRONTEND (React Native / Expo) tests.
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/tests/cg'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/cg/setup/jest.setup.ts'],
moduleNameMapper: {
  '^@expo/vector-icons$': '<rootDir>/tests/cg/setup/vectorIconsMock.js',
  '^react-native-reanimated$': '<rootDir>/tests/cg/setup/reanimatedMock.js',
  '^@/(.*)$': '<rootDir>/$1',
},
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|react-native-css-interop|@shopify/react-native-skia|react-native-reanimated|react-native-worklets))',
  ],
  verbose: true,
  collectCoverageFrom: [
    'src/utils/recommendationEngine.ts',
    'src/services/caregiver/llmService.ts',
    'src/components/caregiver/insights/AiCoachCard.tsx',
    'src/components/caregiver/insights/BurnoutCard.tsx',
    'src/components/caregiver/more/notifications/*.tsx',
  ],
  coverageDirectory: 'test-reports/coverage',
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'MemoCare Caregiver Portal - Frontend Test Report',
      outputPath: 'test-reports/frontend-test-report.html',
      includeFailureMsg: true, sort: 'status',
    }],
  ],
};
