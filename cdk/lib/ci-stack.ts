import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';

export class CiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubSource = codebuild.Source.gitHub({
      owner: 'PokaInc',
      repo: 'devsecops-demo-reinvent2020',
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PULL_REQUEST_CREATED),
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PULL_REQUEST_UPDATED),
      ], 
    });

    new codebuild.Project(this, 'ApplicationComplianceCheck', {
      source: githubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('webapp/ci-buildspec.yml')
    });

    new codebuild.Project(this, 'InfrastructureComplianceCheck', {
      source: githubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('cdk/ci-buildspec.yml')
    });
    
  }
}
