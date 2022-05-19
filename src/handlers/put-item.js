const ethers = require("ethers")
const { isAddress } = ethers.utils
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const tableName = process.env.TABLE;

exports.putItemHandler = async (event) => {
    // All log statements are written to CloudWatch
    console.info('received:', event);

    if (!event.httpMethod) return {statusCode: 400, body: "No httpMethod property on event object"}
    if (event.httpMethod !== 'POST') return {statusCode: 400, body: `postMethod only accept POST method, you tried: ${event.httpMethod}`}
    if (!event.path) return {statusCode: 400, body: "No path property on event object"}
    if (!event.body) return {statusCode: 400, body: "No body property on event object"}

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    if (!body.ethAddress) return {statusCode: 400, body: "No ethAddress property on event.body"}
    if (!body.lockId) return {statusCode: 400, body: "No lockId property on event.body"}
    if (!body.chainId) return {statusCode: 400, body: "No chainId property on event.body"}
    if (!body.multiplier) return {statusCode: 400, body: "No multiplier property on event.body"}
    if (!body.multipliedAirdropPoints) return {statusCode: 400, body: "No multipliedAirdropPoints property on event.body"}
 
    const ethAddress = body.ethAddress;
    if (!isAddress(ethAddress)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}
    
    const lockId = body.lockId;
    if(!/^\d+$/.test(lockId)) return {statusCode: 400, body: "lockId is not a string of only numeric characters"}
    // Could check if lockId < totalSupply of xsLockID on given chain, but don't want to bloat the lambda function here just for that
    
    const chainId = body.chainId;
    if(!/^\d+$/.test(chainId)) return {statusCode: 400, body: "chainId is not a string of only numeric characters"}
    if( (parseInt(chainId) != 1) && (parseInt(chainId) != 137) && (parseInt(chainId) != 1313161554) ) return {statusCode: 400, body: "chainId is not an accepted value"}

    const multiplier = body.multiplier;
    if(!/^[0123456789.]*$/.test(multiplier)) return {statusCode: 400, body: "multiplier is not a string of only numeric characters and '.'"}
    if( ( parseFloat(multiplier) > 9 ) || ( parseFloat(multiplier) < 1 ) ) return {statusCode: 400, body: "multiplier must be between 1.0 and 9.0"}
    
    const multipliedAirdropPoints = body.multipliedAirdropPoints;
    if(!/^[0123456789.]*$/.test(multipliedAirdropPoints)) return {statusCode: 400, body: "multipliedAirdropPoints is not a string of only numeric characters and '.'"}

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName : tableName,
        Item: { 
            ethAddress: ethAddress, 
            lockId: lockId, 
            chainId: chainId,
            multiplier: multiplier,
            multipliedAirdropPoints: multipliedAirdropPoints
        }
    };

    let response;

    try {
        await docClient.put(params).promise();
        response = {
            statusCode: 200,
            body: `Successfully inserted entry - ${JSON.stringify(body)}`
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
};
