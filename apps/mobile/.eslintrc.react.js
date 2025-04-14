module.exports = {
    extends: ['./.eslintrc.js', './.eslintrc.typescript.js'],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        // React specific rules
        'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
        'react/self-closing-comp': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/display-name': 'off',
        'react/jsx-pascal-case': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-uses-react': 'off',
        'react/jsx-uses-vars': 'error',
    },
    overrides: [
        {
            files: ['*.tsx', '*.jsx'],
            rules: {
                // Add any JSX/TSX specific overrides here
            },
        },
    ],
};
