const tableName = process.env.TABLE;
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

exports.getAllItemsHandler = async (event) => {
    // Log in CloudWatch for troubleshooting
    console.info('received:', event);

    if (!event.httpMethod) return {statusCode: 400, body: "No httpMethod property on event object"}
    if (event.httpMethod !== 'GET') return {statusCode: 400, body: `getAllItems only accept GET method, you tried: ${event.httpMethod}`}
    if (!event.path) return {statusCode: 400, body: "No path property on event object"}
    
    // get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
    const params = {
        TableName : tableName
    };

    let response;

    try {
        const data = await docClient.scan(params).promise();
        const items = data.Items;
        response = {
            statusCode: 200,
            body: JSON.stringify(items)
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
