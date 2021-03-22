const { LOCAL_SMOKE_TEST } = process.env

const synthetics = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsStub/index.js') : require('Synthetics')
const log = LOCAL_SMOKE_TEST === 'true' ? require('../stubs/syntheticsLoggerStub/index.js') : require('SyntheticsLogger')
const https = require('https')
const AWS = require('aws-sdk')

const today = new Date()
const thisMonthNextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
const expiryMonth = (thisMonthNextYear.getMonth() + 1).toString()
const expiryYear = thisMonthNextYear.getFullYear().toString().substr(-2).toString()

async function createPayment (apiToken, publicApiUrl, createPaymentRequest) {
  const options = {
    host: publicApiUrl,
    port: 443,
    headers: headers(apiToken),
    path: '/v1/payments',
    method: 'POST'
  }

  return new Promise(resolve => {
    https.request(options, res => {
      if (res.statusCode !== 201) {
        throw new Error(`publicapi responded with ${res.statusCode} status`)
      }

      let data = ''

      res.on('data', d => data += d) // eslint-disable-line
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', error => { throw new Error(error) })
    }).end(JSON.stringify(createPaymentRequest))
  })
}

function createPaymentRequest (provider, typeOf3ds) {
  return {
    amount: 100,
    reference: generatePaymentReference(provider, typeOf3ds, 'card_payment'),
    description: 'should create payment, enter card details and confirm',
    return_url: 'https://products.pymnt.uk/successful'
  }
}

async function enterCardDetailsAndSubmit (page, cardDetails, emailAddress) {
  await synthetics.executeStep('Enter card number', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #card-no')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #card-no')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #card-no', cardDetails.cardNumber)
  })

  await synthetics.executeStep('Enter expiry month', async function () {
    await page.waitForSelector('#card-details #expiry-month')
    await page.click('#card-details #expiry-month')
    await page.type('#card-details #expiry-month', cardDetails.expiryMonth)
  })

  await synthetics.executeStep('Enter expiry year', async function () {
    await page.waitForSelector('#card-details #expiry-year')
    await page.click('#card-details #expiry-year')
    await page.type('#card-details #expiry-year', cardDetails.expiryYear)
  })

  await synthetics.executeStep('Enter card holder name', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #cardholder-name')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #cardholder-name')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #cardholder-name', cardDetails.cardholderName)
  })

  await synthetics.executeStep('Enter cvc', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #cvc')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #cvc')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #cvc', cardDetails.securityCode)
  })

  await synthetics.executeStep('Enter address line 1', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #address-line-1')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #address-line-1')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #address-line-1', '1 Main Street')
  })

  await synthetics.executeStep('Enter address line 2', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #address-line-2')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #address-line-2')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #address-line-2', 'Main Village')
  })

  await synthetics.executeStep('Enter address town', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #address-city')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #address-city')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #address-city', 'London')
  })

  await synthetics.executeStep('Enter postcode', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #address-postcode')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #address-postcode')
    await page.type('.charge-new__content > #card-details-wrap > #card-details #address-postcode', 'AB1A 1AB')
  })

  await synthetics.executeStep('Enter email', async function () {
    await page.waitForSelector('#card-details-wrap > #card-details #email')
    await page.click('#card-details-wrap > #card-details #email')
    await page.type('#card-details-wrap > #card-details #email', emailAddress)
  })

  await synthetics.executeStep('Click submit card details', async function () {
    await page.waitForSelector('.charge-new__content > #card-details-wrap > #card-details #submit-card-details')
    await page.click('.charge-new__content > #card-details-wrap > #card-details #submit-card-details')
  })

  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })
}

async function enterCardDetailsAndConfirm (nextUrl, cardDetails, emailAddress) {
  log.info(`Going to get page ${nextUrl}`)
  const page = await synthetics.getPage()

  const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })

  await synthetics.executeStep('Goto_0', async function () {
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  })

  await page.setViewport({ width: 1920, height: 953 })

  await enterCardDetailsAndSubmit(page, cardDetails, emailAddress)

  await synthetics.executeStep('Click confirm', async function () {
    await page.waitForSelector('.govuk-grid-row > #main-content #confirm')
    await page.click('.govuk-grid-row > #main-content #confirm')
  })

  await navigationPromise
}

