'use strict';

GetOption( { 'enhancement-no-linkfilter': false }, ( items ) =>
{
	if( items[ 'enhancement-no-linkfilter' ] )
	{
		const element = document.createElement( 'script' );
		element.id = 'steamdb_skip_linkfilter';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/linkfilter_injected.js' );

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
