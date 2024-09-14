'use strict';

const progressInfo = document.querySelectorAll( '.badge_title_stats_drops .progress_info_bold' );

if( progressInfo.length > 0 )
{
	let apps = 0;
	let drops = 0;
	let match;

	for( let i = 0; i < progressInfo.length; i++ )
	{
		match = progressInfo[ i ].textContent.match( /(?<number>[0-9]+)/ );

		if( match )
		{
			match = Number.parseInt( match.groups.number, 10 ) || 0;

			if( match > 0 )
			{
				apps++;
				drops += match;
			}
		}
	}

	if( apps > 0 )
	{
		const container = document.querySelector( '.badge_details_set_favorite' );

		if( container )
		{
			const hasPages = document.querySelector( '.pageLinks' );

			let text = document.createElement( 'span' );
			text.className = 'steamdb_drops_remaining';
			text.appendChild( document.createTextNode( _t( hasPages ? 'badges_idle_apps_on_this_page' : 'badges_idle_apps', [ apps ] ) ) );
			container.prepend( text );
			container.prepend( document.createTextNode( ' ' ) );

			text = document.createElement( 'span' );
			text.className = 'steamdb_drops_remaining';
			text.appendChild( document.createTextNode( _t( hasPages ? 'badges_idle_drops_on_this_page' : 'badges_idle_drops', [ drops ] ) ) );
			container.prepend( text );
		}
	}
}
else
{
	GetOption( { 'button-gamecards': true }, ( items ) =>
	{
		if( !items[ 'button-gamecards' ] )
		{
			return;
		}

		const profileTexture = document.querySelector( '.profile_small_header_texture' );

		if( !profileTexture )
		{
			return;
		}

		const badgeUrl = location.pathname.match( /\/badges\/([0-9]+)/ );

		if( !badgeUrl )
		{
			return;
		}

		const badgeid = Number.parseInt( badgeUrl[ 1 ], 10 );

		const container = document.createElement( 'div' );
		container.className = 'profile_small_header_additional steamdb';

		const image = document.createElement( 'img' );
		image.className = 'ico16';
		image.src = GetLocalResource( 'icons/white.svg' );

		const span = document.createElement( 'span' );
		span.dataset.tooltipText = _t( 'view_on_steamdb' );
		span.appendChild( image );

		const link = document.createElement( 'a' );
		link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
		link.href = GetHomepage() + 'badge/' + badgeid + '/';
		link.appendChild( span );

		container.insertBefore( link, container.firstChild );

		profileTexture.appendChild( container );
	} );
}
