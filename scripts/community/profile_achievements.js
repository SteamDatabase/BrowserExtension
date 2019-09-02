'use strict';

var achievementsContainer = document.querySelector( '.achieveHiddenBox' );

if( achievementsContainer )
{
	achievementsContainer = achievementsContainer.parentNode.parentNode;
	
	const headers = new Headers();
	headers.append( 'X-ValveUserAgent', 'panorama' );

	fetch( window.location.origin + window.location.pathname + '?tab=achievements&panorama=please', {
		headers: headers,
	} )
		.then( ( response ) => response.text() )
		.then( ( response ) =>
		{
			response = response.match( /g_rgAchievements\s*=\s*(\{.+?\});/ );
		
			if( !response )
			{
				return;
			}
		
			response = JSON.parse( response[ 1 ] );
		
			if( !response.open )
			{
				return;
			}
		
			for( const key in response.open )
			{
				const achievement = response.open[ key ];
			
				if( !achievement.hidden || achievement.closed )
				{
					continue;
				}
			
				const image = document.createElement( 'img' );
				image.src = achievement.icon_open;
			
				const achieveImgHolder = document.createElement( 'div' );
				achieveImgHolder.className = 'achieveImgHolder';
				achieveImgHolder.appendChild( image );
			
				const h3 = document.createElement( 'h3' );
				h3.className = 'ellipsis';
				h3.appendChild( document.createTextNode( achievement.name ) );
			
				const h5 = document.createElement( 'h5' );
				h5.className = 'ellipsis';
				h5.appendChild( document.createTextNode( `[HIDDEN] ${achievement.desc}` ) );
			
				const achieveTxt = document.createElement( 'div' );
				achieveTxt.className = 'achieveTxt';
				achieveTxt.appendChild( h3 );
				achieveTxt.appendChild( h5 );
			
				const achieveTxtHolder = document.createElement( 'div' );
				achieveTxtHolder.className = 'achieveTxtHolder';
				achieveTxtHolder.appendChild( achieveTxt );
			
				const achieveRow = document.createElement( 'div' );
				achieveRow.className = 'achieveRow';
				achieveRow.appendChild( achieveImgHolder );
				achieveRow.appendChild( achieveTxtHolder );
			
				achievementsContainer.appendChild( achieveRow );
			}
		} );
}
