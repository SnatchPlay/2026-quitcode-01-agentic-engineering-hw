// `eslint-config-next`'s dist files already export a plain flat-config array
// (not a legacy shareable-config object) — going through `FlatCompat.extends()`
// double-wraps that and made ESLint 9.39 crash trying to serialize a circular
// react-plugin structure while formatting an unrelated validation error.
// Importing the flat arrays directly sidesteps the compat shim entirely.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
