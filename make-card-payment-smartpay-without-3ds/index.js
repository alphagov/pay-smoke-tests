const { ENVIRONMENT, LOCAL_SMOKE_TEST } = process.env

const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

const smartpayCard = {
  cardholderName: 'Test User',
  cardNumber: '4444333322221111',
  expiryMonth: '03',
  expiryYear: '30',
  securityCode: '737'
}

exports.handler = async () => {
  const provider = 'smartpay'
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.CARD_SMARTPAY_API_TOKEN
  const publicApiUrl = secret.PUBLIC_API_URL

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, 'non_3ds')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(createPaymentResponse)

  await smokeTestHelpers.enterCardDetailsAndConfirm(createPaymentResponse._links.next_url.href, smartpayCard, secret.EMAIL_ADDRESS)
  log.info('Finished entering card details and confirmed')

  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'success') {
    throw new Error(`Payment status ${paymentStatus} does not equal success`)
  }
}
