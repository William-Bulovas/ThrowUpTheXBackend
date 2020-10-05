import { createServer, proxy } from 'aws-serverless-express';
import app from './backendApp';

const binaryMimeTypes = [
    'application/javascript',
    'application/json',
    'application/octet-stream',
    'application/xml',
    'font/eot',
    'font/opentype',
    'font/otf',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'text/comma-separated-values',
    'text/css',
    'text/html',
    'text/javascript',
    'text/plain',
    'text/text',
    'text/xml'
  ]

const server = createServer(app, undefined, binaryMimeTypes);

export const handler = (event: any, context: any) => proxy(server, event, context);
