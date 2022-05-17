SAM source code for AWS endpoints to assist SOLACE airdrop frontend

# Usage Instructions

## API Endpoints

For given address, get airdrop points

```bash
curl <AWS_ENDPOINT>/airdrop/0xCBe416312599816b9f897AfC6DDF69C9127bB2D0

# {"stakingReward":33.368511768971274,"policyWeight":0,"liquidityProviderRewards":1.304753037912153,"airdropPoints":192.93096916906418,"airdropPointsProportion":0.00029333637709662806}
```

For given address, get xsLocks

```bash
curl <AWS_ENDPOINT>/xslocks/0xCBe416312599816b9f897AfC6DDF69C9127bB2D0

# [{"chainId":"137","xslockID":"256","amount":"9216418705163574941","end":"1650273249","multiplier":1},{"chainId":"137","xslockID":"257","amount":"20000000000000000000","end":"1775811567","multiplier":8.629703589626587}]
```

---

# Dev Instructions

## Requirements

* AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
* Node.js - [Install Node.js 14](https://nodejs.org/en/), including the npm package management tool.

## Quick Start

`sam build` => Build application
`sam deploy --guided` => Deploy application onto AWS

## Logging

`aws logs tail /aws/lambda/getXSLocks`

## Cleanup

```bash
aws s3 rb s3://xs-lock-cache --force
aws cloudformation delete-stack --stack-name sam-app
```

---

# Architecture

## AWS Lambda Functions

isAddressInAirdropFunction
- Invoked via HTTP GET request, via `/airdrop/{address}` path
- Lambda function bundled with airdrop_data.json in same directory
- Lambda function retrives entry for address in airdrop_data.json
- Could not bundle .json into SAM build with Typescript

getXSLock
- Invoked via HTTP GET request, via `/xslocks/{address}` path
- Lambda function takes `address` parameter, retrives cache of xsLockers from `xsLockCache` S3 bucket, and retrives xsLocks of given address

refreshXSLockCache
- Cronjob set to run every 3-minutes. Queries Solace API endpoint and stores response in `xsLockCache` S3 bucket as a cache

## Directories

- `src` - Code for the application's Lambda function.
- `events` - Invocation events that you can use to invoke the function.
- `__tests__` - Unit tests for the application code. 
- `template.yaml` - A template that defines the application's AWS resources.