async function enterCardDetailsContinue3dsAndConfirm (nextUrl, cardDetails, emailAddress) {
  log.info(`Going to get page ${nextUrl}`)
  const page = await synthetics.getPage()

  const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })

  await synthetics.executeStep('Goto_0', async function () {
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  })

  await page.setViewport({ width: 1920, height: 953 })

  await enterCardDetailsAndSubmit(page, cardDetails, emailAddress)

  await synthetics.executeStep('Wait for 3DS iframe to appear', async function () {
    await page.waitForSelector('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .iframe-3ds')
  })

  await synthetics.executeStep('Click submit button on 3DS page', async function () {
    const elementHandle = await page.$('#main-content > .govuk-grid-row > .govuk-grid-column-two-thirds > .iframe-3ds')
    const frame = await elementHandle.contentFrame()
    await frame.waitForSelector('.no-js > body > div > form > .form > li > span > [type="submit"]')
    await frame.click('.no-js > body > div > form > .form > li > span > [type="submit"]')
  })

  await navigationPromise

  await synthetics.executeStep('Wait for a confirm button to appear', async function () {
    await page.waitForSelector('.govuk-grid-row > #main-content #confirm')
  })

  await synthetics.executeStep('Click confirm', async function () {
    await page.waitForSelector('.govuk-grid-row > #main-content #confirm')
    await page.click('.govuk-grid-row > #main-content #confirm')
  })

  await navigationPromise
}

const generatePaymentReference = (provider, typeOf3ds, testDescription) => {
  const reference = ['smoke_test', provider, typeOf3ds, testDescription, Math.floor(Math.random() * 100000)]
  return reference.join('_')
}

async function getPayment (apiToken, publicApiUrl, paymentId) {
  const options = {
    host: publicApiUrl,
    port: 443,
    headers: headers(apiToken),
    path: `/v1/payments/${paymentId}`,
    method: 'GET'
  }

  return new Promise(resolve => {
    https.request(options, res => {
      if (res.statusCode !== 200) {
        throw new Error(`publicapi responded with ${res.statusCode} status`)
      }
      let data = ''

      res.on('data', d => data += d) // eslint-disable-line
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', error => { throw new Error(error) })
    }).end()
  })
}

function headers (apiToken) {
  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  }
}

function getSecret (secretName) {
  const region = 'eu-west-1'
  const client = new AWS.SecretsManager({ region: region })
  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, function (error, data) {
      if (error) {
        log.info(`Error: ${error.message}`)
        if (error.code === 'DecryptionFailureException') {
          log.error('Secrets Manager cannot decrypt the protected secret text using the provided KMS key.')
          throw error
        } else if (error.code === 'InternalServiceErrorException') {
          log.error('An error occurred on the server side.')
          throw error
        } else if (error.code === 'InvalidParameterException') {
          log.error('The parameter contains an invalid value.')
          throw error
        } else if (error.code === 'InvalidRequestException') {
          log.error('The parameter value is not valid for the current state of the resource.')
          throw error
        } else if (error.code === 'ResourceNotFoundException') {
          log.error(`Secrets Manager cannot find the specified secret ${secretName}.`)
          throw error
        }
      } else {
        if ('SecretString' in data) {
          resolve(JSON.parse(data.SecretString))
        } else {
          const buff = Buffer.alloc(data.SecretBinary, 'base64')
          resolve(buff.toString('ascii'))
        }
      }
    })
  })
}

module.exports = {
  expiryMonth,
  expiryYear,
  createPayment,
  createPaymentRequest,
  enterCardDetailsAndSubmit,
  enterCardDetailsAndConfirm,
  enterCardDetailsContinue3dsAndConfirm,
  generatePaymentReference,
  getPayment,
  getSecret,
  headers
}
