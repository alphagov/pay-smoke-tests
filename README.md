# pay-smoke-tests
## GOV.UK Pay's AWS CloudWatch Synthetics Canaries

This repository contains the code used by GOV.UK Pay to run smoke tests against the Pay platform.

They are triggered on a schedule and post application deploy on Concourse.

They are managed via Terraform in which is stored in [pay-infra](https://github.com/alphagov/pay-infra).

The scripts which run the Canaries post application deploy can be found in [pay-ci](https://github.com/alphagov/pay-ci).
