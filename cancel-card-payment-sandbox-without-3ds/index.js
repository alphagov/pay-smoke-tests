const { ENVIRONMENT, LOCAL_SMOKE_TEST } = process.env

const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')
const https = require('https')

async function cancelPayment (apiToken, publicApiUrl, paymentId) {
  const options = {
    host: publicApiUrl,
    port: 443,
    headers: smokeTestHelpers.headers(apiToken),
    path: `/v1/payments/${paymentId}/cancel`,
    method: 'POST'
  }

  return new Promise(resolve => {
    https.request(options, res => {
      if (res.statusCode !== 204) {
        throw new Error(`publicapi responded with ${res.statusCode} status`)
      }
      let data = ''

      res.on('data', d => data += d) // eslint-disable-line
      res.on('end', () => resolve(process.stdout.write(data)))
      res.on('error', error => { throw new Error(error) })
    }).end()
  })
}

exports.handler = async () => {
  const provider = 'sandbox'
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.CARD_SANDBOX_API_TOKEN
  const publicApiUrl = secret.PUBLIC_API_URL

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, 'non_3ds')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(createPaymentResponse)

  log.info(`Going to cancel the payment ${createPaymentResponse.payment_id} to ${provider}`)
  await cancelPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)

  log.info(`Going to get the payment by id ${createPaymentResponse.payment_id}`)
  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  const paymentFinished = payment.state.finished
  const paymentCode = payment.state.code
  const paymentMessage = payment.state.message
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'cancelled') {
    throw new Error(`Payment status ${paymentStatus} does not equal cancelled`)
  }

  if (paymentFinished !== true) {
    throw new Error(`Payment finished ${paymentFinished} does not equal true`)
  }

  if (paymentCode !== 'P0040') {
    throw new Error(`Payment code ${paymentCode} does not equal P0040`)
  }

  if (paymentMessage !== 'Payment was cancelled by the service') {
    throw new Error(`Payment message ${paymentMessage} does not equal Payment was cancelled by the service`)
  }
}
