const argv = require('yargs/yargs')(process.argv.slice(2)).argv
const proxyquire = require('proxyquire').noCallThru()
const syntheticsLoggerStub = require('../stubs/syntheticsLoggerStub')
const syntheticsStub = require('../stubs/syntheticsStub')

const environments = ['test', 'staging', 'production']
if (!argv.env || !environments.includes(argv.env)) {
  console.log(`Enter valid environment name with --env. Must be one of:\n ${environments}`)
  process.exit(1)
}

process.env.ENVIRONMENT = argv.env

const smokeTestHelpersWithStubs = proxyquire(
  '../helpers/smokeTestHelpers.js',
  { Synthetics: syntheticsStub, SyntheticsLogger: syntheticsLoggerStub }
)

const stubs = {
  SyntheticsLogger: syntheticsLoggerStub,
  Synthetics: syntheticsStub,
  '../helpers/smokeTestHelpers': smokeTestHelpersWithStubs
}

// epdq tests are not currently working so have been commented out for now.
const tests = {
  //'make-card-payment-epdq-with-3ds': proxyquire('../make-card-payment-epdq-with-3ds', stubs),
  //'make-card-payment-epdq-with-3ds2': proxyquire('../make-card-payment-epdq-with-3ds2', stubs),
  //'make-card-payment-epdq-without-3ds': proxyquire('../make-card-payment-epdq-without-3ds', stubs),
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
  console.log(`Enter valid test name with --test. Must be one of:\n ${Object.keys(tests)}`)
  process.exit(1)
}

async function runTest (testName) {
  console.log(`Running ${testName}`)
  try{
  await tests[testName].handler()
    process.exit(0)
  } catch(err){
    console.log(`Failed to run test: ${err.message}`)
    process.exit(1)
  }
}

runTest(argv.test)
