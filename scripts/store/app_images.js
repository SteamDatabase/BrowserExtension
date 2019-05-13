'use strict';

GetOption( {
	'prevent-store-images': false,
}, function( items )
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

	const start = Date.now();
	const polling = setInterval( () =>
	{
		const timeDiff = Date.now() - start;

		for( let i = images.length - 1; i >= 0; i-- )
		{
			const image = images[ i ];

			if( image.complete )
			{
				images.splice( i, 1 );
				continue;
			}

			if( image.naturalWidth > 0 || timeDiff > 1000 )
			{
				image.style.width = ( image.width || 100 ) + 'px';
				image.style.height = ( image.height || 100 ) + 'px';
				image.dataset.src = image.src;
				image.src = GetLocalResource( 'icons/image.svg' );
				image.addEventListener( 'click', ImageClick );

				images.splice( i, 1 );
			}
		}

		if( !images.length )
		{
			clearInterval( polling );
		}
	}, 50 );

	function ImageClick()
	{
		this.addEventListener( 'load', ImageLoad );
		this.src = this.dataset.src;
	}

	function ImageLoad()
	{
		this.style.width = '';
		this.style.height = '';
	}
} );
