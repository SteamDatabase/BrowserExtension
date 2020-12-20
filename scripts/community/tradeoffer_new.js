'use strict';

const item = window.location.search.match( /[?&]for_item=([0-9]+)_([0-9]+)_([0-9]+)/ );

if( item !== null )
{
	const InjectScript = function( appid, contextid, assetid )
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
				assets: [
					{
						appid: appid,
						contextid: contextid.toString(),
						assetid: assetid.toString(),
						amount: 1,
					},
				],
				currency: [],
				ready: false,
			},
		};

		window.RedrawCurrentTradeStatus();
	};

	const element = document.createElement( 'script' );
	element.id = 'steamdb_for_item';
	element.type = 'text/javascript';
	element.appendChild( document.createTextNode( '(' + InjectScript.toString() + '(' + item[ 1 ] + ',' + item[ 2 ] + ',' + item[ 3 ] + '))' ) );

	document.head.appendChild( element );
}
