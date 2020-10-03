import {Outlook} from './outlook'

import axios from 'axios'
import * as moment from 'moment'
import 'moment-timezone'
import {Coord, point, Position} from '@turf/helpers'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

import * as _ from 'lodash'

export class NoaaSpcStore {
  public homeLocationName: string

  public homeLocationLatitude: number

  public  homeLocationLongitude: number

  public static tsToTime(rawTime: string) {
    // 202004151200
    const timeFormat = 'YYYYMMDDHHmmZ'
    return moment(rawTime, timeFormat).tz('America/Chicago')
  }

  constructor(homeLocationName: string, homeLocationLatitude: number, homeLocationLongitude: number) {
    this.homeLocationName = homeLocationName
    this.homeLocationLatitude = homeLocationLatitude
    this.homeLocationLongitude = homeLocationLongitude
  }

  public async checkAllForecastsForHome(): Promise<any[]> {
    const hits = await NoaaSpcStore.checkAllForecasts(this.homeLocationLatitude, this.homeLocationLongitude)
    return hits
  }

  static async getGeojson(outlook: Outlook) {
    const url = outlook.geometryUrl()
    const response = await axios.get(url)
    return response.data
  }

  static async isPointInForecast(outlook: Outlook, coords: Coord) {
    const geojson = await NoaaSpcStore.getGeojson(outlook)
    const features = geojson.features
    if (_.isEmpty(features)) {
      return undefined
    }
    const hit = _.find(geojson.features, feature => {
      const geom = feature.geometry
      // This is when the spc doesn't have any geoms for a given outlook
      if (geom?.type === 'GeometryCollection') {
        if (_.isEmpty(geom.geometries)) {
          return false
        }
      }
      const containsPoint = booleanPointInPolygon(coords, feature)
      return containsPoint
    })
    return hit
  }

  static async checkAllForecasts(lat: number, lng: number) {
    const coordsToCheck = point([lat, lng])
    const outlooks = Outlook.getOutlooks()
    const hits: any[] = []
    await Promise.all(_.map(outlooks, async outlook => {
      try {
        const pointInForecast = await NoaaSpcStore.isPointInForecast(outlook, (coordsToCheck.geometry?.coordinates as Position))
        const result: any = {}
        if (pointInForecast) {
          const forecastType = pointInForecast.properties.LABEL2
          result.forecastType = forecastType
          result.severeType = outlook.outlookType.weatherType
          const imageUrl = outlook.imageUrl()
          result.imageUrl = imageUrl
          const day = outlook.day
          result.day = day
          const rawValidTime = pointInForecast.properties.VALID
          result.validTime = NoaaSpcStore.tsToTime(`${rawValidTime}Z`)
          const rawExpireTime = pointInForecast.properties.EXPIRE
          result.expireTime = NoaaSpcStore.tsToTime(`${rawExpireTime}Z`)
          const rawIssueTime = pointInForecast.properties.ISSUE
          result.issueTime = NoaaSpcStore.tsToTime(`${rawIssueTime}Z`)
          result.geojsonUrl = outlook.geometryUrl()
          result.textViewUrl = outlook.webUrl()
          hits.push(result)
        }
      } catch (error) {
        // console.log(outlook.geometryUrl())
        throw error
      }
    }))
    return hits
  }
}
