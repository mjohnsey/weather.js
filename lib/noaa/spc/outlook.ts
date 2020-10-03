import * as _ from 'lodash'

export enum OutlookBaseType {
  CATEGORICAL,
  PROBABILISTIC
}

export enum SevereWeatherTypes {
  GENERAL = '',
  TORNADO = 'torn',
  WIND = 'wind',
  HAIL = 'hail'
}

export class OutlookType {
  public static getOutlookTypes() {
    const types: OutlookType[] = []
    types.push(new OutlookType(OutlookBaseType.CATEGORICAL, SevereWeatherTypes.GENERAL, false, [1, 2, 3]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.TORNADO, false, [1]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.TORNADO, true, [1]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.HAIL, false, [1]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.HAIL, true, [1]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.WIND, false, [1]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.WIND, true, [1]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.GENERAL, false, [2, 3]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.GENERAL, true, [2, 3]))
    types.push(new OutlookType(OutlookBaseType.PROBABILISTIC, SevereWeatherTypes.GENERAL, false, [4, 5, 6, 7, 8], true))
    return types
  }

  public baseType: OutlookBaseType

  public weatherType: SevereWeatherTypes

  public isSignificant: boolean

  public daysSupported: number[]

  public isExperimental: boolean

  constructor(baseType: OutlookBaseType,
    weatherType: SevereWeatherTypes,
    isSignificant: boolean,
    daysSupported: number[],
    isExperimental = false) {
    this.baseType = baseType
    this.weatherType = weatherType
    this.isSignificant = isSignificant
    this.daysSupported = daysSupported
    this.isExperimental = isExperimental
  }

  public toString(): string {
    return ''
  }

  public isDaySupported(day: number) {
    return this.daysSupported.includes(day)
  }

  public geometryTypeString(): string {
    if (this.isExperimental) {
      return 'prob'
    }
    let result = 'otlk'
    if (this.baseType === OutlookBaseType.CATEGORICAL) {
      result += '_cat'
      return result
    }
    result += '_'
    if (this.isSignificant) {
      result += 'sig'
    }
    result += this.weatherType === SevereWeatherTypes.GENERAL ? 'prob' : this.weatherType
    return result
  }

  public textTypeString(): string {
    if (this.isExperimental) {
      return 'prob'
    }

    return 'otlk'
  }
}

export class Outlook {
  public static baseUrl(isExperimental = false): string {
    return isExperimental ? 'https://www.spc.noaa.gov/products/exper/day4-8' : 'https://www.spc.noaa.gov/products/outlook'
  }

  public static getOutlooks(): Outlook[] {
    const types = OutlookType.getOutlookTypes()
    const outlooks: Outlook[] = []
    _.each(types, type => {
      _.each(type.daysSupported, (day: number) => {
        const out = new Outlook(type, day, false)
        outlooks.push(out)
      })
    })
    return outlooks
  }

  public outlookType: OutlookType

  public isLayered: boolean

  public day: number

  constructor(outlookType: OutlookType, day: number, layered: boolean) {
    if (!outlookType.isDaySupported(day)) {
      throw new Error(`${day} not supported for ${outlookType}`)
    }
    this.outlookType = outlookType
    this.day = day
    this.isLayered = layered
  }

  public geometryUrl(ending = 'geojson') {
    const urlBase = Outlook.baseUrl(this.outlookType.isExperimental)
    const type = this.outlookType.geometryTypeString()
    const layerString = this.isLayered ? 'lyr' : 'nolyr'
    const url = `${urlBase}/day${this.day}${type}.${layerString}.${ending}`
    return url
  }

  public imageUrl() {
    const base = Outlook.baseUrl(this.outlookType.isExperimental)
    let type = ''
    switch (this.outlookType.weatherType) {
    case SevereWeatherTypes.GENERAL:
      type = 'otlk'
      break
    case SevereWeatherTypes.HAIL:
      type = 'probotlk_hail'
      break
    case SevereWeatherTypes.TORNADO:
      type = 'probotlk_torn'
      break
    case SevereWeatherTypes.WIND:
      type = 'probotlk_wind'
      break
    }
    const url = `${base}/day${this.day}${type}.gif`
    return url
  }

  public webUrl() {
    const urlBase = Outlook.baseUrl(this.outlookType.isExperimental)
    if (this.outlookType.isExperimental) {
      return urlBase
    }
    const type = this.outlookType.textTypeString()
    const url = `${urlBase}/day${this.day}${type}.html`
    return url
  }
}
