'use strict';

GetOption( {
	'enhancement-appicon': true,
}, function( items )
{
	if( items[ 'enhancement-appicon' ] )
	{
		const style = document.createElement( 'link' );
		style.id = 'steamdb_appicon';
		style.type = 'text/css';
		style.rel = 'stylesheet';
		style.href = GetLocalResource( 'styles/appicon.css' );

		document.head.appendChild( style );

		// Fix cdn url
		window.addEventListener( 'DOMContentLoaded', () =>
		{
			const icon = document.querySelector( '.apphub_AppIcon > img' );

			if( !icon )
			{
				return;
			}

			if( !icon.src.includes( '%CDN_HOST_MEDIA_SSL%' ) )
			{
				return;
			}

			const metaImage = document.querySelector( 'meta[itemprop="image"]' );

			if( !metaImage )
			{
				return;
			}

			const url = new URL( document.querySelector( 'link[rel="image_src"]' ).href );

			icon.src = icon.src.replace( '%CDN_HOST_MEDIA_SSL%', url.host );
		} );
	}
} );
