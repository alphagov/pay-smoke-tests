process.env.LOCAL_SMOKE_TEST = 'true'

const makeCardPaymentEpdqWithout3ds = require('../make-card-payment-epdq-without-3ds')
const makeCardPaymentEpdqWith3ds = require('../make-card-payment-epdq-with-3ds')
const makeCardPaymentEpdqWith3ds2 = require('../make-card-payment-epdq-with-3ds2')
const makeCardPaymentSandboxWithout3ds = require('../make-card-payment-sandbox-without-3ds')
const makeCardPaymentSmartpayWithout3ds = require('../make-card-payment-smartpay-without-3ds')
const makeCardPaymentStripeWithout3ds = require('../make-card-payment-stripe-without-3ds')
const makeCardPaymentStripeWith3ds2 = require('../make-card-payment-stripe-with-3ds2')
const makeCardPaymentWorldpayWithout3ds = require('../make-card-payment-worldpay-without-3ds')
const makeCardPaymentWorldpayWith3ds = require('../make-card-payment-worldpay-with-3ds')
const makeCardPaymentWorldpayWith3ds2 = require('../make-card-payment-worldpay-with-3ds2')
const makeCardPaymentWorldpayWith3ds2ExemptionEngine = require('../make-card-payment-worldpay-with-3ds2-exemption-engine')

async function runHarness () {
  console.log('Running: Make Card Payment')

  await makeCardPaymentEpdqWithout3ds.handler()
  await makeCardPaymentEpdqWith3ds.handler()
  await makeCardPaymentEpdqWith3ds2.handler()
  await makeCardPaymentSandboxWithout3ds.handler()
  await makeCardPaymentSmartpayWithout3ds.handler()
  await makeCardPaymentStripeWithout3ds.handler()
  await makeCardPaymentStripeWith3ds2.handler()
  await makeCardPaymentWorldpayWithout3ds.handler()
  await makeCardPaymentWorldpayWith3ds.handler()
  await makeCardPaymentWorldpayWith3ds2.handler()
  await makeCardPaymentWorldpayWith3ds2ExemptionEngine.handler()

  process.exit(0)
}

runHarness()
