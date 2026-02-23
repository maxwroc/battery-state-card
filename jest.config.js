module.exports = {
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/test/card/**/*.test.ts',
        '<rootDir>/test/entity/**/*.test.ts'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/dist/battery-state-card.js'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      coveragePathIgnorePatterns: [
        '<rootDir>/test'
      ]
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/test/other/**/*.test.ts'
      ],
      moduleNameMapper: {
        '^lit$': '<rootDir>/test/mocks/lit.mock.ts',
        '^custom-card-helpers$': '<rootDir>/test/mocks/custom-card-helpers.mock.ts'
      },
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      coveragePathIgnorePatterns: [
        '<rootDir>/test'
      ]
    }
  ]
};