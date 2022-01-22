'use strict';

GetOption( {
	'spoiler-achievements': true,
}, function( items )
{
	const spoilerAchievements = !!items[ 'spoiler-achievements' ];
	let achievementsContainer = document.querySelector( '.achieveHiddenBox' );

	if( achievementsContainer )
	{
		achievementsContainer = achievementsContainer.parentNode.parentNode;

		const headers = new Headers();
		headers.append( 'X-ValveUserAgent', 'panorama' );

		fetch( window.location.origin + window.location.pathname + '?tab=achievements&panorama=please', {
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

					if( spoilerAchievements )
					{
						const span = document.createElement( 'span' );
						span.className = 'steamdb_achievement_spoiler';
						span.appendChild( document.createTextNode( achievement.desc ) );

						const hiddenAchiev = document.createElement( 'i' );
						hiddenAchiev.textContent = 'Hidden achievement, mouse over to reveal: ';

						h5.appendChild( hiddenAchiev );
						h5.appendChild( span );
					}
					else
					{
						const hiddenAchiev = document.createElement( 'i' );
						hiddenAchiev.textContent = 'Hidden achievement: ';

						h5.appendChild( hiddenAchiev );
						h5.appendChild( document.createTextNode( achievement.desc ) );
					}

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
} );
