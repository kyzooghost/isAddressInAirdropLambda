const fs = require("fs")
const ethers = require("ethers")
const { isAddress } = ethers.utils

exports.isAddressInAirdropHandler = async (event) => {
    console.info('received:', event);

    if (!event.httpMethod) return {statusCode: 400, body: "No httpMethod property on event object"}
    if (event.httpMethod !== 'GET') return {statusCode: 400, body: `isAddressInAirdropHandler only accept GET method, you tried: ${event.httpMethod}`}
    if (!event.path) return {statusCode: 400, body: "No path property on event object"}
    if (!event.pathParameters) return {statusCode: 400, body: "No pathParameters property on event object"}
    if (!event.pathParameters.address) return {statusCode: 400, body: "No address parameter found"}
    
    const address = event.pathParameters.address;
    if (!isAddress(address)) return {statusCode: 400, body: "Did not provide a valid Ethereum address"}

    const airdrop_data_path = __dirname + "/airdrop_data.json"
    let airdrop_data; 

    try {
        airdrop_data = JSON.parse( fs.readFileSync(airdrop_data_path).toString() )
        
        response = {
            statusCode: 200,
            body: JSON.stringify(airdrop_data[address])
        }

        // All log statements are written to CloudWatch
        console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
        return response;
    } catch {
        return {statusCode: 400, body: "No airdrop_data.json in same directory as isAddressInAirdropHandler"}
    }
}
