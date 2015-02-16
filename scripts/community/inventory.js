'use strict';

(function()
{
	var FoundState =
	{
		None: 0,
		Process: 1,
		Added: 2,
		DisableButtons: 3
	};
	
	var i,
	    link,
	    giftCache = {},
		lookupGiftSubids = document.body.dataset.steamdbGiftSubid === 'true',
	    homepage = document.getElementById( 'steamdb_inventory_hook' ).dataset.homepage,
	    originalPopulateActions = window.PopulateActions,
	    fixCommunityUrls = !!document.getElementById( 'steamdb_https_fix' );
	
	window.PopulateActions = function( elActions, rgActions, item, owner )
	{
		var foundState = FoundState.None;
		
		try
		{
			// PopulateActions is called for both item.actions and item.owner_actions, we only want first one
			if( item.appid == 753 && rgActions === item.actions )
			{
				if( item.type === 'Coupon' && rgActions )
				{
					var couponLink, pos;
					
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							foundState = FoundState.Added;
							
							break;
						}
						else if( link.link )
						{
							pos = link.link.indexOf( 'list_of_subs=' );
							
							if( pos > 0 )
							{
								couponLink = link.link;
								
								foundState = FoundState.Process;
							}
						}
					}
					
					if( foundState === FoundState.Process )
					{
						var subs = couponLink.substring( pos + 'list_of_subs='.length ).split( ',' );
						
						for( i = 0; i < subs.length; i++ )
						{
							rgActions.push( {
								steamdb: true,
								link: homepage + 'sub/' + subs[ i ] + '/',
								name: 'View ' + subs[ i ] + ' on Steam Database'
							} );
						}
						
						foundState = FoundState.Added;
					}
				}
				else if( lookupGiftSubids && item.owner_actions && item.type === 'Gift' )
				{
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							if( link.link.match( /^#steamdb_/ ) !== null )
							{
								rgActions[ i ].link = homepage + 'sub/' + giftCache[ item.classid ] + '/';
							}
							
							foundState = FoundState.Added;
							
							break;
						}
					}
					
					if( foundState !== FoundState.Added )
					{
						foundState = FoundState.DisableButtons;
						
						var action =
						{
							steamdb: true,
							link: '#steamdb_' + item.id,
							name: 'View on Steam Database'
						};
						
						if( giftCache[ item.classid ] )
						{
							action.link = homepage + 'sub/' + giftCache[ item.classid ] + '/';
						}
						else
						{
							var xhr = new XMLHttpRequest();
							xhr.onreadystatechange = function()
							{
								if( xhr.readyState === 4 && xhr.status === 200 && xhr.response.packageid )
								{
									giftCache[ item.classid ] = xhr.response.packageid;
									
									link = elActions.querySelector( '.item_actions a[href="#steamdb_' + item.id + '"]' );
									
									if( link )
									{
										link.classList.remove( 'btn_disabled' );
										link.href = homepage + 'sub/' + xhr.response.packageid + '/';
									}
								}
							};
							xhr.open( 'GET', '//steamcommunity.com/gifts/' + item.id + '/validateunpack', true );
							xhr.responseType = 'json';
							xhr.send();
						}
						
						rgActions.push( action );
					}
				}
				else if( rgActions )
				{
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							foundState = FoundState.Added;
							
							break;
						}
						else if( link.link && link.link.match( /\.com\/(app|sub)\// ) )
						{
							foundState = FoundState.Process;
						}
					}
					
					if( foundState === FoundState.Process )
					{
						for( i = 0; i < rgActions.length; i++ )
						{
							link = rgActions[ i ].link;
							
							if( !link )
							{
								continue;
							}
							
							link = link.match( /\.com\/(app|sub)\/([0-9]{1,6})/ );
							
							if( link )
							{
								rgActions.push( {
									steamdb: true,
									link: homepage + link[ 1 ] + '/' + link[ 2 ] + '/',
									name: 'View on Steam Database'
								} );
								
								foundState = FoundState.Added;
								
								break;
							}
						}
					}
				}
				else if( item.type === 'Gift' )
				{
					item.actions = rgActions = [ {
						steamdb: true,
						link: homepage + 'search/?a=sub&q=' + encodeURIComponent( item.name ),
						name: 'Search on Steam Database'
					} ];
					
					foundState = FoundState.Added;
				}
			}
			
			// https fix
			if( fixCommunityUrls && rgActions )
			{
				for( i = 0; i < rgActions.length; i++ )
				{
					link = rgActions[ i ].link;
					
					if( link )
					{
						rgActions[ i ].link = link.replace( /^http:\/\/steamcommunity\.com/, 'https://steamcommunity.com' );
					}
				}
			}
		}
		catch( e )
		{
			// Don't break website functionality if something fails above
			console.error( e );
		}
		
		originalPopulateActions( elActions, rgActions, item, owner );
		
		try
		{
			// We want our links to be open in new tab
			if( foundState === FoundState.Added )
			{
				link = elActions.querySelectorAll( '.item_actions a[href^="' + homepage + '"]' );
				
				if( link )
				{
					for( i = 0; i < link.length; i++ )
					{
						link[ i ].target = '_blank';
					}
				}
			}
			else if( foundState === FoundState.DisableButtons )
			{
				link = elActions.querySelectorAll( '.item_actions a[href^="#steamdb_"]' );
				
				if( link )
				{
					for( i = 0; i < link.length; i++ )
					{
						link[ i ].target = '_blank';
						link[ i ].classList.add( 'btn_disabled' );
					}
				}
			}
		}
		catch( e )
		{
			// Don't break website functionality if something fails above
			console.error( e );
		}
	};
}());
