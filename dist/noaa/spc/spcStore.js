"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoaaSpcStore = exports.ForecastHit = void 0;
const axios_1 = require("axios");
const helpers_1 = require("@turf/helpers");
const boolean_point_in_polygon_1 = require("@turf/boolean-point-in-polygon");
const _ = require("lodash");
const outlook_1 = require("./outlook");
const utils_1 = require("./utils");
class ForecastHit {
    // eslint-disable-next-line no-useless-constructor
    constructor(forecastType, severeType, imageUrl, day, validTime, expireTime, issueTime, geojsonUrl, textViewUrl) {
        this.forecastType = forecastType;
        this.severeType = severeType;
        this.imageUrl = imageUrl;
        this.day = day;
        this.validTime = validTime;
        this.expireTime = expireTime;
        this.issueTime = issueTime;
        this.geojsonUrl = geojsonUrl;
        this.textViewUrl = textViewUrl;
    }
    isSevere() {
        return this.severeType !== outlook_1.SevereWeatherTypes.GENERAL;
    }
}
exports.ForecastHit = ForecastHit;
class NoaaSpcStore {
    constructor(homeLocationName, homeLocationLatitude, homeLocationLongitude) {
        this.homeLocationName = homeLocationName;
        this.homeLocationLatitude = homeLocationLatitude;
        this.homeLocationLongitude = homeLocationLongitude;
    }
    async checkAllForecastsForHome() {
        const hits = await NoaaSpcStore.checkAllForecasts(this.homeLocationLatitude, this.homeLocationLongitude);
        return hits;
    }
    static async getGeojson(outlook) {
        const url = outlook.geometryUrl();
        const response = await axios_1.default.get(url);
        return response.data;
    }
    static async getGeojsonFromUrlViaAxios(url) {
        const response = await axios_1.default.get(url);
        return response.data;
    }
    static async isPointInForecast(coords, geojson) {
        const { features } = geojson;
        if (_.isEmpty(features)) {
            return undefined;
        }
        const hit = _.find(geojson.features, (feature) => {
            const geom = feature.geometry;
            // This is when the spc doesn't have any geoms for a given outlook
            if ((geom === null || geom === void 0 ? void 0 : geom.type) === 'GeometryCollection') {
                if (_.isEmpty(geom.geometries)) {
                    return false;
                }
            }
            const containsPoint = boolean_point_in_polygon_1.default(coords, feature);
            return containsPoint;
        });
        return hit;
    }
    static async processForecastGeojson(location, outlook, geojson) {
        var _a;
        const pointInForecast = await NoaaSpcStore.isPointInForecast((_a = location.geometry) === null || _a === void 0 ? void 0 : _a.coordinates, geojson);
        if (pointInForecast) {
            const forecastType = pointInForecast.properties.LABEL2;
            const imageUrl = outlook.imageUrl();
            const { day } = outlook;
            const rawValidTime = pointInForecast.properties.VALID;
            const validTime = utils_1.tsToTime(`${rawValidTime}Z`);
            const rawExpireTime = pointInForecast.properties.EXPIRE;
            const expireTime = utils_1.tsToTime(`${rawExpireTime}Z`);
            const rawIssueTime = pointInForecast.properties.ISSUE;
            const issueTime = utils_1.tsToTime(`${rawIssueTime}Z`);
            const geojsonUrl = outlook.geometryUrl();
            const textViewUrl = outlook.webUrl();
            const forecastHit = new ForecastHit(forecastType, outlook.outlookType.weatherType, imageUrl, day, validTime, expireTime, issueTime, geojsonUrl, textViewUrl);
            return forecastHit;
        }
        return null;
    }
    static getPoint(lat, lng) {
        return helpers_1.point([lng, lat]);
    }
    static async checkAllForecasts(lat, lng) {
        const coordsToCheck = NoaaSpcStore.getPoint(lat, lng);
        const outlooks = outlook_1.Outlook.getOutlooks();
        const hits = [];
        await Promise.all(_.map(outlooks, async (outlook) => {
            // eslint-disable-next-line no-useless-catch
            try {
                const forecastHit = await NoaaSpcStore.processForecastGeojson(coordsToCheck, outlook, await NoaaSpcStore.getGeojson(outlook));
                if (forecastHit) {
                    hits.push(forecastHit);
                }
            }
            catch (error) {
                // console.log(outlook.geometryUrl())
                throw error;
            }
        }));
        return hits;
    }
}
exports.NoaaSpcStore = NoaaSpcStore;
