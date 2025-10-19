'use strict';

/**
 * Script to extract all translations from _locales folder into a CSV file
 * Groups translations by key, with all languages appearing in columns
 */

const fs = require('fs');
const path = require('path');

interface MessageValue {
	message: string;
	description?: string;
	placeholders?: Record<string, unknown>;
}

interface Messages {
	[key: string]: MessageValue;
}

interface Translations {
	[lang: string]: {
		[key: string]: string;
	};
}

const localesDir = path.join(__dirname, '..', '_locales');
const outputFile = path.join(__dirname, 'translations.csv');

// Get all language directories
const languages = fs.readdirSync(localesDir)
	.filter((file: string) => {
		const stat = fs.statSync(path.join(localesDir, file));
		return stat.isDirectory();
	})
	.sort((a: string, b: string) => {
		// Ensure 'en' comes first
		if (a === 'en') {
			return -1;
		}
		if (b === 'en') {
			return 1;
		}
		// Sort the rest alphabetically
		return a.localeCompare(b);
	});

console.log(`Found ${languages.length} languages:`, languages.join(', '));

// Collect all unique translation keys
const allKeys = new Set<string>();
const translations: Translations = {};

// Read all translation files
for (const lang of languages) {
	const messagesFile = path.join(localesDir, lang, 'messages.json');

	if (!fs.existsSync(messagesFile)) {
		console.warn(`Warning: ${messagesFile} does not exist`);
		continue;
	}

	try {
		const content = fs.readFileSync(messagesFile, 'utf8');
		const messages: Messages = JSON.parse(content);

		translations[lang] = {};

		for (const [key, value] of Object.entries(messages)) {
			allKeys.add(key);

			// Extract the message text
			let message = value.message || '';

			// Replace newlines with spaces
			message = message.replace(/\r?\n/g, ' ');

			translations[lang][key] = message;
		}

		console.log(`Loaded ${Object.keys(messages).length} keys from ${lang}`);
	}
	catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error reading ${messagesFile}:`, errorMessage);
	}
}

// Sort keys alphabetically
const sortedKeys = Array.from(allKeys).sort();

console.log(`Total unique translation keys: ${sortedKeys.length}`);

// Escape CSV field (handle commas, quotes, and newlines)
function escapeCsvField(field: string | null | undefined): string {
	if (field === null || field === undefined) {
		return '';
	}

	const str = String(field);

	// If field contains comma, quote, or newline, wrap in quotes and escape quotes
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}

	return str;
}

// Build CSV content
const csvLines: string[] = [];

// Header row: Translation Key, Language Code, Message
csvLines.push(['Translation Key', 'Language Code', 'Message'].map(escapeCsvField).join(','));

// Data rows: one row per translation key per language
for (const key of sortedKeys) {
	for (const lang of languages) {
		const translation = translations[lang][key] || '';
		const row = [key, lang, translation];
		csvLines.push(row.map(escapeCsvField).join(','));
	}
}

// Write to file
const csvContent = csvLines.join('\n');
fs.writeFileSync(outputFile, csvContent, 'utf8');

console.log(`\nCSV file created successfully: ${outputFile}`);
console.log(`Total rows: ${csvLines.length} (1 header + ${sortedKeys.length} keys × ${languages.length} languages)`);
console.log(`Format: Each translation key has ${languages.length} rows (one per language)`);
