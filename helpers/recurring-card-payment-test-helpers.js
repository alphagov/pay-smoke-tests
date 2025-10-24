const log = require('SyntheticsLogger')
const smokeTestHelpers = require('./smoke-test-helpers')
const agreementTestHelpers = require('./agreement-test-helpers')

async function setupPaymentForAgreement (publicApiUrl, apiToken, provider, agreementId, providerCard, emailAddress, agreementPaymentType) {
  log.info(`Setting up a payment for [${provider}] and agreement [${agreementId}]`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, 'non_3ds', agreementId, agreementPaymentType)
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(`Created payment [${createPaymentResponse.payment_id}] for agreement [${agreementId}]`)

  await smokeTestHelpers.enterCardDetailsAndConfirm(createPaymentResponse._links.next_url.href, providerCard, emailAddress)
  log.info(`Finished setting up payment [${createPaymentResponse.payment_id}] for agreement [${agreementId}]`)

  return assertPaymentStatusAndAgreementPaymentType(publicApiUrl, apiToken, createPaymentResponse.payment_id, agreementPaymentType)
}

async function takeARecurringPaymentForAgreement (publicApiUrl, apiToken, provider, agreementId, agreementPaymentType) {
  log.info(`Taking a recurring payment for [${provider}] and agreement [${agreementId}]`)
  const createPaymentRequest = smokeTestHelpers.getCreateRecurringPaymentPayload(provider, agreementId, agreementPaymentType)
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)

  await assertPaymentStatusAndAgreementPaymentType(publicApiUrl, apiToken, createPaymentResponse.payment_id, agreementPaymentType)
}

async function assertPaymentStatusAndAgreementPaymentType (publicApiUrl, apiToken, paymentId, agreementPaymentType) {
  let totalTimeTaken = 0

  // query payment status every one second until it is processed asynchronously in connector for a maximum of 6 seconds
  for (const retryDelay of new Array(6).fill(1000)) {
    await wait(retryDelay)
    totalTimeTaken += retryDelay

    const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, paymentId)
    const paymentStatus = payment.state.status
    const responseAgreementPaymentType = payment.agreement_payment_type
    log.info(`Payment [${paymentId}] status is ${paymentStatus}`)
    log.info(`Requested agreement payment type is [${agreementPaymentType}] and response one is [${responseAgreementPaymentType}]`)

    if (responseAgreementPaymentType === agreementPaymentType && paymentStatus === 'success') {
      return payment
    }
  }

  throw new Error(`Payment [${paymentId}] status does not equal to success after multiple retries for a total of ${totalTimeTaken} milliseconds`)
}

async function assertAgreementStatus (publicApiUrl, apiToken, agreementId) {
  const agreementResponse = await agreementTestHelpers.getAgreement(apiToken, publicApiUrl, agreementId)
  log.info(`Agreement [${agreementId}] status is ${agreementResponse.status}`)

  if (agreementResponse.status !== 'active') {
    throw new Error(`Agreement status ${agreementResponse.status} does not equal active`)
  }
}

async function createAgreement (publicApiUrl, apiToken, provider) {
  log.info(`Creating agreement for [${provider}]`)
  const createAgreementPayload = agreementTestHelpers.getCreateAgreementPayload(provider)
  const createAgreementResponse = await agreementTestHelpers.createAgreement(apiToken, publicApiUrl, createAgreementPayload)
  log.info(`Created agreement [${createAgreementResponse.agreement_id}]`)

  return createAgreementResponse
}

async function wait (seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds))
}

module.exports = {
  assertAgreementStatus,
  createAgreement,
  setupPaymentForAgreement,
  takeARecurringPaymentForAgreement
}
