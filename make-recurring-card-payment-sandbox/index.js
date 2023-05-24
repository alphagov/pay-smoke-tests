const { ENVIRONMENT, WEBHOOKS_ENABLED } = process.env

const synthetics = require('Synthetics')
const smokeTestHelpers = require('../helpers/smoke-test-helpers')
const recCardPaymentTestHelpers = require('../helpers/recurring-card-payment-test-helpers')

const sandboxCard = {
  cardholderName: 'Test User',
  cardNumber: '4242424242424242',
  expiryMonth: smokeTestHelpers.expiryMonth,
  expiryYear: smokeTestHelpers.expiryYear,
  securityCode: '737'
}
const provider = 'sandbox'
let apiToken, publicApiUrl, secret

exports.handler = async () => {
  secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  apiToken = secret.CARD_SANDBOX_API_TOKEN
  publicApiUrl = secret.PUBLIC_API_URL
  const emailAddress = secret.EMAIL_ADDRESS

  let createAgreementResponse, payment

  await synthetics.executeStep('Create agreement', async function () {
    createAgreementResponse = await recCardPaymentTestHelpers.createAgreement(publicApiUrl, apiToken, provider)
  })

  await synthetics.executeStep('Setup payment for the agreement', async function () {
    payment = await recCardPaymentTestHelpers.setupPaymentForAgreement(publicApiUrl, apiToken, provider,
      createAgreementResponse.agreement_id, sandboxCard, emailAddress)
  })

  if (WEBHOOKS_ENABLED === 'true') {
    await smokeTestHelpers.validateWebhookReceived(ENVIRONMENT, payment.payment_id)
  }

  await synthetics.executeStep('Validate agreement status', async function () {
    await recCardPaymentTestHelpers.assertAgreementStatus(publicApiUrl, apiToken, createAgreementResponse.agreement_id)
  })

  await synthetics.executeStep('Take a recurring payment for the agreement', async function () {
    await recCardPaymentTestHelpers.takeARecurringPaymentForAgreement(publicApiUrl, apiToken,
      provider, createAgreementResponse.agreement_id)
  })
}
