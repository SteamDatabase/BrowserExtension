'use strict';

const compareAvatar = document.querySelector( '#compareAvatar a' );
const path = window.location.pathname.match( /^\/stats\/\w+/ );

if( compareAvatar && path )
{
	const tab = document.createElement( 'div' );
	tab.className = 'tab steamdb_stats_tab';

	const link = document.createElement( 'a' );
	link.className = 'tabOn';
	link.href = `${compareAvatar.href}${path}?tab=achievements`;
	link.textContent = 'View your achievements';

	tab.appendChild( link );
	document.querySelector( '#tabs' ).appendChild( tab );

	const headers = new Headers();
	headers.append( 'X-ValveUserAgent', 'panorama' );

	fetch( compareAvatar.href + path + '?tab=achievements&panorama=please', {
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

			const elements = document.querySelectorAll( '.achieveTxt > h3' );

			for( const key in response.open )
			{
				const achievement = response.open[ key ];

				if( !achievement.hidden || achievement.closed )
				{
					continue;
				}
				for( let i = 0; i < elements.length; i++ )
				{
					if( elements[ i ].textContent === achievement.name )
					{
						elements[ i ].parentNode.querySelector( 'h5' ).textContent = `[HIDDEN] ${achievement.desc}`;
						break;
					}
				}
			}
		} );
}
