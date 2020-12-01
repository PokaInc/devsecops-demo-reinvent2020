#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdStack } from '../lib/cd-stack';
import { CiStack } from '../lib/ci-stack';

const app = new cdk.App();
new CiStack(app, 'ReInventDemoCiStack');
new CdStack(app, 'ReInventDemoCdStack');
