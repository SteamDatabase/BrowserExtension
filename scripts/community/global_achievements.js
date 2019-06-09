'use strict';

var compareAvatar = document.querySelector( '#compareAvatar a' );

if( compareAvatar )
{
	const path = window.location.pathname.match( /^\/stats\/\w+/ );

	if( path )
	{
		const tab = document.createElement( 'div' );
		tab.className = 'tab steamdb_stats_tab';

		const link = document.createElement( 'a' );
		link.className = 'tabOn';
		link.href = path + '?tab=achievements';
		link.textContent = 'View your achievements';

		tab.appendChild( link );
		document.querySelector( '#tabs' ).appendChild( tab );
	}
}
