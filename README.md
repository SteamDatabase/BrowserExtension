# SteamDB Extension

[![chrome users](https://img.shields.io/chrome-web-store/users/kdbmhfkmnlmbkgbabkdealhhbfhlmmon?label=chrome%20users&style=for-the-badge&logo=googlechrome)](https://chrome.google.com/webstore/detail/steam-database/kdbmhfkmnlmbkgbabkdealhhbfhlmmon)
[![firefox users](https://img.shields.io/amo/users/steam-database?label=firefox%20users&color=4c1&style=for-the-badge&logo=firefoxbrowser)](https://addons.mozilla.org/firefox/addon/steam-database/)
[![edge users](https://img.shields.io/badge/dynamic/json?label=edge%20users&query=%24.activeInstallCount&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/hjknpdomhlodgaebegjopkmfafjpbblg&style=for-the-badge&logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/steam-database/hjknpdomhlodgaebegjopkmfafjpbblg)  

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
* Privacy Policy: https://steamdb.info/extension/privacy/
* Chrome Web Store: https://chrome.google.com/webstore/detail/kdbmhfkmnlmbkgbabkdealhhbfhlmmon
* Mozilla Addons: https://addons.mozilla.org/en-US/firefox/addon/steam-database/
* Microsoft Edge: https://microsoftedge.microsoft.com/addons/detail/steam-database/hjknpdomhlodgaebegjopkmfafjpbblg

*There are no plans to support Safari at this time due to Apple's policies.*

### Contributing

This extension does not have any build steps, and you can simply load the folder on the extensions page of your browser.

When writing code, make sure to run our linter:
1. Run `npm install` to install eslint
2. Run `npm test` which should report warnings
3. Run `npm run fix` which should automatically fix most of the reported warnings

#### Localization rules

- Do not localize "SteamDB"
- Keep the HTML codes intact
- If there is whitespace in the strings, keep it
- If there are words that are used by Steam itself (such as discovery queue), match them
- Substitution tokens like `$1` should be kept

#### Making a release

Run `npm run version 3.0.0` which updates `manifest.json`, creates a commit, creates a tag,
and runs `npm run build` which creates a zip file with the release.

### Trade offers support for `for_item` and `my_item`

This extension adds support for `for_item` and `my_item` parameters in `/tradeoffer/new` urls,
these parameters will automatically add items to trade window upon page load.

* `for_item` specifies an item in partner's inventory.
* `my_item` specifies an item in your inventory.

Multiple parameters can be specified, a single parameter takes format of `appid_contextid_assetid`.

For example:
```
https://steamcommunity.com/tradeoffer/new?partner=[steamid]&for_item=753_6_1234
https://steamcommunity.com/tradeoffer/new?partner=[steamid]&for_item=753_6_1234&for_item=753_6_5678
https://steamcommunity.com/tradeoffer/new?partner=[steamid]&my_item=753_6_1234
https://steamcommunity.com/tradeoffer/new?partner=[steamid]&my_item=753_6_1234&my_item=753_6_5678
https://steamcommunity.com/tradeoffer/new?partner=[steamid]&for_item=753_6_1234&my_item=753_6_5678
```

### Automatically open "grant an award" popup from a link using `award`

This extension adds support for `award` parameter in profile, workshop, and other published files such as screenshots.

Open the "grant an award" popup upon page load: `https://steamcommunity.com/id/xpaw?award`

Open popup and pre-select a specific award: `https://steamcommunity.com/id/xpaw?award=17`  
In this case id 17 is "Take my points".

It works the same way for shared files: `https://steamcommunity.com/sharedfiles/filedetails/?id=2935326022&award=17`

### License
Code in this repository is governed by a BSD-style license that can be found in the [LICENSE](LICENSE) file.
