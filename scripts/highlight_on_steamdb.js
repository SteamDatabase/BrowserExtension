'use strict';

GetOption( { 'steamdb-highlight': true }, function( items )
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}
	
	var apps     = document.querySelectorAll( 'tr.app' ),
	    packages = document.querySelectorAll( 'tr.package' );

	if( apps.length > 0 || packages.length > 0 )
	{
		var xhr = new XMLHttpRequest();
		
		xhr.open( 'GET', 'https://store.steampowered.com/dynamicstore/userdata/', true );
		xhr.responseType = 'json';
		
		xhr.onreadystatechange = function()
		{
			if( this.readyState !== XMLHttpRequest.DONE || this.status !== 200 )
			{
				return;
			}
			
			console.log( this.response );
			
			var i, element, mapAppsToElements = [], mapPackagesToElements = [];
			
			for( i = 0; i < apps.length; i++ )
			{
				element = apps[ i ];
				
				mapAppsToElements[ element.dataset.appid ] = element;
			}
			
			apps = null;
			
			for( i = 0; i < packages.length; i++ )
			{
				element = packages[ i ];
				
				mapPackagesToElements[ element.dataset.subid ] = element;
			}
			
			packages = null;
			
			var data = this.response;
			
			if( mapAppsToElements.length > 0 )
			{
				// Wished apps
				for( i = 0; i < data.rgWishlist.length; i++ )
				{
					element = mapAppsToElements[ data.rgWishlist[ i ] ];
					
					if( element )
					{
						element.classList.add( 'wished' );
					}
				}
				
				// Owned apps
				for( i = 0; i < data.rgOwnedApps.length; i++ )
				{
					element = mapAppsToElements[ data.rgOwnedApps[ i ] ];
					
					if( element )
					{
						element.classList.add( 'owned' );
					}
				}
				
				// Apps in cart
				for( i = 0; i < data.rgAppsInCart.length; i++ )
				{
					element = mapAppsToElements[ data.rgAppsInCart[ i ] ];
					
					if( element )
					{
						element.classList.add( 'cart' );
					}
				}
				
				// rgIgnoredApps
			}
			
			if( mapPackagesToElements.length > 0 )
			{
				// Owned packages
				for( i = 0; i < data.rgOwnedPackages.length; i++ )
				{
					element = mapPackagesToElements[ data.rgOwnedPackages[ i ] ];
					
					if( element )
					{
						element.classList.add( 'owned' );
					}
				}
				
				// Packages in cart
				for( i = 0; i < data.rgPackagesInCart.length; i++ )
				{
					element = mapPackagesToElements[ data.rgPackagesInCart[ i ] ];
					
					if( element )
					{
						element.classList.add( 'cart' );
					}
				}
				
				// rgIgnoredPackages
			}
		};
		
		xhr.send();
	}
} );
