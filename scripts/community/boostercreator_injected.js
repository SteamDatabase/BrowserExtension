'use strict';

/** @type {HTMLSelectElement} */
const gameSelector = document.querySelector( '#booster_game_selector' );

if( gameSelector )
{
	// Add a container for the available date before the game selector
	const availableDateContainer = document.createElement( 'div' );
	availableDateContainer.id = 'booster_available_date';
	gameSelector.after( availableDateContainer );

	// Add an event listener to update the available date when the game selector changes
	gameSelector.addEventListener( 'change', updateBoosterAvailableDate );

	// Initialize the available date when the script loads
	updateBoosterAvailableDate();
}

function updateBoosterAvailableDate( )
{
	const availableDateContainer = document.getElementById( 'booster_available_date' );
	const selectedGame = gameSelector.value;

	const availableDate = window.CBoosterCreatorPage.sm_rgBoosterData[ selectedGame ]?.available_at_time;

	if( availableDate )
	{
		availableDateContainer.textContent = `You will not be able to create another Booster Pack for this game until ${availableDate}.`;
	}
	else
	{
		availableDateContainer.textContent = '';
	}
}
