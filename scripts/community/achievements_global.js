/* global DoAchievements */

'use strict';

DoAchievements( false );

{
	const currentUser = document.querySelector( '#global_actions .user_avatar' );
	const currentUserPath = window.location.pathname.match( /^\/stats\/\w+/ );

	if( currentUser && currentUserPath )
	{
		const currentUserUrl = currentUser.href.replace( /\/$/, '' );

		const tab = document.createElement( 'div' );
		tab.className = 'tab steamdb_stats_tab';

		const link = document.createElement( 'a' );
		link.className = 'tabOff';
		link.href = `${currentUserUrl}${currentUserPath}?tab=achievements`;
		link.textContent = _t( 'view_your_achievements' );

		tab.appendChild( link );
		document.querySelector( '#tabs' )?.appendChild( tab );
	}
}
