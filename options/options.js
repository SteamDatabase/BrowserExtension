'use strict';

( ( () =>
{
	document.body.dir = _t( '@@bidi_dir' );

	/** @type {NodeListOf<HTMLElement>} */
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

	/** @type {NodeListOf<HTMLInputElement>} */
	const checkboxes = document.querySelectorAll( '.option-check:not(:disabled)' );

	/** @type {Record<string, HTMLInputElement[]>} */
	const options =
	{
		'clicked-star': null,
	};

	/**
	 * @this {HTMLInputElement}
	 * @param {Event} e
	 */
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
			alert( `Failed to request permissions: ${e}` );
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
		storeHref = 'https://addons.mozilla.org/firefox/addon/steam-database/?utm_source=Options';
	}

	/** @type {HTMLAnchorElement} */
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

	// Steam China optional permission
	const steamChinaPermissions = {
		origins: [
			'https://*.steamchina.com/*',
		],
	};

	document.getElementById( 'js-get-steamchina-permissions' ).addEventListener( 'click', ( e ) =>
	{
		e.preventDefault();

		try
		{
			ExtensionApi.permissions.request( steamChinaPermissions ).catch( e =>
			{
				alert( `Failed to request Steam China permissions: ${e.message}` );
			} );
		}
		catch( e )
		{
			alert( `Failed to request Steam China permissions: ${e}` );
		}
	} );

	ExtensionApi.permissions.onAdded.addListener( HideSteamChinaButtonIfPermissionsGranted );
	ExtensionApi.permissions.onRemoved.addListener( HideSteamChinaButtonIfPermissionsGranted );

	HideSteamChinaButtonIfPermissionsGranted();

	function HideSteamChinaButtonIfPermissionsGranted()
	{
		ExtensionApi.permissions.contains( steamChinaPermissions, ( result ) =>
		{
			document.getElementById( 'steamchina-permissions' ).hidden = result;
		} );
	}

	// Search functionality for filtering options
	/** @type {HTMLInputElement} */
	const searchField = document.querySelector( '#search-field' );
	searchField.placeholder = _t( 'search' );

	searchField.addEventListener( 'input', function()
	{
		const searchVal = this.value.trim().normalize( 'NFD' ).toLocaleUpperCase();

		/** @type {NodeListOf<HTMLElement>} */
		const sections = document.querySelectorAll( 'h3, .checkbox, label.checkbox, details' );

		if( searchVal.length === 0 )
		{
			for( const section of sections )
			{
				section.hidden = false;
			}

			return;
		}

		for( const section of sections )
		{
			section.hidden = true;
		}

		/** @type {Set<Element>} */
		const visibleHeaders = new Set();

		/** @type {NodeListOf<HTMLElement>} */
		const checkboxContainers = document.querySelectorAll( '.checkbox, label.checkbox' );

		for( const container of checkboxContainers )
		{
			const textContent = container.textContent.trim().normalize( 'NFD' ).toLocaleUpperCase();
			const isMatch = textContent.includes( searchVal );

			if( !isMatch )
			{
				continue;
			}

			container.hidden = false;

			let currentElement = container.previousElementSibling;

			while( currentElement )
			{
				if( currentElement.tagName === 'DETAILS' )
				{
					visibleHeaders.add( currentElement );
				}

				if( currentElement.tagName === 'H3' )
				{
					visibleHeaders.add( currentElement );
					break;
				}

				currentElement = currentElement.previousElementSibling;
			}
		}

		// Show relevant headers
		for( const header of visibleHeaders )
		{
			if( header instanceof HTMLElement )
			{
				header.hidden = false;
			}
		}
	} );

	// Focus search field when pressing '/' or 's'
	document.addEventListener( 'keydown', ( e ) =>
	{
		if( e.ctrlKey || e.metaKey )
		{
			return;
		}

		if( e.target instanceof Element && [ 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON' ].includes( e.target.tagName ) )
		{
			return;
		}

		if( e.code === 'Slash' || e.code === 'KeyS' || e.key === '/' || e.key === 's' )
		{
			e.preventDefault();
			searchField.focus();
		}
	} );
} )() );
