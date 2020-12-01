import * as cdk from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as ecr from '@aws-cdk/aws-ecr'
import * as iam from '@aws-cdk/aws-iam';

import { ServiceDeploymentStage } from './service-deployment';

export class CdStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const sourceArtifact = new codepipeline.Artifact();
        const outputArtifact = new codepipeline.Artifact();

        const pipeline = new pipelines.CdkPipeline(this, 'CdPipeline', {
            cloudAssemblyArtifact: outputArtifact,

            sourceAction: new codepipeline_actions.GitHubSourceAction({
                actionName: 'DownloadSources',
                owner: 'PokaInc',
                repo: 'devsecops-demo-reinvent2020',
                oauthToken: cdk.SecretValue.secretsManager('github/token'),
                output: sourceArtifact,
                branch: 'main'
            }),

            synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
                sourceArtifact: sourceArtifact,
                cloudAssemblyArtifact: outputArtifact,
                subdirectory: 'cdk',
            }),
        });

        const repository = new ecr.Repository(this, 'WebAppRepository', {
            repositoryName: 'demo-reinvent2020/webapp',
        });

        const buildRole = new iam.Role(this, 'DockerBuildRole', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        });
        repository.grantPullPush(buildRole);

        const buildStage = pipeline.addStage('AppBuild')
        buildStage.addActions(new codepipeline_actions.CodeBuildAction({
            actionName: 'DockerBuild',
            input: sourceArtifact,
            project: new codebuild.Project(this, 'DockerBuild', {
                role: buildRole,
                environment: {
                    buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
                    privileged: true,
                },
                buildSpec: this.getDockerBuildSpec(repository.repositoryUri)
            }),
        }));

        const prod = new ServiceDeploymentStage(this, 'Prod');
        pipeline.addApplicationStage(prod);
    }

    getDockerBuildSpec(repositoryUri: string): codebuild.BuildSpec {
        return codebuild.BuildSpec.fromObject({
            version: '0.2',
            phases: {
                pre_build: {
                    commands: [
                        'cd webapp',
                        'echo Logging in to Amazon ECR...',
                        '$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)',
                    ]
                },
                build: {
                    commands: [
                        'echo Build started on `date`',
                        'echo Building the Docker image...',
                        `docker build -t ${repositoryUri}:$CODEBUILD_RESOLVED_SOURCE_VERSION .`,
                    ]
                },
                post_build: {
                    commands: [
                        'echo Build completed on `date`',
                        'echo Pushing the Docker image...',
                        `docker push ${repositoryUri}:$CODEBUILD_RESOLVED_SOURCE_VERSION`,
                    ]
                },
            },
        });
    }
}
