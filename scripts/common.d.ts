declare var ExtensionApi: typeof browser | typeof chrome;

declare var CurrentAppID: number;

declare function GetCurrentAppID(): number;

declare function GetHomepage(): string;

declare function _t(message: string, substitutions?: string[]): string;

declare function GetLanguage(): string;

declare type GetOptionCallback = (items: { [key: string]: any }) => void;

declare function GetOption(items: { [key: string]: any }, callback: GetOptionCallback): void;

declare function SetOption(option: string, value: any): void;

declare function GetLocalResource(res: string): string;

declare type SendMessageToBackgroundScriptResponse = {
	success: boolean;
	error?: string;
	data?: any;
};

declare type SendMessageToBackgroundScriptCallback = (data: SendMessageToBackgroundScriptResponse | undefined) => void;

declare function SendMessageToBackgroundScript(
	message: { contentScriptQuery: string, [key: string]: any },
	callback: SendMessageToBackgroundScriptCallback
): void;

declare function WriteLog(...args: any[]): void;
