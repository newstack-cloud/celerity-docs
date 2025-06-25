---
sidebar_position: 1
---

# Introduction

Celerity applications are made up of a set of resource types that can be defined in a [blueprint](https://bluelink.dev/docs/blueprint/intro) along with handler source code. A blueprint defines the components of the application and its infrastructure dependencies.

Compute resources make up the compute components of your application that can run on FaaS[^1] platforms, containerised environments, or other compute platforms without any changes to your application source code[^2].

Infrastructure resources allow you to define common components such as queues, databases and VPCs that an application depends on.

There are 5 main compute resource types for a Celerity application including [`celerity/api`](/docs/applications/resources/celerity-api), [`celerity/consumer`](/docs/applications/resources/celerity-consumer)[^3], [`celerity/schedule`](/docs/applications/resources/celerity-schedule), [`celerity/workflow`](/docs/applications/resources/celerity-workflow) and [`celerity/handler`](/docs/applications/resources/celerity-handler).

There are 7 main infrastructure resource types including [`celerity/vpc`](/docs/applications/resources/celerity-vpc), [`celerity/sqlDatabase`](/docs/applications/resources/celerity-sql-database), [`celerity/datastore`](/docs/applications/resources/celerity-datastore), [`celerity/cache`](/docs/applications/resources/celerity-cache), [`celerity/topic`](/docs/applications/resources/celerity-topic), [`celerity/queue`](/docs/applications/resources/celerity-queue) and [`celerity/bucket`](/docs/applications/resources/celerity-bucket).

In addition to these, there are also convenience resource types for shared handler configuration ([`celerity/handlerConfig`](/docs/applications/resources/celerity-handler-config)) and application secrets and configuration ([`celerity/config`](/docs/applications/resources/celerity-config)).
Each of these resource types are versioned over time, the implementation of these resource types are spread across the Celerity runtime and deploy engine.
The runtime and deploy engine projects will indicate which resource versions are supported for a given version of the software.

The `celerity/api`, `celerity/consumer` and `celerity/schedule` resource types can be composed together to make up a single application.
Depending on the target environment, the Celerity deploy engine will ensure the necessary infrastructure is provisioned to support each of these resource types in a single deployable unit.

:::note
Blueprints are not exclusive to Celerity resources.
The blueprint specification and core framework implementation are designed to be generic and can be used to describe any kind of resources, not just Celerity resources.
You can even use the Blueprint framework as a part of a more general purpose deployment system for known cloud providers or any kind of resources that can be managed with an API.
:::

:::tip
As you navigate through the Celerity resource types, you may notice the lack of a `tags` field in the resource specs.

Don't worry, this is intentional and Celerity very much has grouping and organising cloud provider resources in mind.

For all Celerity application resource types, the contents of `metadata.labels` will be saved as tags in the target cloud provider for the concrete resources that support tags.
In addition, Celerity-specific tags will be added to all resources that are created by the Celerity Deploy Engine to help you identify resources that are part of a Celerity deployment.
:::

[^1]: Function-as-a-Service such as AWS Lambda, Google Cloud Functions, and Azure Functions.
[^2]: Minimal configuration changes that feed into the Celerity Build process are required. Changes to your source code may be required if you are switching cloud providers and your application talks to vendor-specific services, such as AWS S3, Google Cloud Storage, or Azure Blob Storage.
[^3]: Depending on the target deployment environment, `celerity/consumer` can be a composite of application config and infrastructure resources such as queues that subscribe to topics. [Read more about consumers](/docs/applications/resources/celerity-consumer).