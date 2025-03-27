module.exports = {
    extends: ['./.eslintrc.js'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-empty-interface': 'warn',
        '@typescript-eslint/ban-ts-comment': [
            'warn',
            {
                'ts-ignore': 'allow-with-description',
                'ts-expect-error': 'allow-with-description',
            },
        ],
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'no-undef': 'off', // TypeScript already checks this
            },
        },
    ],
};
