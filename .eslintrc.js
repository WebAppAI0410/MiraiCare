module.exports = {
  extends: [
    'expo',
    '@react-native-community',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Add custom rules here
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-native/no-inline-styles': 'warn',
  },
  env: {
    jest: true,
    'react-native/react-native': true,
  },
}; 