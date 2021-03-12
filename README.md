# pay-smoke-tests
## GOV.UK Pay's AWS CloudWatch Synthetics Canaries

This repository contains the code used by GOV.UK Pay to run smoke tests against the Pay platform.

They are triggered on a schedule and post application deploy on Concourse.

They are managed via Terraform in which is stored in [pay-infra](https://github.com/alphagov/pay-infra).

The scripts which run the Canaries post application deploy can be found in [pay-ci](https://github.com/alphagov/pay-ci).

## Structure

### Stubs
AWS uses two libraries `Synthetics` and `SyntheticsLogger`, which appear to only be available inside of the lambda runtime, because of this when running tests locally we need to stub out both of these libraries using Puppeteer. The stubs for these exist in the `stubs` directory in the root of the repository.

### Test Harness 
To run the smoke tests locally we have a test harness which calls the `handler` function inside of each canary, as new tests are added they should also be added to the harness. The harness exists inside of the `run-local` folder in the root of the repository.

### Tests
Each smoke test should have its own folder which should be placed in the root of the repository.

### How to run smoke tests locally

To run smoke tests against test, staging or production environment locally, please follow the steps.

1. Run the following command to install packages, and any packages that it depends on.

    ```
    npm install
    ```

2. Run the following command to executes a command with AWS credentials in the environment.

    ```
    aws-vault exec deploy
    ```

2. Run the following command to run the smoke tests against test environment. You can set ENVIRONMENT to staging or
production if you want to run the tests against either staging or production environment.

    ```
    export ENVIRONMENT=test; export LOCAL_SMOKE_TEST=true; node run-local/index.js
    ```

## Licence
[MIT License](LICENCE)

## Responsible Disclosure
GOV.UK Pay aims to stay secure for everyone. If you are a security researcher and have discovered a security vulnerability in this code, we appreciate your help in disclosing it to us in a responsible manner. We will give appropriate credit to those reporting confirmed issues. Please e-mail gds-team-pay-security@digital.cabinet-office.gov.uk with details of any issue you find, we aim to reply quickly.
