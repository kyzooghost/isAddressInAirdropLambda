const ethers = require("ethers")
const { isAddress } = ethers.utils
const AWS = require( 'aws-sdk' )
const s3 = new AWS.S3();

const bucketName = process.env.BUCKET;
const bucketKey = process.env.BUCKET_KEY;

exports.getXSLocksHandler = async (event) => {
    console.info('received:', event);

    if (!event.httpMethod) return {statusCode: 400, body: "No httpMethod property on event object"}
    if (event.httpMethod !== 'GET') return {statusCode: 400, body: `isAddressInAirdropHandler only accept GET method, you tried: ${event.httpMethod}`}
    if (!event.path) return {statusCode: 400, body: "No path property on event object"}
    if (!event.pathParameters) return {statusCode: 400, body: "No pathParameters property on event object"}
    if (!event.pathParameters.address) return {statusCode: 400, body: "No address parameter found"}
    
    const address = event.pathParameters.address;
    if (!isAddress(address)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}

    let xsLockerData;

    try {
        const resp = await s3.getObject({
            Bucket: bucketName,
            Key: bucketKey,
        })
        .promise()

        console.info("S3 DOWNLOAD SUCCESS")
        console.info(resp)

        xsLockerData = JSON.parse( resp.Body.toString() )
    } catch (e) {
        console.error(e)
        return {statusCode: 400, body: "Error downloading from S3 bucket"}
    }   

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

    const userLocks = []; 

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

    return {
        statusCode: 200,
        body: JSON.stringify(userLocks)
    }
}