/* global chrome:false, browser:false */
( function()
{
	'use strict';

	if( location.search.includes( 'welcome=1' ) )
	{
		document.getElementById( 'welcome' ).hidden = false;
	}

	let browserObject;

	if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
	{
		browserObject = browser;
	}
	else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
	{
		browserObject = chrome;
	}
	else
	{
		throw new Error( 'Did not find an API for storage' );
	}

	let element;
	let starDismissed = false;
	const checkboxes = document.querySelectorAll( '.option-check:not(:disabled)' );
	const options =
	{
		'clicked-star': null,
	};

	const SetOption = ( option, value ) =>
	{
		const chromepls = {}; chromepls[ option ] = value;

		browserObject.storage.sync.set( chromepls );
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
		element = checkboxes[ i ];

		options[ element.dataset.option ] = element;

		element.addEventListener( 'change', CheckboxChange );
	}

	GetOption( Object.keys( options ), function( items )
	{
		for( const item in items )
		{
			if( item === 'clicked-star' )
			{
				starDismissed = true;
				document.getElementById( 'star' ).hidden = true;
				continue;
			}

			element = options[ item ];

			element.checked = items[ item ];
		}
	} );

	browserObject.storage.sync.onChanged.addListener( ( changes ) =>
	{
		const changedItems = Object.keys( changes );

		for( const item of changedItems )
		{
			if( options[ item ] )
			{
				options[ item ].checked = !!changes[ item ].newValue;
				options[ item ].disabled = false;
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
			browserObject.permissions.request( permissions ).catch( e =>
			{
				alert( `Failed to request permissions: ${e.message}` );
			} );
		}
		catch( e )
		{
			alert( `Failed to request permissions: ${e.message}` );
		}
	} );

	browserObject.permissions.onAdded.addListener( HideButtonIfAllPermissionsGranted );
	browserObject.permissions.onRemoved.addListener( HideButtonIfAllPermissionsGranted );

	HideButtonIfAllPermissionsGranted();

	function HideButtonIfAllPermissionsGranted()
	{
		browserObject.permissions.contains( permissions, ( result ) =>
		{
			document.getElementById( 'permissions' ).hidden = result;
			document.getElementById( 'star' ).hidden = starDismissed || !result;
		} );
	}

	let storeHref = null;

	if( browserObject.runtime.id === 'kdbmhfkmnlmbkgbabkdealhhbfhlmmon' )
	{
		storeHref = 'https://chromewebstore.google.com/detail/steamdb/kdbmhfkmnlmbkgbabkdealhhbfhlmmon?utm_source=Options';
	}
	else if( browserObject.runtime.id === 'hjknpdomhlodgaebegjopkmfafjpbblg' )
	{
		storeHref = 'https://microsoftedge.microsoft.com/addons/detail/steamdb/hjknpdomhlodgaebegjopkmfafjpbblg?utm_source=Options';
	}
	else if( browserObject.runtime.id === 'firefox-extension@steamdb.info' )
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
}() );
