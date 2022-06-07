'use strict';

GetOption( { 'link-subid-widget': true }, function( items )
{
	if( !items[ 'link-subid-widget' ] )
	{
		return;
	}

	const link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.target = '_blank';
	link.className = 'steamdb_link';

	const subid = document.querySelector( 'input[name="subid"]' );

	if( subid )
	{
		link.href = GetHomepage() + 'sub/' + subid.value + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		link.textContent = _t( 'widget_view_sub', subid.value );
	}
	else
	{
		const appid = GetCurrentAppID();

		link.href = GetHomepage() + 'app/' + appid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		link.textContent = _t( 'widget_view_app', appid );
	}

	const container = document.createElement( 'p' );
	container.appendChild( link );

	document.querySelector( '.desc' ).appendChild( container );
} );
