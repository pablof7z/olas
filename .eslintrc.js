module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        'react-native/react-native': true,
        es2024: true,
    },
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:react-native/all',
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
    ignorePatterns: [
        'node_modules/**',
        'build/**',
        '.expo/**',
        '.expo-shared/**',
        '.turbo/**',
        'ios/**',
        'android/**',
        '.vscode/**',
        '.goose/**',
        '.maestro/**',
        'dist/**',
        '**/*.d.ts',
        '__mocks__/**',
        '.eslintrc.js',
    ],
    rules: {
        // TypeScript
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            },
        ],
        '@typescript-eslint/consistent-type-imports': [
            'error',
            {
                prefer: 'type-imports',
                fixStyle: 'inline-type-imports',
            },
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

        // React
        'react/jsx-boolean-value': ['error', 'never'],
        'react/jsx-curly-brace-presence': [
            'error',
            {
                props: 'never',
                children: 'never',
            },
        ],
        'react/jsx-fragments': ['error', 'syntax'],
        'react/jsx-no-useless-fragment': 'error',
        'react/self-closing-comp': [
            'error',
            {
                component: true,
                html: true,
            },
        ],
        'react/hook-use-state': 'error',
        'react/jsx-sort-props': [
            'error',
            {
                callbacksLast: true,
                shorthandFirst: true,
                ignoreCase: true,
                reservedFirst: true,
            },
        ],

        // React Native
        'react-native/no-unused-styles': 'error',
        'react-native/split-platform-components': 'error',
        'react-native/no-inline-styles': 'error',
        'react-native/no-raw-text': [
            'error',
            {
                skip: ['Text.Link'],
            },
        ],
        'react-native/no-single-element-style-arrays': 'error',

        // General
        'no-console': [
            'warn',
            {
                allow: ['warn', 'error', 'info'],
            },
        ],
        curly: ['error', 'all'],
        eqeqeq: ['error', 'always'],
        'no-return-await': 'error',
        'require-await': 'error',
        'no-nested-ternary': 'error',
        'no-duplicate-imports': 'error',
        'sort-imports': [
            'error',
            {
                ignoreCase: true,
                ignoreDeclarationSort: true,
            },
        ],
    },
};
