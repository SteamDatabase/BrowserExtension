'use strict';

( ( () =>
{
	document.body.dir = _t( '@@bidi_dir' );

	const localizable = document.querySelectorAll( '[data-msg]' );

	for( const element of localizable )
	{
		const token = element.dataset.msg;
		let msg = null;

		if( token === 'options_extra_data_players' )
		{
			msg = _t( token, [ _t( 'options_online_stats' ), _t( 'options_steamdb_last_update' ) ] );
		}
		else if( token === 'options_extra_data_prices' )
		{
			msg = _t( token, [ _t( 'options_steamdb_lowest_price' ) ] );
		}
		else if( token === 'options_extra_data_achievement_groups' )
		{
			msg = _t( token, [ _t( 'options_achievement_groups' ) ] );
		}
		else if( token === 'options_extra_data_steam_family' )
		{
			msg = _t( token, [ _t( 'options_steam_family_flag' ) ] );
		}
		else
		{
			msg = _t( token );
		}

		if( !msg )
		{
			console.error( 'Missing localization', element, token );
		}

		if( element.tagName === 'TITLE' )
		{
			msg += ' · SteamDB';
		}

		element.innerHTML = msg;
	}

	if( location.search.includes( 'welcome=1' ) )
	{
		document.getElementById( 'welcome' ).hidden = false;
	}

	let starDismissed = false;
	const checkboxes = document.querySelectorAll( '.option-check:not(:disabled)' );

	/** @type {Object.<string, HTMLElement[]>} */
	const options =
	{
		'clicked-star': null,
	};

	const CheckboxChange = function( e )
	{
		if( !e.isTrusted )
		{
			return;
		}

		this.disabled = true;

		SetOption( this.dataset.option, this.checked );
	};

	for( let i = 0; i < checkboxes.length; i++ )
	{
		const element = checkboxes[ i ];
		const item = element.dataset.option;

		if( !options[ item ] )
		{
			options[ item ] = [ element ];
		}
		else
		{
			options[ item ].push( element );
		}

		element.addEventListener( 'change', CheckboxChange );
	}

	GetOption( Object.keys( options ), ( items ) =>
	{
		for( const item in items )
		{
			if( item === 'clicked-star' )
			{
				starDismissed = true;
				document.getElementById( 'star' ).hidden = true;
				continue;
			}

			for( const element of options[ item ] )
			{
				element.checked = items[ item ];
			}
		}
	} );

	ExtensionApi.storage.sync.onChanged.addListener( ( changes ) =>
	{
		const changedItems = Object.keys( changes );

		for( const item of changedItems )
		{
			if( options[ item ] )
			{
				for( const element of options[ item ] )
				{
					element.checked = !!changes[ item ].newValue;
					element.disabled = false;
				}
			}
		}
	} );

	// Must be synced with host_permissions in manifest.json
	const permissions = {
		origins: [
			'https://steamdb.info/*',
			'https://steamcommunity.com/*',
			'https://*.steampowered.com/*',
		],
	};

	document.getElementById( 'js-get-permissions' ).addEventListener( 'click', ( e ) =>
	{
		e.preventDefault();

		try
		{
			ExtensionApi.permissions.request( permissions ).catch( e =>
			{
				alert( `Failed to request permissions: ${e.message}` );
			} );
		}
		catch( e )
		{
			alert( `Failed to request permissions: ${e.message}` );
		}
	} );

	ExtensionApi.permissions.onAdded.addListener( HideButtonIfAllPermissionsGranted );
	ExtensionApi.permissions.onRemoved.addListener( HideButtonIfAllPermissionsGranted );

	HideButtonIfAllPermissionsGranted();

	function HideButtonIfAllPermissionsGranted()
	{
		ExtensionApi.permissions.contains( permissions, ( result ) =>
		{
			document.getElementById( 'permissions' ).hidden = result;
			document.getElementById( 'star' ).hidden = starDismissed || !result;
		} );
	}

	let storeHref = null;

	if( ExtensionApi.runtime.id === 'kdbmhfkmnlmbkgbabkdealhhbfhlmmon' )
	{
		storeHref = 'https://chromewebstore.google.com/detail/steamdb/kdbmhfkmnlmbkgbabkdealhhbfhlmmon?utm_source=Options';
	}
	else if( ExtensionApi.runtime.id === 'hjknpdomhlodgaebegjopkmfafjpbblg' )
	{
		storeHref = 'https://microsoftedge.microsoft.com/addons/detail/steamdb/hjknpdomhlodgaebegjopkmfafjpbblg?utm_source=Options';
	}
	else if( ExtensionApi.runtime.id === 'firefox-extension@steamdb.info' )
	{
		storeHref = 'https://addons.mozilla.org/en-US/firefox/addon/steam-database/?utm_source=Options';
	}

	const storeUrl = document.querySelector( '#star a' );
	storeUrl.addEventListener( 'click', () =>
	{
		starDismissed = true;
		SetOption( 'clicked-star', true );
		document.getElementById( 'star' ).hidden = true;
	} );

	if( storeHref !== null )
	{
		storeUrl.href = storeHref;
	}
} )() );
