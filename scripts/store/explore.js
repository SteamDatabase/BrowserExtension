'use strict';

// Fix Valve's bug where empty queue banner has wrong height and it hides text
const emptyQueue = document.querySelector( '.discover_queue_empty' );

if( emptyQueue )
{
	emptyQueue.style.height = 'auto';
}

const buttonContainer = document.createElement( 'div' );
buttonContainer.id = 'steamdb_cheat_queue';
buttonContainer.className = 'discovery_queue_customize_ctn';

const button = document.createElement( 'div' );
button.className = 'btnv6_blue_hoverfade btn_medium';
const span = document.createElement( 'span' );
span.appendChild( document.createTextNode( _t( 'explore_auto_discover' ) ) );
button.appendChild( span );
buttonContainer.appendChild( button );

const textElements = document.createElement( 'div' );
textElements.className = 'steamdb_cheat_queue_text';

const exploreStatus = document.createElement( 'div' );
exploreStatus.appendChild( document.createTextNode( _t( 'explore_auto_discover_description' ) ) );
textElements.appendChild( exploreStatus );

const itemStatus = document.createElement( 'div' );
textElements.appendChild( itemStatus );

buttonContainer.appendChild( textElements );

const image = document.createElement( 'img' );
image.src = GetLocalResource( 'icons/white.svg' );
image.width = 32;
image.height = 32;
buttonContainer.appendChild( image );

const container = document.querySelector( '.discovery_queue_customize_ctn' );
container.parentNode.insertBefore( buttonContainer, container );

button.addEventListener( 'click', function( )
{
	StartViewTransition( () =>
	{
		button.remove();
		GenerateQueue();
	} );
}, false );

function GenerateQueue( generateFails = 0 )
{
	const applicationConfigElement = document.getElementById( 'application_config' );

	if( !applicationConfigElement )
	{
		exploreStatus.textContent = 'Failed to find application_config'; // This shouldn't happen, so don't translate
		return;
	}

	const storeUserConfigJSON = applicationConfigElement.dataset.store_user_config;
	const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );
	const accessToken = storeUserConfigJSON && JSON.parse( storeUserConfigJSON ).webapi_token;

	if( !accessToken || !applicationConfig )
	{
		exploreStatus.textContent = 'Failed to get application_config'; // This shouldn't happen, so don't translate
		return;
	}

	exploreStatus.textContent = _t( 'explore_generating' );

	const params = new URLSearchParams();
	params.set( 'access_token', accessToken );
	params.set( 'country_code', applicationConfig.COUNTRY || 'US' );
	// params.set( 'rebuild_queue', '1' );
	params.set( 'queue_type', '0' ); // k_EStoreDiscoveryQueueTypeNew
	params.set( 'ignore_user_preferences', '1' );

	fetch(
		`${applicationConfig.WEBAPI_BASE_URL}IStoreService/GetDiscoveryQueue/v1/?${params.toString()}`,
	)
		.then( ( response ) =>
		{
			if( !response.ok )
			{
				throw new Error( `HTTP ${response.status}` );
			}

			return response.json();
		} )
		.then( ( data ) =>
		{
			if( !data.response || !data.response.appids )
			{
				throw new Error( 'Unexpected response' );
			}

			const appids = data.response.appids;
			let done = 0;
			let fails = 0;

			const requestDone = ( response ) =>
			{
				if( response.status !== 200 )
				{
					requestFail( new Error( `HTTP ${response.status}` ) );
					return;
				}

				if( ++done === appids.length )
				{
					StartViewTransition( () =>
					{
						exploreStatus.textContent = _t( 'explore_finished' );

						ClaimSaleItem( applicationConfig, accessToken );
					} );
				}
				else
				{
					exploreStatus.textContent = _t( 'explore_exploring', [ done, appids.length ] );

					requestNextInQueue( done );
				}
			};

			const requestFail = ( error ) =>
			{
				WriteLog( 'Failed to clear queue item', error );

				if( ++fails >= 10 )
				{
					exploreStatus.textContent = _t( 'explore_failed_to_clear_too_many' );
					return;
				}

				setTimeout( () =>
				{
					requestNextInQueue( done );
				}, RandomInt( 5000, 10000 ) );
			};

			const requestNextInQueue = ( index ) =>
			{
				const skipParams = new URLSearchParams();
				skipParams.set( 'access_token', accessToken );
				skipParams.set( 'appid', appids[ index ] );

				fetch(
					`${applicationConfig.WEBAPI_BASE_URL}IStoreService/SkipDiscoveryQueueItem/v1/?${skipParams.toString()}`,
					{
						method: 'POST',
					},
				)
					.then( requestDone )
					.catch( requestFail );
			};

			requestNextInQueue( 0 );
		} )
		.catch( ( error ) =>
		{
			WriteLog( 'Failed to get discovery queue', error );

			if( ++generateFails >= 10 )
			{
				exploreStatus.textContent = _t( 'explore_failed_to_clear_too_many' );
				return;
			}

			setTimeout( () =>
			{
				GenerateQueue( generateFails );
			}, RandomInt( 5000, 10000 ) );
		} );
}

