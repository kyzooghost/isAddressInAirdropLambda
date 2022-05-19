const ethers = require("ethers")
const { isAddress } = ethers.utils
const tableName = process.env.TABLE;
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

exports.deleteByEthAddressHandler = async (event) => {
  console.info('received:', event);

  if (!event.httpMethod) return {statusCode: 400, body: "No httpMethod property on event object"}
  if (event.httpMethod !== 'DELETE') return {statusCode: 400, body: `deleteByEthAddressHandler only accept DELETE method, you tried: ${event.httpMethod}`}
  if (!event.path) return {statusCode: 400, body: "No path property on event object"}
  if (!event.pathParameters) return {statusCode: 400, body: "No pathParameters property on event object"}
  if (!event.pathParameters.address) return {statusCode: 400, body: "No address parameter found"}

  // Get address from pathParameters from APIGateway because of `/{address}` at template.yaml
  const address = event.pathParameters.address;
  if (!isAddress(address)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}
 
  // Get the item from the table
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
  var params = {
    TableName : tableName,
    Key: { ethAddress: address }
  };

  let response;

  try {
    await docClient.delete(params).promise();
    response = {
        statusCode: 200,
        body: `Successfully deleted database entry for ${address} in table ${tableName}`
    };
  } catch(e) {
    response = {
        statusCode: 400,
        body: JSON.stringify(e)
    }
  }
 
  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}
