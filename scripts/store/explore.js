'use strict';

// Fix Valve's bug where empty queue banner has wrong height and it hides text
const emptyQueue = document.querySelector( '.discover_queue_empty' );

if( emptyQueue )
{
	emptyQueue.style.height = 'auto';
}

const buttonContainer = document.createElement( 'div' );
buttonContainer.className = 'discovery_queue_customize_ctn';

const button = document.createElement( 'div' );
button.className = 'btnv6_blue_hoverfade btn_medium';
let span = document.createElement( 'span' );
span.appendChild( document.createTextNode( _t( 'explore_auto_discover' ) ) );
button.appendChild( span );
buttonContainer.appendChild( button );

span = document.createElement( 'span' );
span.style.lineHeight = '32px';
span.appendChild( document.createTextNode( _t( 'explore_auto_discover_description' ) ) );
buttonContainer.appendChild( span );

const image = document.createElement( 'img' );
image.src = GetLocalResource( 'icons/white.svg' );
image.width = 32;
image.height = 32;
image.style.float = 'right';
buttonContainer.appendChild( image );

const container = document.querySelector( '.discovery_queue_customize_ctn' );
container.parentNode.insertBefore( buttonContainer, container );

button.addEventListener( 'click', function( )
{
	GenerateQueue();
	button.remove();
}, false );

function GenerateQueue()
{
	const session = document.body.innerHTML.match( /g_sessionID = "(?<sessionid>\w+)";/ );

	if( !session )
	{
		span.textContent = 'Failed to find g_sessionID'; // This shouldn't happen, so don't translate
		return;
	}

	span.textContent = _t( 'explore_generating' );

	let formData = new FormData();
	formData.append( 'sessionid', session.groups.sessionid );
	formData.append( 'queuetype', 0 );

	fetch( 'https://store.steampowered.com/explore/generatenewdiscoveryqueue', {
		credentials: 'include',
		method: 'POST',
		body: formData,
		headers: {
			'X-Requested-With': 'SteamDB',
		},
	} )
		.then( ( response ) => response.json() )
		.then( ( data ) =>
		{
			let done = 0;
			let fails = 0;

			const requestDone = ( response ) =>
			{
				if( response.status !== 200 )
				{
					requestFail( new Error( `HTTP ${response.status}` ) );
					return;
				}

				if( ++done === data.queue.length )
				{
					span.textContent = _t( 'explore_finished' );

					ClaimSaleItem();
				}
				else
				{
					span.textContent = _t( 'explore_exploring', [ done, data.queue.length ] );

					requestNextInQueue( done );
				}
			};

			const requestFail = ( error ) =>
			{
				WriteLog( 'Failed to clear queue', error );

				if( ++fails >= 10 )
				{
					span.textContent = _t( 'explore_failed_to_clear_too_many', [ done ] );

					return;
				}

				span.textContent = _t( 'explore_failed_to_clear', [ done ] );

				setTimeout( () =>
				{
					requestNextInQueue( done );
				}, RandomInt( 5000, 10000 ) );
			};

			const requestNextInQueue = ( index ) =>
			{
				formData = new FormData();
				formData.append( 'sessionid', session.groups.sessionid );
				formData.append( 'appid_to_clear_from_queue', data.queue[ index ] );

				fetch( 'https://store.steampowered.com/app/10', {
					credentials: 'include',
					method: 'POST',
					body: formData,
					headers: {
						'X-Requested-With': 'SteamDB',
					},
				} )
					.then( requestDone )
					.catch( requestFail );
			};

			requestNextInQueue( 0 );
		} )
		.catch( ( error ) =>
		{
			WriteLog( 'Failed to generate queue', error );

			setTimeout( GenerateQueue, RandomInt( 5000, 10000 ) );

			span.textContent = _t( 'explore_failed_to_generate' );
		} );
}

function ClaimSaleItem()
{
	const applicationConfigElement = document.getElementById( 'application_config' );
	if( applicationConfigElement )
	{
		const userConfigJSON = applicationConfigElement.dataset.store_user_config;
		const webapiToken =
			userConfigJSON && JSON.parse( userConfigJSON ).webapi_token;

		if( webapiToken )
		{
			let result = span.textContent; // storing explore result to show again after trying to get a sale item
			span.textContent = _t( 'explore_saleitem_trying_to_claim' );

			fetch(
				`https://api.steampowered.com/ISaleItemRewardsService/ClaimItem/v1?access_token=${webapiToken}`,
				{
					method: 'POST',
				},
			)
				.then( ( response ) =>
				{
					if( response.ok )
					{
						return response.json();
					}
					else
					{
						throw new Error( `HTTP ${response.status}` );
					}
				} )
				.then( ( data ) =>
				{
					const response = data.response;
					if( response && response.communityitemid )
					{
						const itemTitle = response.reward_item?.community_item_data?.item_title;
						result += ' ' + _t(	'explore_saleitem_success',	[ itemTitle || `ID #${response.communityitemid}` ] );
					}
					else
					{
						throw new Error(
							'No item ID returned while trying to get a sale item, perhaps it was already claimed.',
						);
					}
				} )
				.catch( ( error ) =>
				{
					WriteLog( 'Failed to get a sale item', error );
				} )
				.finally( () =>
				{
					span.textContent = result;
				} );
		}
	}
}

function RandomInt( min, max )
{
	return Math.floor( Math.random() * ( max - min + 1 ) + min );
}
