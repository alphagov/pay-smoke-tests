process.env.LOCAL_SMOKE_TEST = 'true'
const makeCardPayment = require('../make-card-payment')

async function runHarness () {
  console.log('Running: Make Card Payment')
  await makeCardPayment.handler()
  process.exit(0)
}

runHarness()
