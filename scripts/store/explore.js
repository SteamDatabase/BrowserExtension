'use strict';

// Fix Valve's bug where empty queue banner has wrong height and it hides text
const emptyQueue = document.querySelector( '.discover_queue_empty' );

if( emptyQueue )
{
	emptyQueue.style.height = 'auto';
}

const applicationConfigElement = document.getElementById( 'application_config' );

if( !applicationConfigElement )
{
	throw new Error( 'Failed to find application_config' );
}

const storeUserConfigJSON = applicationConfigElement.dataset.store_user_config;
const applicationConfig = JSON.parse( applicationConfigElement.dataset.config );
const accessToken = storeUserConfigJSON && JSON.parse( storeUserConfigJSON ).webapi_token;

if( !accessToken || !applicationConfig )
{
	throw new Error( 'Failed to get application_config' );
}

let exploreButton;
let exploreStatus;
let itemButton;
let itemStatus;
let itemImage;

CreateSaleItemContainer();
CreateExploreContainer();

function CreateExploreContainer()
{
	const buttonContainer = document.createElement( 'div' );
	buttonContainer.className = 'steamdb_cheat_queue discovery_queue_customize_ctn';

	exploreButton = document.createElement( 'div' );
	exploreButton.className = 'btnv6_blue_hoverfade btn_medium';
	const span = document.createElement( 'span' );
	span.textContent = _t( 'explore_auto_discover' );
	exploreButton.append( span );
	buttonContainer.append( exploreButton );

	exploreStatus = document.createElement( 'div' );
	exploreStatus.className = 'steamdb_cheat_queue_text';
	exploreStatus.textContent = _t( 'explore_auto_discover_description' );
	buttonContainer.append( exploreStatus );

	const image = document.createElement( 'img' );
	image.src = GetLocalResource( 'icons/white.svg' );
	image.width = 32;
	image.height = 32;
	buttonContainer.append( image );

	const container = document.querySelector( '.discovery_queue_customize_ctn' );
	container.parentNode.insertBefore( buttonContainer, container );

	exploreButton.addEventListener( 'click', ( ) =>
	{
		if( exploreButton.classList.contains( 'btn_disabled' ) )
		{
			return;
		}

		StartViewTransition( () =>
		{
			exploreStatus.textContent = _t( 'explore_generating' );
			exploreButton.classList.add( 'btn_disabled' );
			GenerateQueue();
		} );
	}, false );
}

function CreateSaleItemContainer()
{
	const buttonContainer = document.createElement( 'div' );
	buttonContainer.className = 'steamdb_saleitem_claim discovery_queue_customize_ctn';

	itemButton = document.createElement( 'div' );
	itemButton.className = 'btnv6_blue_hoverfade btn_medium btn_disabled';
	const span = document.createElement( 'span' );
	span.textContent = _t( 'explore_saleitem_claim' );
	itemButton.append( span );
	buttonContainer.append( itemButton );

	itemStatus = document.createElement( 'div' );
	itemStatus.className = 'steamdb_cheat_queue_text';
	itemStatus.textContent = _t( 'explore_saleitem_cant_claim' );
	buttonContainer.append( itemStatus );

	itemImage = document.createElement( 'img' );
	itemImage.src = GetLocalResource( 'icons/white.svg' );
	itemImage.width = 32;
	itemImage.height = 32;
	itemImage.style.opacity = '0';
	buttonContainer.append( itemImage );

	const container = document.querySelector( '.discovery_queue_customize_ctn' );
	container.parentNode.insertBefore( buttonContainer, container );

	itemButton.addEventListener( 'click', ( ) =>
	{
		if( itemButton.classList.contains( 'btn_disabled' ) )
		{
			return;
		}

		StartViewTransition( () =>
		{
			itemButton.classList.add( 'btn_disabled' );
			ClaimSaleItem();
		} );
	}, false );

	CheckClaimSaleItem();
}

