const argv = require('yargs/yargs')(process.argv.slice(2)).argv
const proxyquire = require('proxyquire').noCallThru()
const syntheticsLoggerStub = require('../stubs/syntheticsLoggerStub')
const syntheticsStub = require('../stubs/syntheticsStub')

const smokeTestHelpersWithStubs = proxyquire(
  '../helpers/smokeTestHelpers.js',
  { Synthetics: syntheticsStub, SyntheticsLogger: syntheticsLoggerStub }
)

const stubs = {
  SyntheticsLogger: syntheticsLoggerStub,
  Synthetics: syntheticsStub,
  '../helpers/smokeTestHelpers': smokeTestHelpersWithStubs
}

process.env.LOCAL_SMOKE_TEST = 'true'

const tests = {
  'make-card-payment-epdq-with-3ds': proxyquire('../make-card-payment-epdq-with-3ds', stubs),
  'make-card-payment-epdq-with-3ds2': proxyquire('../make-card-payment-epdq-with-3ds2', stubs),
  'make-card-payment-epdq-without-3ds': proxyquire('../make-card-payment-epdq-without-3ds', stubs),
  'make-card-payment-sandbox-without-3ds': proxyquire('../make-card-payment-sandbox-without-3ds', stubs),
  'make-card-payment-smartpay-without-3ds': proxyquire('../make-card-payment-smartpay-without-3ds', stubs),
  'make-card-payment-stripe-with-3ds2': proxyquire('../make-card-payment-stripe-with-3ds2', stubs),
  'make-card-payment-stripe-without-3ds': proxyquire('../make-card-payment-stripe-without-3ds', stubs),
  'make-card-payment-worldpay-with-3ds': proxyquire('../make-card-payment-worldpay-with-3ds', stubs),
  'make-card-payment-worldpay-with-3ds2': proxyquire('../make-card-payment-worldpay-with-3ds2', stubs),
  'make-card-payment-worldpay-with-3ds2-exemp': proxyquire('../make-card-payment-worldpay-with-3ds2-exemption-engine', stubs),
  'make-card-payment-worldpay-without-3ds': proxyquire('../make-card-payment-worldpay-without-3ds', stubs),
  'cancel-card-payment-sandbox-without-3ds': proxyquire('../cancel-card-payment-sandbox-without-3ds', stubs),
  'use-payment-link-for-sandbox': proxyquire('../use-payment-link-for-sandbox', stubs)
}

if (!argv.test || !tests[argv.test]) {
  console.error(`Enter valid test name with --test. Must be one of:\n ${Object.keys(tests)}`)
  process.exit(1)
}

async function runTest (testName) {
  console.log(`Running ${testName}`)
  await tests[testName].handler()
}

runTest(argv.test)
