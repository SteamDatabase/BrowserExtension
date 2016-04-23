/* global chrome:false, browser:false */
( function()
{
	'use strict';
	
	var element, checkboxes = document.querySelectorAll( '.option-check:not(:disabled)' ), options = {};
	
	var CheckboxChange = function( )
	{
		SetOption( this.dataset.option, this.checked );
	};
	
	var SetOption = function( option, value )
	{
		var chromepls = {}; chromepls[ option ] = value;
		
		if( typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' )
		{
			chrome.storage.local.set( chromepls );
		}
		else if( typeof browser !== 'undefined' )
		{
			browser.storage.local.set( chromepls );
		}
	};
	
	for( var i = 0; i < checkboxes.length; i++ )
	{
		element = checkboxes[ i ];
		
		options[ element.dataset.option ] = element;
		
		element.addEventListener( 'change', CheckboxChange );
	}
	
	GetOption( Object.keys( options ), function( items )
	{
		for( var item in items )
		{
			element = options[ item ];
			
			element.checked = items[ item ];
		}
	} );
}() );
