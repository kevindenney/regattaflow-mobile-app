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
    // Disable rules that may not be available in this ESLint version
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
    'import/no-unresolved': 'off', // TypeScript handles this
  },
};
