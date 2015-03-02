'use strict';

var element = document.getElementById( 'steamdb-extension-protip' );

if( element )
{
	element.setAttribute( 'hidden', true );
}

GetOption( { 'steamdb-highlight': true, 'steamdb-hide-not-interested': false }, function( items )
{
	if( !items[ 'steamdb-highlight' ] )
	{
		return;
	}
	
	var apps     = document.querySelectorAll( 'tr.app' ),
	    packages = document.querySelectorAll( 'tr.package' ),
	    packageScope = document.querySelector( '.scope-package' ),
	    appScope = document.querySelector( '.scope-app' );
	
	if( apps.length > 0 || packages.length > 0 || appScope || packageScope )
	{
		var xhr = new XMLHttpRequest();
		
		xhr.open( 'GET', 'https://store.steampowered.com/dynamicstore/userdata/', true );
		xhr.responseType = 'json';
		
		xhr.onreadystatechange = function()
		{
			if( xhr.readyState !== 4 || xhr.status !== 200 )
			{
				return;
			}
			
			var i, mapAppsToElements = [], mapPackagesToElements = [];
			
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
			
			var data = xhr.response, id;
			
			if( appScope || mapAppsToElements.length > 0 )
			{
				var scopeAppID = appScope && appScope.dataset.appid;
				
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
					id = data.rgOwnedApps[ i ];
					element = mapAppsToElements[ id ];
					
					if( element )
					{
						element.classList.add( 'owned' );
					}
					
					if( scopeAppID == id )
					{
						appScope = document.querySelector( '.panel-ownership' );
						
						if( appScope )
						{
							appScope.hidden = false;
						}
						
						appScope = false;
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
			}
			
			if( packageScope || mapPackagesToElements.length > 0 )
			{
				var scopeSubID = packageScope && packageScope.dataset.subid;
				
				// Owned packages
				for( i = 0; i < data.rgOwnedPackages.length; i++ )
				{
					id = data.rgOwnedPackages[ i ];
					element = mapPackagesToElements[ id ];
					
					if( element )
					{
						element.classList.add( 'owned' );
					}
					
					if( scopeSubID == id )
					{
						packageScope = document.querySelector( '.panel-ownership' );
						
						if( packageScope )
						{
							packageScope.hidden = false;
						}
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
			}
			
			// Show as owned if one of the packages is owned
			if( appScope )
			{
				appScope = document.querySelector( '.panel-ownership' );
				
				if( appScope && appScope.hidden && document.querySelector( '#subs .package.owned' ) )
				{
					appScope.hidden = false;
				}
			}
			
			if( document.querySelector( '.scope-sales' ) )
			{
				if( items[ 'steamdb-hide-not-interested' ] )
				{
					for( i = 0; i < data.rgIgnoredApps.length; i++ )
					{
						element = mapAppsToElements[ data.rgIgnoredApps[ i ] ];
						
						if( element )
						{
							element.parentNode.removeChild( element );
						}
					}
					
					for( i = 0; i < data.rgIgnoredPackages.length; i++ )
					{
						element = mapPackagesToElements[ data.rgIgnoredPackages[ i ] ];
						
						if( element )
						{
							element.parentNode.removeChild( element );
						}
					}
				}
				
				if( document.querySelector( '#js-hide-owned-games.checked' ) )
				{
					var elements = document.querySelectorAll( '.appimg.owned' );
					
					for ( var i = 0; i < elements.length; i++ )
					{
						elements[ i ].hidden = true;
					}
				}
			}
		};
		
		xhr.send();
	}
} );
