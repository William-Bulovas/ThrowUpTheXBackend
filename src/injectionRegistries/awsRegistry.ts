import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { registry } from "tsyringe";

@registry([
    { token: DocumentClient, useFactory: () => 
        new DocumentClient()
    }
])
export class AWSRegistry {}