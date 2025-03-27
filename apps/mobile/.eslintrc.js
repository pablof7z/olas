module.exports = {
    extends: ['universe/native'],
    root: true,
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
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // General
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

        // React
        'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
        'react/self-closing-comp': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',

        // Formatting
        indent: ['error', 4],
        quotes: ['error', 'single', { avoidEscape: true }],
    },
    overrides: [
        {
            files: ['*.js'],
            env: {
                node: true,
            },
        },
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint'],
            rules: {
                'no-undef': 'off', // TypeScript already checks this
                '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
                'no-unused-vars': 'off',
            },
        },
        {
            files: ['*.test.js', '*.test.jsx', '*.test.ts', '*.test.tsx', '**/__tests__/**'],
            env: {
                jest: true,
            },
        },
    ],
};
