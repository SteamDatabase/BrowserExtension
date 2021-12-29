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

					for( const element of elements )
					{
						if( element.textContent !== achievement.name )
						{
							continue;
						}

						if( achievement.progress )
						{
							const progress = document.createElement( 'span' );
							progress.className = 'achievePercent wt steamdb_achievement_progress';
							progress.textContent = `Your progress: ${achievement.progress.currentVal} / ${achievement.progress.max_val}`;

							const meter = document.createElement( 'meter' );
							meter.min = achievement.progress.min_val;
							meter.max = achievement.progress.max_val;
							meter.value = achievement.progress.currentVal;
							progress.appendChild( meter );

							const achievePercent = element.closest( '.achieveRow' ).querySelector( '.achievePercent' );
							achievePercent.insertAdjacentElement( 'afterend', progress );
						}

						if( !achievement.hidden || achievement.closed )
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
