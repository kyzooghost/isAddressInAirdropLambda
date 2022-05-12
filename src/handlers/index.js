const fs = require("fs")
const ethers = require("ethers")
const { isAddress } = ethers.utils

exports.airdropAddressHandler = async (event) => {
    // Input validation
    if (!event) return {statusCode: 400, body: "No event object"}
    if (!event.queryStringParameters) return {statusCode: 400, body: "No queryStringParameters property on event object"}
    if (!event.queryStringParameters.address) return {statusCode: 400, body: "No Address parameter found"}
    const address = event.queryStringParameters.address
    if (!isAddress(address)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}

    const airdrop_data_path = __dirname + "/airdrop_data.json"
    const airdrop_data = JSON.parse( fs.readFileSync(airdrop_data_path).toString() )

    // All log statements are written to CloudWatch
    console.info(airdrop_data[address])    

    return airdrop_data[address];
}
