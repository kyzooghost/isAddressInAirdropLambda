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
const AWS = require( 'aws-sdk' )
const s3 = new AWS.S3();
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

const bucketName = process.env.BUCKET;
const bucketKey = process.env.BUCKET_KEY;
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
    if (!fs.existsSync (airdrop_data_path)) {return {statusCode: 400, body: "No airdrop_data.json in same directory as isAddressInAirdropHandler"}}

    let airdrop_points = 0;
    let userLocks = []; 
    let lockdrop_choice = [];

    let airdrop_data = JSON.parse( fs.readFileSync(airdrop_data_path).toString() );

    if (airdrop_data.hasOwnProperty(address)) {
        airdrop_points = airdrop_points = airdrop_data[address]["airdropPoints"]

        // If address has locks, get xsLock data
        if (airdrop_data[address].hasOwnProperty("stakingReward")) {
            try { userLocks = await getUserLocks(address) }
            catch (e) {
                console.error(e)
                return {statusCode: 400, body: "Error downloading from xs-lock-cache S3 bucket"}
            }
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
            console.info(item)

            if(item) {
                const {chainId, multipliedAirdropPoints, lockId, multiplier} = item

                lockdrop_choice.push({
                    chainId: chainId,
                    multipliedAirdropPoints: multipliedAirdropPoints, 
                    lockId: lockId, 
                    multiplier: multiplier
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

async function getUserLocks(address) {
    let userLocks = [];

    const resp = await s3.getObject({
        Bucket: bucketName,
        Key: bucketKey,
    })
    .promise()
    
    console.info("S3 DOWNLOAD SUCCESS")
    console.info(`S3 response: ${resp}`)
    
    let xsLockerData = JSON.parse( resp.Body.toString() )
    
    // Iterate through returned object find locks for given address

    /*
        xsLockerData = {
            "1": [
                {
                    xslockID: ,
                    owner: ,
                    amount: ,
                },
                ...
            ],
            "137": ...
        }
    */

    const THRESHHOLD_TIME = 1655424000 // 00:00:00 GMT on 17 June 2022
    const SIX_MONTHS = 15778800
            
    for (const chainId in xsLockerData) {
        for (const lock of xsLockerData[chainId]) {
            const {xslockID, owner, amount, end} = lock
            if (address == owner) {
                let multiplier

                if (parseInt(end) <= THRESHHOLD_TIME) {
                    multiplier = 1
                } else {
                    const LOCK_TIME = parseInt(end) - THRESHHOLD_TIME
                    multiplier = 1 + ( LOCK_TIME / SIX_MONTHS ) // +1x multiplier, for every 6 months extra staked
                }

                userLocks.push({
                    chainId: chainId,
                    xslockID: xslockID,
                    amount: amount,
                    end: end,
                    multiplier: multiplier
                })
            }
        }
    }

    console.info(`For ${address} obtained: ${userLocks}`)
    return userLocks
}