const { CARD_STRIPE_API_TOKEN, PUBLIC_API_URL, LOCAL_SMOKE_TEST } = process.env

const synthetics = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsStub/index.js') : require('Synthetics')
const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

const stripe3dsCard = {
  cardholderName: 'Test User',
  cardNumber: '4000000000003063',
  expiryMonth: smokeTestHelpers.expiryMonth,
  expiryYear: smokeTestHelpers.expiryYear,
  securityCode: '737'
}

const enterCardDetailsContinueStripe3dsAndConfirm = async function (nextUrl, cardDetails, emailAddress) {
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

  // Need to find a way to do the following method
  // wait.until(ExpectedConditions.javaScriptThrowsNoExceptions("window.frames[0].frames[0].postMessage({test_source: {authorize: true}}, '*')"));

  await navigationPromise

  await synthetics.executeStep('Click confirm', async function () {
    await page.waitForSelector('.govuk-grid-row > #main-content #confirm')
    await page.click('.govuk-grid-row > #main-content #confirm')
  })

  await navigationPromise
}

exports.handler = async () => {
  const provider = 'stripe'
  const apiToken = `${CARD_STRIPE_API_TOKEN}`
  const publicApiUrl = `${PUBLIC_API_URL}`

  log.info(`Going to create a payment to ${provider}`)
  const createPaymentRequest = smokeTestHelpers.createPaymentRequest(provider, '3ds2')
  const createPaymentResponse = await smokeTestHelpers.createPayment(apiToken, publicApiUrl, createPaymentRequest)
  log.info(createPaymentResponse)

  await enterCardDetailsContinueStripe3dsAndConfirm(createPaymentResponse._links.next_url.href, stripe3dsCard, secret.EMAIL_ADDRESS)
  log.info('Finished entering card details and confirmed')

  const payment = await smokeTestHelpers.getPayment(apiToken, publicApiUrl, createPaymentResponse.payment_id)
  const paymentStatus = payment.state.status
  log.info(`Payment status is ${paymentStatus}`)

  if (paymentStatus !== 'success') {
    throw new Error(`Payment status ${paymentStatus} does not equal success`)
  }
}
