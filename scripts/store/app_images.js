'use strict';

GetOption( {
	'prevent-store-images': false,
}, ( items ) =>
{
	if( !items[ 'prevent-store-images' ] )
	{
		return;
	}

	const images = Array.from( document.querySelectorAll( '.game_area_description img, .early_access_announcements img' ) );

	if( !images.length )
	{
		return;
	}

	for( const image of images )
	{
		if( image.complete )
		{
			continue;
		}

		image.style.width = ( image.width || 100 ) + 'px';
		image.style.height = ( image.height || 100 ) + 'px';
		image.dataset.src = image.src;
		image.src = GetLocalResource( 'icons/image.svg' );
		image.addEventListener( 'click', ImageClick, { once: true } );
	}

	function ImageClick( e )
	{
		this.addEventListener( 'load', ImageLoad, { once: true } );
		this.src = this.dataset.src;
		e.preventDefault();
	}

	function ImageLoad()
	{
		this.style.width = '';
		this.style.height = '';
	}
} );
