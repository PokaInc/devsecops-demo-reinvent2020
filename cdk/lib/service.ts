import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as kms from '@aws-cdk/aws-kms';
import * as s3 from '@aws-cdk/aws-s3';


export class ServiceStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc');

    const albFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster: new ecs.Cluster(this, 'Cluster', {
        clusterName: 'devsecops-demo-reinvent2020',
        vpc: vpc,
        containerInsights: true,
      }),
      cpu: 256,
      memoryLimitMiB: 512,
      taskImageOptions: {
        containerName: 'webapp',
        image: ecs.ContainerImage.fromEcrRepository(
          ecr.Repository.fromRepositoryName(this, 'Repository', 'demo-reinvent2020/webapp'),
          process.env.CODEBUILD_RESOLVED_SOURCE_VERSION || 'latest',
        )
      },
      publicLoadBalancer: true,
    })


    const encryptionKey = new kms.Key(this, 'Key', {
      enableKeyRotation: true,
    });

    const bucket = new s3.Bucket(this, 'Bucket', {
      encryptionKey: encryptionKey,
      blockPublicAccess: {
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
      },
      versioned: true,
    });
    
    bucket.grantRead(albFargateService.taskDefinition.taskRole);
    encryptionKey.grantDecrypt(albFargateService.taskDefinition.taskRole);

  }
}
