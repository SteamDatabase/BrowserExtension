'use strict';

GetOption( {
	'enhancement-appicon': true,
}, ( items ) =>
{
	if( items[ 'enhancement-appicon' ] )
	{
		let styleAdded = false;
		const style = document.createElement( 'link' );
		style.id = 'steamdb_appicon';
		style.type = 'text/css';
		style.rel = 'stylesheet';
		style.href = GetLocalResource( 'styles/appicon.css' );

		if( document.head )
		{
			styleAdded = true;
			document.head.appendChild( style );
		}

		window.addEventListener( 'DOMContentLoaded', () =>
		{
			if( !styleAdded )
			{
				document.head.appendChild( style );
			}

			/** @type {HTMLImageElement} */
			const icon = document.querySelector( '.apphub_AppIcon > img' );

			if( !icon )
			{
				return;
			}

			const src = icon.getAttribute( 'src' );

			if( !src.includes( '%CDN_HOST_MEDIA_SSL%' ) )
			{
				return;
			}

			const applicationConfigElement = document.getElementById( 'application_config' );

			if( !applicationConfigElement )
			{
				return;
			}

			const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );

			icon.src = src.replace( 'https://%CDN_HOST_MEDIA_SSL%/', applicationConfig.MEDIA_CDN_URL );
		} );
	}
} );
