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

	fetch( '/explore/generatenewdiscoveryqueue', {
		body: formData,
		method: 'post',
	} )
		.then( ( response ) => response.json() )
		.then( ( data ) =>
		{
			const requests = [];
			let done = 0;
			let errorShown;

			const requestDone = () =>
			{
				if( errorShown )
				{
					return;
				}

				span.textContent = _t( 'explore_exploring', [ ++done, data.queue.length ] );
			};

			const requestFail = ( error ) =>
			{
				WriteLog( 'Failed to clear queue', error );

				if( errorShown )
				{
					return;
				}

				errorShown = true;

				span.textContent = _t( 'explore_failed_to_clear', [ ++done ] );
			};

			for( const queuedItem of data.queue )
			{
				formData = new FormData();
				formData.append( 'sessionid', session.groups.sessionid );
				formData.append( 'appid_to_clear_from_queue', queuedItem );

				const request = fetch( '/app/10', {
					body: formData,
					method: 'post',
				} )
					.then( requestDone )
					.catch( requestFail );

				requests.push( request );
			}

			Promise.allSettled( requests ).then( () =>
			{
				if( errorShown )
				{
					setTimeout( GenerateQueue, 5000 );

					span.textContent = _t( 'explore_failed_to_generate' );
				}

				span.textContent = _t( 'explore_finished' );
			} );
		} )
		.catch( ( error ) =>
		{
			WriteLog( 'Failed to generate queue', error );

			setTimeout( GenerateQueue, 5000 );

			span.textContent = _t( 'explore_failed_to_generate' );
		} );
}
