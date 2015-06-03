'use strict';

GetOption( { 'link-bundle-packages': true }, function( items )
{
	if( !items[ 'link-bundle-packages' ] )
	{
		return;
	}
	
	var container = document.querySelector( '.game_area_purchase_game.bundle' );
	
	if( container )
	{

		var elements = document.querySelectorAll( '[data-ds-packageid]' );
		var length = elements.length;

		if ( length == 0 )
		{
			return;
		}

		var subs = [ ];

		for( var i = 0; i < length; i++ )
		{
			if ( subs.indexOf( elements[ i ] ) == -1 )
			{
				subs.push( elements[ i ].dataset.dsPackageid );
			}
		}

		subs.sort( function( a, b )
		{
			return a - b;
		} );

		var element = document.createElement( 'div' );
		element.className = 'steamdb_link';

		element.appendChild( document.createTextNode( 'View on Steam Database ' ) );

		var subidElement = document.createElement( 'i' );
		subidElement.className = 'steamdb_subid';

		subidElement.appendChild( document.createTextNode( '(' ) );

		for( var sub in subs )
		{
			var link = document.createElement( 'a' );
			link.target = '_blank';
			link.href = GetHomepage() + 'sub/' + subs[ sub ] + '/';
			link.appendChild( document.createTextNode( subs[ sub ] ) );
			subidElement.appendChild( link );

			if ( sub < subs.length - 1 )
			{
				subidElement.appendChild( document.createTextNode( ', ' ) );
			}
		}

		subidElement.appendChild( document.createTextNode( ')' ) );

		element.appendChild( subidElement );
		
		container.appendChild( element, container.firstChild );
	}
} );
