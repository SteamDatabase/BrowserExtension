/* global DoAchievements */

'use strict';

DoAchievements( false );

{
	const currentUser = document.querySelector( '#global_actions .user_avatar' );
	const currentUserPath = location.pathname.split( '/' );

	if( currentUser && currentUserPath[ 1 ] === 'stats' )
	{
		const currentUserUrl = currentUser.href.replace( /\/$/, '' );

		const tab = document.createElement( 'div' );
		tab.className = 'tab steamdb_stats_tab';

		const link = document.createElement( 'a' );
		link.className = 'tabOff';
		link.href = `${currentUserUrl}/stats/${currentUserPath[ 2 ]}?tab=achievements`;
		link.textContent = _t( 'view_your_achievements' );

		tab.appendChild( link );
		document.querySelector( '#tabs' )?.appendChild( tab );
	}
}
