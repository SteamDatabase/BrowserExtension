# SteamDB Extension

Adds SteamDB links on various pages in the Steam Community and Store.
Also highlights owned and wished products on steamdb.info.

![](https://steamdb.info/static/img/extension.png)

### Major features
* Add SteamDB links across most Steam store and community pages
* Highlight owned/wished/in cart games and packages on steamdb.info *(by fetching info from Steam store)*
* Add new features on Steam sites (e.g. automatic age gate skip, quick sell in inventory, market prices in other inventories)
* Fix stuff that Valve hasn't (e.g. properly center Steam store on big screens)
* See [this link](https://steamdb.info/extension/) for a list of all options and features

### Links
* Features: https://steamdb.info/extension/
* Privacy Policy: https://steamdb.info/extension/#privacy
* Chrome Web Store: https://chrome.google.com/webstore/detail/kdbmhfkmnlmbkgbabkdealhhbfhlmmon
* Mozilla Addons: https://addons.mozilla.org/en-US/firefox/addon/steam-database/
* Microsoft Edge: https://microsoftedge.microsoft.com/addons/detail/steam-database/hjknpdomhlodgaebegjopkmfafjpbblg

### Contributing

This extension does not have any build steps, and you can simply load the folder on the extensions page of your browser.

When writing code, make sure to run our linter:
1. Run `npm install` to install eslint
2. Run `npm test` which should report warnings
3. Run `npm run fix` which should automatically fix most of the reported warnings

#### Making a release

Run `npm run version 3.0.0` which updates `manifest.json`, creates a commit, creates a tag,
and runs `npm run build` which creates a zip file with the release.

### License
Code in this repository is governed by a BSD-style license that can be found in the [LICENSE](LICENSE) file.
