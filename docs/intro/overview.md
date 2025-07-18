---
sidebar_position: 2
---

# Celerity Overview

## Introduction

Celerity is a framework for building backend applications focused around simple building blocks.
It aims to provide a way to rapidly build portable systems without sacrificing quality.

Celerity provides a unified approach to building, testing and deploying applications that can run in multiple cloud providers and on-premise environments[^1].

Building applications with Celerity is a serverless-like experience, without being constrained to a vendor's serverless platform.
Celerity applications can be deployed as both serverless[^2] and traditional applications[^3].

## Pain points that Celerity addresses

### Cloud complexity & vendor lock-in

- **Pain point**: Cloud-native applications are complex to architect, build and maintain, with each cloud provider having its own approach to stitching together compute, storage, messaging and networking. Once you pick a cloud provider and architecture, it is expensive and time-consuming to switch when requirements change or a provider fails to meet your SLAs.
- **Solution**: Celerity provides high-level, industry-recognised building blocks you can use to build your systems. Celerity deals with the complexity of the cloud provider's services and integration patterns, allowing you to focus on designing and building your applications. Celerity takes care of applying industry best-practises when it comes to networking and cloud security, while you just connect the building blocks together. With Celerity, you can build your systems in a vendor-agnostic way; with the help of additional tooling[^4] you can migrate your systems between providers for a fraction of the cost of solutions that are locked in to a specific provider.

### Production readiness & developer productivity

- **Pain point**: Building production-ready backend systems is complex and time-consuming. A lot of trade-offs are often made to meet deadlines and budgets where an optimised development workflow is often de-prioritised. Even when substantial internal tooling is built for an optimal developer workflow, it is often a large maintenance burden with its own issues and complexity that can slow down development.
- **Solution**: Celerity provides an optimised development environment that can run locally or in the cloud that provides tooling for testing and running your applications focused on providing fast feedback loops. When it comes to production-readiness, Celerity makes sure that your applications are instrumented with built-in observability and telemetry to integrate with your monitoring tools out-of-the-box. When you choose to deploy your applications to a containerised environment, Celerity runs your application in a runtime that is built to be performant and fault-tolerant.

## Application building blocks

Celerity provides a set of building blocks (often referred to as "primitives") that can be used to build backend applications. These building blocks are derived from common patterns and practices in the industry when designing and building backend systems.

### API

The API building block ([`celerity/api`](/docs/applications/resources/celerity-api)) is used to define a HTTP or WebSocket API that exposes functionality of your application to frontends and other systems. This comes with support for authentication and CORS out of the box. Celerity WebSocket APIs come with built-in resilience and a client SDK to make interacting with them as smooth as possible; the built-in support for authentication and CORS extends to WebSocket APIs.

[Read more about Celerity APIs](/docs/applications/resources/celerity-api).

### Workflow

The workflow building block ([`celerity/workflow`](/docs/applications/resources/celerity-workflow)) is used to define a workflow that orchestrates the execution of multiple handlers in a blueprint as a series of steps. Workflows can be deployed to different target environments. Serverless environments will use the cloud provider's workflow service, such as AWS Step Functions, Google Cloud Workflows, or Azure Logic Apps. Containerised and custom server environments will use the Celerity workflow runtime to execute the workflow steps.

[Read more about Celerity Workflows](/docs/applications/resources/celerity-workflow).

### Handler

The handler building block ([`celerity/handler`](/docs/applications/resources/celerity-handler)) is used to define a function that can be used to handle events from a variety of sources. This includes HTTP requests, WebSocket messages, and events from a variety of sources such as scheduled events, databases, queues and topics.

[Read more about Celerity Handlers](/docs/applications/resources/celerity-handler).

### Config/Secret Store

The config/secret store building block ([`celerity/config`](/docs/applications/resources/celerity-config)) is used to define a config/secret store that can be used to store configuration and secrets for your application. This includes support for multiple providers such as AWS SSM, AWS Secrets Manager, Azure Key Vault and GCP Secret Manager.

