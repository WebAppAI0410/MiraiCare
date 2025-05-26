module.exports = {
  extends: [
    'expo',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Add custom rules here
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/react-in-jsx-scope': 'off',
  },
  env: {
    jest: true,
    es6: true,
    node: true,
  },
}; 