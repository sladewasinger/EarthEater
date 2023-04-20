module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        "plugin:vue/essential",
        "@vue/standard",
        "@vue/typescript/recommended"
    ],
    parserOptions: {
        ecmaVersion: 2020,
        parser: "@typescript-eslint/parser"
    },
    plugins: ["vue", "@typescript-eslint"],
    rules: {}
};
