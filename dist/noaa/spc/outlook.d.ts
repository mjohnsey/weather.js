export declare enum OutlookBaseType {
    CATEGORICAL = "CATEGORICAL",
    PROBABILISTIC = "PROBABILISTIC"
}
export declare enum SevereWeatherTypes {
    GENERAL = "",
    TORNADO = "torn",
    WIND = "wind",
    HAIL = "hail"
}
export declare class OutlookType {
    static getOutlookTypes(): OutlookType[];
    baseType: OutlookBaseType;
    weatherType: SevereWeatherTypes;
    isSignificant: boolean;
    daysSupported: number[];
    isExperimental: boolean;
    constructor(baseType: OutlookBaseType, weatherType: SevereWeatherTypes, isSignificant: boolean, daysSupported: number[], isExperimental?: boolean);
    toString(): string;
    isDaySupported(day: number): boolean;
    geometryTypeString(): string;
    textTypeString(): string;
}
export declare class Outlook {
    static baseUrl(isExperimental?: boolean): string;
    static getOutlooks(): Outlook[];
    outlookType: OutlookType;
    isLayered: boolean;
    day: number;
    constructor(outlookType: OutlookType, day: number, layered: boolean);
    geometryUrl(ending?: string): string;
    imageUrl(): string;
    webUrl(): string;
    name(): string;
}
