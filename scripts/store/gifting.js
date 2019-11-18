( function()
{
	'use strict';

	var element;
	var i;
	var blocks = document.querySelectorAll( '.friend_block' );

	for( i = 0; i < blocks.length; i++ )
	{
		element = blocks[ i ];
		element.querySelector( '[name=friend_radio]' ).disabled = false;
		element.classList.remove( 'disabled' );
	}
}() );