[Read more about Celerity Config/Secret Stores](/docs/applications/resources/celerity-config).

### SQL Database

The SQL database building block ([`celerity/sql-database`](/docs/applications/resources/celerity-sql-database)) is used to define a SQL database that can be used to store structured data. This includes support for multiple providers such as AWS RDS, Azure SQL Database and GCP Cloud SQL.

[Read more about Celerity SQL Databases](/docs/applications/resources/celerity-sql-database).

### NoSQL Database

The NoSQL database building block ([`celerity/datastore`](/docs/applications/resources/celerity-datastore)) is used to define a NoSQL database that can be used to store unstructured data. This includes support for multiple providers such as AWS DynamoDB, Azure Cosmos DB and GCP Datastore.

[Read more about Celerity NoSQL Databases](/docs/applications/resources/celerity-datastore).

### Queue

The queue building block ([`celerity/queue`](/docs/applications/resources/celerity-queue)) is used to define a queue that can be used as a persistent message queue that is used to deliver messages to your application for processing. This includes support for multiple providers such as AWS SQS, Azure Service Bus, GCP Pub/Sub and Google Cloud Tasks.

[Read more about Celerity Queues](/docs/applications/resources/celerity-queue).

### Topic

The topic building block ([`celerity/topic`](/docs/applications/resources/celerity-topic)) is used to define a topic that can be used as a way to decouple applications and allow for asynchronous communication between them with a pattern such as [publish/subscribe](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern). This includes support for multiple providers such as AWS SNS, Azure Service Bus and GCP Pub/Sub.

[Read more about Celerity Topics](/docs/applications/resources/celerity-topic).

### Consumer

The consumer building block ([`celerity/consumer`](/docs/applications/resources/celerity-consumer)) is used to define a consumer (or subscriber) that can be used to consume messages from a queue, topic or other event source.
A consumer is usually made up of an application component, and in some cases, intermediary infrastructure such as a queue that can subscribe to a topic.
This includes support for consuming messages from sources such as AWS SQS, Azure Service Bus, GCP Pub/Sub and Google Cloud Tasks.

[Read more about Celerity Consumers](/docs/applications/resources/celerity-consumer).

### Schedule

The schedule building block ([`celerity/schedule`](/docs/applications/resources/celerity-schedule)) is used to define a schedule that can be used to trigger a handler at a specified time. This includes support for multiple providers such as AWS EventBridge, Azure Scheduler and GCP Cloud Scheduler.

[Read more about Celerity Schedules](/docs/applications/resources/celerity-schedule).

### Cache

The cache building block ([`celerity/cache`](/docs/applications/resources/celerity-cache)) is used to define a cache that can be used to store data for fast access in a scalable and reliable way. This includes support for multiple providers such as AWS ElastiCache, Azure Cache for Redis and GCP Memorystore.

[Read more about Celerity Caches](/docs/applications/resources/celerity-cache).

### Bucket

The bucket building block ([`celerity/bucket`](/docs/applications/resources/celerity-bucket)) is used to define a bucket that can be used to store files for your application. This includes support for multiple providers such as AWS S3, Azure Blob Storage and GCP Cloud Storage.

[Read more about Celerity Buckets](/docs/applications/resources/celerity-bucket).

### VPC

The VPC building block ([`celerity/vpc`](/docs/applications/resources/celerity-vpc)) is used to define a VPC that can be used to create a virtual network for your application. This includes support for multiple providers such as AWS VPC, Azure Virtual Network and GCP VPC.

[Read more about Celerity VPCs](/docs/applications/resources/celerity-vpc).

## The Celerity toolkit

Celerity consists of multiple tools for development, testing and deployment that all work together to provide a seamless experience.

### Celerity CLI

The Celerity CLI is a delightful command-line tool to manage your Celerity applications. It provides a set of interactive commands to help create, test and deploy your applications.

[Read more about the Celerity CLI](/cli/docs/intro).

### Celerity::1

