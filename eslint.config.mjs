import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig( [
	{
		ignores: [ 'node_modules/*' ],
	},
	{
		files: [ '**/*.js', '**/*.mjs' ],
		extends: [
			'js/all',
			'js/recommended',
			'jsdoc/flat/recommended-typescript-flavor',
			'@stylistic/recommended',
		],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.webextensions,

				_t: 'readonly',
				ExtensionApi: 'readonly',
				GetAppIDFromUrl: 'readonly',
				GetCurrentAppID: 'readonly',
				GetHomepage: 'readonly',
				GetLanguage: 'readonly',
				GetLocalResource: 'readonly',
				GetOption: 'readonly',
				SendMessageToBackgroundScript: 'readonly',
				SetOption: 'readonly',
				WriteLog: 'readonly',
			},
			sourceType: 'commonjs',
		},
		plugins: {
			js,
			jsdoc,
			'@stylistic': stylistic,
		},
		rules: {
			'jsdoc/reject-any-type': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-property-description': 'off',
			'jsdoc/require-returns-description': 'off',
			'jsdoc/require-returns': 'off',
			camelcase: 'off',
			'capitalized-comments': 'off',
			'class-methods-use-this': 'off',
			complexity: 'off',
			'consistent-this': 'off',
			'default-case': 'off',
			'func-name-matching': 'off',
			'func-names': 'off',
			'func-style': 'off',
			'id-length': 'off',
			'init-declarations': 'off',
			'max-classes-per-file': 'off',
			'max-depth': 'off',
			'max-lines-per-function': 'off',
			'max-lines': 'off',
			'max-params': 'off',
			'max-statements': 'off',
			'new-cap': 'off',
			'no-alert': 'off',
			'no-bitwise': 'off',
			'no-console': 'off',
			'no-continue': 'off',
			'no-implicit-coercion': 'off',
			'no-inline-comments': 'off',
			'no-invalid-this': 'off',
			'no-magic-numbers': 'off',
			'no-multi-assign': 'off',
			'no-negated-condition': 'off',
			'no-nested-ternary': 'off',
			'no-param-reassign': 'off',
			'no-plusplus': 'off',
			'no-ternary': 'off',
			'no-undefined': 'off',
			'no-underscore-dangle': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'no-useless-assignment': 'off',
			'no-var': [ 'error' ],
			'no-warning-comments': 'off',
			'one-var': 'off',
			'prefer-arrow-callback': 'off',
			'prefer-const': [ 'error' ],
			'prefer-destructuring': 'off',
			'prefer-named-capture-group': 'off',
			'prefer-rest-params': 'off',
			'prefer-template': 'off',
			'require-atomic-updates': 'off',
			'require-unicode-regexp': 'off',
			'sort-keys': 'off',
			strict: [ 'error', 'global' ],
			'@stylistic/array-bracket-spacing': [ 'error', 'always' ],
			'@stylistic/arrow-parens': [ 'error', 'always' ],
			'@stylistic/brace-style': [ 'error', 'allman' ],
			'@stylistic/comma-dangle': [ 'error', 'only-multiline' ],
			'@stylistic/computed-property-spacing': [ 'error', 'always' ],
			'@stylistic/indent-binary-ops': [ 'error', 'tab' ],
			'@stylistic/indent': [ 'error', 'tab', { SwitchCase: 1 } ],
			'@stylistic/line-comment-position': 'off',
			'@stylistic/max-statements-per-line': [ 'error', { max: 3 } ],
			'@stylistic/multiline-comment-style': 'off',
			'@stylistic/no-tabs': 'off',
			'@stylistic/no-trailing-spaces': [ 'error' ],
			'@stylistic/object-curly-spacing': [ 'error', 'always' ],
			'@stylistic/operator-linebreak': [ 'error', 'after' ],
			'@stylistic/quote-props': [ 'error', 'as-needed' ],
			'@stylistic/semi': [ 'error', 'always' ],
			'@stylistic/space-before-function-paren': [ 'error', 'never' ],
			'@stylistic/space-in-parens': [ 'error', 'always' ],
			'@stylistic/keyword-spacing': [ 'error', {
				before: false,
				after: false,

				overrides: {
					async: {
						after: true,
					},

					await: {
						after: true,
					},

					case: {
						after: true,
					},

					return: {
						after: true,
					},

					const: {
						after: true,
					},

					let: {
						after: true,
					},

					of: {
						before: true,
						after: true,
					},

					as: {
						before: true,
						after: true,
					},

					from: {
						before: true,
						after: true,
					},

					static: {
						after: true,
					},

					import: {
						after: true,
					},

					default: {
						after: true,
					},

					throw: {
						after: true,
					},
				},
			} ],
		},
	},
	{
		files: [ '*.mjs' ],
		languageOptions: {
			sourceType: 'module',
		},
	},
	{
		files: [ 'build.js', 'version.js' ],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
] );
