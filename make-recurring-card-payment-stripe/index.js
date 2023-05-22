const { ENVIRONMENT, WEBHOOKS_ENABLED } = process.env

const synthetics = require('Synthetics')
const log = require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smoke-test-helpers')
const agreementTestHelpers = require('../helpers/agreement-test-helpers')

const stripeCard = {
  cardholderName: 'Test User',
  cardNumber: '4242424242424242',
  expiryMonth: smokeTestHelpers.expiryMonth,
  expiryYear: smokeTestHelpers.expiryYear,
  securityCode: '737'
}
const provider = 'stripe'
let apiToken, publicApiUrl, secret

async function createAgreement (provider) {
  log.info(`Creating agreement for [${provider}]`)
  const createAgreementPayload = agreementTestHelpers.getCreateAgreementPayload(provider)
  const createAgreementResponse = await agreementTestHelpers.createAgreement(apiToken, publicApiUrl, createAgreementPayload)
  log.info(`Created agreement [${createAgreementResponse.agreement_id}]`)

  return createAgreementResponse
}

async function setupPaymentForAgreement (agreementId) {
  log.info(`Setting up a payment for [${provider}] and agreement [${agreementId}]`)
  let createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, 'non_3ds', agreementId)
  let createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(`Created payment [${createPaymentResponse.payment_id}] for agreement [${agreementId}]`)

  await smokeTestHelpers.enterCardDetailsAndConfirm(createPaymentResponse._links.next_url.href, stripeCard, secret.EMAIL_ADDRESS)
  log.info(`Finished setting up payment [${createPaymentResponse.payment_id}] for agreement [${agreementId}]`)

  return assertPaymentStatus(createPaymentResponse.payment_id)
}

async function assertPaymentStatus (paymentId) {
  let totalTimeTaken = 0

  // query payment status every one second until it is processed asynchronously in connector for a maximum of 6 seconds
  for (const retryDelay of new Array(6).fill(1000)) {
    await wait(retryDelay)
    totalTimeTaken += retryDelay

    const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, paymentId)
    const paymentStatus = payment.state.status
    log.info(`Payment [${paymentId}] status is ${paymentStatus}`)

    if (paymentStatus === 'success') {
      return payment
    }
  }

  throw new Error(`Payment [${paymentId}] status does not equal to success after multiple retries for a total of ${totalTimeTaken} milliseconds`)

}

async function assertAgreementStatus (agreementId) {
  const agreementResponse = await agreementTestHelpers.getAgreement(apiToken, publicApiUrl, agreementId)
  log.info(`Agreement [${agreementId}] status is ${agreementResponse.status}`)

  if (agreementResponse.status !== 'active') {
    throw new Error(`Agreement status ${agreementResponse.status} does not equal active`)
  }
}

async function wait (seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds))
}

async function takeARecurringPaymentForAgreement (agreementId) {
  log.info(`Taking a recurring payment for [${provider}] and agreement [${agreementId}]`)
  const createPaymentRequest = smokeTestHelpers.getCreateRecurringPaymentPayload(provider, agreementId)
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)

  await assertPaymentStatus(createPaymentResponse.payment_id)
}

exports.handler = async () => {
  secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  apiToken = secret.CARD_STRIPE_API_TOKEN
  publicApiUrl = secret.PUBLIC_API_URL
  let createAgreementResponse, payment

  await synthetics.executeStep('Create agreement', async function () {
    createAgreementResponse = await createAgreement(provider)
  })

  await synthetics.executeStep('Setup payment for the agreement', async function () {
    payment = await setupPaymentForAgreement(createAgreementResponse.agreement_id)
  })

  if (WEBHOOKS_ENABLED === 'true') {
    await smokeTestHelpers.validateWebhookReceived(ENVIRONMENT, payment.payment_id)
  }

  await synthetics.executeStep('Validate agreement status', async function () {
    await assertAgreementStatus(createAgreementResponse.agreement_id)
  })

  await synthetics.executeStep('Take a recurring payment for the agreement', async function () {
    await takeARecurringPaymentForAgreement(createAgreementResponse.agreement_id)
  })
}
