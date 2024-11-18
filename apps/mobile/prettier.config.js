module.exports = {
    printWidth: 160, // Allow longer lines before wrapping
    tabWidth: 4,
    singleQuote: true,
    bracketSameLine: true,
    trailingComma: 'es5',
    arrowParens: 'always',

    plugins: [require.resolve('prettier-plugin-tailwindcss')],
    tailwindAttributes: ['className'],
};