function ClaimSaleItem( applicationConfig, accessToken )
{
	itemStatus.textContent = _t( 'explore_saleitem_trying_to_claim' );

	const params = new URLSearchParams();
	params.set( 'access_token', accessToken );
	params.set( 'language', applicationConfig.LANGUAGE );

	const claimItem = ( fails = 0 ) =>
	{
		fetch(
			`${applicationConfig.WEBAPI_BASE_URL}ISaleItemRewardsService/ClaimItem/v1/?${params.toString()}`,
			{
				method: 'POST',
			},
		)
			.then( ( response ) =>
			{
				if( !response.ok )
				{
					throw new Error( `HTTP ${response.status}` );
				}

				return response.json();
			} )
			.then( ( data ) =>
			{
				const response = data.response;

				if( !response || !response.communityitemid )
				{
					throw new Error( 'Unexpected response' );
				}

				StartViewTransition( () =>
				{
					const itemTitle = response.reward_item?.community_item_data?.item_title;
					itemStatus.textContent = _t( 'explore_saleitem_success', [ itemTitle || `ID #${response.communityitemid}` ] );

					if( response.reward_item?.community_item_data )
					{
						createItemImage( response.reward_item );
					}
				} );
			} )
			.catch( ( error ) =>
			{
				WriteLog( 'Failed to get a sale item', error );

				if( ++fails >= 5 )
				{
					itemStatus.textContent = _t( 'explore_saleitem_claim_failed' );
					return;
				}

				setTimeout( () =>
				{
					claimItem( fails );
				}, RandomInt( 5000, 10000 ) );
			} );
	};

	const canClaimItem = ( fails = 0 ) =>
	{
		fetch( `${applicationConfig.WEBAPI_BASE_URL}ISaleItemRewardsService/CanClaimItem/v1/?${params.toString()}` )
			.then( ( response ) =>
			{
				if( !response.ok )
				{
					throw new Error( `HTTP ${response.status}` );
				}

				return response.json();
			} )
			.then( ( data ) =>
			{
				const response = data.response;

				if( response && response.can_claim )
				{
					claimItem();
					return;
				}

				StartViewTransition( () =>
				{
					itemStatus.textContent = _t( 'explore_saleitem_cant_claim' );

					if( response.next_claim_time )
					{
						const dateFormatter = new Intl.DateTimeFormat( GetLanguage(), {
							dateStyle: 'medium',
							timeStyle: 'short',
						} );
						const nextClaimTime = dateFormatter.format( response.next_claim_time * 1000 );

						itemStatus.textContent += ' ' + _t( 'explore_saleitem_next_item_time', [ nextClaimTime.toLocaleString() ] );
					}

					if( response.reward_item?.community_item_data )
					{
						createItemImage( response.reward_item );
					}
				} );
			} )
			.catch( ( error ) =>
			{
				WriteLog( 'Failed to find out if a sale item can be claimed', error );

				if( ++fails >= 5 )
				{
					itemStatus.textContent = _t( 'explore_saleitem_claim_failed' );
					return;
				}

				setTimeout( () =>
				{
					canClaimItem( fails );
				}, RandomInt( 5000, 10000 ) );
			} );
	};

	const createItemImage = ( item ) =>
	{
		const itemImage = document.createElement( 'img' );
		itemImage.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/items/${item.appid}/${item.community_item_data.item_image_small || item.community_item_data.item_image_large}`;
		itemImage.width = 32;
		itemImage.height = 32;
		itemImage.title = item.community_item_data.item_title;
		image.insertAdjacentElement( 'beforebegin', itemImage );
	};

	canClaimItem();
}

function RandomInt( min, max )
{
	return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

function StartViewTransition( callback )
{
	if( document.startViewTransition )
	{
		document.startViewTransition( callback );
	}
	else
	{
		callback();
	}
}
