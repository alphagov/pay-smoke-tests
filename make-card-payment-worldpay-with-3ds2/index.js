const { ENVIRONMENT, WEBHOOKS_ENABLED } = process.env

const synthetics = require('Synthetics')
const log = require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

const worldpay3ds2Card = {
  cardholderName: '3DS_V2_CHALLENGE_IDENTIFIED',
  cardNumber: '4462030000000000',
  expiryMonth: smokeTestHelpers.expiryMonth,
  expiryYear: smokeTestHelpers.expiryYear,
  securityCode: '737'
}

const enterCardDetailsContinueWorldpay3dsAndConfirm = async function (nextUrl, cardDetails, emailAddress) {
  log.info(`Going to get page ${nextUrl}`)
  const page = await synthetics.getPage()

  const navigationPromise = page.waitForNavigation()

  await synthetics.executeStep('Goto_0', async function () {
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  })

  await page.setViewport({ width: 1920, height: 953 })

  await smokeTestHelpers.enterCardDetailsAndSubmit(page, cardDetails, emailAddress)

  await synthetics.executeStep('Wait for 3DS iframe to appear', async function () {
    await page.waitForSelector('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .iframe-3ds')
  })

  await synthetics.executeStep('Click submit button on 3DS page', async function () {
    const elementHandle = await page.$('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .iframe-3ds')
    const frame = await elementHandle.contentFrame()
    await frame.waitForSelector('#challengeForm > [type="submit"]')
    await frame.click('#challengeForm > [type="submit"]')
  })

  await navigationPromise

  await synthetics.executeStep('Click confirm', async function () {
    await page.waitForSelector('.govuk-grid-row > #main-content #confirm')
    await page.click('.govuk-grid-row > #main-content #confirm')
  })

  await navigationPromise
}

exports.handler = async () => {
  const provider = 'worldpay'
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const apiToken = secret.CARD_WORLDPAY_3DS_FLEX_API_TOKEN
  const publicApiUrl = secret.PUBLIC_API_URL

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, '3ds2')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(createPaymentResponse)

  await enterCardDetailsContinueWorldpay3dsAndConfirm(createPaymentResponse._links.next_url.href, worldpay3ds2Card, secret.EMAIL_ADDRESS)
  log.info('Finished entering card details and confirmed')

  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'success') {
    throw new Error(`Payment status ${paymentStatus} does not equal success`)
  }
  if (WEBHOOKS_ENABLED === 'true') await smokeTestHelpers.validateWebhookReceived(ENVIRONMENT, payment.payment_id)
}
