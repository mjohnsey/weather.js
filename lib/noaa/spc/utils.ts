import * as moment from 'moment'
import 'moment-timezone'

// eslint-disable-next-line import/prefer-default-export
export const tsToTime = (rawTime: string) => {
  // 202004151200
  const timeFormat = 'YYYYMMDDHHmmZ'
  // ignoring TS2339
  return (moment(rawTime, timeFormat) as any).tz('America/Chicago')
}
