const argv = require('yargs/yargs')(process.argv.slice(2)).argv
const proxyquire = require('proxyquire').noCallThru()
const syntheticsLoggerStub = require('../stubs/syntheticsLoggerStub')
const syntheticsStub = require('../stubs/syntheticsStub')(argv.headless)

const smokeTestHelpersWithStubs = proxyquire(
  '../helpers/smokeTestHelpers.js',
  { Synthetics: syntheticsStub, SyntheticsLogger: syntheticsLoggerStub }
)

const stubs = {
  SyntheticsLogger: syntheticsLoggerStub,
  Synthetics: syntheticsStub,
  '../helpers/smokeTestHelpers': smokeTestHelpersWithStubs
}
const ENVIRONMENTS = ['test', 'staging', 'production']
process.env.ENVIRONMENT = argv.env
process.env.WEBHOOKS_ENABLED = argv.webhooks

const TESTS = {
  'make-card-payment-sandbox-without-3ds': proxyquire('../make-card-payment-sandbox-without-3ds', stubs),
  'make-card-payment-stripe-with-3ds2': proxyquire('../make-card-payment-stripe-with-3ds2', stubs),
  'make-card-payment-stripe-without-3ds': proxyquire('../make-card-payment-stripe-without-3ds', stubs),
  'make-card-payment-worldpay-with-3ds': proxyquire('../make-card-payment-worldpay-with-3ds', stubs),
  'make-card-payment-worldpay-with-3ds2': proxyquire('../make-card-payment-worldpay-with-3ds2', stubs),
  'make-card-payment-worldpay-with-3ds2-exemp': proxyquire('../make-card-payment-worldpay-with-3ds2-exemption-engine', stubs),
  'make-card-payment-worldpay-without-3ds': proxyquire('../make-card-payment-worldpay-without-3ds', stubs),
  'cancel-card-payment-sandbox-without-3ds': proxyquire('../cancel-card-payment-sandbox-without-3ds', stubs),
  'use-payment-link-for-sandbox': proxyquire('../use-payment-link-for-sandbox', stubs),
  'notifications-sandbox': proxyquire('../notifications-sandbox', stubs)
}

if (argv.h || !argv.env || !argv.test || !argv.webhooks) {
  console.log(`Options: 
  --env must be one of: ${ENVIRONMENTS}
  --test must be one of:
   ${Object.keys(TESTS)}
  --webhooks must be either true or false
  [--headless] run browser in headless mode, default to false
  `)
  process.exit(1)
}

async function runTest (testName) {
  console.log(`Running ${testName}`)
  try {
    await TESTS[testName].handler()
    process.exit(0)
  } catch (err) {
    console.log(`Test failed: ${err.message}`)
    process.exit(1)
  }
}

runTest(argv.test)
