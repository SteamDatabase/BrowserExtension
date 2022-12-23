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
		span.textContent = _t( 'error' );
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

			const requestDone = () =>
			{
				if( ++done === data.queue.length )
				{
					span.textContent = _t( 'explore_finished' );
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
				}, 5000 );
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

			setTimeout( GenerateQueue, 5000 );

			span.textContent = _t( 'explore_failed_to_generate' );
		} );
}
