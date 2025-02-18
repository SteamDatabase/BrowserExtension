interface Window {
	[propName: string]: any;
}

declare namespace browser {
	namespace runtime {
		const OnInstalledReason: typeof chrome.runtime.OnInstalledReason;
	}
}
