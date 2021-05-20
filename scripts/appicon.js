'use strict';

GetOption( {
	'enhancement-appicon': true,
}, function( items )
{
	if( items[ 'enhancement-appicon' ] )
	{
		const style = document.createElement( 'link' );
		style.id = 'steamdb_appicon';
		style.type = 'text/css';
		style.rel = 'stylesheet';
		style.href = GetLocalResource( 'styles/appicon.css' );

		document.head.appendChild( style );
	}
} );
