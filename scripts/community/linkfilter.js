'use strict';

GetOption( { 'enhancement-no-linkfilter': false }, ( items ) =>
{
	if( items[ 'enhancement-no-linkfilter' ] )
	{
		if( window.location && window.location.search )
		{
			const params = new URLSearchParams( window.location.search );

			if( params.has( 'u' ) )
			{
				window.location.replace( params.get( 'u' ) );
			}
			else if( params.has( 'url' ) )
			{
				window.location.replace( params.get( 'url' ) );
			}
		}
	}
} );
