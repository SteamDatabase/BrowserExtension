'use strict';

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const yazl = require( 'yazl' );
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

	const chromeManifest = structuredClone( manifest );
	delete chromeManifest.$schema;
	delete chromeManifest.background.scripts;
	delete chromeManifest.browser_specific_settings;

	const json = JSON.stringify( chromeManifest, null, '\t' );
	return CreateArchive( zipPath, json );
}

function ArchiveFirefox()
{
	const zipPath = path.join( __dirname, `steamdb_ext_${version}_firefox.zip` );

	const firefoxManifest = structuredClone( manifest );
	delete firefoxManifest.$schema;
	delete firefoxManifest.background.service_worker;

	const json = JSON.stringify( firefoxManifest, null, '\t' );
	return CreateArchive( zipPath, json );
}

/**
 * @param {string} zipPath
 * @param {string} manifestJson
 */
function CreateArchive( zipPath, manifestJson )
{
	console.log( `Packaging to ${zipPath}` );

	const zip = new yazl.ZipFile();

	zip.addBuffer( Buffer.from( manifestJson ), 'manifest.json' );
	zip.addFile( path.join( __dirname, 'LICENSE' ), 'LICENSE' );
	AddDirectory( zip, path.join( __dirname, 'icons' ), 'icons' );
	AddDirectory( zip, path.join( __dirname, 'options' ), 'options' );
	AddDirectory( zip, path.join( __dirname, 'scripts' ), 'scripts' );
	AddDirectory( zip, path.join( __dirname, 'styles' ), 'styles' );
	AddDirectory( zip, path.join( __dirname, '_locales' ), '_locales' );

	return new Promise( ( resolve, reject ) =>
	{
		const output = fs.createWriteStream( zipPath );
		output.on( 'close', () =>
		{
			console.log( `Written ${output.bytesWritten} total bytes to ${zipPath}` );
			resolve();
		} );
		zip.outputStream.pipe( output );
		zip.outputStream.on( 'error', reject );
		zip.end();
	} );
}

/**
 * @param {yazl.ZipFile} zip
 * @param {string} dirPath
 * @param {string} prefix
 */
function AddDirectory( zip, dirPath, prefix )
{
	for( const entry of fs.readdirSync( dirPath, { withFileTypes: true, recursive: true } ) )
	{
		if( !entry.isFile() )
		{
			continue;
		}

		const fullPath = path.join( entry.parentPath, entry.name );
		const zipName = path.join( prefix, path.relative( dirPath, fullPath ) ).replace( /\\/g, '/' );
		zip.addFile( fullPath, zipName );
	}
}
