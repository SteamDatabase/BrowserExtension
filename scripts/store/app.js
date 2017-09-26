'use strict';

var container = document.getElementById( 'error_box' );

if( container )
{
	var link = document.createElement( 'a' );
	link.className = 'steamdb_error_link';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
	link.appendChild( document.createTextNode( 'View on Steam Database' ) );
	
	container.appendChild( link );
}
else
{
	GetOption( { 'button-app': true, 'button-pcgw': true, 'link-subid': true, 'online-stats': true }, function( items )
	{
		var link, element, image, container, injectTooltipFix = false;
		
		if( items[ 'online-stats' ] && !document.querySelector( '.game_area_dlc_bubble' ) )
		{
			var blockInner = document.createElement( 'div' );
			blockInner.className = 'block_content_inner';
			
			var block = document.createElement( 'div' );
			block.className = 'block responsive_apppage_details_right steamdb_stats';
			block.appendChild( blockInner );
			
			link = document.createElement( 'a' );
			link.title = 'View more information and graphs on SteamDB';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/graphs/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
			
			image = document.createElement( 'img' );
			image.className = 'steamdb_stats_logo';
			image.src = GetLocalResource( 'icons/white.svg' );
			link.appendChild( image );
			
			blockInner.appendChild( link );
			
			image = document.createElement( 'b' );
			image.id = 'steamdb_stats_online_now';
			image.textContent = '…';
			link = document.createElement( 'p' );
			link.appendChild( image );
			link.appendChild( document.createTextNode( ' online now' ) );
			blockInner.appendChild( link );
			
			image = document.createElement( 'b' );
			image.id = 'steamdb_stats_peak_today';
			image.textContent = '…';
			link = document.createElement( 'p' );
			link.appendChild( image );
			link.appendChild( document.createTextNode( ' peak today' ) );
			blockInner.appendChild( link );
			
			image = document.createElement( 'b' );
			image.id = 'steamdb_stats_peak_all';
			image.textContent = '…';
			link = document.createElement( 'p' );
			link.appendChild( image );
			link.appendChild( document.createTextNode( ' all-time peak' ) );
			blockInner.appendChild( link );
			
			var clear = document.createElement( 'div' );
			clear.style.clear = 'left';
			blockInner.appendChild( clear );
			
			container = document.querySelector( '.game_meta_data' );
			
			if( container )
			{
				container.insertBefore( block, container.firstChild );
			}
			
			var StatsErrorCallback = function( err )
			{
				var SetError = function( element )
				{
					element = document.getElementById( element );
					element.textContent = 'N/A';
					element.title = err.error;
				};
				
				SetError( 'steamdb_stats_online_now' );
				SetError( 'steamdb_stats_peak_today' );
				SetError( 'steamdb_stats_peak_all' );
			};
			
			var xhr = new XMLHttpRequest();
			xhr.onerror = StatsErrorCallback;
			xhr.onreadystatechange = function()
			{
				if( xhr.readyState !== 4 )
				{
					return;
				}
				
				if( xhr.status !== 200 )
				{
					StatsErrorCallback( { error: 'Something went wrong on SteamDB: HTTP ' + xhr.status } );
					
					return;
				}
				
				if( !xhr.response.success )
				{
					StatsErrorCallback( { error: 'SteamDB has no data for this app.' } );
					
					return;
				}
				
				var FormatNumber = function( num )
				{
					return num.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
				};
				
				document.getElementById( 'steamdb_stats_online_now' ).textContent = FormatNumber( xhr.response.data.CurrentPlayers );
				document.getElementById( 'steamdb_stats_peak_today' ).textContent = FormatNumber( xhr.response.data.MaxDailyPlayers );
				document.getElementById( 'steamdb_stats_peak_all' ).textContent = FormatNumber( xhr.response.data.MaxPlayers );
				
				if( xhr.response.data.LastDepotUpdate )
				{
					container = document.createElement( 'div' );
					container.className = 'dev_row steamdb_last_update';
					container.title = 'As seen by Steam Database';
					
					link = document.createElement( 'a' );
					link.className = 'date';
					
					if( xhr.response.data.WarnOldUpdate )
					{
						link.className = 'steamdb_last_update_old';
					}
					
					link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/history/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
					link.textContent = xhr.response.data.LastDepotUpdate;
					
					var subtitle = document.createElement( 'div' );
					subtitle.className = 'subtitle column';
					subtitle.textContent = 'Depots Update:';
					
					container.appendChild( subtitle );
					container.appendChild( link );
					
					element = document.querySelector( '.release_date' );
					
					if( element )
					{
						element.parentNode.insertBefore( container, element.nextSibling );
					}
				}
			};
			xhr.open( 'GET', GetHomepage() + 'api/GetCurrentPlayers/?appid=' + GetCurrentAppID() + '&source=extension_steam_store', true );
			xhr.responseType = 'json';
			xhr.send();
		}
		
		if( items[ 'button-app' ] )
		{
			container = document.querySelector( '.apphub_OtherSiteInfo' );
			
			if( container )
			{
				link = document.createElement( 'a' );
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
				
				element = document.createElement( 'span' );
				element.dataset.storeTooltip = 'View on Steam Database';
				link.appendChild( element );
				
				image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/white.svg' );
				
				element.appendChild( image );
				
				container.insertBefore( link, container.firstChild );
				
				injectTooltipFix = true;
			}
		}
		
		if( items[ 'button-pcgw' ] )
		{
			container = document.querySelector( '.apphub_OtherSiteInfo' );
			
			if( container )
			{
				link = document.createElement( 'a' );
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = 'http://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
				
				element = document.createElement( 'span' );
				element.dataset.storeTooltip = 'View article on PCGamingWiki';
				link.appendChild( element );
				
				image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/pcgamingwiki.svg' );
				
				element.appendChild( image );
				
				container.insertBefore( link, container.firstChild );
				
				// Best hacks EU
				container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );
				
				injectTooltipFix = true;
			}
		}
		
		if( items[ 'link-subid' ] )
		{
			// Find each "add to cart" button
			container = document.querySelectorAll( 'input[name="subid"]' );
			
			var hasDropdowns = false, i = 0, subid = 0, subidElement, length = container.length;
			
			for( i = 0; i < length; i++ )
			{
				element = container[ i ];
				
				subid = element.value;
				
				element = element.parentElement.parentElement;
				
				subidElement = document.createElement( 'i' );
				subidElement.className = 'steamdb_subid';
				
				// Is this a subscription selector?
				if( subid.length === 0 )
				{
					if( element.querySelector( '.game_area_purchase_game_dropdown_selection' ) )
					{
						hasDropdowns = true;
						
						subidElement.appendChild( document.createTextNode( '(nothing selected)' ) );
						
						link = document.createElement( 'a' );
						link.className = 'steamdb_link' + ( element.querySelector( '.game_area_purchase_game_dropdown_left_panel' ) ? '' : ' steamdb_float_left' );
						link.href = '#';
						link.appendChild( document.createTextNode( 'View on Steam Database ' ) );
						link.appendChild( subidElement );
						
						element.appendChild( link );
					}
				}
				else
				{
					subidElement.appendChild( document.createTextNode( '(' + subid + ')' ) );
					
					link = document.createElement( 'a' );
					link.className = 'steamdb_link steamdb_float_left';
					link.href = GetHomepage() + 'sub/' + subid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
					link.appendChild( document.createTextNode( 'View on Steam Database ' ) );
					link.appendChild( subidElement );
					
					element.appendChild( link );
				}
			}
			
			// We have to inject our JS directly into the page to hook Steam's functionatily
			if( hasDropdowns )
			{
				element = document.createElement( 'script' );
				element.id = 'steamdb_subscriptions_hook';
				element.type = 'text/javascript';
				element.src = GetLocalResource( 'scripts/store/subscriptions.js' );
				element.dataset.homepage = GetHomepage();
				
				document.head.appendChild( element );
			}
		}
		
		// We need to bind a tooltip, and the only way to do that is to inject a script into the page
		if( injectTooltipFix )
		{
			element = document.createElement( 'script' );
			element.id = 'steamdb_bind_tooltip';
			element.type = 'text/javascript';
			element.appendChild( document.createTextNode( 'BindStoreTooltip( jQuery( ".btn_steamdb > span" ) );' ) );
			
			document.head.appendChild( element );
		}
	} );
	
	const positiveVoteText = document.querySelector( 'label[for="review_type_positive"] .user_reviews_count' );
	const negativeVoteText = document.querySelector( 'label[for="review_type_negative"] .user_reviews_count' );
	
	if( positiveVoteText && negativeVoteText )
	{
		const positiveVotes = parseInt( positiveVoteText.textContent.replace( /[\(\.,\)]/g, '' ), 10 );
		const totalVotes = positiveVotes + parseInt( negativeVoteText.textContent.replace( /[\(\.,\)]/g, '' ), 10 );
		const average = positiveVotes / totalVotes;
		const score = average - ( average - 0.5 ) * Math.pow( 2, -Math.log10( totalVotes + 1 ) );
		
		const container = document.createElement( 'div' );
		container.className = 'user_reviews_summary_row';
		
		const subtitle = document.createElement( 'div' );
		subtitle.className = 'subtitle column';
		subtitle.textContent = 'SteamDB Rating:';
		
		const summary = document.createElement( 'div' );
		const link = document.createElement( 'a' );
		link.className = 'summary column game_review_summary';
		link.href = 'https://steamdb.info/blog/steamdb-rating/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		
		if( score > 0.74 )
		{
			link.className += ' positive';
		}
		else if( score > 0.49 )
		{
			link.className += ' mixed';
		}
		
		link.textContent = ( score * 100 ).toFixed( 2 ) + '%';
		
		summary.appendChild( link );
		container.appendChild( subtitle );
		container.appendChild( summary );
		
		let element = document.querySelectorAll( '.user_reviews_summary_row' );
		element = element[ element.length - 1 ];
		
		if( element )
		{
			element.parentNode.insertBefore( container, element.nextSibling );
		}
	}
}
