'use strict';

// Fix Valve's bug where empty queue banner has wrong height and it hides text
const emptyQueue = document.querySelector( '.discover_queue_empty' );

if( emptyQueue )
{
	emptyQueue.style.height = 'auto';
}

const buttonContainer = document.createElement( 'div' );
buttonContainer.className = 'discovery_queue_customize_ctn';
buttonContainer.style.display = 'flex';
buttonContainer.style.alignItems = 'center';

const button = document.createElement( 'div' );
button.className = 'btnv6_blue_hoverfade btn_medium';
const span = document.createElement( 'span' );
span.appendChild( document.createTextNode( _t( 'explore_auto_discover' ) ) );
button.appendChild( span );
buttonContainer.appendChild( button );

const textElements = document.createElement( 'div' );

const exploreStatus = document.createElement( 'div' );
exploreStatus.style.lineHeight = '32px';
exploreStatus.appendChild( document.createTextNode( _t( 'explore_auto_discover_description' ) ) );
textElements.appendChild( exploreStatus );

const itemStatus = document.createElement( 'div' );
itemStatus.style.lineHeight = '32px';
textElements.appendChild( itemStatus );

buttonContainer.appendChild( textElements );

const image = document.createElement( 'img' );
image.src = GetLocalResource( 'icons/white.svg' );
image.width = 32;
image.height = 32;
image.style.marginLeft = 'auto';
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
		exploreStatus.textContent = 'Failed to find g_sessionID'; // This shouldn't happen, so don't translate
		return;
	}

	exploreStatus.textContent = _t( 'explore_generating' );

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
					exploreStatus.textContent = _t( 'explore_finished' );

					ClaimSaleItem();
				}
				else
				{
					exploreStatus.textContent = _t( 'explore_exploring', [ done, data.queue.length ] );

					requestNextInQueue( done );
				}
			};

			const requestFail = ( error ) =>
			{
				WriteLog( 'Failed to clear queue', error );

				if( ++fails >= 10 )
				{
					exploreStatus.textContent = _t( 'explore_failed_to_clear_too_many', [ done ] );

					return;
				}

				exploreStatus.textContent = _t( 'explore_failed_to_clear', [ done ] );

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

			exploreStatus.textContent = _t( 'explore_failed_to_generate' );
		} );
}

function ClaimSaleItem()
{
	const applicationConfigElement = document.getElementById( 'application_config' );
	if( applicationConfigElement )
	{
		const storeUserConfigJSON = applicationConfigElement.dataset.store_user_config;
		const webapiToken = storeUserConfigJSON && JSON.parse( storeUserConfigJSON ).webapi_token;

		if( webapiToken )
		{
			itemStatus.textContent = _t( 'explore_saleitem_trying_to_claim' );

			const params = new URLSearchParams();
			params.set( 'access_token', webapiToken );

			const configJSON = applicationConfigElement.dataset.config;
			const language = configJSON && JSON.parse( configJSON ).LANGUAGE;
			if( language )
			{
				params.set( 'language', language );
			}

			const claimItem = ( fails = 0, maxRetries = 5 ) =>
			{
				fetch(
					`https://api.steampowered.com/ISaleItemRewardsService/ClaimItem/v1?${params.toString()}`,
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
							itemStatus.textContent = _t( 'explore_saleitem_success', [ itemTitle || `ID #${response.communityitemid}` ] );
						}
						else
						{
							itemStatus.textContent = _t( 'explore_saleitem_empty' );
						}
					} )
					.catch( ( error ) =>
					{
						WriteLog( 'Failed to get a sale item', error );
						fails++;

						if( fails < maxRetries )
						{
							setTimeout( () =>
							{
								claimItem( fails );
							}, RandomInt( 5000, 10000 ) );
						}
						else
						{
							itemStatus.textContent = _t( 'explore_saleitem_claim_failed', [ maxRetries, error.message ] );
						}
					} );
			};

			const canClaimItem = ( fails = 0, maxRetries = 5 ) =>
			{
				fetch( `https://api.steampowered.com/ISaleItemRewardsService/CanClaimItem/v1?${params.toString()}` )
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
						if( response && response.can_claim === true )
						{
							claimItem();
						}
						else
						{
							itemStatus.textContent = _t( 'explore_saleitem_cant_claim' );
							if( response.next_claim_time )
							{
								const nextClaimTime = new Date( response.next_claim_time * 1000 );
								itemStatus.textContent += ' ' + _t( 'explore_saleitem_next_item_time', [ nextClaimTime.toLocaleString() ] );
							}
						}
					} )
					.catch( ( error ) =>
					{
						WriteLog( 'Failed to find out if a sale item can be claimed', error );
						fails++;

						if( fails < maxRetries )
						{
							setTimeout( () =>
							{
								canClaimItem( fails );
							}, RandomInt( 5000, 10000 ) );
						}
						else
						{
							itemStatus.textContent = _t( 'explore_saleitem_claim_failed', [ maxRetries, error.message ] );
						}
					} );
			};

			canClaimItem();
		}
	}
}

function RandomInt( min, max )
{
	return Math.floor( Math.random() * ( max - min + 1 ) + min );
}
