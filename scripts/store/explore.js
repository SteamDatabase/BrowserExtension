'use strict';

// Fix Valve's bug where empty queue banner has wrong height and it hides text
/** @type {HTMLElement} */
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

/** @type {HTMLElement} */
let exploreButton;
/** @type {HTMLElement} */
let exploreStatus;

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

			/**
			 * @param {Response} response
			 */
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

			/**
			 * @param {any} error
			 */
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

			/**
			 * @param {number} index
			 */
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

/**
 * @param {number} min
 * @param {number} max
 */
function RandomInt( min, max )
{
	return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

/**
 * @param {ViewTransitionUpdateCallback} callback
 */
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
