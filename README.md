SAM source code for AWS endpoints to assist SOLACE airdrop frontend

# Usage Instructions

## API Endpoints

For given address, get lockdrop data

```bash
curl <AWS_ENDPOINT>/0xCBe416312599816b9f897AfC6DDF69C9127bB2D0

# {
#   "airdrop_points":192.93096916906418, /
#   "xsLocks":[
#       {"chainId":"137","xslockID":"256","amount":"9216418705163574941","end":"1650273249","multiplier":1},
#       {"chainId":"137","xslockID":"257","amount":"20000000000000000000","end":"1775811567","multiplier":8.629703589626587}
#   ],
#   "lockdrop_choice":[{"chainId":"1","multipliedAirdropPoints":"100000","lockId":"1","multiplier":"2.1"}]
# }
```

Create or edit {ethAddress, lockId, chainId, multiplier, multipliedAirdropPoints} record in DynamoDB table

```bash
curl -d '{"ethAddress":"0xCBe416312599816b9f897AfC6DDF69C9127bB2D0", "lockId":"1", "chainId":"1", "multiplier": "2.1", "multipliedAirdropPoints": "200000"}' -H "Content-Type: application/json" -X POST <AWS_ENDPOINT>
```

Delete a single DynamoDB table entry using primary key `ethAddress`

```bash
curl -X DELETE <AWS_ENDPOINT>/0xCBe416312599816b9f897AfC6DDF69C9127bB2D0
```

View all lockdrop choices stored in DynamoDB table

```bash
curl <AWS_ENDPOINT>
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

`aws logs tail <LOG_GROUP>`

## Cleanup

```bash
aws s3 rb s3://xs-lock-cache --force
aws cloudformation delete-stack --stack-name sam-app
```

---

# Architecture

## AWS Lambda Functions

getLockdropDataFunction
- Invoked via HTTP GET request via `/{address}` path
- Bundled with airdrop_data.json in same directory. Wanted to write in Typescript but could not bundle .json into SAM build with Typescript
- Lambda function retrieves entry for address in airdrop_data.json
- If entry present, retrive xsLocks of given address from xsLockers cache in `xsLockCache` S3 bucket
- If entry present, also retrive current lockdrop choice from DynamoDB table


getAllItemsFunction
- Invoked via HTTP GET request
- Obtain all entries in DynamoDB table of lockdrop entries


deleteByEthAddressFunction
- Invoked via HTTP DELETE request to via `/{address}` path
- Deletes corresponding DynamoDB entry


InsertLockdropChoiceFunction
- Invoked via HTTP POST request
- Creates or edits DynamoDB entry, POST request must include the following fields
```js
{
    ethAddress,
    lockId,
    chainId,
    multiplier,
    multipliedAirdropPoints
}
```


refreshXSLockCache
- Cronjob set to run every 3-minutes. Queries Solace API endpoint and stores response in `xsLockCache` S3 bucket as a cache

## Other AWS Resources

xsLockCache
- S3 bucket containing xsLockersCache


LockdropTable
- DynamoDB table containing user lockdrop choices