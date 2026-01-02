#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

// Get allowed IPs from context or environment variable
const allowedIpsString = process.env.ALLOWED_IPS ?? '';
const allowedIps = allowedIpsString ? allowedIpsString.split(',').map((ip: string) => ip.trim()) : [];

new CdkStack(app, 'NextMastraStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-west-2',
  },
  allowedIps,
  description: 'Next.js Mastra App with CloudFront, Lambda Web Adapter, and OAC',
});
