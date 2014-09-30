(function()
{
	var element, checkboxes = document.querySelectorAll( '.option-check' ), options = {};
	
	for( var i = 0; i < checkboxes.length; i++ )
	{
		element = checkboxes[ i ];
		
		options[ element.dataset.option ] = element;
		
		element.dataset.default = element.checked;
		
		element.addEventListener( 'change', CheckboxChange );
	}
	
	GetOption( Object.keys( options ), function( items )
	{
		for( var item in items )
		{
			element = options[ item ];
			
			element.checked = !element.checked;
		}
	} );
	
	function CheckboxChange( )
	{
		SetOption( this.dataset.option, this.checked, this.dataset.default );
	}
	
	function SetOption( option, value, defaultValue )
	{
		if( value.toString() === defaultValue )
		{
			chrome.storage.local.remove( option );
		}
		else
		{
			var chromepls = {}; chromepls[ option ] = defaultValue === 'true';
			chrome.storage.local.set( chromepls );
		}
	}
}());
