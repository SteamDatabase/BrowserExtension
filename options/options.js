(function()
{
	var element, checkboxes = document.querySelectorAll( '.option-check' ), options = {};
	
	for( var i = 0; i < checkboxes.length; i++ )
	{
		element = checkboxes[ i ];
		
		options[ element.dataset.option ] = element;
		
		element.addEventListener( 'change', CheckboxChange );
	}
	
	chrome.storage.local.get( Object.keys( options ), function( items )
	{
		for( var item in items )
		{
			options[ item ].checked = false;
		}
	} );
	
	function CheckboxChange( )
	{
		var option = this.dataset.option;
		
		if( this.checked )
		{
			chrome.storage.local.remove( option );
		}
		else
		{
			var chromepls = {}; chromepls[ option ] = true;
			chrome.storage.local.set( chromepls );
		}
	}
}());
