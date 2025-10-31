/**
 * ESLint rules to enforce type-safe navigation
 *
 * To enable these rules project-wide, merge this into your root .eslintrc.js:
 *
 * module.exports = {
 *   ...
 *   rules: {
 *     ...require('./lib/navigation/.eslintrc.js').rules,
 *   }
 * }
 */

module.exports = {
  rules: {
    // Prevent direct string literal navigation
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='router'][callee.property.name='push'] > Literal",
        message: 'Use navigateTo() from @/lib/navigation/routes instead of router.push() with string literals. Example: navigateTo(router, "/path")',
      },
      {
        selector: "CallExpression[callee.object.name='router'][callee.property.name='push'] > TemplateLiteral",
        message: 'Use navigateTo() from @/lib/navigation/routes instead of router.push() with template literals. Example: navigateTo(router, "/path/[id]", { id })',
      },
      {
        selector: "CallExpression[callee.object.name='router'][callee.property.name='replace'] > Literal",
        message: 'Use navigateTo() from @/lib/navigation/routes instead of router.replace() with string literals. Example: navigateTo(router, "/path", { replace: true })',
      },
      {
        selector: "CallExpression[callee.object.name='router'][callee.property.name='replace'] > TemplateLiteral",
        message: 'Use navigateTo() from @/lib/navigation/routes instead of router.replace() with template literals. Example: navigateTo(router, "/path/[id]", { id }, { replace: true })',
      },
      {
        selector: "TSAsExpression[typeAnnotation.typeName.name='any']",
        message: 'Avoid "as any" casts in navigation code. Use proper typing from @/lib/navigation/routes',
      },
    ],

    // Warn on any usage of router.push/replace to encourage migration
    'no-restricted-properties': [
      'warn',
      {
        object: 'router',
        property: 'push',
        message: 'Consider using navigateTo() from @/lib/navigation/routes for type-safe navigation',
      },
      {
        object: 'router',
        property: 'replace',
        message: 'Consider using navigateTo() from @/lib/navigation/routes for type-safe navigation',
      },
    ],
  },
};
