const AWS = require( 'aws-sdk' )
const s3 = new AWS.S3();
const bucketName = process.env.BUCKET;
const bucketKey = process.env.BUCKET_KEY;

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

module.exports = {getUserLocks}