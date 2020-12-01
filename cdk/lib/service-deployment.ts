import * as cdk from '@aws-cdk/core';
import { ServiceStack } from './service';

export class ServiceDeploymentStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ServiceStack(this, 'ReInventDemoService');
  }
}
