// GET request providing 'address' parameter

/*
    Return

    {
        airdrop_points: number
        xsLocks: {
            chainId: number,
            lockId: number,
            amount, BigNumber,
            end: BigNumber,
        }[]
        lockdrop_choice: {
            chainId: number,
            lockId: number,
            multiplier: number,
            multipliedAirdropPoints: number
        }
    }

*/

const fs = require("fs")
const ethers = require("ethers")
const { isAddress } = ethers.utils
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const { getUserLocks } = require("./utils/getUserLocks")
const tableName = process.env.TABLE;

exports.getLockdropDataHandler = async (event) => {
    console.info('received:', event);

    if (!event.httpMethod) return {statusCode: 400, body: "No httpMethod property on event object"}
    if (event.httpMethod !== 'GET') return {statusCode: 400, body: `isAddressInAirdropHandler only accept GET method, you tried: ${event.httpMethod}`}
    if (!event.path) return {statusCode: 400, body: "No path property on event object"}
    if (!event.pathParameters) return {statusCode: 400, body: "No pathParameters property on event object"}
    if (!event.pathParameters.address) return {statusCode: 400, body: "No address parameter found"}
    const address = event.pathParameters.address;
    if (!isAddress(address)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}
    const airdrop_data_path = __dirname + "/data/airdrop_data.json"
    if (!fs.existsSync (airdrop_data_path)) {return {statusCode: 400, body: `No airdrop_data.json in ${airdrop_data_path}`}}

    let airdrop_points = 0;
    let userLocks = []; 
    let lockdrop_choice = [];

    let airdrop_data = JSON.parse( fs.readFileSync(airdrop_data_path).toString() );

    if (airdrop_data.hasOwnProperty(address)) {
        airdrop_points = airdrop_points = airdrop_data[address]["airdropPoints"]

        // If address has locks, get xsLock data
        // if (airdrop_data[address].hasOwnProperty("stakingReward")) {
            // try { userLocks = await getUserLocks(address) }
            // catch (e) {
            //     console.error(e)
            //     return {statusCode: 400, body: "Error downloading from xs-lock-cache S3 bucket"}
            // }
        // }

        // Remove surrounding if-block, edge case of user without lock
        // in snapshot, and then creating a new lock
        try { userLocks = await getUserLocks(address) }
        catch (e) {
            console.error(e)
            console.error("Error downloading from xs-lock-cache S3 bucket, item not present?")
        }

        // Get previous lock choices
        const tableParams = {
            TableName : tableName,
            Key: { ethAddress: address }
        };

        try {
            const data = await docClient.get(tableParams).promise();
            const item = data.Item;
            console.info("Successful DynamoDB read")

            if(item) {
                const {option, chainId, multipliedAirdropPoints, lockId, multiplier} = item

                lockdrop_choice.push({
                    option: option,
                    chainId: chainId,
                    lockId: lockId, 
                    multiplier: multiplier,
                    multipliedAirdropPoints: multipliedAirdropPoints, 
                })
            }
        } catch (e) {
            console.error(e)
            return {statusCode: 400, body: "Error getting entry from DynamoDB table - LockdropTable"}
        }
    }
    
    response = {
        statusCode: 200,
        body: JSON.stringify({
            airdrop_points: airdrop_points,
            xsLocks: userLocks,
            lockdrop_choice: lockdrop_choice
        })
    }

    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response
}