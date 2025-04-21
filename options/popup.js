'use strict';

( () =>
{
	const browserApi = typeof browser !== 'undefined' ? browser : chrome;

	document.body.dir = browserApi.i18n.getMessage( '@@bidi_dir' );

	/** @type {NodeListOf<HTMLElement>} */
	const localizable = document.querySelectorAll( '[data-msg]' );

	for( const element of localizable )
	{
		element.textContent = browserApi.i18n.getMessage( element.dataset.msg );
	}

	document.getElementById( 'options-link' ).addEventListener( 'click', function( ev )
	{
		ev.preventDefault();

		browserApi.runtime.openOptionsPage();
	} );
} )();
