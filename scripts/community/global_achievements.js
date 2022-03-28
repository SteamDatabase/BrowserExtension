'use strict';

GetOption( {
	'spoiler-achievements': true,
}, function( items )
{
	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
	const ownsGame = !!document.querySelector( '#compareAvatar a' );
	const currentUser = document.querySelector( '#global_actions .user_avatar' );
	const path = window.location.pathname.match( /^\/stats\/\w+/ );

	if( currentUser && path )
	{
		const tab = document.createElement( 'div' );
		tab.className = 'tab steamdb_stats_tab';

		const link = document.createElement( 'a' );
		link.className = 'tabOn';
		link.href = `${currentUser.href}${path}?tab=achievements`;
		link.textContent = 'View your achievements';

		tab.appendChild( link );
		document.querySelector( '#tabs' ).appendChild( tab );

		const headers = new Headers();
		headers.append( 'X-ValveUserAgent', 'panorama' );

		fetch( `${currentUser.href}${path}?tab=achievements&panorama=please`, {
			headers,
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

				if( !response )
				{
					return;
				}

				const elements = document.querySelectorAll( '.achieveTxt > h3' );
				const achievements = Object.values( { ...response.closed, ...response.open } );

				if( achievements.length === 0 )
				{
					return;
				}

				if( !ownsGame )
				{
					const headerContentLeft = document.getElementById( 'headerContentLeft' );

					if( headerContentLeft )
					{
						headerContentLeft.appendChild( document.createTextNode( ' (but SteamDB extension was able to load your achievements)' ) );
					}
				}

				for( const achievement of achievements )
				{
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

						if( ownsGame )
						{
							if( achievement.closed )
							{
								continue;
							}
						}
						else
						{
							const img = document.createElement( 'img' );
							img.width = 64;
							img.height = 64;
							img.src = achievement.closed ? achievement.icon_closed : achievement.icon_open;
							const compareImg = document.createElement( 'div' );
							compareImg.className = 'compareImg compare_rightcol_element';
							compareImg.appendChild( img );

							const achieveRow = element.closest( '.achieveRow' );
							achieveRow.insertBefore( compareImg, element.parentNode.parentNode );

							if( achievement.closed )
							{
								achieveRow.classList.add( 'unlocked' );
							}
						}

						if( !achievement.hidden )
						{
							continue;
						}

						const parent = element.parentNode.querySelector( 'h5' );

						if( spoilerAchievements && !achievement.closed )
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
