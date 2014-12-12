'use strict';

(function()
{
	var i,
	    link,
	    homepage = document.getElementById( 'steamdb_inventory_hook' ).dataset.homepage,
	    originalPopulateActions = window.PopulateActions;
	
	window.PopulateActions = function( elActions, rgActions, item )
	{
		var foundState = 0;
		
		try
		{
			if( item.appid == 753 )
			{
				if( item.type === 'Coupon' && rgActions )
				{
					var couponLink, pos;
					
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							foundState = 2;
							
							break;
						}
						else if( link.link )
						{
							pos = link.link.indexOf( 'list_of_subs=' );
							
							if( pos > 0 )
							{
								couponLink = link.link;
								
								foundState = 1;
							}
						}
					}
					
					if( foundState === 1 )
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
						
						foundState = 2;
					}
				}
				else if( rgActions )
				{
					for( i = 0; i < rgActions.length; i++ )
					{
						link = rgActions[ i ];
						
						if( link.steamdb )
						{
							foundState = 2;
							break;
						}
						else if( link.link && link.link.match( /\.com\/(app|sub)\// ) )
						{
							foundState = 1;
						}
					}
					
					if( foundState === 1 )
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
								
								foundState = 2;
								
								break;
							}
						}
					}
				}
				else if( !item.actions && item.type === 'Gift' ) // This function gets called with owner_actions too
				{
					item.actions = rgActions = [ {
						steamdb: true,
						link: homepage + 'search/?a=sub&q=' + encodeURIComponent( item.name ),
						name: 'Search on Steam Database'
					} ];
					
					foundState = 2;
				}
			}
		}
		catch( e )
		{
			// Don't break website functionality if something fails above
			console.error( e );
		}
		
		originalPopulateActions( elActions, rgActions, item );
		
		// We want our links to be open in new tab
		if( foundState === 2 )
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
	};
}());
