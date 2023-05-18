const https = require('https')

async function createAgreement (apiToken, publicApiUrl, createAgreementPayload) {
  const options = {
    host: publicApiUrl,
    port: 443,
    headers: headers(apiToken),
    path: '/v1/agreements',
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
    }).end(JSON.stringify(createAgreementPayload))
  })
}

function getCreateAgreementPayload (provider) {
  return {
    reference: generateAgreementReference(provider, 'agreement'),
    description: 'should create agreement, setup agreement and take a recurring payment'
  }
}

const generateAgreementReference = (provider, testDescription) => {
  const reference = ['smoke_test', provider, testDescription, Math.floor(Math.random() * 100000)]
  return reference.join('_')
}

async function getAgreement (apiToken, publicApiUrl, agreementId) {
  const options = {
    host: publicApiUrl,
    port: 443,
    headers: headers(apiToken),
    path: `/v1/agreements/${agreementId}`,
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

module.exports = {
  getCreateAgreementPayload,
  createAgreement,
  getAgreement
}
