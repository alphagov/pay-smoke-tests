const { CARD_EPDQ_3DS1_API_TOKEN, PUBLIC_API_URL, LOCAL_SMOKE_TEST } = process.env

const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

const epdq3dsCard = {
  cardholderName: 'Test User',
  cardNumber: '4000000000000002',
  expiryMonth: smokeTestHelpers.expiryMonth,
  expiryYear: smokeTestHelpers.expiryYear,
  securityCode: '737'
}

exports.handler = async () => {
  const provider = 'epdq'
  const apiToken = `${CARD_EPDQ_3DS1_API_TOKEN}`
  const publicApiUrl = `${PUBLIC_API_URL}`

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, '3ds')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(createPaymentResponse)

  await smokeTestHelpers.enterCardDetailsContinue3dsAndConfirm(createPaymentResponse._links.next_url.href, epdq3dsCard, secret.EMAIL_ADDRESS)
  log.info('Finished entering card details and confirmed')

  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'success') {
    throw new Error(`Payment status ${paymentStatus} does not equal success`)
  }
}
