'use strict';

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const child_process = require( 'node:child_process' );
const manifestPath = path.join( __dirname, 'manifest.json' );
const version = process.argv[ 2 ];

if( !/^[0-9]+\.[0-9]+$/.test( version ) )
{
	console.error( 'Provide version as the first argument. Example: 3.0' );
	process.exit( 1 );
}

fs.writeFileSync(
	manifestPath,
	fs.readFileSync( manifestPath ).toString().replace( /"version": "[0-9.]+",$/m, `"version": "${version}",` ),
);

child_process.execSync( `git add manifest.json && git commit -m "Increase version to ${version}"`, { stdio: 'inherit' } );
child_process.execSync( `git tag "v${version}" -m "v${version}"`, { stdio: 'inherit' } );
child_process.execSync( 'npm run build', { stdio: 'inherit' } );
