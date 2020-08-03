'use strict';

GetOption( {
	'spoiler-achievements': true,
}, function( items )
{
	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
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

					for( const element of elements )
					{
						if( element.textContent !== achievement.name )
						{
							continue;
						}

						const parent = element.parentNode.querySelector( 'h5' );

						if( spoilerAchievements )
						{
							const span = document.createElement( 'span' );
							span.className = 'steamdb_achievement_spoiler';
							span.appendChild( document.createTextNode( achievement.desc ) );

							const hiddenAchiev = document.createElement( 'i' );
							hiddenAchiev.textContent = 'Hidden achievement, mouse over to reveal: ';

							parent.appendChild( hiddenAchiev );
							parent.appendChild( span );
						}
						else
						{
							const hiddenAchiev = document.createElement( 'i' );
							hiddenAchiev.textContent = 'Hidden achievement: ';

							parent.appendChild( hiddenAchiev );
							parent.appendChild( document.createTextNode( achievement.desc ) );
						}

						break;
					}
				}
			} );
	}
} );