function GenerateQueue( generateFails = 0 )
{
	const valveQueueEl = document.getElementById( 'discovery_queue_ctn' );

	if( valveQueueEl )
	{
		valveQueueEl.style.display = 'none';
	}

	if( emptyQueue )
	{
		emptyQueue.style.display = 'block';
	}

	const params = new URLSearchParams();
	params.set( 'origin', location.origin );
	params.set( 'access_token', accessToken );
	params.set( 'country_code', applicationConfig.COUNTRY || 'US' );
	params.set( 'rebuild_queue', '1' );
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

				fails--;

				if( ++done === appids.length )
				{
					exploreButton.classList.remove( 'btn_disabled' );
					exploreStatus.textContent = _t( 'explore_finished' );
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
					exploreButton.classList.remove( 'btn_disabled' );
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
				skipParams.set( 'origin', location.origin );
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

			if( ++generateFails >= 20 )
			{
				exploreButton.classList.remove( 'btn_disabled' );
				exploreStatus.textContent = _t( 'explore_failed_to_clear_too_many' );
				return;
			}

			exploreStatus.textContent = `${_t( 'explore_generating' )} (#${generateFails})`;

			setTimeout( () =>
			{
				GenerateQueue( generateFails );
			}, RandomInt( 5000, 10000 * generateFails ) );
		} );
}

function HandleSaleItemResponse( response )
{
	if( response.next_claim_time )
	{
		const dateFormatter = new Intl.DateTimeFormat( GetLanguage(), {
			dateStyle: 'medium',
			timeStyle: 'short',
		} );
		const nextClaimTime = dateFormatter.format( response.next_claim_time * 1000 );

		itemStatus.textContent += ' ' + _t( 'explore_saleitem_next_item_time', [ nextClaimTime.toLocaleString() ] );

		const timer = ( response.next_claim_time * 1000 ) - Date.now();

		setTimeout( () =>
		{
			itemStatus.textContent = _t( 'explore_saleitem_claim_description' );
			itemButton.classList.remove( 'btn_disabled' );
		}, timer );
	}

	if( response.reward_item?.community_item_data )
	{
		const item = response.reward_item.community_item_data;
		const file = item.item_image_small || item.item_image_large;
		itemImage.src = `${applicationConfig.MEDIA_CDN_COMMUNITY_URL}images/items/${response.reward_item.appid}/${file}`;
		itemImage.title = item.item_title;
		itemImage.style.opacity = '1';
	}
}

function CheckClaimSaleItem( fails = 0 )
{
	const params = new URLSearchParams();
	params.set( 'origin', location.origin );
	params.set( 'access_token', accessToken );
	params.set( 'language', applicationConfig.LANGUAGE );

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

			StartViewTransition( () =>
			{
				if( response.can_claim )
				{
					itemStatus.textContent = _t( 'explore_saleitem_claim_description' );
					itemButton.classList.remove( 'btn_disabled' );
					return;
				}

				itemStatus.textContent = _t( 'explore_saleitem_cant_claim' );

				HandleSaleItemResponse( response );
			} );
		} )
		.catch( ( error ) =>
		{
			WriteLog( 'Failed to find out if a sale item can be claimed', error );

			if( ++fails >= 5 )
			{
				itemStatus.textContent = _t( 'explore_saleitem_cant_claim' );
				return;
			}

			setTimeout( () =>
			{
				CheckClaimSaleItem( fails );
			}, RandomInt( 5000, 10000 ) );
		} );
}

function ClaimSaleItem( fails = 0 )
{
	itemStatus.textContent = _t( 'explore_saleitem_trying_to_claim' );

	const params = new URLSearchParams();
	params.set( 'origin', location.origin );
	params.set( 'access_token', accessToken );
	params.set( 'language', applicationConfig.LANGUAGE );

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
				fails = 10; // If there is no item to claim the response is just empty
				throw new Error( 'Unexpected response' );
			}

			StartViewTransition( () =>
			{
				const itemTitle = response.reward_item?.community_item_data?.item_title;
				itemStatus.textContent = _t( 'explore_saleitem_success', [ itemTitle || `ID #${response.communityitemid}` ] );

				HandleSaleItemResponse( response );
			} );
		} )
		.catch( ( error ) =>
		{
			WriteLog( 'Failed to get a sale item', error );

			if( ++fails >= 5 )
			{
				itemButton.classList.remove( 'btn_disabled' );
				itemStatus.textContent = _t( 'explore_saleitem_claim_failed' );
				return;
			}

			setTimeout( () =>
			{
				ClaimSaleItem( fails );
			}, RandomInt( 5000, 10000 ) );
		} );
}

function RandomInt( min, max )
{
	return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

function StartViewTransition( callback )
{
	if( document.startViewTransition )
	{
		document.startViewTransition( () =>
		{
			try
			{
				callback();
			}
			catch( e )
			{
				console.error( e );
			}
		} );
	}
	else
	{
		callback();
	}
}
