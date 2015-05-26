'use strict';

GetOption( { 'enhancement-store-center': true }, function( items )
{
	if( items[ 'enhancement-store-center' ] )
	{
		var element = document.createElement( 'link' );
		element.id = 'steamdb_center_store';
		element.type = 'text/css';
		element.rel = 'stylesheet';
		element.href = GetLocalResource( 'styles/store-center.css' );
		
		document.head.appendChild( element );
	}
} );
