const { ENVIRONMENT } = process.env
const https = require('https')

const log = require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

exports.handler = async () => {
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.NOTIFICATIONS_SANDBOX_AUTH_TOKEN
  const notificationsHostName = secret.NOTIFICATIONS_SANDBOX_HOST
  const path = '/v1/api/notifications/sandbox'

  log.info(`Sending POST request to ${notificationsHostName}${path}`)
  const options = {
    host: notificationsHostName,
    port: 443,
    headers: {
      Authorization: apiToken
    },
    path,
    method: 'POST'
  }

  return new Promise((resolve, reject) => {
    https.request(options, res => {
      if (res.statusCode === 200) {
        log.info('Notifications responded with 200 OK')
        resolve()
      } else {
        reject(new Error(`Notifications endpoint responded with ${res.statusCode} status`))
      }
    }).end()
  })
}
