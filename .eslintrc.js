module.exports = {
  extends: ['expo', 'plugin:import/typescript'],
  ignorePatterns: ['/dist/*'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        paths: ['.'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    },
  },
  rules: {
    'import/no-unresolved': 'off', // ✅ safe
    'import/extensions': [
      'error',
      'ignorePackages',
      { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' }
    ],
  },
};
