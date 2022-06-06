const fs = require("fs")
const ethers = require("ethers")
const { isAddress } = ethers.utils
const { getUserLocks } = require("./utils/getUserLocks")
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
    if (!body.address) return {statusCode: 400, body: "No address property on event.body"}
    if (!body.option) return {statusCode: 400, body: "No option property on event.body"}
 
    // Basic input validation
    const address = body.address;
    if (!isAddress(address)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}
    
    const option = parseInt(body.option);
    if(!/^\d+$/.test(option.toString())) return {statusCode: 400, body: "option is not a string of only numeric characters"}

    // Define variables for DynamoDB table input
    let lockId
    let chainId
    let multiplier
    let multipliedAirdropPoints

    // Input validation against local database

    // Can only use address that qualified for airdrop
    const airdrop_data_path = __dirname + "/data/airdrop_data.json"
    if (!fs.existsSync (airdrop_data_path)) {return {statusCode: 400, body: `No airdrop_data.json in ${airdrop_data_path}`}}
    let airdrop_data = JSON.parse( fs.readFileSync(airdrop_data_path).toString() );
    if (!airdrop_data.hasOwnProperty(address)) return {statusCode: 400, body: "Error: address does not qualify for airdrop"}

    // If option > 0, then option must <= # of xsLocks
    const airdrop_points = airdrop_data[address]["airdropPoints"]

    if (option === 0) {
        lockId = 0
        chainId = 137
        multiplier = 1
        multipliedAirdropPoints = airdrop_points
    } else {
        if(!airdrop_data[address].hasOwnProperty("stakingReward")) return {statusCode: 400, body: "Error: option > 0, but address has no locks"}
        
        try { userLocks = await getUserLocks(address) }
        catch (e) {
            console.error(e)
            return {statusCode: 400, body: "Error downloading from xs-lock-cache S3 bucket"}
        }

        if(option > userLocks.length) return {statusCode: 400, body: "Error: option > # of locks"}

        lockId = userLocks[option - 1].xslockID
        chainId = userLocks[option - 1].chainId
        multiplier = userLocks[option - 1].multiplier
        multipliedAirdropPoints = multiplier * airdrop_points
    }

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName : tableName,
        Item: { 
            ethAddress: address, 
            option: option,
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
            body: `Successfully inserted entry - ${JSON.stringify(params.Item)}`
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
