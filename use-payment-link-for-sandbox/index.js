const { ENVIRONMENT } = process.env

const synthetics = require('Synthetics')
const log = require('SyntheticsLogger')
const smokeTestHelpers = require('../helpers/smoke-test-helpers')

async function enterAmount (page, amount) {
  await page.waitForSelector('#payment-amount')
  await page.click('#payment-amount')
  await page.type('#payment-amount', amount)
}

async function clickContinueOnPage (page) {
  await page.waitForSelector('.govuk-button')
  const navigationPromise = page.waitForNavigation()
  await page.click('.govuk-button')
  await navigationPromise
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
  await synthetics.executeStep('Click on "Continue" button on start page', async function () {
    log.info('Click on "Continue" button on start page')
    await clickContinueOnPage(page)
  })
  await synthetics.executeStep('Enter amount', async function () {
    log.info('Enter the amount')
    await enterAmount(page, '50.50')
  })
  await synthetics.executeStep('Click on "Continue" button on amount page', async function () {
    log.info('Click on "Continue" button on amount page')
    await clickContinueOnPage(page)
  })
  await synthetics.executeStep('Click on "Proceed to payment" button', async function () {
    log.info('Click on "Proceed to payment" button')
    await clickContinueOnPage(page)
  })

  const title = await page.title()
  log.info(`We are on "${title}" page`)

  if (title !== 'Enter card details') {
    throw new Error(`Page title ${page.title()} does not equal "Enter card details"`)
  }
}
