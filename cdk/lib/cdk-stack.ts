import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import path from 'node:path';

export interface CdkStackProps extends cdk.StackProps {
  allowedIps?: string[];
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);

    const allowedIps = props?.allowedIps || [];

    // Lambda function with Docker image
    const webFunction = new lambda.DockerImageFunction(this, 'NextMastraFunction', {
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../webapp')),
      memorySize: 2048,
      timeout: cdk.Duration.minutes(15),
      architecture: lambda.Architecture.ARM_64,
      environment: {
        PORT: '8080',
        AWS_LWA_INVOKE_MODE: 'response_stream',
        AWS_LWA_ENABLE_COMPRESSION: 'true',
      },
    });

    // Lambda Function URL with IAM auth (required for OAC)
    const functionUrl = webFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
    });

    // CloudFront Function for IP allowlist
    const ipAllowlistFunction = new cloudfront.Function(this, 'IpAllowlistFunction', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var clientIp = event.viewer.ip;
  var allowedIps = ${JSON.stringify(allowedIps)};

  if (allowedIps.length > 0 && !allowedIps.some(function(ip) {
    if (ip.indexOf('/') > -1) {
      // CIDR notation handling (simplified)
      var ipPrefix = ip.split('/')[0];
      return clientIp.indexOf(ipPrefix.substring(0, ipPrefix.lastIndexOf('.'))) === 0;
    }
    return clientIp === ip;
  })) {
    return {
      statusCode: 403,
      statusDescription: 'Forbidden',
      headers: {
        'content-type': { value: 'text/plain' }
      },
      body: 'Access denied'
    };
  }

  return request;
}
      `),
    });

    // CloudFront Distribution with OAC
    const distribution = new cloudfront.Distribution(this, 'NextMastraDistribution', {
      defaultBehavior: {
        origin: origins.FunctionUrlOrigin.withOriginAccessControl(functionUrl),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: allowedIps.length > 0 ? [{
          function: ipAllowlistFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }] : undefined,
      },
      comment: 'Next.js Mastra App Distribution',
    });

    // Grant CloudFront permission to invoke Lambda Function URL
    webFunction.addPermission('AllowCloudFrontServicePrincipal', {
      principal: new iam.ServicePrincipal('cloudfront.amazonaws.com'),
      action: 'lambda:InvokeFunctionUrl',
    });

    // Outputs
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL (protected by IAM)',
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });
  }
}
