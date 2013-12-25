var CurrentAppID,
	GetCurrentAppID = function()
	{
		if( !CurrentAppID )
		{
			CurrentAppID = location.pathname.match( /\/([0-9]{1,6})\/?/ );
			
			if( CurrentAppID )
			{
				CurrentAppID = parseInt( CurrentAppID[ 1 ], 10 );
			}
			else
			{
				CurrentAppID = -1;
			}
		}
		
		return CurrentAppID;
	},
	
	GetHomepage = function()
	{
		return 'http://steamdb.info/';
	},
	
	GetLocalResource = function( res )
	{
		if( typeof chrome !== 'undefined' )
		{
			return chrome.extension.getURL( res );
		}
		
		// TODO: Add Firefox/Safari apis here
		
		return res;
	};
