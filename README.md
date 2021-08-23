# pay-smoke-tests
## GOV.UK Pay's AWS CloudWatch Synthetics Canaries

This repository contains the code used by GOV.UK Pay to run smoke tests against the Pay platform.

They are triggered on a schedule and post application deploy on Concourse.

They are managed via Terraform in which is stored in [pay-infra](https://github.com/alphagov/pay-infra).

The scripts which run the Canaries post application deploy can be found in [pay-ci](https://github.com/alphagov/pay-ci).

## Naming

The AWS Canary resources have a 21-character name limit. The full test name is included
in the resource tags, however here's a quick reference guide:

Scenario | Environment | Canary name
------------ | ------------- | ------------- |
make-card-payment-sandbox-without-3ds | test | card_sandbox_test |
make-card-payment-smartpay-without-3ds | test | card_smartpay_test |
make-card-payment-stripe-with-3ds2 | test | card_stripe_3ds_test |
make-card-payment-stripe-without-3ds | test | card_stripe_test |
make-card-payment-worldpay-with-3ds | test | card_wpay_3ds_test |
make-card-payment-worldpay-with-3ds2 | test | card_wpay_3ds2_test |
make-card-payment-worldpay-with-3ds2-exemption | test | card_wpay_3ds2ex_test |
make-card-payment-worldpay-without-3ds | test | card_wpay_test |
notifications-sandbox | test | notifications_test |
cancel-card-payment-sandbox-without-3ds | test | cancel_sandbox_test |
use-payment-link-for-sandbox | test | pymntlnk_sandbox_test |
make-card-payment-sandbox-without-3ds | staging | card_sandbox_stag |
make-card-payment-smartpay-without-3ds | staging | card_smartpay_stag |
make-card-payment-stripe-with-3ds2 | staging | card_stripe_3ds_stag |
make-card-payment-stripe-without-3ds | staging | card_stripe_stag |
make-card-payment-worldpay-with-3ds | staging | card_wpay_3ds_stag |
make-card-payment-worldpay-with-3ds2 | staging | card_wpay_3ds2_stag |
make-card-payment-worldpay-with-3ds2-exemption | staging | card_wpay_3ds2ex_stag |
make-card-payment-worldpay-without-3ds | staging | card_wpay_stag |
notifications-sandbox | staging | notifications_stag |
cancel-card-payment-sandbox-without-3ds | staging | cancel_sandbox_stag |
use-payment-link-for-sandbox | staging | pymntlnk_sandbox_stag |
make-card-payment-sandbox-without-3ds | production | card_sandbox_prod |
make-card-payment-smartpay-without-3ds | production | card_smartpay_prod |
make-card-payment-stripe-with-3ds2 | production | card_stripe_3ds_prod |
make-card-payment-stripe-without-3ds | production | card_stripe_prod |
make-card-payment-worldpay-with-3ds | production | card_wpay_3ds_prod |
make-card-payment-worldpay-with-3ds2 | production | card_wpay_3ds2_prod |
make-card-payment-worldpay-with-3ds2-exemption | production | card_wpay_3ds2ex_prod |
make-card-payment-worldpay-without-3ds | production | card_wpay_prod |
notifications-sandbox | production | notifications_prod |
cancel-card-payment-sandbox-without-3ds | production | cancel_sandbox_prod |
use-payment-link-for-sandbox | production | pymntlnk_sandbox_prod |

## Structure

### Stubs
AWS uses two libraries `Synthetics` and `SyntheticsLogger`, which appear to only be available inside of the lambda runtime, because of this when running tests locally we need to stub out both of these libraries using Puppeteer. The stubs for these exist in the `stubs` directory in the root of the repository.

### Test Harness 
To run the tests locally use the `run-local/index.js` script. Provide the name
of the test you want to run with the `--test` flag. It will print out the valid
test names if none is provided or an invalid name is given. Provide the environment to run the tests for with the '--env' flag.

To run the tests in a headless mode use the `--headless` flag.

Example:

> aws-vault exec deploy -- node run-local/index.js --test make-card-payment-sandbox-without-3ds --env test --headless


### Tests
Each smoke test should have its own folder which should be placed in the root of the repository.

## EPDQ
The EPDQ smoke tests were not working prior to the migration from pay-end-to-end and were not being run by Deploy Jenkins. There is [JIRA ticket](https://payments-platform.atlassian.net/browse/PP-8356) to investigate and fix them but for now these tests are not deployed as AWS Canaries and are commented out from running locally.

## Releases

When a PR is merged, a Github Action will build a package and create a release.

The smoke test Canaries can then be updated by a developer using the [Concourse deploy-smoke-tests pipeline](https://cd.gds-reliability.engineering/teams/pay-deploy/pipelines/deploy-smoke-tests).


## Licence
[MIT License](LICENCE)

## Responsible Disclosure
GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. We will give appropriate credit to those reporting confirmed issues. Please e-mail gds-team-pay-security@digital.cabinet-office.gov.uk with details of any issue you find, we aim to reply quickly.
