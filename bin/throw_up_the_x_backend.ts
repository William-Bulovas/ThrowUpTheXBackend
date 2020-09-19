#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ThrowUpTheXBackendStack } from '../lib/throw_up_the_x_backend-stack';

const app = new cdk.App();
new ThrowUpTheXBackendStack(app, 'ThrowUpTheXBackendStack');
