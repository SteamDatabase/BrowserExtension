GetOption( [ 'experiment-cepheus', 'last-alert-version' ], function( items )
{

// TODO: Remove in next version (this doesn't need to be ported)
if( items[ 'last-alert-version' ] !== '1.0.4' )
{
	var element = document.createElement( 'div' );
	
	element.id = 'steamdb-update-notice';
	element.style.backgroundColor = '#DA4453';
	element.style.color = '#FFF';
	element.style.position = 'fixed';
	element.style.bottom = '10px';
	element.style.right = '10px';
	element.style.padding = '10px';
	element.style.zIndex = 1336;
	element.style.width = '200px';
	element.innerHTML = 'Hey, SteamDB extension now has an options page! <a class="close-steamdb-version-message" href="' + GetLocalResource( 'options/options.html' ) + '" target="_blank" style="text-decoration:underline">Check it out!</a>'
		+ '<br><br><a class="close-steamdb-version-message" href="#" style="text-decoration:underline">Never show this mesage again</a>';
	
	document.body.insertBefore( element, document.body.firstChild );
	
	element = document.querySelectorAll( '.close-steamdb-version-message' );
	
	for( var i = 0; i < element.length; i++ )
	{
		element[ i ].addEventListener( 'click', function( )
		{
			var element = document.getElementById( 'steamdb-update-notice' );
			element.parentNode.removeChild( element );
			
			chrome.storage.local.set( { 'last-alert-version': '1.0.4' } );
		} );
	}
}

if( items[ 'experiment-cepheus' ] === true )
{
	return;
}

/*
// ==UserScript==
// @version        1.1.0
// @name           Steam Highlight - Proof of concept
// @description    Lorem ipsum
// @homepage       http://steamdb.info
// @namespace      http://steamdb.info/highlight_owned/
// @icon           http://steamdb.info/static/logo_144px.png
// @match          http://store.steampowered.com/*
// @match          https://store.steampowered.com/*
// @exclude        http://store.steampowered.com/widget/*
// @exclude        https://store.steampowered.com/widget/*
// ==/UserScript==
*/

var toLookup = [],
	insertStylesheet,
	lookupElements = {},
	attribute,
	element,
	i,
	
	regexGameHover = /{['"]type['"]:['"]app['"],['"]id['"]:['"]?([0-9]+)['"]?.*}/,
	regexAppID = /app\/([0-9]+)/,
	
	AddToLookup = function( appid, element )
	{
		insertStylesheet = true;
		
		appid = parseInt( appid, 10 );
		
		// TODO: Perhaps we can use localStorage, but probably need to purge data
		var data = sessionStorage.getItem( 'appid' + appid );
		
		if( data )
		{
			if( data[ 0 ] === '1' )
			{
				element.classList.add( 'owned_product' );
			}
			else if( data[ 1 ] === '1' )
			{
				element.classList.add( 'wished_product' );
			}
			
			return;
		}
		
		toLookup.push( appid );
		
		// Glorious javascript
		( lookupElements[ appid ] || ( lookupElements[ appid ] = [] ) ).push( element );
	},
	
	InjectStylesheet = function( )
	{
		var code =
			'.cepheus_loading { background-color: #D35400; padding: 10px; position: fixed; top: 0; right: 0; z-index: 1337; }' +
			'.wished_product { color: #FFF; background-color: #57A4D0 !important; background: linear-gradient(135deg, #57A4D0 0%, #305D7A 100%) !important; }' +
			'.owned_product, .owned_product.item > .info { color: #FFF; background-color: #6F894D !important; background: linear-gradient(135deg, #7A9811 0%, #4B6A21 100%) !important; }' +
			'.owned_product .tab_price > span { color: #BBB !important }' +
			'.owned_product .tab_price { color: #FFF }' +
			'.owned_product .tab_desc { color: #CCC }' +
			'.owned_product.small_cap h5 { color: #CCC }' +
			'.owned_product .game_area_dlc_name { color: #FFF }' +
			'.owned_product .sale_page_release_date { color: #FFF }';
		
		var style = document.createElement( 'style' );
		style.id = 'steamdb_highlight_games';
		style.type = 'text/css';
		style.appendChild( document.createTextNode( code ) );
		document.head.appendChild( style );
	},
	
	InjectMagnificentDynamicPageTabsHacks = function()
	{
		console.debug( 'Injecting page tabs hack' );
		
		var gorgeousHack = function( )
		{
			var findAppsAndLoadData = function( tab )
			{
				var rows = document.getElementById( tab ).querySelectorAll( '.tab_row:not([data-highlight-processed])' ),
					toLookup = [],
					lookupElements = {};
				
				for( var i = 0; i < rows.length; i++ )
				{
					element = rows[ i ];
					attribute = regexGameHover.exec( element.getAttribute( 'onmouseover' ) );
					
					if( attribute )
					{
						attribute = parseInt( attribute[ 1 ], 10 );
						
						toLookup.push( attribute );
						
						lookupElements[ attribute ] = [ element ];
					}
				}
				
				if( toLookup.length )
				{
					LoadAppUserDetails( toLookup, lookupElements );
				}
			};
			
			var __TabUpdateCounts = window.TabUpdateCounts;
			
			window.TabUpdateCounts = function( tab, delta, max )
			{
				console.log( tab, delta, max );
				
				__TabUpdateCounts( tab, delta, max );
				
				findAppsAndLoadData( 'tab_' + tab + '_items' );
			};
			
			// Overly complicated hacks for tag pages
			var counters = document.querySelectorAll( '.tab_page_count > span:first-child' );
			
			if( counters.length )
			{
				var observer = new MutationObserver( function( mutations )
				{
					mutations.forEach( function( mutation )
					{
						if( mutation.addedNodes.length > 0 )
						{
							findAppsAndLoadData( mutation.target.id.match( /(tab_[a-zA-Z]+)/ )[ 0 ] + '_items' );
						}
					} );
				} );
				
				for( var i = 0; i < counters.length; i++ )
				{
					observer.observe( counters[ i ], { childList: true } );
				}
			}
			
		};
		
		var element = document.createElement( 'script' );
		element.id = 'steamdb_highlight_games_hook';
		element.type = 'text/javascript';
		element.appendChild( document.createTextNode( '(function(){ var regexGameHover = ' + regexGameHover + ', LoadAppUserDetails = ' + LoadAppUserDetails + ', Hook = ' + gorgeousHack + '; Hook(); }());' ) );
		
		document.head.appendChild( element );
	},
	
	LoadAppUserDetails = function( toLookup, lookupElements )
	{
		var loaderElement = document.createElement( 'span' );
		loaderElement.className = 'cepheus_loading';
		loaderElement.appendChild( document.createTextNode( 'Loading…' ) );
		
		document.body.appendChild( loaderElement );
		
		var xhr = new XMLHttpRequest();
		xhr.open( 'GET', '//store.steampowered.com/api/appuserdetails/?appids=' + toLookup.join( ',' ), true );
		
		xhr.onreadystatechange = function( )
		{
			if( this.readyState !== 4 )
			{
				return;
			}
			else if( this.status !== 200 )
			{
				loaderElement.textContent = 'Error ' + this.status;
				
				return;
			}
			
			var response = JSON.parse( this.responseText );
			
			for( var appid in response )
			{
				if( !lookupElements[ appid ] )
				{
					continue;
				}
				
				var data = response[ appid ];
				
				if( !data.data )
				{
					continue;
				}
				
				data = data.data; // Ye boy!
				
				var elements = lookupElements[ appid ];
				
				for( var i = 0; i < elements.length; i++ )
				{
					var element = elements[ i ];
					
					if( data.is_owned )
					{
						element.classList.add( 'owned_product' );
					}
					else if( data.added_to_wishlist )
					{
						element.classList.add( 'wished_product' );
					}
					
					element.dataset.highlightProcessed = true;
					
					sessionStorage.setItem( 'appid' + appid, '' + ( data.is_owned ? 1 : 0 ) + ( data.added_to_wishlist ? 1 : 0 ) );
				}
			}
			
			document.body.removeChild( loaderElement );
		};
		
		xhr.send();
	},
	
	FindSmallCaps = function( )
	{
		var rows = document.querySelectorAll( '.small_cap' );
		
		// small caps all over the place (featured games, recently updated, demos)
		for( i = 0; i < rows.length; i++ )
		{
			element = rows[ i ];
			attribute = regexGameHover.exec( element.getAttribute( 'onmouseover' ) );
			
			if( attribute )
			{
				AddToLookup( attribute[ 1 ], element );
			}
		}
	},
	
	FindCommon = function( selector )
	{
		var found, rows = document.querySelectorAll( selector );
		
		for( i = 0; i < rows.length; i++ )
		{
			element = rows[ i ];
			attribute = regexGameHover.exec( element.getAttribute( 'onmouseover' ) );
			
			if( attribute )
			{
				AddToLookup( attribute[ 1 ], element );
				
				found = true;
			}
			// Find first link and hope it's correct
			else
			{
				var element2 = element.querySelector( 'a' );
				attribute = regexAppID.exec( element2.href );
				
				if( attribute )
				{
					AddToLookup( attribute[ 1 ], element );
				}
			}
		}
		
		return found;
	},
	
	FindDailyDeal = function( )
	{
		// daily deal
		var rows = document.querySelector( '.dailydeal > .cap' );
		
		if( rows )
		{
			attribute = regexGameHover.exec( rows.getAttribute( 'onmouseover' ) );
			
			if( attribute )
			{
				AddToLookup( attribute[ 1 ], document.querySelector( '.dailydeal_content' ) );
			}
		}
	},
	
	FindClusterCapsules = function( )
	{
		// big cluster capsules
		var rows = document.querySelectorAll( '.cluster_capsule' );
		
		for( i = 0; i < rows.length; i++ )
		{
			element = rows[ i ];
			attribute = regexAppID.exec( element.href );
			
			if( attribute )
			{
				var selector = element.querySelector( '.main_cap_content, .large_cap_content' );
				AddToLookup( attribute[ 1 ], selector );
			}
		}
	},
	
	FindSpecialsBlock = function( )
	{
		// specials block
		var rows = document.querySelectorAll( '.special_block' );
		var regex = /app\/([0-9]+)\//;
		
		for( i = 0; i < rows.length; i++ )
		{
			element = rows[ i ];
			attribute = regex.exec( element.querySelector( 'a' ).href );
			
			if( attribute )
			{
				AddToLookup( attribute[ 1 ], element );
			}
		}
	};

if( document.cookie.match( /steamLogin=\d+/ ) )
{
	FindSmallCaps();
	
	if( FindCommon( '.tab_row' ) )
	{
		InjectMagnificentDynamicPageTabsHacks();
	}
	
	var pathname = window.location.pathname;
	
	if( /^\/app\/.*/.test( pathname ) )
	{
		FindCommon( '.game_area_dlc_row' );
	}
	else if( /^\/(tag|genre)\/.*/.test( pathname ) )
	{
		FindClusterCapsules();
	}
	else if( /^\/sale\/.*/.test( pathname ) )
	{
		FindCommon( '.promo_item_list > .item' );
		FindCommon( '.sale_page_purchase_app' );
	}
	else if( /^\/$/.test( pathname ) )
	{
		FindDailyDeal();
		FindSpecialsBlock();
		FindClusterCapsules();
		FindCommon( '.summersale_dailydeal' );
	}
	// TODO: http://store.steampowered.com/recommended/friendactivity
	// TODO: http://store.steampowered.com/recommended/
	// TODO: http://store.steampowered.com/recommended/morelike/app/214360/
	// TODO: http://store.steampowered.com/tag/browse/ - Browsing tag lists with ajax
	
	if( insertStylesheet )
	{
		InjectStylesheet();
	}
	
	if( toLookup.length )
	{
		LoadAppUserDetails( toLookup, lookupElements );
	}
}

});