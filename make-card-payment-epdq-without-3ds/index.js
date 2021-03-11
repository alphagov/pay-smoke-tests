const { ENVIRONMENT, LOCAL_SMOKE_TEST } = process.env

const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

const epdqCard = {
  cardholderName: 'Test User',
  cardNumber: '4111111111111111',
  expiryMonth: smokeTestHelpers.expiryMonth,
  expiryYear: smokeTestHelpers.expiryYear,
  securityCode: '737'
}

exports.handler = async () => {
  const provider = 'epdq'
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.CARD_EPDQ_API_TOKEN
  const publicApiUrl = secret.PUBLIC_API_URL

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, 'non_3ds')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(createPaymentResponse)

  await smokeTestHelpers.enterCardDetailsAndConfirm(createPaymentResponse._links.next_url.href, epdqCard, secret.EMAIL_ADDRESS)
  log.info('Finished entering card details and confirmed')

  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'success') {
    throw new Error(`Payment status ${paymentStatus} does not equal success`)
  }
}
