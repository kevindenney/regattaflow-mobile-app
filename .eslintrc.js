module.exports = {
  extends: ['expo', 'prettier'],
  plugins: [],
  rules: {
    // Warn on console.log and console.debug - allow console.warn and console.error
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],
    // Prevent unused variables except those starting with _
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
  },
};
