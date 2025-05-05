module.exports = (api) => {
    api.cache(true);

    return {
        presets: [
            [
                'babel-preset-expo',
                { jsxImportSource: 'nativewind', unstable_transformImportMeta: true },
            ],
            'nativewind/babel',
        ],

        plugins: [
            'babel-plugin-transform-vite-meta-env',
            '@babel/plugin-syntax-import-attributes',
            'react-native-reanimated/plugin',
        ],
    };
};
