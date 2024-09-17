/* exported AddLinksInErrorBox */

'use strict';

function AddLinksInErrorBox( container )
{
	const pageTypeMatch = location.pathname.match( /^\/(?:[a-z]+\/)?(?<type>app|bundle|sub)\// );

	if( !pageTypeMatch )
	{
		return;
	}

	const pageType = pageTypeMatch.groups.type;

	const linkContainer = document.createElement( 'div' );
	linkContainer.className = 'steamdb_error_link';

	// SteamDB
	let link = document.createElement( 'a' );
	link.className = 'btnv6_blue_hoverfade btn_medium';
	link.href = `${GetHomepage()}${pageType}/${GetCurrentAppID()}/`;

	let text = document.createElement( 'span' );
	text.append( document.createTextNode( _t( 'view_on_steamdb' ) ) );
	link.append( text );

	linkContainer.append( link );

	// PCGW
	if( pageType === 'app' )
	{
		linkContainer.append( document.createTextNode( ' ' ) );

		link = document.createElement( 'a' );
		link.className = 'btnv6_blue_hoverfade btn_medium';
		link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=SteamDB';

		text = document.createElement( 'span' );
		text.append( document.createTextNode( _t( 'view_on_pcgamingwiki' ) ) );
		link.append( text );

		linkContainer.append( link );
	}

	container.append( linkContainer );
}
