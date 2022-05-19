// Intended as cronjob for every 3 minutes
// Gets xsLockers data from SOLACE API endpoint, store in S3 bucket as cache

const axios = require("axios")
const AWS = require( 'aws-sdk' )
const s3 = new AWS.S3();
const bucketName = process.env.BUCKET;
const bucketKey = process.env.BUCKET_KEY;

exports.refreshXSLockCacheHandler = async (event) => {
    console.info('received:', event);

    let xsLockerData;

    try {
        const response = await axios.get('https://stats-cache.solace.fi/analytics-stats.json')
        xsLockerData = response.data.xslocker
    } catch {
        console.error(e)
        return {statusCode: 400, body: "Error making HTTP GET request to https://stats-cache.solace.fi/analytics-stats.json"}
    }

    try {
        await s3.putObject({
            Bucket: bucketName,
            Key: bucketKey,
            Body: JSON.stringify(xsLockerData)
        })
        .promise()

        console.info("UPLOAD SUCCESS")
        return {statusCode: 200, body: "Successful upload to S3 bucket"}
    } catch (e) {
        console.error(e)
        return {statusCode: 400, body: "Error uploading to S3 bucket"}
    }
}