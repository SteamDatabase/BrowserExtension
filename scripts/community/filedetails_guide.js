'use strict';

if( document.querySelector( '.guideTopContent' ) )
{
	const guide = document.querySelector( '.guide' );

	if( guide.querySelector( '.bb_spoiler' ) )
	{
		const StartViewTransition = ( callback ) =>
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
		};

		const controls = document.querySelector( '#ItemControls' );

		const divider = document.createElement( 'div' );
		divider.className = 'vertical_divider';
		controls.append( divider );

		const checkboxWrapper = document.createElement( 'label' );
		checkboxWrapper.textContent = _t( 'spoilers_reveal' );
		checkboxWrapper.className = 'workshopItemControlCtn general_btn steamdb_reveal_spoilers_button';

		const checkbox = document.createElement( 'input' );
		checkbox.type = 'checkbox';
		checkboxWrapper.prepend( checkbox );
		controls.append( checkboxWrapper );

		checkbox.addEventListener( 'change', () =>
		{
			const spoilers = guide.querySelectorAll( '.bb_spoiler' );
			const reveal = checkbox.checked;

			StartViewTransition( () =>
			{
				for( const spoiler of spoilers )
				{
					spoiler.classList.toggle( 'steamdb_spoiler_revealed', reveal );
				}
			} );
		} );
	}
}
