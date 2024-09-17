import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import globals from "globals";
import js from "@eslint/js";
import path from "node:path";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const compat = new FlatCompat( {
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
} );

export default[
	...compat.extends( "eslint:all" ),
	...compat.extends( "eslint:recommended" ),
	{
		ignores: [ "node_modules/*" ],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.webextensions,

				_t: "readonly",
				ExtensionApi: "readonly",
				GetAppIDFromUrl: "readonly",
				GetCurrentAppID: "readonly",
				GetHomepage: "readonly",
				GetLanguage: "readonly",
				GetLocalResource: "readonly",
				GetOption: "readonly",
				SendMessageToBackgroundScript: "readonly",
				SetOption: "readonly",
				WriteLog: "readonly",
			},
			sourceType: "commonjs",
		},

		rules: {
			"array-bracket-spacing": [ "error", "always" ],
			"brace-style": [ "error", "allman" ],
			"camelcase": "off",
			"capitalized-comments": "off",
			"class-methods-use-this": "off",
			"complexity": "off",
			"computed-property-spacing": [ "error", "always" ],
			"consistent-return": "off",
			"consistent-this": "off",
			"default-case": "off",
			"func-name-matching": "off",
			"func-names": "off",
			"func-style": "off",
			"guard-for-in": "off",
			"id-length": "off",
			"indent": [ "error", "tab", { SwitchCase: 1 } ],
			"init-declarations": "off",
			"line-comment-position": "off",
			"max-classes-per-file": "off",
			"max-depth": "off",
			"max-lines-per-function": "off",
			"max-lines": "off",
			"max-params": "off",
			"max-statements": "off",
			"multiline-comment-style": "off",
			"new-cap": "off",
			"no-alert": "off",
			"no-bitwise": "off",
			"no-console": "off",
			"no-continue": "off",
			"no-implicit-coercion": "off",
			"no-inline-comments": "off",
			"no-invalid-this": "off",
			"no-magic-numbers": "off",
			"no-multi-assign": "off",
			"no-negated-condition": "off",
			"no-nested-ternary": "off",
			"no-param-reassign": "off",
			"no-plusplus": "off",
			"no-shadow": "off",
			"no-tabs": "off",
			"no-ternary": "off",
			"no-trailing-spaces": [ "error" ],
			"no-undefined": "off",
			"no-underscore-dangle": "off",
			"no-unused-vars": "off",
			"no-use-before-define": "off",
			"no-useless-assignment": "off",
			"no-var": [ "error" ],
			"no-warning-comments": "off",
			"object-curly-spacing": [ "error", "always" ],
			"object-shorthand": "off",
			"one-var": "off",
			"prefer-arrow-callback": "off",
			"prefer-const": [ "error" ],
			"prefer-destructuring": "off",
			"prefer-named-capture-group": "off",
			"prefer-rest-params": "off",
			"prefer-template": "off",
			"require-unicode-regexp": "off",
			"semi": [ "error", "always" ],
			"sort-keys": "off",
			"space-before-function-paren": [ "error", "never" ],
			"space-in-parens": [ "error", "always" ],
			"strict": [ "error", "global" ],
			"keyword-spacing": [ "error", {
				before: false,
				after: false,

				overrides: {
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
				},
			} ],
		},
	},
	{
		files: [ "*.mjs" ],

		languageOptions: {
			sourceType: "module",
		},
	},
	{
		files: [ "build.js", "version.js" ],

		languageOptions: {
			globals: {
				...globals.node
			},
		}
	}
];
