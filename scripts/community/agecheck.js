'use strict';

GetOption( { 'enhancement-skip-agecheck': false }, function( items )
{
	if( items[ 'enhancement-skip-agecheck' ] )
	{
		const element = document.createElement( 'script' );
		element.id = 'steamdb_skip_agecheck';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/agecheck_injected.js' );

		document.head.insertBefore( element, document.head.firstChild );
	}
} );
