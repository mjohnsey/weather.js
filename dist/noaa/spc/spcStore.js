"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoaaSpcStore = void 0;
const outlook_1 = require("./outlook");
const axios_1 = require("axios");
const moment = require("moment");
require("moment-timezone");
const helpers_1 = require("@turf/helpers");
const boolean_point_in_polygon_1 = require("@turf/boolean-point-in-polygon");
const _ = require("lodash");
class NoaaSpcStore {
    constructor(homeLocationName, homeLocationLatitude, homeLocationLongitude) {
        this.homeLocationName = homeLocationName;
        this.homeLocationLatitude = homeLocationLatitude;
        this.homeLocationLongitude = homeLocationLongitude;
    }
    static tsToTime(rawTime) {
        // 202004151200
        const timeFormat = 'YYYYMMDDHHmmZ';
        return moment(rawTime, timeFormat).tz('America/Chicago');
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
    static async isPointInForecast(outlook, coords) {
        const geojson = await NoaaSpcStore.getGeojson(outlook);
        const features = geojson.features;
        if (_.isEmpty(features)) {
            return undefined;
        }
        const hit = _.find(geojson.features, feature => {
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
    static async checkAllForecasts(lat, lng) {
        const coordsToCheck = helpers_1.point([lat, lng]);
        const outlooks = outlook_1.Outlook.getOutlooks();
        const hits = [];
        await Promise.all(_.map(outlooks, async (outlook) => {
            var _a;
            try {
                const pointInForecast = await NoaaSpcStore.isPointInForecast(outlook, (_a = coordsToCheck.geometry) === null || _a === void 0 ? void 0 : _a.coordinates);
                const result = {};
                if (pointInForecast) {
                    const forecastType = pointInForecast.properties.LABEL2;
                    result.forecastType = forecastType;
                    result.severeType = outlook.outlookType.weatherType;
                    const imageUrl = outlook.imageUrl();
                    result.imageUrl = imageUrl;
                    const day = outlook.day;
                    result.day = day;
                    const rawValidTime = pointInForecast.properties.VALID;
                    result.validTime = NoaaSpcStore.tsToTime(`${rawValidTime}Z`);
                    const rawExpireTime = pointInForecast.properties.EXPIRE;
                    result.expireTime = NoaaSpcStore.tsToTime(`${rawExpireTime}Z`);
                    const rawIssueTime = pointInForecast.properties.ISSUE;
                    result.issueTime = NoaaSpcStore.tsToTime(`${rawIssueTime}Z`);
                    result.geojsonUrl = outlook.geometryUrl();
                    result.textViewUrl = outlook.webUrl();
                    hits.push(result);
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
