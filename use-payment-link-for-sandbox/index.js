const { ENVIRONMENT, LOCAL_SMOKE_TEST } = process.env

const synthetics = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsStub/index.js') : require('Synthetics')
const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smokeTestHelpers')

async function enterAmount (page, amount) {
  log.info(`Enter the amount £${amount}`)
  await synthetics.executeStep('Enter amount', async function () {
    await page.waitForSelector('#payment-amount')
    await page.click('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .push-bottom > .currency-input > .currency-input__inner > #payment-amount')
    await page.type('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .push-bottom > .currency-input > .currency-input__inner > #payment-amount', amount)
  })
}

async function clickProceedToPaymentButton (page) {
  log.info('Click on "Proceed to payment" button')
  await synthetics.executeStep('Click on "Proceed to payment" button', async function () {
    await page.waitForSelector('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .push-bottom > .govuk-button')
    await page.click('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .push-bottom > .govuk-button')
  })

  await page.waitForNavigation()
}

async function navigateToPayStart (page, paymentLinkUrl) {
  log.info(`Going to visit ${paymentLinkUrl}`)
  await synthetics.executeStep('Goto_0', async function () {
    await page.goto(paymentLinkUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  })

  await page.setViewport({ width: 1920, height: 953 })
}

exports.handler = async () => {
  const secret = await smokeTestHelpers.getSecret(`${ENVIRONMENT}/smoke_test`)
  const paymentLinkUrl = secret.SMOKE_TEST_PRODUCT_PAYMENT_LINK_URL
  const page = await synthetics.getPage()

  await navigateToPayStart(page, paymentLinkUrl)
  await enterAmount(page, '50.50')
  await clickProceedToPaymentButton(page)

  const title = await page.title()
  log.info(`We are on "${title}" page`)

  if (title !== 'Enter card details') {
    throw new Error(`Page title ${page.title()} does not equal "Enter card details"`)
  }
}
