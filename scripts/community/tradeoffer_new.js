'use strict';

const params = new URLSearchParams( window.location.search );

const items = params.getAll( 'for_item' );

if( items.length > 0 )
{
	const InjectScript = function( them_assets )
	{
		window.g_rgCurrentTradeStatus =
		{
			newversion: true,
			version: 1,
			me: {
				assets: [],
				currency: [],
				ready: false,
			},
			them: {
				assets: them_assets.split( ';' ).map( function( asset )
				{
					const search = asset.match( /([0-9]+)_([0-9]+)_([0-9]+)/ );
					if( search === null )return null;
					return{
						appid: search[ 1 ],
						contextid: search[ 2 ],
						assetid: search[ 3 ],
						amount: 1,
					};
				} ).filter( asset => asset ),
				currency: [],
				ready: false,
			},
		};

		window.RedrawCurrentTradeStatus();
	};

	const element = document.createElement( 'script' );
	element.id = 'steamdb_for_item';
	element.type = 'text/javascript';
	element.appendChild( document.createTextNode( '(' + InjectScript.toString() + '("' + items.join( ';' ) + '"))' ) );

	document.head.appendChild( element );
}
