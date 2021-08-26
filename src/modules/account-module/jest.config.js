module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	collectCoverageFrom: ['resolvers/**/*.{ts,tsx}'],
	testPathIgnorePatterns: ['<rootDir>/dist/'],
};
