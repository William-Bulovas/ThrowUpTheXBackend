import { Cors, LambdaRestApi } from '@aws-cdk/aws-apigateway';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { AssetCode, Function, Runtime } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';

export class ThrowUpTheXBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'throwUpTheXTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: 'ThrowUpTheXTable'
    });

    table.addGlobalSecondaryIndex({
      indexName: 'gsi',
      partitionKey: {
        name: 'gsiIndex',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'gsiSort',
        type: AttributeType.STRING
      }
    });

    const dataGathererFunction = new Function(this, 'dataGathererFunction', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: new AssetCode('src'),
      timeout: Duration.minutes(10)
    });

    table.grantReadWriteData(dataGathererFunction);

    const backEndFunction = new Function(this, 'backendFunction', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'backendIndex.handler',
      code: new AssetCode('src')
    });

    table.grantReadWriteData(backEndFunction);

    new LambdaRestApi(this, 'backendApi', {
      handler: backEndFunction,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_METHODS
      }
    });
  }
}
