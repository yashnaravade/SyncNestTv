module.exports = {
  root: true,
  extends: ['next/core-web-vitals', '../../.eslintrc.cjs'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
};
