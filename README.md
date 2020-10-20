# Throw up the X Backend 

This project contains the CDK + backend code for the Throw up the X Fantasy Football Viewer

## About

This project uses AWS API Gateway + AWS Lambda for the backend infrastruture.

The data is stored in dynamo and is retrieved by calling the Yahoo APIs

The CDK contains the infrastructure for the Frontend Website which is a static website hosted on an S3 bucket with AWS Cloudfront
