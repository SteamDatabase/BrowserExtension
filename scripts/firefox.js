var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;

var scriptOptions = {
	"icons/18.png": data.url("icons/18.png"),
	"subscriptions": data.url("scripts/store/subscriptions.js"),
	"inventory": data.url("scripts/community/inventory.js"),
	"firefox": true
}

var manifest = JSON.parse(data.load('manifest.json'));

for ( page in manifest['content_scripts'] )
{
	var includeMatches = [];
	for ( match in manifest['content_scripts'][page]["matches"] )
	{
		match = manifest['content_scripts'][page]["matches"][match].replace(/\*/g, ".*").replace(/[\/]/g, "\/");
		includeMatches.push(new RegExp(match));
	}

	var jsFiles = [];
	for ( js in manifest['content_scripts'][page]["js"] )
	{
		jsFiles.push(data.url(manifest['content_scripts'][page]["js"][js]));
	}

	var cssFiles = [];
	for ( css in manifest['content_scripts'][page]["css"] )
	{
		cssFiles.push(data.url(manifest['content_scripts'][page]["css"][css]));
	}

	pageMod.PageMod({
		include: includeMatches,
		contentScriptFile: jsFiles,
		contentStylefile: cssFiles,
		contentScriptOptions: scriptOptions
	 });
}