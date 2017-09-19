import moment from 'moment-timezone'
import camelCase from 'lodash/camelCase'
import mapValues from 'lodash/mapValues'
import isNil from 'lodash/isNil'
import pick from 'lodash/pick'
import flatMapDeep from 'lodash/flatMapDeep'
import yargsParser from 'yargs-parser'
import { TIME_ZONE } from './config'

export const isProd = process.env.NODE_ENV === 'production'

export const getTime = (time, format = false) => {
  time = time || new Date()
  const parsedTime = moment.tz(time, TIME_ZONE)
  if (format) {
    return format === 'iso'
            ? parsedTime.toISOString()
            : parsedTime.format(format === true ? undefined : format)
  }
  return moment.tz(time, TIME_ZONE)
}


export const checkDateValidity = (date, time, comparisonType = 'same') => {
  const parsedDate = getTime(new Date(date))
  let intervalType
  if (comparisonType === 'same') intervalType = 'day'
  comparisonType = camelCase(`is ${comparisonType}`)
  return parsedDate[comparisonType](time, intervalType)
}

export const prettyPrint = data => JSON.stringify(data, null, '\t')

export const nativeClone = obj => JSON.parse(JSON.stringify(obj))

export const serializeObj = obj => Object.keys(obj)
                                      .filter(x => !isNil(obj[x]))
                                      .reduce((p, c) => {
                                        p[c] = JSON.stringify(obj[c])
                                        return p
                                      }, {})

export const createTimeObj = (data) => {
  const time = {}
  time.now = getTime().startOf('hour')
  time.todayDate = getTime(time.now).format('YYYY-MM-DD')

  if (data.lastRun) {
    const diffDay = data.lastUpdate ?
            !time.now.isSame(data.lastUpdate, 'day') : !time.now.isSame(data.lastRun, 'day')
    if (diffDay) {
      const yesterday = getTime(time.now).subtract(1, 'days').startOf('day')
      if (yesterday.diff(data.initDate, 'days') > 100) {
        time.deleteDate = getTime(yesterday).subtract(101, 'days').format('YYYY-MM-DD')
      }
      time.yesterdayStart = yesterday
      time.yesterdayDate = yesterday.format('YYYY-MM-DD')
    }
  }
  return mapValues(time, v => moment.isDate(v) || moment.isMoment(v) ? v.format() : v)
}


export const getFullPartyName = (str) => {
  const dict = {
    D: 'Democrats',
    BI: 'Bipartisan',
    I: 'Independent',
    R: 'Republicans',
  }
  return dict[str.toUpperCase()]
}

export const unserializeObj = obj => mapValues(obj, v => v !== undefined && v !== 'undefined' ? JSON.parse(v) : null)

export const trimLeadingSpace = (str, flatten = false) =>
          flatten ? str.replace(/\n\s+/gmi, ' ') : str.replace(/^(?![\n])\s+/gmi, '')

export const extractAccounts = userData =>
  flatMapDeep(userData, ({ accounts, name, type: userType, id: userId, chamber }, userIndex) =>
                accounts.map((account, accountIndex) =>
                          Object.assign({}, account, { name,
                            type: userType,
                            chamber,
                            user_index: userIndex,
                            account_index: accountIndex },
                            userType === 'member' ? { bioguide: userId.bioguide } : {}),
                    ),
                )

export const parsedFlags = pick(yargsParser(process.argv.slice(2), {
  alias: {
    'collect-replies': ['c', 'cr', 'collect', 'collectreplies'],
    'format-only': ['format', 'ff', 'formatfiles', 'formatonly', 'fo', 'fmt'],
    'has-bot': ['hb', 'hasbot', 'bot'],
    'init-list': ['initlist', 'il', 'list', 'init'],
    'local-store': ['ls', 'localstore', 'nostore'],
    'no-commit': ['n', 'nc', 'no', 'nocommit'],
    'post-build': ['p', 'post', 'pb', 'postbuild'],
    'self-update': ['s', 'self', 'su', 'selfupdate'],
  },
}), ['collectReplies', 'formatOnly', 'hasBot', 'initList', 'localStore', 'noCommit', 'postBuild', 'selfUpdate'])
