"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Outlook = exports.OutlookType = exports.SevereWeatherTypes = exports.OutlookBaseType = void 0;
const _ = require("lodash");
var OutlookBaseType;
(function (OutlookBaseType) {
    OutlookBaseType[OutlookBaseType["CATEGORICAL"] = 0] = "CATEGORICAL";
    OutlookBaseType[OutlookBaseType["PROBABILISTIC"] = 1] = "PROBABILISTIC";
})(OutlookBaseType = exports.OutlookBaseType || (exports.OutlookBaseType = {}));
var SevereWeatherTypes;
(function (SevereWeatherTypes) {
    SevereWeatherTypes["GENERAL"] = "";
    SevereWeatherTypes["TORNADO"] = "torn";
    SevereWeatherTypes["WIND"] = "wind";
    SevereWeatherTypes["HAIL"] = "hail";
})(SevereWeatherTypes = exports.SevereWeatherTypes || (exports.SevereWeatherTypes = {}));
class OutlookType {
    constructor(baseType, weatherType, isSignificant, daysSupported, isExperimental = false) {
        this.baseType = baseType;
        this.weatherType = weatherType;
        this.isSignificant = isSignificant;
        this.daysSupported = daysSupported;
        this.isExperimental = isExperimental;
    }
    static getOutlookTypes() {
        const types = [];
        types.push(new OutlookType(OutlookBaseType.CATEGORICAL, SevereWeatherTypes.GENERAL, false, [1, 2, 3]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.TORNADO, false, [1]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.TORNADO, true, [1]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.HAIL, false, [1]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.HAIL, true, [1]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.WIND, false, [1]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.WIND, true, [1]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.GENERAL, false, [2, 3]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.GENERAL, true, [2, 3]));
        types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.GENERAL, false, [4, 5, 6, 7, 8], true));
        return types;
    }
    toString() {
        return '';
    }
    isDaySupported(day) {
        return this.daysSupported.includes(day);
    }
    geometryTypeString() {
        if (this.isExperimental) {
            return 'prob';
        }
        let result = 'otlk';
        if (this.baseType === OutlookBaseType.CATEGORICAL) {
            result += '_cat';
            return result;
        }
        result += '_';
        if (this.isSignificant) {
            result += 'sig';
        }
        result += this.weatherType === SevereWeatherTypes.GENERAL ? 'prob' : this.weatherType;
        return result;
    }
    textTypeString() {
        if (this.isExperimental) {
            return 'prob';
        }
        return 'otlk';
    }
}
exports.OutlookType = OutlookType;
class Outlook {
    constructor(outlookType, day, layered) {
        if (!outlookType.isDaySupported(day)) {
            throw new Error(`${day} not supported for ${outlookType}`);
        }
        this.outlookType = outlookType;
        this.day = day;
        this.isLayered = layered;
    }
    static baseUrl(isExperimental = false) {
        return isExperimental ? 'https://www.spc.noaa.gov/products/exper/day4-8' : 'https://www.spc.noaa.gov/products/outlook';
    }
    static getOutlooks() {
        const types = OutlookType.getOutlookTypes();
        const outlooks = [];
        _.each(types, type => {
            _.each(type.daysSupported, (day) => {
                const out = new Outlook(type, day, false);
                outlooks.push(out);
            });
        });
        return outlooks;
    }
    geometryUrl(ending = 'geojson') {
        const urlBase = Outlook.baseUrl(this.outlookType.isExperimental);
        const type = this.outlookType.geometryTypeString();
        const layerString = this.isLayered ? 'lyr' : 'nolyr';
        const url = `${urlBase}/day${this.day}${type}.${layerString}.${ending}`;
        return url;
    }
    imageUrl() {
        const base = Outlook.baseUrl(this.outlookType.isExperimental);
        let type = '';
        switch (this.outlookType.weatherType) {
            case SevereWeatherTypes.GENERAL:
                type = 'otlk';
                break;
            case SevereWeatherTypes.HAIL:
                type = 'probotlk_hail';
                break;
            case SevereWeatherTypes.TORNADO:
                type = 'probotlk_torn';
                break;
            case SevereWeatherTypes.WIND:
                type = 'probotlk_wind';
                break;
        }
        const url = `${base}/day${this.day}${type}.gif`;
        return url;
    }
    webUrl() {
        const urlBase = Outlook.baseUrl(this.outlookType.isExperimental);
        if (this.outlookType.isExperimental) {
            return urlBase;
        }
        const type = this.outlookType.textTypeString();
        const url = `${urlBase}/day${this.day}${type}.html`;
        return url;
    }
}
exports.Outlook = Outlook;
