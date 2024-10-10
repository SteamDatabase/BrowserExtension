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

	document.body.style.margin = 0;
}
else
{
	GetOption( { 'enhancement-hide-install-button': true, 'enhancement-no-linkfilter': false }, ( items ) =>
	{
		if( items[ 'enhancement-hide-install-button' ] )
		{
			const button = document.querySelector( '.header_installsteam_btn' );

			if( button )
			{
				button.setAttribute( 'hidden', true );
				button.style.display = 'none';
			}
		}

		if( items[ 'enhancement-no-linkfilter' ] )
		{
			const links = document.querySelectorAll( 'a[href^="https://steamcommunity.com/linkfilter/"]' );

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

	GetOption( { 'options_steam_family_flag': true }, ( items ) =>
	{
		if( !items.options_steam_family_flag )
		{
			return;
		}

		SendMessageToBackgroundScript( {
			contentScriptQuery: 'FetchSteamUserFamilyData',
		}, ( response ) =>
		{
			const OnPageLoaded = () =>
			{
				if( response.error )
				{
					if( response.error === 'You are not part of any family group.' )
					{
						WriteLog( response.error );
					}
					else
					{
						WriteLog( 'Failed to load userFamilydata', response.error );
					}
				}

				if( response.data )
				{
					WriteLog( 'UserFamilydata loaded', `Apps: ${Object.keys( response.data.rgFamilySharedApps ).length}` );
					window.postMessage( { type: 'steamdb:user-family-data-processed', data: response.data } );
				}
			};

			if( document.readyState === 'loading' )
			{
				document.addEventListener( 'DOMContentLoaded', OnPageLoaded, { once: true } );
			}
			else
			{
				OnPageLoaded();
			}
		} );
	} );
}
