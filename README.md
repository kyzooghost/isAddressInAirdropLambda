# Intended Use

Build and deploy the Lambda function

Obtain function URL - `aws lambda get-function-url-config --function-name isAddressInAirdropFunction`

HTTP GET request to function URL, with query param `address = ...`

Example
`curl https://m224buwvehcfsvs4sft76ca4au0udcaz.lambda-url.ap-southeast-2.on.aws?address=0xB0E424CE85679E518940D7c54E94325541D11464`

# Requirements

* AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
* Node.js - [Install Node.js 14](https://nodejs.org/en/), including the npm package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community).

# Quick Start

`sam build` => Build application
`sam deploy --guided` => Deploy application onto AWS

# Directories

- `src` - Code for the application's Lambda function.
- `events` - Invocation events that you can use to invoke the function.
- `__tests__` - Unit tests for the application code. 
- `template.yaml` - A template that defines the application's AWS resources.

# Test

Run functions locally and invoke them with the `sam local invoke` command.

```bash
sam local invoke --no-event
```

```bash
sam local invoke -e events/sample_event.json
```

# Logging

`sam logs`

## Unit tests

`npm install && npm run test`


## Cleanup

```bash
aws cloudformation delete-stack --stack-name sam-app
```