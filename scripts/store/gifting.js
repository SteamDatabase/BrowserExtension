( function()
{
	'use strict';

	let element;
	let i;
	const blocks = document.querySelectorAll( '.friend_block' );

	for( i = 0; i < blocks.length; i++ )
	{
		element = blocks[ i ];
		element.querySelector( '[name=friend_radio]' ).disabled = false;
		element.classList.remove( 'disabled' );
	}
}() );
