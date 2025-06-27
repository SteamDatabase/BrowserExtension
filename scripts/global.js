'use strict';

// There's no easier way to check if we're on error page :(
if( document.title === 'Sorry!' ||
document.title === 'Error' ||
document.title === '502 Bad Gateway' ||
document.title === 'We Broke It' )
{
	const link = document.createElement( 'a' );
	link.href = 'https://steamstat.us';
	link.appendChild( document.createTextNode( _t( 'steamstatus' ) ) );

	const container = document.createElement( 'div' );
	container.className = 'steamdb_downtime';
	container.appendChild( document.createTextNode( _t( 'steamstatus_downtime' ) ) );
	container.appendChild( link );

	document.body.insertBefore( container, document.body.firstChild );

	document.body.style.margin = '0';
}
else
{
	GetOption( { 'enhancement-hide-install-button': true, 'enhancement-no-linkfilter': false }, ( items ) =>
	{
		if( items[ 'enhancement-hide-install-button' ] )
		{
			/** @type {HTMLElement} */
			const button = document.querySelector( '.header_installsteam_btn' );

			if( button )
			{
				button.setAttribute( 'hidden', 'true' );
				button.style.display = 'none';
			}
		}

		if( items[ 'enhancement-no-linkfilter' ] )
		{
			/** @type {NodeListOf<HTMLAnchorElement>} */
			const links = document.querySelectorAll( 'a[href^="https://steamcommunity.com/linkfilter/"], a[href^="https://steamcommunity.com:/linkfilter/"]' );

			for( const link of links )
			{
				if( !link.search )
				{
					continue;
				}

				const params = new URLSearchParams( link.search );

				if( params.has( 'u' ) )
				{
					link.href = params.get( 'u' );
				}
				else if( params.has( 'url' ) )
				{
					link.href = params.get( 'url' );
				}
			}
		}
	} );

	const popup = document.querySelector( '#account_dropdown .popup_body' );

	if( popup )
	{
		const optionsLink = document.createElement( 'a' );
		optionsLink.target = '_blank';
		optionsLink.className = 'popup_menu_item steamdb_options_link';
		optionsLink.textContent = ' ' + _t( 'steamdb_options' );
		optionsLink.href = GetLocalResource( 'options/options.html' );

		const image = document.createElement( 'img' );
		image.className = 'ico16';
		image.src = GetLocalResource( 'icons/white.svg' );
		optionsLink.prepend( image );

		popup.appendChild( optionsLink );
	}
}
