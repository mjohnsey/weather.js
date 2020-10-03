import { Outlook } from './outlook';
import * as moment from 'moment';
import 'moment-timezone';
import { Coord } from '@turf/helpers';
export declare class NoaaSpcStore {
    homeLocationName: string;
    homeLocationLatitude: number;
    homeLocationLongitude: number;
    static tsToTime(rawTime: string): moment.Moment;
    constructor(homeLocationName: string, homeLocationLatitude: number, homeLocationLongitude: number);
    checkAllForecastsForHome(): Promise<any[]>;
    static getGeojson(outlook: Outlook): Promise<any>;
    static isPointInForecast(outlook: Outlook, coords: Coord): Promise<any>;
    static checkAllForecasts(lat: number, lng: number): Promise<any[]>;
}
