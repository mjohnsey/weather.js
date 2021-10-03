import { Coord, Point, Feature, Properties } from '@turf/helpers';
import { Moment } from 'moment';
import { Outlook, SevereWeatherTypes } from './outlook';
export declare class ForecastHit {
    readonly forecastType: string;
    readonly severeType: SevereWeatherTypes;
    readonly imageUrl: string;
    readonly day: number;
    readonly validTime: Moment;
    readonly expireTime: Moment;
    readonly issueTime: Moment;
    readonly geojsonUrl: string;
    readonly textViewUrl: string;
    constructor(forecastType: string, severeType: SevereWeatherTypes, imageUrl: string, day: number, validTime: Moment, expireTime: Moment, issueTime: Moment, geojsonUrl: string, textViewUrl: string);
    isSevere(): boolean;
}
export declare class NoaaSpcStore {
    homeLocationName: string;
    homeLocationLatitude: number;
    homeLocationLongitude: number;
    constructor(homeLocationName: string, homeLocationLatitude: number, homeLocationLongitude: number);
    checkAllForecastsForHome(): Promise<ForecastHit[]>;
    static getGeojson(outlook: Outlook): Promise<any>;
    static getGeojsonFromUrlViaAxios(url: string): Promise<any>;
    static isPointInForecast(coords: Coord, geojson: any): Promise<any>;
    static processForecastGeojson(location: Feature<Point, Properties>, outlook: Outlook, geojson: any): Promise<ForecastHit | null>;
    static getPoint(lat: number, lng: number): Feature<Point, Properties>;
    static checkAllForecasts(lat: number, lng: number): Promise<ForecastHit[]>;
}
