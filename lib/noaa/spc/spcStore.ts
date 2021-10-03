import axios from 'axios'
import {
  Coord,
  Point,
  point,
  Position,
  Feature,
  Properties,
} from '@turf/helpers'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

import * as _ from 'lodash'
import { Moment } from 'moment'

import { Outlook, SevereWeatherTypes } from './outlook'
import { tsToTime } from './utils'

export class ForecastHit {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public readonly forecastType: string,
    public readonly severeType: SevereWeatherTypes,
    public readonly imageUrl: string,
    public readonly day: number,
    public readonly validTime: Moment,
    public readonly expireTime: Moment,
    public readonly issueTime: Moment,
    public readonly geojsonUrl: string,
    public readonly textViewUrl: string,
  ) {}

  public isSevere(): boolean {
    return this.severeType !== SevereWeatherTypes.GENERAL
  }
}

export class NoaaSpcStore {
  public homeLocationName: string

  public homeLocationLatitude: number

  public homeLocationLongitude: number

  constructor(
    homeLocationName: string,
    homeLocationLatitude: number,
    homeLocationLongitude: number,
  ) {
    this.homeLocationName = homeLocationName
    this.homeLocationLatitude = homeLocationLatitude
    this.homeLocationLongitude = homeLocationLongitude
  }

  public async checkAllForecastsForHome(): Promise<ForecastHit[]> {
    const hits = await NoaaSpcStore.checkAllForecasts(
      this.homeLocationLatitude,
      this.homeLocationLongitude,
    )
    return hits
  }

  static async getGeojson(outlook: Outlook): Promise<any> {
    const url = outlook.geometryUrl()
    const response = await axios.get(url)
    return response.data
  }

  static async getGeojsonFromUrlViaAxios(url: string): Promise<any> {
    const response = await axios.get(url)
    return response.data
  }

  static async isPointInForecast(coords: Coord, geojson: any) {
    const { features } = geojson
    if (_.isEmpty(features)) {
      return undefined
    }
    const hit = _.find(geojson.features, (feature) => {
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

  static async processForecastGeojson(
    location: Feature<Point, Properties>,
    outlook: Outlook,
    geojson: any,
  ): Promise<ForecastHit | null> {
    const pointInForecast = await NoaaSpcStore.isPointInForecast(
      location.geometry?.coordinates as Position,
      geojson,
    )
    if (pointInForecast) {
      const forecastType = pointInForecast.properties.LABEL2
      const imageUrl = outlook.imageUrl()
      const { day } = outlook
      const rawValidTime = pointInForecast.properties.VALID
      const validTime = tsToTime(`${rawValidTime}Z`)
      const rawExpireTime = pointInForecast.properties.EXPIRE
      const expireTime = tsToTime(`${rawExpireTime}Z`)
      const rawIssueTime = pointInForecast.properties.ISSUE
      const issueTime = tsToTime(`${rawIssueTime}Z`)
      const geojsonUrl = outlook.geometryUrl()
      const textViewUrl = outlook.webUrl()
      const forecastHit = new ForecastHit(
        forecastType,
        outlook.outlookType.weatherType,
        imageUrl,
        day,
        validTime,
        expireTime,
        issueTime,
        geojsonUrl,
        textViewUrl,
      )
      return forecastHit
    }
    return null
  }

  static getPoint(lat: number, lng: number): Feature<Point, Properties> {
    return point([lng, lat])
  }

  static async checkAllForecasts(
    lat: number,
    lng: number,
  ): Promise<ForecastHit[]> {
    const coordsToCheck = NoaaSpcStore.getPoint(lat, lng)
    const outlooks = Outlook.getOutlooks()
    const hits: ForecastHit[] = []
    await Promise.all(
      _.map(outlooks, async (outlook) => {
        // eslint-disable-next-line no-useless-catch
        try {
          const forecastHit = await NoaaSpcStore.processForecastGeojson(
            coordsToCheck,
            outlook,
            await NoaaSpcStore.getGeojson(outlook),
          )
          if (forecastHit) {
            hits.push(forecastHit)
          }
        } catch (error) {
          // console.log(outlook.geometryUrl())
          throw error
        }
      }),
    )
    return hits
  }
}
