---
sidebar_position: 2
---

# Architectures

Celerity supports a range of architectures for building multi-cloud applications that can run in multiple environments[^1].

This includes applications that provide HTTP APIs, WebSocket APIs, pub/sub message handling, queue message handling, workflows, scheduled event triggers and responding to cloud service events.

You can also define core infrastructure resources including databases, storage, queues, pub/sub, secret/configuration stores and network resources for your application.

## HTTP APIs

## WebSocket APIs

## Events - Pub/Sub & Queues

Pub/Sub and Queue events are messages that can be polled from a message broker or queue service that has been created outside of a blueprint.

External Pub/Sub and Queue triggers are configured as a part of the `celerity/consumer` resource type.

### Multiple Consumers in Celerity Runtime (External Sources)

Multiple `celerity/consumer` resources can be defined in a single blueprint to handle messages from different sources that are created outside of a blueprint. To group multiple consumers into the same application you can use the `celerity.app` label to group them together in the same application. This is especially useful when deploying to a containerised or custom server environment as it allows you to deploy multiple consumers as a part of a single deployed application; in this scenario, a consumer polling loop for each message source will run in separate tasks across multiple threads.

:::warning
You should limit the amount of consumers defined in a single blueprint to avoid overloading the runtime with too many polling loops. If you need to handle a large number of message sources, consider breaking them up into separate applications.
:::

An example of multiple consumers in a single application:

```yaml
version: 2025-05-12
transform: celerity-2026-02-28
variables:
    ordersQueue:
        type: string
    paymentEventsQueue:
        type: string
resources:
    ordersConsumer:
        type: "celerity/consumer"
        metadata:
            displayName: Orders Consumer
            annotations:
                celerity.app: "payments"
        linkSelector:
            byLabel:
                consumerGroup: "orders"
        spec:
            sourceId: "${variables.ordersQueue}"
            batchSize: 10
            visibilityTimeout: 30
            waitTimeSeconds: 20
            partialFailures: true

    paymentEventsConsumer:
        type: "celerity/consumer"
        metadata:
            displayName: Payment Events Consumer
            annotations:
                celerity.app: "payments"
        linkSelector:
            byLabel:
                consumerGroup: "paymentEvents"
        spec:
            sourceId: "${variables.paymentEventsQueue}"
            batchSize: 10
            visibilityTimeout: 30
            waitTimeSeconds: 20
            partialFailures: true
```

## Events - Schedule

Scheduled events are events that are generated by a scheduler such as a cron job or a cloud service that provides scheduled event triggers.

Scheduled triggers are configured as a part of the `celerity/schedule` resource type.
`celerity/handler` resources can then be linked to the schedule resource to handle the scheduled events.

When a Celerity application is deployed to FaaS[^2] environments, the scheduled triggers are configured as you would expect for the specific cloud provider. (e.g. AWS EventBridge, Google Cloud Scheduler and Azure Event Grid)

When a Celerity application is deployed to containerised environments, the Celerity runtime hooks up scheduled triggers to a queue or message broker that is then polled by the runtime.

### Multiple Schedules in Celerity Runtime

Multiple `celerity/schedule` resources can be defined in a single blueprint to run different tasks on different schedules. When deployed to a containerised or custom server environment, each schedule trigger (From a cloud scheduler) will be hooked up to send trigger messages to a single queue that is polled by the runtime.
For this reason, all schedules in a single blueprint will be combined into a single deployed application.


## Events - Cloud Service Events

Cloud service events are events that are generated by cloud services such as object storage, databases, and other services. These events can be used to trigger handlers in your application.

These events are configured as part of the `celerity/handler` resource type directly and do not require a separate resource type (e.g. `celerity/consumer` for queue message handling).

When a Celerity application is deployed to FaaS[^2] environments, the event triggers are configured as you would expect for the specific cloud provider.

When a Celerity application is deployed to containerised environments, the Celerity runtime hooks up Cloud Service event triggers to a queue or message broker that is then polled by the runtime. For a subset of supported stream services[^3], the runtime will act as a direct consumer of the stream.

## Workflows

## Combining Architectures

When defining multiple application resource types in a single blueprint, by default, they will be combined into a single application. In target environments that deploy containerised applications, these will be combined into a single application and combine infrastructure and configuration laid out in the "Target Environments" section of each resource type.

Application resource types that can be combined are `celerity/api`, `celerity/consumer` and `celerity/schedule`. Application resource types are also derived from links between infrastructure resources and handlers; for example, a `celerity/bucket` resource linked to a `celerity/handler` resource will in practise produce an application that listens for events from the bucket and triggers the handler.

Depending on the target environment, event-driven and API applications may have to be deployed to
separate applications.
For example, in Azure Container Apps, event-driven applications are deployed as [Jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli), while API applications are deployed as [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview) to fully utilise the Azure Container Apps platform.

:::warning About Workflow resource types
The `celerity/workflow` resource type can **not** be combined with other application resource types.
A workflow will always be deployed separately.
:::

## Infrastructure Components

### Secret & Configuration Stores

### SQL Databases

### Data Stores (NoSQL)

### Caches

### Pub/Sub

### Queues

### Networking

## About "Serverless" Environments

The term "Serverless" is used frequently in describing the behaviour of target environments.
In the context of Celerity deployments, "Serverless" refers to environments using FaaS[^2] platforms and the components that integrate with them.

In normal circumstances, a lot of the containerised environments such as ECS or EKS backed by Fargate, Azure Container Apps and Google Cloud Run are also considered "Serverless" in that they remove the need to manage the VMs used to run the containers. _This is **not** what is meant by "Serverless" in the context of Celerity deployments._

[^1]: Environments in this context covers Function-as-a-service offerings such as AWS Lambda, Google Cloud Functions, and Azure Functions, as well as containerised environments such as Kubernetes, Docker, and the container orchestration platforms that use these technologies such as Amazon ECS, Google Kubernetes Engine, and Azure Kubernetes Service.
[^2]: Function-as-a-Service such as AWS Lambda, Google Cloud Functions, and Azure Functions.
[^3]: Supported stream services include Amazon Kinesis and Azure Event Hubs.
