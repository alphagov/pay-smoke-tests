const { ENVIRONMENT } = process.env
const https = require('https')

const log = require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smoke-test-helpers')

exports.handler = async () => {
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.NOTIFICATIONS_SANDBOX_AUTH_TOKEN
  const notificationsHostName = secret.NOTIFICATIONS_SANDBOX_HOST
  const path = '/v1/api/notifications/sandbox'

  log.info(`Sending POST request to ${notificationsHostName}${path}`)

  const data = JSON.stringify({
    body: 'sandbox-notifications'
  })

  const options = {
    host: notificationsHostName,
    port: 443,
    headers: {
      Authorization: apiToken,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    path,
    method: 'POST'
  }

  return new Promise((resolve, reject) => {
    const request = https.request(options, res => {
      if (res.statusCode === 200) {
        log.info('Notifications responded with 200 OK')
        resolve()
      } else {
        reject(new Error(`Notifications endpoint responded with ${res.statusCode} status`))
      }
    })

    request.write(data)
    request.end()
  })
}
