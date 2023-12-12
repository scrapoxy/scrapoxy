import * as dotenv from 'dotenv';


if (process.env.DOTENV_FILE) {
    dotenv.config({
        path: process.env.DOTENV_FILE,
    });
}

export default {
    displayName: 'connector-aws-backend',
    preset: '../../../../jest.preset.js',
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
    },
    testEnvironment: 'node',
};
