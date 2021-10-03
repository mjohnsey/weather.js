"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsToTime = void 0;
const moment = require("moment");
require("moment-timezone");
// eslint-disable-next-line import/prefer-default-export
exports.tsToTime = (rawTime) => {
    // 202004151200
    const timeFormat = 'YYYYMMDDHHmmZ';
    // ignoring TS2339
    return moment(rawTime, timeFormat).tz('America/Chicago');
};
