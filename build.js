'use strict';

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const archiver = require( 'archiver' );
const manifest = require( './manifest.json' );
const version = manifest.version.replace( /\./g, '_' );

delete manifest.$schema;

( async() =>
{
	await ArchiveChromium();
	await ArchiveFirefox();
} )();

function ArchiveChromium()
{
	const zipPath = path.join( __dirname, `steamdb_ext_${version}.zip` );
	const archive = PrepareArchive( zipPath );

	const chromeManifest = structuredClone( manifest );
	delete chromeManifest.$schema;
	delete chromeManifest.background.scripts;
	delete chromeManifest.browser_specific_settings;

	const json = JSON.stringify( chromeManifest, null, '\t' );
	archive.append( json, { name: 'manifest.json' } );

	return archive.finalize();
}

function ArchiveFirefox()
{
	const zipPath = path.join( __dirname, `steamdb_ext_${version}_firefox.zip` );
	const archive = PrepareArchive( zipPath );

	const firefoxManifest = structuredClone( manifest );
	delete firefoxManifest.$schema;
	delete firefoxManifest.background.service_worker;

	const json = JSON.stringify( firefoxManifest, null, '\t' );
	archive.append( json, { name: 'manifest.json' } );

	return archive.finalize();
}

/**
 * @param {string} zipPath
 */
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
