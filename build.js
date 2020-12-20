const fs = require( 'fs' );
const path = require( 'path' );
const archiver = require( 'archiver' );
const manifest = require( './manifest.json' );

const zipPath = path.join( __dirname, `steamdb_ext_${manifest.version.replace( /\./g, '_' )}.zip` );

console.log( `Packaging to ${zipPath}` );

const output = fs.createWriteStream( zipPath );
const archive = archiver( 'zip' );

output.on( 'close', () =>
{
	console.log( archive.pointer() + ' total bytes' );
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

archive.file( path.join( __dirname, 'manifest.json' ), { name: 'manifest.json' } );
archive.directory( path.join( __dirname, 'icons/' ), 'icons' );
archive.directory( path.join( __dirname, 'options/' ), 'options' );
archive.directory( path.join( __dirname, 'scripts/' ), 'scripts' );
archive.directory( path.join( __dirname, 'styles/' ), 'styles' );
archive.finalize();
