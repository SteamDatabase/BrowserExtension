'use strict';

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const archiver = require( 'archiver' );
const manifest = require( './manifest.json' );
const version = manifest.version.replace( /\./g, '_' );

( async() =>
{
	await ArchiveChromium();
	await ArchiveFirefox();
} )();

function ArchiveChromium()
{
	const zipPath = path.join( __dirname, `steamdb_ext_${version}.zip` );
	const archive = PrepareArchive( zipPath );

	archive.file( path.join( __dirname, 'manifest.json' ), { name: 'manifest.json' } );
	return archive.finalize();
}

function ArchiveFirefox()
{
	const zipPath = path.join( __dirname, `steamdb_ext_${version}_firefox.zip` );
	const archive = PrepareArchive( zipPath );

	const ffManifest = manifest;
	ffManifest.background =
	{
		scripts:
		[
			'scripts/background.js',
		],
	};
	ffManifest.browser_specific_settings =
	{
		gecko:
		{
			id: 'firefox-extension@steamdb.info',
			strict_min_version: '109.0',
		},
		gecko_android:
		{
			strict_min_version: '120.0',
		},
	};

	for( const web_accessible_resources of ffManifest.web_accessible_resources )
	{
		delete web_accessible_resources.use_dynamic_url; // Unsupported
	}

	const json = JSON.stringify( ffManifest, null, '\t' );

	archive.append( json, { name: 'manifest.json' } );
	return archive.finalize();
}

function PrepareArchive( zipPath )
{
	console.log( `Packaging to ${zipPath}` );

	const output = fs.createWriteStream( zipPath );
	const archive = archiver( 'zip' );

	output.on( 'close', () =>
	{
		console.log( `Written ${archive.pointer()} total bytes to ${zipPath}` );
	} );

	archive.on( 'warning', err =>
	{
		throw err;
	} );

	archive.on( 'error', err =>
	{
		throw err;
	} );

	archive.pipe( output );

	archive.file( path.join( __dirname, 'LICENSE' ), { name: 'LICENSE' } );
	archive.directory( path.join( __dirname, 'icons/' ), 'icons' );
	archive.directory( path.join( __dirname, 'options/' ), 'options' );
	archive.directory( path.join( __dirname, 'scripts/' ), 'scripts' );
	archive.directory( path.join( __dirname, 'styles/' ), 'styles' );
	archive.directory( path.join( __dirname, '_locales/' ), '_locales' );

	return archive;
}
