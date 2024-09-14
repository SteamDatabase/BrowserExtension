'use strict';

GetOption( { 'enhancement-skip-agecheck': false }, ( items ) =>
{
	if( items[ 'enhancement-skip-agecheck' ] )
	{
		const element = document.createElement( 'script' );
		element.id = 'steamdb_skip_agecheck';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/agecheck_injected.js' );

		if( document.head )
		{
			document.head.insertBefore( element, document.head.firstChild );
		}
		else
		{
			document.documentElement.appendChild( element );
		}
	}
} );
