/* exported AddLinksInErrorBox */

'use strict';

// eslint-disable-next-line no-unused-vars
function AddLinksInErrorBox( container )
{
	const linkContainer = document.createElement( 'div' );
	linkContainer.className = 'steamdb_error_link';

	// SteamDB
	let link = document.createElement( 'a' );
	link.className = 'btnv6_blue_hoverfade btn_medium';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';

	let text = document.createElement( 'span' );
	text.append( document.createTextNode( _t( 'view_on_steamdb' ) ) );
	link.append( text );

	linkContainer.append( link );

	linkContainer.append( document.createTextNode( ' ' ) );

	// PCGW
	link = document.createElement( 'a' );
	link.className = 'btnv6_blue_hoverfade btn_medium';
	link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=SteamDB';

	text = document.createElement( 'span' );
	text.append( document.createTextNode( _t( 'view_on_pcgamingwiki' ) ) );
	link.append( text );

	linkContainer.append( link );

	container.append( linkContainer );
}