Celerity::1 is a tool that is used when running and testing Celerity applications in local or cloud development environments. Celerity::1 uses open source software to power the infrastructure primitives such as databases, queues and caches.

[Read more about Celerity::1](/celerity-one/docs/intro).

### Celerity Runtimes

The Celerity runtimes allow you to run your Celerity applications in containers or on VMs. The runtimes are built to be performant, are instrumented for production-grade observability and take care of loading all the configuration needed to connect to the infrastructure defined for your application.

The core runtime acts as a host for your handlers that will deal with setting up the appropriate application type such as a HTTP API, WebSocket API, scheduled job, queue consumer, etc.

The [Workflow runtime](/workflow-runtime/docs/intro) provides a way to run your `celerity/workflow` applications in a container or on a VM and is the best way to leverage the full capabilities of a [Celerity Workflow application](/docs/applications/resources/celerity-workflow).

[Read more about Celerity Runtimes](/docs/runtime/intro).

### Celerity SDKs

The Celerity SDKs are a set of libraries for all the languages that Celerity supports to help you build your applications.

The SDKs allow you to build your application handlers in a way that is idiomatic to your language of choice and provide a convenient way to interact with your application's infrastructure dependencies such as queues, databases and storage buckets.

:::warning
With databases, the SDKs will provide ways to run simple queries and CRUD operations against the database. Generally, it's better to use tried and tested SQL libraries, specific database clients or ORMs if you prefer where the Celerity SDKs are used to source connection details.
:::

Celerity provides SDKs for the following languages:

- [Node.js (TypeScript)](/node-runtime/docs/intro)
- [Python](/python-runtime/docs/intro)
- [Go](/go-sdk/docs/intro)
- [C#/.NET](/csharp-runtime/docs/intro)
- [Java](/java-runtime/docs/intro)

### Bluelink

[Bluelink](https://www.bluelink.dev) is an infrastructure management tool that is used to deploy and manage the infrastructure for your Celerity applications. It provides the [configuration format for blueprints](https://www.bluelink.dev/docs/blueprint/specification) that are used to define the components of your application. Bluelink has a unique approach that extends the concept of [infrastructure as code](https://en.wikipedia.org/wiki/Infrastructure_as_code) to a concept that can be referred to as "infrastructure as relationships" that enables you to focus on the important infrastructure components and connect them together without having to define networking, permissions and other "glue" elements.

Bluelink's blueprint language server is installed with Celerity to provide a rich experience when editing Celerity application blueprints, providing features such as auto-completion, validation and documentation.

[Read more about Bluelink](https://www.bluelink.dev/docs/overview).

## Why not just use containers for portability?

You may be wondering, portable software is a solved problem, why not just use containers?

Well, this is partially true, but here's why we think the Celerity approach provides so much more value:

1. Celerity aims to leverage as much as possible in terms of what serverless platforms have to offer; often, the approach to portability is to run traditional applications in containers on a function-as-a-service platforms which misses out on all the benefits of the first-class integrations with event sources and API gateways that serverless platforms provide.
2. Celerity provides a fully integrated approach that allows you to define and manage [application building blocks](#application-building-blocks) that allows for portable infrastructure[^5] in addition to the portability of your application code.

[^1]: Currently, Celerity only supports AWS, Azure, GCP and local environments, but the goal is to support on-premise environments in the future.
[^2]: Serverless applications in this context refers to Function-as-a-Service (FaaS) platforms (Such as AWS Lambda) that integrate with event sources and API gateways.
[^3]: Traditional applications in this context refers to those that are deployed as containers with a container orchestration service or virtual machines. An example of a container orchestratoin service would be a managed Kubernetes service such as Amazon EKS.
[^4]: Additional tooling refers to third-party tools ore commercial services that help with the migration of infrastructure such as databases between cloud providers.
[^5]: Portable infrastructure will often require migration tools when switching between cloud providers, Celerity may provide these migration tools in the future, or they may be provided by commercial services centered around Celerity.