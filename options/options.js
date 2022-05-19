/* global chrome:false, browser:false */
( function()
{
	'use strict';

	if( location.search.includes( 'welcome=1' ) )
	{
		document.getElementById( 'welcome' ).hidden = false;
	}

	let element;
	const checkboxes = document.querySelectorAll( '.option-check:not(:disabled)' );
	const options = {};

	const SetOption = ( option, value ) =>
	{
		const chromepls = {}; chromepls[ option ] = value;

		if( typeof browser !== 'undefined' && typeof browser.storage !== 'undefined' )
		{
			browser.storage.local.set( chromepls );
		}
		else if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
		{
			chrome.storage.local.set( chromepls );
		}
		else
		{
			throw new Error( 'Did not find an API for storage.local.set' );
		}
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
}() );
