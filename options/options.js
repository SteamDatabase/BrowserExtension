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
	const checkboxes = document.querySelectorAll( '.option-check:not(:disabled)' );
	const options = {};

	const SetOption = ( option, value ) =>
	{
		const chromepls = {}; chromepls[ option ] = value;

		browserObject.storage.sync.set( chromepls );
	};

	const CheckboxChange = function( )
	{
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
			element = options[ item ];

			element.checked = items[ item ];
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

		browserObject.permissions.request( permissions );
	} );

	browserObject.permissions.onAdded.addListener( HideButtonIfAllPermissionsGranted );
	browserObject.permissions.onRemoved.addListener( HideButtonIfAllPermissionsGranted );

	HideButtonIfAllPermissionsGranted();

	function HideButtonIfAllPermissionsGranted()
	{
		browserObject.permissions.contains( permissions, ( result ) =>
		{
			document.getElementById( 'permissions' ).hidden = result;
		} );
	}
}() );
