---
sidebar_position: 3
---

# `celerity/consumer`

**v2026-02-28 (draft)**

**blueprint transform:** `celerity-2026-02-28`

The `celerity/consumer` resource type is used to define a subscriber to messages on a `celerity/topic`, events in a `celerity/datastore` or a `celerity/bucket`, messages from a `celerity/queue`, an externally defined queue or message broker.

A consumer can be deployed to different target environments such as a Serverless event-driven flow[^1], a containerised environment, or a custom server.
For containerised and custom server environments, the default mode is for the Celerity runtime provides a polling mechanism to check for new messages in a queue or message broker. There are some exceptions like the Google Cloud Run target environment where a push model is used to deliver messages to the consumer application.

In some target environments, infrastructure resources are created for a consumer. When `sourceId` is a Celerity topic, this will often be a queue that subscribes to the topic to implement a reliable and scalable fan-out approach. When a `celerity/datastore` or `celerity/bucket` is linked to a consumer, depending on the target environment, intermediary infrastructure resources may also be created to deliver events to the consumer application.
When the `sourceId` is an external queue or message broker, the consumer is configured to listen to the external queue or message broker.

:::note
Links between consumers and topics are not supported as part of a blueprint.
The reason for this is that pub/sub systems are designed to be decoupled applications and a blueprint in the context of Celerity is to define a single application.
A topic should be defined in blueprints for producer applications and a consumer should be defined in blueprints for consumer applications. The outputs of a topic can be used to configure a consumer. Multiple producers can publish to the same topic, different blueprints can define the same topic, read more about it in the [`celerity/topic` documentation](/docs/applications/resources/celerity-topic).
:::

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.
The rest of this section lists fields that are available to configure the `celerity/consumer` resource followed by examples of different configurations for the resource type, a section outlining the behaviour in supported target environments along with additional documentation.

### sourceId (conditionally required)

The source ID is a unique identifier for the topic, queue, message broker or other event source that the consumer will listen to for messages.
For example, this could be a Celerity topic ID, the URL of an Amazon SQS queue, a Google Cloud Pub/Sub topic, or a name of an Azure Service Bus Queue.
The type of source is based on the provided target environment at build/deploy time.

There are two cases where `sourceId` is not required. The first is when the consumer is linked from a `celerity/datastore`, `celerity/bucket` or `celerity/queue` resource type, in which case the `sourceId` will be derived from the linked resource. The second is when the `externalEvents` is set with a stream ID or storage bucket name, in which case the `sourceId` will be derived from the event source configuration.

:::note
A source ID should not be set when the consumer has at least one entry in the `externalEvents` mapping, as the source ID will be derived from the event source configuration.
:::

**type**

string

**examples**

`celerity::topic::arn:aws:sns:us-east-1:123456789012:users-topic-NZJ5JSMVGFIE` - An Amazon SNS topic ARN prefixed with `celerity::topic::` to identify the source as a Celerity topic, which depending on the environment will require a queue to be created to subscribe to the topic. 

`https://sqs.us-east-1.amazonaws.com/123456789012/my-queue`

`projects/my-project/topics/my-topic`

`my-queue`

### batchSize

The size of the batch of messages to retrieve from the queue or message broker.
This value is used to configure the maximum number of messages to retrieve in a single poll operation.
Depending on the target environment, this value will be limited to different maximum values and may be ignored, see the [configuration mappings](#configuration-mappings) section for more details.

**type**

integer

### visibilityTimeout

The time in seconds that a message is hidden from other consumers after being retrieved from the queue or message broker.
Depending on the target environment, this value may be ignored, see the [configuration mappings](#configuration-mappings) section for more details.

**type**

integer

### waitTimeSeconds

The time in seconds to wait for messages to become available in the queue or message broker before polling again.
Depending on the target environment, this value may be ignored, see the [configuration mappings](#configuration-mappings) section for more details.

**type**

integer

### partialFailures

Whether partial failure reporting is supported.
When enabled, the consumer will report partial failures to the source queue or message broker,
meaning that only failed messages will be retried.

This is only supported in some target environments, see the [configuration mappings](#configuration-mappings) section for more details.

**type**

boolean

**default value**

`false`

### routingKey

The routing key used to filter messages based on the payload of the message.
This is only applicable when the consumer message payload is a valid JSON object that contain the specified routing key field.
This defaults to `event` and is only used when routing is activated through the use of a `celerity.handler.consumer.route` annotation set on a handler.

**type**

string

**default value**

`event`

### externalEvents

A mapping of cloud service event configurations that the consumer will respond to, this can include events from object storage, databases, and other services. Depending on the target environment, the consumer will be wired up to the appropriate event source (e.g. AWS S3, Google Cloud Storage, Azure Blob Storage).

:::note
External events should not be present when the source ID is set.
:::

**type**

mapping[string, [externalEventConfiguration](#externaleventconfiguration)]

## Annotations

Annotations define additional metadata that can determine the behaviour of the resource in relation to other resources in the blueprint or to add behaviour to a resource that is not in its spec.

### `celerity/consumer`

The following are a set of annotations that are specific to the `celerity/consumer` resource type.
These annotations are nothing to do with relationships between resources, but are used to configure the behaviour of the consumer.

<p style={{fontSize: '1.2em'}}><strong>celerity.app</strong></p>

Provides a way to group consumers together that are part of the same application.
This is especially useful when deploying to a containerised or custom server environment as it allows you to deploy multiple consumers as a part of a single deployed application.

**type**

string
___

<p style={{fontSize: '1.2em'}}><strong>celerity.consumer.deadLetterQueue</strong></p>

When the `sourceId` is a Celerity topic, by default, a dead letter queue (or equivalent) will be created for the consumer to receive messages that could not be processed after a maximum number of attempts has been surpassed.
This annotation can be set to `false` to disable the creation of a dead letter queue for the consumer.

**type**

boolean

**default value**

`true`

___

<p style={{fontSize: '1.2em'}}><strong>celerity.consumer.deadLetterQueueMaxAttempts</strong></p>

The maximum number of attempts to process a message before it is sent to the dead letter queue
when the `sourceId` is a Celerity topic and the dead letter queue behaviour is enabled.

**type**

integer

**default value**

The default value for the target environment is used. See the [Dead Letter Queue Configuration Mappings](#dead-letter-queue-configuration-mappings) section for more details.

___

### `celerity/vpc` 🔗 `celerity/consumer`

The following are a set of annotations that determine the behaviour of the consumer in relation to a VPC.
Appropriate security groups are managed by the VPC to consumer link.

When a VPC is not defined for the container-backed AWS, Google Cloud and Azure target environments, the default VPC for the account will be used.

VPC annotations and links do not have any effect for serverless environments.
Serverless consumers are no more than configuration of a topic or queue trigger for a serverless function.

:::warning
When a VPC is not defined for container-backed cloud environments, annotations in the `celerity/consumer` will apply to the default VPC for the account.
:::

<p style={{fontSize: '1.2em'}}><strong>celerity.consumer.vpc.subnetType</strong></p>

The kind of subnet that the consumer application should be deployed to.

**type**

string

**allowed values**

`public` | `private`

**default value**

`public` - When a VPC links to a consumer, the consumer will be deployed to a public subnet.

___

<p style={{fontSize: '1.2em'}}><strong>celerity.consumer.vpc.ingressType</strong></p>

The kind of ingress used for the consumer application.
This is only applicable when the consumer is deployed to a containerised environment that subscribes to a queue or topic via a push model. (e.g. Google Cloud Run)

**type**

string

**allowed values**

`public` | `private`

**default value**

`public` - When a VPC links to an consumer, traffic will be accepted from the public internet via an application load balancer if one is configured for the application.

___

### `celerity/datastore` 🔗 `celerity/consumer`

#### celerity.consumer.datastore

Specifies the name of the data store (in the blueprint) that the consumer should listen to for events. This is only required when there is ambiguity where a consumer matches the the link selector of multiple data sources in the blueprint. If the consumer is only linked to a single data store, this annotation is not required and the default behaviour will be to listen to the data store that matches the link selector.

**type**

string

___

#### celerity.consumer.datastore.startFromBeginning

Whether the consumer should start processing events from the beginning of the stream (or earliest available point).

This is only supported in some target environments.

**type**

boolean

___

### `celerity/queue` 🔗 `celerity/consumer`

#### celerity.consumer.queue

Specifies the name of the queue (in the blueprint) that the consumer should listen to for messages. This is only required when there is ambiguity where a consumer matches the the link selector of multiple queues in the blueprint. If the consumer is only linked to a single queue, this annotation is not required and the default behaviour will be to listen to the queue that matches the link selector.

**type**

string

___

### `celerity/bucket` 🔗 `celerity/consumer`

#### celerity.consumer.bucket

Specifies the name of the bucket (in the blueprint) that the consumer should listen to for events. This is only required when there is ambiguity where a consumer matches the the link selector of multiple buckets in the blueprint. If the consumer is only linked to a single bucket, this annotation is not required and the default behaviour will be to listen to events for the bucket that matches the link selector.

**type**

string

___

#### celerity.consumer.bucket.events

The object storage events that should trigger the consumer.

**type**

string - Comma-separated list of events

**allowed values**

`created` | `deleted` | `metadataUpdated`

**examples**

`created,deleted`

___

## Outputs

Outputs are computed values that are accessible via the `{resourceName}.spec.*` field accessor in a blueprint substitution.
For example, if the resource name is `myConsumer`, the output would be accessible via `${myConsumer.spec.id}`.

### subscriberId (optional)

The ID of the subscription that is created for the consumer when the `sourceId` is a Celerity topic.
This will be a queue ID or a subscription ID depending on the target environment.
This output is **only** present in the outputs when the `sourceId` is a Celerity topic and the target environment requires a queue or subscription to be created to subscribe to the topic to follow best practises in creating a scalable and resilient architecture.

**type**

string | null

**examples**

`arn:aws:sqs:us-east-1:123456789012:example-queue-NZJ5JSMVGFIE` - An Amazon SQS Queue ARN

## Data Types

### externalEventConfiguration

Configuration for a cloud service event trigger that the consumer will respond to.
This supports a limited set of event sources, such as object storage, NoSQL database streams/events, data streams and a few other services.

Due to the differences in event sources across cloud providers, the amount of options is kept minimal and as general as possible to support the most common event sources.

To support a wider range of event sources, you will need to wire up an event source to a queue or message broker and use a `celerity/consumer` resource to handle the events.

#### FIELDS
___

<p style={{fontSize: '1.2em'}}><strong>sourceType (required)</strong></p>

The type of event source that the consumer will respond to.

**field type**

string

**allowed values**

`objectStorage` | `dbStream` | `dataStream`
___

<p style={{fontSize: '1.2em'}}><strong>sourceConfiguration (required)</strong></p>

The event source configuration for the event source type. 

**field type**

[objectStorageEventConfiguration](#objectstorageeventconfiguration) |
[dbStreamConfiguration](#dbstreamconfiguration) |
[dataStreamConfiguration](#datastreamconfiguration)

___

### objectStorageEventConfiguration

Configuration for an object storage event trigger that the consumer will respond to.
This supports object storage services such as AWS S3, Google Cloud Storage, and Azure Blob Storage based on the target environment.

#### FIELDS
___

<p style={{fontSize: '1.2em'}}><strong>events (required)</strong></p>

The object storage events that should trigger the consumer.

**field type**

array[string]

**allowed values**

`created` | `deleted` | `metadataUpdated`

**examples**

`["created", "deleted"]`
___


<p style={{fontSize: '1.2em'}}><strong>bucket (required)</strong></p>

The name of the bucket that the consumer will respond to events from.

**field type**

string

**examples**

`order-invoice-bucket`
___

### dbStreamConfiguration

Configuration for a database stream event trigger that the consumer will respond to.
This supports NoSQL database streams/events such as DynamoDB Streams, Google Cloud Datastore, and Azure Cosmos DB based where the selected service is based on the target environment.

You can find more information about the configuration mappings for database streams in the [configuration mappings](#serverless-database-streams) section. You can also dive into how DB streams work with containerised and custom server environments [here](/docs/applications/architectures#events---cloud-service-events)

#### FIELDS
___

<p style={{fontSize: '1.2em'}}><strong>batchSize</strong></p>

The size of the batch of events to retrieve from the database stream.
The maximum value depends on the target environment, see the [configuration mappings](#serverless-database-streams) section for more details.

**field type**

integer
___

<p style={{fontSize: '1.2em'}}><strong>dbStreamId (required)</strong></p>

The ID of the database stream that the consumer will respond to events from.
The format of the ID depends on the target environment, see the [configuration mappings](#serverless-database-streams) section for more details.

**field type**

string

**examples**

`arn:aws:dynamodb:us-east-1:123456789012:table/MyTable/stream/2021-07-01T00:00:00.000`
___

<p style={{fontSize: '1.2em'}}><strong>partialFailures</strong></p>

Whether partial failure reporting is supported.
When enabled, the consumer will report partial failures to the source stream,
meaning that only failed messages will be retried.

This is only supported in some target environments, see the [configuration mappings](#serverless-database-streams) section for more details.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>startFromBeginning</strong></p>

Whether the consumer should start processing events from the beginning of the stream (or earliest available point).

This is only supported in some target environments, see the [configuration mappings](#serverless-database-streams) section for more details.

**type**

boolean
___

### dataStreamConfiguration

Configuration for data stream event triggers that the consumer will respond to.
This supports data stream services such as Amazon Kinesis and Azure Event Hubs, where the selected service is based on the target environment.

You can find more information about the configuration mappings for data streams in the [configuration mappings](#serverless-data-streams) section. You can also dive into how DB streams work with containerised and custom server environments [here](/docs/applications/architectures#events---cloud-service-events)

#### FIELDS
___

<p style={{fontSize: '1.2em'}}><strong>batchSize</strong></p>

The size of the batch of events to retrieve from the data stream.
The maximum value depends on the target environment, see the [configuration mappings](#serverless-data-streams) section for more details.

**field type**

integer
___

<p style={{fontSize: '1.2em'}}><strong>dataStreamId (required)</strong></p>

The ID of the data stream that the consumer will respond to events from.
The format of the ID depends on the target environment, see the [configuration mappings](#serverless-data-streams) section for more details.

**field type**

string

**examples**

`arn:aws:kinesis:us-east-1:123456789012:stream/MyStream`
___

<p style={{fontSize: '1.2em'}}><strong>partialFailures</strong></p>

Whether partial failure reporting is supported.
When enabled, the consumer will report partial failures to the source stream,
meaning that only failed messages will be retried.

This is only supported in some target environments, see the [configuration mappings](#serverless-data-streams) section for more details.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>startFromBeginning</strong></p>

Whether the consumer should start processing events from the beginning of the stream (or earliest available point).

This is only supported in some target environments, see the [configuration mappings](#serverless-data-streams) section for more details.

**type**

boolean
___

## Linked From

A consumer can be linked from a number of resource types in a blueprint, these resource types either define the networking configuration for the consumer, or the event source that the consumer will listen to.

:::note
When a consumer matches multiple resources of the same type (e.g. multiple `celerity/queue` instances), an annotation must be used to disambiguate which resource the consumer should listen to as a consumer can only have one event or message source.
:::

:::warning
A consumer can not be linked to multiple message/event source resource types in a blueprint.
For example, a consumer can not be linked to both a `celerity/datastore` and a `celerity/queue` resource type.
:::

#### [`celerity/vpc`](/docs/applications/resources/celerity-vpc)

Depending on the target environment, a consumer application may be deployed to a VPC.
When a consumer is combined into a single application with an API, schedule or other triggers for handlers,
a single VPC will be created for the application and all resource types that make up the application will be deployed into the VPC.
When deploying to serverless environments, a consumer is a placeholder for a connection between a topic or queue and a handler, and does not require a VPC.

#### [`celerity/datastore`](/docs/applications/resources/celerity-datastore)

When a consumer is linked from a `celerity/datastore` resource type, the consumer will be configured to listen to events in the datastore.
Depending on the target environment, this can be a direct stream of events from the datastore, a queue or pub/sub integration to deliver events to the consumer application.

#### [`celerity/queue`](/docs/applications/resources/celerity-queue)

When a consumer is linked from a `celerity/queue` resource type, the consumer will be configured to listen to messages in the queue.

#### [`celerity/bucket`](/docs/applications/resources/celerity-bucket)

When a consumer is linked from a `celerity/bucket` resource type, the consumer will be configured to listen to events in the bucket.

## Links To

#### [`celerity/handler`](/docs/applications/resources/celerity-handler)

Handlers contain the message processing functionality that is executed in response to one or more messages being received by the consumer.

#### [`celerity/config`](/docs/applications/resources/celerity-config)

The `celerity/config` resource type can be used to store configuration and sensitive information such as API keys, database passwords, and other credentials that are used by the application.
A consumer can link to a `celerity/config` resource to access secrets at runtime, linking an application to a secret and configuration store will automatically make secrets accessible to all handlers in the application without having to link each handler to the store.

:::note
Where an application is made up of a composition of consumers, an API, schedules or other triggers, a `celerity/config` resource only need to be linked to one of the application resource types.
:::


## Examples

```yaml
version: 2025-05-12
transform: celerity-2026-02-28
variables:
    ordersTopic:
        type: string
resources:
    ordersConsumer:
        type: "celerity/consumer"
        metadata:
            displayName: Orders Consumer
        linkSelector:
            byLabel:
                application: "orders"
        spec:
            sourceId: "${variables.ordersTopic}"
            batchSize: 10
            visibilityTimeout: 30
            waitTimeSeconds: 20
            partialFailures: true
```

See [`celerity/handler`](/docs/applications/resources/celerity-handler#handlers-for-a-message-queue) for integrated examples of how to use consumers for an application.

## Target Environments

### Celerity::1

In the Celerity::1 local environment, a consumer is deployed as a containerised version of the Celerity runtime that consumes a Valkey [stream](https://valkey.io/topics/streams-intro/) for messages, using a stream allows for reliable message delivery that provides parity with the behaviour of cloud queue services. The consumer will treat the stream as a queue by keeping track of an ID for the last message processed, this ID is stored as a key/value pair in the same valkey instance. On initalisation, the consumer reads the last processed ID from valkey and starts consuming messages from the stream that have an ID greater than the last processed ID. The last processed ID is set after each message has been successfully processed by a handler in the consumer application.

A visibility timeout (or lock duration) is implemented for messages in the stream by using a Valkey list to store the IDs of messages that are currently being processed by a given consumer, where the consumer has an ID that is used to form the key for the list.

If the consumer `sourceId` is a Celerity topic, the consumer will be configured to consume messages from a stream that is prepared for the topic, see [`celerity/topic`](/docs/applications/resources/celerity-topic#celerity1) for more information on how topics work in the Celerity::1 environment. If a dead-letter queue is configured, the message will be forwarded to a dedicated Redis stream which can then be inspected through tools such as the Celerity CLI.

For other event sources, the Celerity::1 environment will introduce some intermediary components to receive events from the source data store, bucket or queue and forward them to the consumer application via a dedicated Valkey stream. For external event sources, the Celerity::1 environment will use a local containerised version of the Celerity runtime to poll the external source for messages if the Celerity runtime supports it, otherwise, the consumer application will not be able to consume messages from the external source. For unsupported external event sources, you can manually test your consumer application by using the Celerity CLI (or another tool) to publish messages to the Valkey stream dedicated to the consumer application.

Links from VPCs to consumers are ignored for this environment as the consumer application is deployed to a local container network on a developer or CI machine.

### AWS

In the AWS environment, a consumer is deployed as a containerised version of the Celerity runtime that polls an SQS queue or consumes a Kinesis or DynamoDB stream for messages, depending on the configured event source.

When the `sourceId` is a Celerity topic, an SQS Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The consumer application is then configured to poll the SQS Queue for messages.

For Kinesis and DynamoDB streams, the Celerity runtime variation with an embedded [KCL MultiLangDaemon](https://docs.aws.amazon.com/streams/latest/dev/develop-kcl-consumers-non-java.html) is used to consume messages from the stream, with the runtime consuming events received by the KCL MultiLangDaemon. The [Kinesis Adaptor for DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.KCLAdapter.html) is used to consume DynamoDB streams.

Consumers can be deployed to [ECS](https://aws.amazon.com/ecs/) or [EKS](https://aws.amazon.com/eks/) backed by [Fargate](https://aws.amazon.com/fargate/) or [EC2](https://aws.amazon.com/ec2/) using [deploy configuration](#app-deploy-configuration) for the AWS target environment.

#### ECS

When a Consumer is first deployed to ECS, a new cluster is created for the application. A service is provisioned within the cluster to run the application.

The service is deployed with an auto-scaling group that will scale the number of tasks running the consumer based on the CPU and memory usage of the tasks. The auto-scaling group will scale the desired task count with a minimum of 1 task and a maximmum of `N` tasks depending on the [app environment](/cli/docs/app-deploy-configuration#structure).

The default maximum number of tasks is 3 for `development` app environments and 6 for `production` app environments. Deploy configuration can be used to override this behaviour.

If backed by EC2, the auto-scaling group will scale the number instances based on CPU utilisation of the instances with a minimum of 1 instance and a maximum of `N` instances depending on the [app environment](/cli/docs/app-deploy-configuration#structure).

The default maximum number of EC2 instances is 3 for `development` app environments and 6 for `production` app environments. Deploy configuration can be used to override this behaviour.

When it comes to networking, ECS services need to be deployed to VPCs; if a VPC is defined in the blueprint and linked to the consumer, it will be used, otherwise the default VPC for the account will be used. The service for the application will be deployed to a public subnet by default, but can be configured to be deployed to a private subnet by setting the `celerity.consumer.vpc.subnetType` annotation to `private`. By default, 2 private subnets and 2 public subnets are provisioned for the associated VPC, the subnets are spread across 2 availability zones, the ECS resources that need to be associated with a subnet will be associated with these subnets, honouring the subnet type defined in the annotations.

The CPU to memory ratio used by default for AWS deployments backed by EC2 is that of the `t3.*` instance family. The auto-scaling launch configuration will use the appropriate instance type based on the requirements of the application, these requirements will be taken from the deploy configuration or derived from the handlers configured for the consumer application. If the requirements can not be derived, a default instance type will be selected. For production app environments, the default instance type will be `t3.medium` with 2 vCPUs and 4GB of memory. For development app environments, the default instance type will be `t3.small` with 2 vCPUs and 2GB of memory.

Fargate-backed ECS deployments use the same CPU to memory ratios allowed for Fargate tasks as per the [task definition parameters](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size).

If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. For an EC2-backed cluster, the task housing the containers that make up the service for the consumer will be deployed with less than 50 percent of memory and 0.8 vCPUs. Less than half of the memory and CPU is allocated to the EC2 instance to allow for smooth deployments of new versions of the application, this is done by making sure there is enough memory and CPU available to the ECS agent. The exact memory usage values for the defaults would be 1,792MB for production app environments and 870MB for development app environments.

For a Fargate-backed cluster, in production app environments, the task housing the containers for the consumer application will be deployed with 2GB of memory and 1 vCPU. In development app environments, the task for the API will be deployed with 1GB of memory and 0.5 vCPUs.

A sidecar [ADOT collector](https://aws-otel.github.io/docs/getting-started/collector) container is deployed with the application to collect traces and metrics for the application, this will take up a small portion of the memory and CPU allocated to the consumer. Traces are only collected when tracing is enabled for the handler that is processing messages.
 
#### EKS

When a consumer application is first deployed to EKS, a new cluster is created for the application unless you specify an existing cluster to use in the deploy configuration.

:::warning using existing clusters
When using an existing cluster, the cluster must be configured in a way that is compatible with the VPC annotations configured for the consumer as well as the target compute type.
For example, a cluster without a Fargate profile can not be used to deploy a consumer application that is configured to use Fargate. Another example would be a cluster with a node group only associated with public subnets not being compatible with a consumer application with the `celerity.consumer.vpc.subnetType` annotation set to `private`.
You also need to make sure there is enough memory and CPU allocated for node group instances to run the application in addition to other workloads running in the cluster.
:::

:::warning cost of running on EKS
Running a Celerity application on EKS will often not be the most cost-effective way to run consumer applications that are not expected to use a lot of resources. All EKS clusters have a fixed cost of $74 per month for the control plane, in addition to the cost of the EC2 instances or Fargate tasks that are used to run the application along with the cost of data transfer and networking components. If you are looking for a cost-effective solution for low-load applications on AWS, consider using [ECS](#ecs) or switching to a [serverless deployment](#aws-serverless) instead.
:::

The cluster is configured with a private endpoint for the Kubernetes API server by default, this can be overridden in the deploy configuration. (VPC links are required to access the Kubernetes API server with the default configuration)

For an EKS cluster backed by EC2, a node group is configured with auto-scaling configuration to have a minimum size of 2 nodes and a maximum size of 6 nodes by default for production app environments. For development app environments, the minimum size of a node group is 1 with a maximum size of 3 by default. Auto-scaling is handled by the [Kubernetes Cluster Autoscaler](https://github.com/kubernetes/autoscaler#kubernetes-autoscaler). The instance type configured for node groups is determined by the CPU and memory requirements defined in the deploy configuration or derived from the handlers of the consumer application, if the requirements can not be derived, a default instance type will be selected. For production app environments, the default instance type will be `t3.medium` with 2 vCPUs and 4GB of memory. For development app environments, the default instance type will be `t3.small` with 2 vCPUs and 2GB of memory.

For an EKS cluster backed by Fargate, a [Fargate profile](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html) is configured to run the consumer application.

The [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) is used to scale the number of pods running the API based on CPU utilisation and average memory utilisation. In development app environments, the minimum number of pods is set to 1 and the maximum number of pods is set to 3 by default. In production app environments, the minimum number of pods is set to 2 and the maximum number of pods is set to 6 by default. The minimum and maximum number of pods can be overridden in the deploy configuration.

Once the cluster is up and running, Kubernetes services are provisioned to run the application.

When it comes to networking, EKS services need to be deployed to VPCs; if a VPC is defined in the blueprint and linked to the consumer application, it will be used, otherwise the default VPC for the account will be used.

By default, 2 private subnets and 2 public subnets are provisioned for the associated VPC, the subnets are spread across 2 availability zones. For EC2-backed clusters, the EKS node group will be associated with all 4 subnets when `celerity.consumer.vpc.subnetType` is set to `public`; when `celerity.consumer.vpc.subnetType` is set to `private`, the node group will only be associated with the 2 private subnets. The orchestrator will take care of assigning one of the subnets defined for the node group.

For Fargate-backed clusters, the Fargate profile will be associated with the private subnets due to the [limitations with Fargate profiles](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html). For Fargate, the consumer application will be deployed to one of the private subnets associated with the profile. 

:::warning
`celerity.consumer.vpc.subnetType` has no effect for Fargate-based EKS deployments, the application will always be deployed to a private subnet.
:::

If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set.
For an EC2-backed cluster, the containers that make up the service for the consumer application will be deployed with less than 50 percent of memory and 0.8 vCPUs. Less than half of the memory and CPU is allocated to a node that will host the containers to allow for smooth deployments of new versions of the consumer application, this is done by making sure there is enough memory and CPU available to the Kubernetes agents. The exact memory usage values for the defaults would be 1,792MB for production app environments and 870MB for development app environments.

For a Fargate-backed cluster, in production app environments, the pod for the application will be deployed with 2GB of memory and 0.5 vCPUs. In development app environments, the pod for the application will be deployed with 1GB of memory and 0.5 vCPUs. Fargate has a [fixed set of CPU and memory configurations](https://docs.aws.amazon.com/eks/latest/userguide/fargate-pod-configuration.html) that can be used.

A sidecar [ADOT collector](https://aws-otel.github.io/docs/getting-started/collector) container is deployed in the pod with the consumer application to collect traces and metrics for the application, this will take up a small portion of the memory and CPU allocated to the consumer. Traces are only collected when tracing is enabled for the consumer application.

### AWS Serverless

In the AWS Serverless environment, consumer applications are deployed as SQS, Kinesis, S3 or DynamoDB Stream triggers (event source mappings) for the AWS Lambda handlers defined for the consumer application.

When the `sourceId` is a Celerity topic, an SQS Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The queue will be configured as the trigger for the handlers linked to from the consumer application.

When tracing is enabled, an [ADOT lambda layer](https://aws-otel.github.io/docs/getting-started/lambda) is bundled with and configured to instrument each handler to collect traces and metrics. Traces are only collected when tracing is enabled for the handlers that process messages.

### Google Cloud

In the Google Cloud environment, consumer applications are deployed as a containerised version of the Celerity runtime.

consumer applications can be deployed to [Cloud Run](https://cloud.google.com/run), as well as [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) in [Autopilot](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview) or [Standard](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-regional-cluster) mode using [deploy configuration](/cli/docs/deploy-configuration) for the Google Cloud target environment.

#### Cloud Run

Cloud Run is a relatively simple environment to deploy applications to, the consumer application is deployed as a containerised application.

When the `sourceId` is a Celerity topic, a Pub/Sub subscription is created without the need for any intermediary infrastructure.
For other event sources, an integration is set up to receive events from the source data store, bucket or queue and forward them to the consumer application via a Pub/Sub topic. The Celerity runtime will then receive messages from the Pub/Sub topic.

For consumer applications, Cloud Run uses a push model where a [Pub/Sub push subscription](https://cloud.google.com/run/docs/tutorials/pubsub) is configured for a Cloud Run app. Due to this, the Celerity runtime will not be configured to poll a message source, a HTTP API will be set up instead to receive messages from the Pub/Sub push subscription.

Autoscaling is configured with the use of Cloud Run annotations through `autoscaling.knative.dev/minScale` and `autoscaling.knative.dev/maxScale` [annotations](https://cloud.google.com/run/docs/reference/rest/v1/ObjectMeta). The knative autoscaler will scale the number of instances based on the number of requests and the CPU and memory usage of the instances. By default, for production app environments, the application will be configured to scale the number of instances with a minimum of 2 instances and a maximum of 5 instances. The default values for development app environments are a minimum of 1 instance and a maximum of 3 instances. Deploy configuration can be used to override this behaviour.

For Cloud Run, the consumer application will not be associated with a VPC, defining custom VPCs for Cloud Run applications is not supported. Creating and linking a VPC to the consumer application will enable the `Internal` networking mode in the [network ingress settings](https://cloud.google.com/run/docs/securing/ingress). `celerity.consumer.vpc.subnetType` has no effect for Cloud Run deployments, the application will always be deployed to a network managed by Google Cloud. Setting `celerity.consumer.vpc.ingressType` to `private` will have the same affect as attaching a VPC to the application, making the run trigger endpoint private. Setting `celerity.consumer.vpc.ingressType` to `public` will have the same effect as not attaching a VPC to the consumer application, making the Cloud Run service public if an external application load balancer is configured to route traffic to the Cloud Run service. `public` is equivalent to the "Internal and Cloud Load Balancing" [ingress setting](https://cloud.google.com/run/docs/securing/ingress#settings).

Memory and CPU resources allocated to the consumer application can be defined in the deploy configuration, when not defined, memory and CPU will be derived from the handlers configured for the application.
If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. The Cloud Run service will be allocated a limit of 2GB of memory and 1 vCPU per instance in production app envirionments. For develompent app environments, the service will be allocated a limit of 1GB of memory and 0.5 vCPUs per instance.

A sidecar [OpenTelemetry Collector](https://github.com/GoogleCloudPlatform/opentelemetry-cloud-run) container is deployed in the service with the consumer application to collect traces and metrics, this will take up a small portion of the memory and CPU allocated to the application. Traces will only be collected if tracing is enabled for the handlers that process messages.

#### GKE

In the GKE environment, the Celerity runtime will use a [pull subscription](https://cloud.google.com/pubsub/docs/pull) to poll a Pub/Sub topic for messages.
For other event sources, an integration is set up to receive events from the source data store, bucket or queue and forward them to the consumer application via a Pub/Sub topic. The Celerity runtime will then pull messages from the Pub/Sub topic.

When a consumer application is first deployed to GKE, a new cluster is created for the application unless you specify an existing cluster to use in the deploy configuration.

:::warning Using existing clusters
When using an existing cluster, the cluster must be configured in a way that is compatible with the VPC annotations configured for the application as well as the target compute type.
:::

:::warning Cost of running on GKE
Running a Celerity application on GKE will often not be the most cost-effective option for APIs with low traffic or applications that are not expected to use a lot of resources. All GKE clusters have a fixed cost of around $72 per month for cluster management (control plane etc.), in addition to the cost of the nodes (VMs) that are used to run the application pods along with cost of data transfer and networking components.
If you are looking for a cost-effective solution for low-load applications on Google Cloud, consider using [Cloud Run](#cloud-run) or switching to a [serverless deployment](#google-cloud-serverless) instead.
:::

When in standard mode, for production app environments, the cluster will be regional with 2 zones for better availability guarantees. A node pool is created with autoscaling enabled, by default, the pool will have a minimum of 1 node and a maximum of 3 nodes per zone. As the cluster has 2 zones, this will be a minimum of 2 nodes and a maximum of 6 nodes overall. The [cluster autoscaler](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-autoscaler) is used to manage scaling and choosing the appropriate instance type to use given the requirements of the consumer application service. For development app environments, the cluster will be regional with 1 zone. The node pool will have a minimum of 1 node and a maximum of 3 nodes in the single zone. The minimum and maximum number of nodes can be overridden in the deploy configuration.

For standard mode, the machine type configured for node pools is determined by the CPU and memory requirements defined in the deploy configuration or derived from the handlers of the consumer aplication, if the requirements can not be derived, a default machine type will be selected. For production app environments, the default machine type will be `n2-highcpu-4` with 4 vCPUs and 4GB of memory. For development app environments, the default machine type will be `n1-highcpu-2` with 2 vCPUs  and 2GB of memory. The machine type for node pools can be overridden in the deploy configuration.

When in autopilot mode, Google manages scaling, security and node pools. Based on memory and CPU limits applied at the pod-level, appropriate node instance types will be selected and will be scaled automatically. There is no manual autoscaling configuration when running in autopilot mode, GKE Autopilot is priced per pod request rather than provisioned infrastructure, depending on the nature of your workloads, it could be both a cost-effective and convenient way to run your applications. [Read more about autopilot mode pricing](https://cloud.google.com/kubernetes-engine/pricing#autopilot_mode).

In standard mode, the [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) is used to scale the number of pods running the consumer application based on CPU utilisation and average memory utilisation. In development app environments, the minimum number of pods is set to 1 and the maximum number of pods is set to 3 by default. In production app environments, the minimum number of pods is set to 2 and the maximum number of pods is set to 6 by default. The minimum and maximum number of pods can be overridden in the deploy configuration.

When it comes to networking, a GKE cluster is deployed as a [private cluster](https://cloud.google.com/kubernetes-engine/docs/concepts/private-cluster-concept), nodes that the pods for the application run on only use internal IP addresses, isolating them from the public internet. The Control plane has both internal and external endpoints, the external endpoint can be disabled from the Google Cloud/Kubernetes side.

:::warning
`celerity.consumer.vpc.subnetType` has no effect for GKE clusters, the application will always be deployed to a private network.
:::

If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. Limits of 1,792MB of memory and 1.6 vCPUs will be set for the pods that run the application in production app environments. For development app environments, the pods will be deployed with 870MB of memory and 0.8 vCPUs.

The [OpenTelemetry Operator](https://cloud.google.com/blog/topics/developers-practitioners/easy-telemetry-instrumentation-gke-opentelemetry-operator/) is used to configure a sidecar collector container for the application to collect traces and metrics. Traces will only be collected if tracing is enabled for the handlers that process messages.

### Google Cloud Serverless

In the Google Cloud Serverless environment, consumer applications are deployed as Google Cloud Functions that are triggered by a Pub/Sub topic.

When the `sourceId` is a Celerity topic, a Pub/Sub subscription is created without the need for any intermediary infrastructure.
For other event sources, direct triggers are set up for the consumer handlers for the configured data store, storage bucket or queue event source.

When tracing is enabled, the built-in Google Cloud metrics and tracing offerings will be used to collect traces and metrics for the handlers. Traces and metrics can be collected in to tools like Grafana with plugins that use Google Cloud Trace as a data source. You can export logs and metrics to other tools like Grafana with plugins that use Google Cloud Logging and Monitoring as a data source.

### Azure

In the Azure environment, consumer applications are deployed as a containerised version of the Celerity runtime.

Consumer applications can be deployed to [Azure Container Apps](https://azure.microsoft.com/en-us/products/container-apps/) or [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/products/kubernetes-service) using [deploy configuration](/cli/docs/deploy-configuration) for the Azure target environment.

#### Container Apps

Container Apps is a relatively simple environment to deploy applications to, the consumer application is deployed as an [event-driven job](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-event-driven-jobs).

When the `sourceId` is a Celerity topic, an Azure Service Bus Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The Azure Container Apps job environment is then configured to listen to the Service Bus Queue for messages.
For other event sources, an integration is set up to receive events from the source data store, bucket or queue and forward them to the consumer application via a Service Bus Queue.

Autoscaling is determined based on the number of messages received in the queue. By default, the [scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli#event-driven-jobs) are set to scale the number of instances with a minimum of 0 executions and a maximum of 10 executions in production app environments. For development app environments, the default configuration is set to scale from 0 to 5 executions. [Deploy configuration](#app-deploy-configuration) can be used to override this behaviour.

Container Apps will not be associated with a private network by default, a VNet is automatically generated for you and generated VNets are publicly accessible over the internet. [Read about networking for Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/networking?tabs=workload-profiles-env%2Cazure-cli). When you define a VPC and link it to the consumer application, a custom VNet will be provisioned and the consumer application will be deployed to either a private or public subnet based on the `celerity.consumer.vpc.subnetType` annotation, defaulting to a public subnet if not specified. As consumer applications are triggered by the the Container Apps Jobs service, availability guarantees for a consumer application relies on the Azure Container Apps platform.

Memory and CPU resources allocated to the application can be defined in the deploy configuration, when not defined, memory and CPU will be derived from the handlers configured for the application. If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. For production app environments, the Container App job will be allocated a limit of 2GB of memory and 1 vCPU per instance in the consumption plan, [see allocation requirements](https://learn.microsoft.com/en-us/azure/container-apps/containers#allocations). For development app environments, the Container App job will be allocated a limit of 1GB of memory and 0.5 vCPUs per instance in the consumption plan.

The [OpenTelemetry Data Agent](https://learn.microsoft.com/en-us/azure/container-apps/opentelemetry-agents?tabs=arm) is used to collect traces and metrics for the application. Traces will only be collected if tracing is enabled for the handlers that process messages.

:::warning
When deploying to the Azure environment with Container Apps, consumer applications can **not** be combined into a single application with an API. To utilise the [Azure Container Apps jobs](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-event-driven-jobs) environment to do the heavy lifting when it comes to scaling and launching jobs, consumer applications must be background jobs that are not accessible from the public internet and only run when triggered by a message in the queue.
:::

#### AKS

In the AKS environment, the Celerity runtime will poll for messages and trigger handlers in response to messages from a queue.

When a consumer application is first deployed to AKS, a new cluster is created for the application unless you specify an existing cluster to use in the deploy configuration.

:::warning Using existing clusters
When using an existing cluster, it must be configured in a way that is compatible with the VPC annotations configured for the application as well as the target compute type.
:::

:::warning Cost of running on AKS
Running a Celerity application on AKS will often not be the most cost-effective option for consumer applications that are not expected to use a lot of resources. The default configuration uses instances that meet the minimum requirements to run Kubernetes in AKS that will cost hundreds of US dollars a month to run.
If you are looking for a cost-effective solution for low-load applications on Azure, consider using [Azure Container Apps](#container-apps) instead.
:::

When the `sourceId` is a Celerity topic, an Azure Service Bus Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The Celerity runtime is configured to listen for messages from the Service Bus Queue for messages.
For other event sources, an integration is set up to receive events from the source data store, bucket or queue and forward them to the consumer application via a Service Bus Queue. The Celerity runtime will then listen for messages from the Service Bus Queue.

The cluster is created across 2 availability zones for better availability guarantees. Best effort zone balancing is used with [Azure VM Scale Sets](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-use-availability-zones?tabs=portal-2#zone-balancing). 2 separate node pools will be configured for the cluster, 1 for the Kubernetes system components and 1 for your application. When using an existing cluster, a new node pool will be created specifically for this application.

The cluster is configured with an [autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler?tabs=azure-cli) for each node pool. For production app environments, by default, the autoscaler for the application node pool will be configured with a minimum of 3 nodes and a maximum of 6 nodes distributed across availability zones as per Azure's zone balancing. For development app environments, the autoscaler for the application node pool will be configured with a minimum of 1 node and a maximum of 4 nodes by default.

The autoscaler for the system node pool will be configured with a minimum of 2 nodes and a maximum of 3 nodes for production app environments. For development app environments, the autoscaler for the system node pool will be configured with a minimum of 1 node and a maximum of 2 nodes by default.

For both production and development app environments, the default node size for the system node pool is `Standard_D4d_v5` with 4 vCPUs and 16GB of memory. This size has been chosen because of the [minimum requirements for system Node Pools](https://learn.microsoft.com/en-us/azure/aks/use-system-pools?tabs=azure-cli#system-and-user-node-pools).
For the application node pool, the default node size differs based on the app environment. For production app environments, the default node size is `Standard_D4ls_v6` with 4 vCPUs and 8GB of memory. For development app environments, the default node size is `Standard_D2ls_v6` with 2 vCPUs and 4GB of memory.
If the CPU or memory requirements of the application defined in the app blueprint cause the default node size to not be able to comfortably run 2 instances of the consumer application, a larger node size will be selected.
Min and max node count along with the node size for both system and application node pools can be overridden in the deploy configuration.

The [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) is used to scale the number of pods running the application based on CPU utilisation and average memory utilisation. In development app environments, the minimum number of pods is set to 1 and the maximum number of pods is set to 6 by default. In production app environments, the minimum number of pods is set to 2 and the maximum number of pods is set to 12 by default. The minimum and maximum number of pods can be overridden in the deploy configuration.

When it comes to networking, the application will be deployed with the overlay network model in a public network as per the default AKS access mode. [Read about private and public clusters for AKS](https://techcommunity.microsoft.com/t5/core-infrastructure-and-security/public-and-private-aks-clusters-demystified/ba-p/3716838).
When you define a VPC and link it to the application, it will be deployed as a private cluster using the VNET integration feature of AKS where the control plane will not be made available through a public endpoint. The `celerity.consumer.vpc.subnetType` annotation has **no** effect for AKS deployments as the networking model for Azure with it's managed Kubernetes offering is different from other cloud providers and all services running on a cluster are private by default.

Memory and CPU resources allocated to the consumer pod can be defined in the deploy configuration, if not specified, the consumer will derive memory and CPU from handlers configured for the application. If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. For production app environments, the pod that runs the consumer will be allocated a limit of 1,792MB of memory and 0.8 vCPUs. For development app environments, the pod that runs the consumer application will be allocated a limit of 870MB of memory and 0.4 vCPUs.

The [OpenTelemetry Operator](https://opentelemetry.io/docs/kubernetes/operator/) is used to configure a sidecar collector container for the consumer application to collect traces and metrics. Traces will only be collected if tracing is enabled for the handlers that process messages.

### Azure Serverless

In the Azure Serverless environment, Azure Functions are deployed for the handlers which are triggered by a queue.

When the `sourceId` is a Celerity topic, an Azure Service Bus Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The Azure Service Bus Queue will then be configured as a [trigger](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-service-bus-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cextensionv5&pivots=programming-language-csharp) for the deployed Azure Function(s).
For other event sources such as data sources or blob storage containers, either a direct trigger is set up for the consumer handlers or an integration with Service Bus is configured to be able to trigger the consumer application functions through Service Bus.

When it comes metrics and tracing for the Azure Functions that process messages, traces and metrics go to Application Insights by default, from which you can export logs, traces and metrics to other tools like Grafana with plugins that use Azure Monitor as a data source.
[OpenTelemetry for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/opentelemetry-howto?tabs=otlp-export&pivots=programming-language-csharp) is also supported for some languages, you can use the deploy configuration to enable OpenTelemetry for Azure Functions.

Consumers can be deployed to Azure Functions with Azure Service Bus Queue triggers using [deploy configuration](/cli/docs/app-deploy-configuration) for the Azure Serverless target environment.

## Configuration Mappings

### Serverless Event-Driven Flows

The following is a table of `celerity/consumer` configuration fields and how they map to different target environments when the Celerity application is deployed as a Serverless event-driven flow[^1].

<table>
    <thead>
        <tr>
        <th>Celerity Consumer</th>
        <th>AWS SQS</th>
        <th>Google Cloud Pub/Sub</th>
        <th>Azure Service Bus Queue</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>batchSize</td>
        <td>batchSize (default: `10`, min: `1`, max: `10000`)</td>
        <td>N/A</td>
        <td>maxMessagesBatchSize (default: `1000`)</td>
        </tr>
        <tr>
        <td>visibilityTimeout</td>
        <td>N/A</td>
        <td>N/A</td>
        <td>N/A</td>
        </tr>
        <tr>
        <td>waitTimeSeconds</td>
        <td>N/A</td>
        <td>N/A</td>
        <td>maxBatchWaitTime (default: `00:00:30`, max: `00:02:30`)</td>
        </tr>
        <tr>
        <td>partialFailures</td>
        <td>functionResponseTypes</td>
        <td>N/A</td>
        <td>N/A</td>
        </tr>
    </tbody>
</table>

### Dead Letter Queues

The following is a table of `celerity/consumer` configuration fields for queues or subscriptions that can be configured to send messages to a dead letter queue (DLQ) after a certain number of failed processing attempts. This applies when the `sourceId` is a Celerity topic.

For Google Cloud Pub/Sub, the DLQ is implemented as a dead letter topic that is configured for the subscription created for the consumer.

<table>
    <thead>
        <tr>
        <th>AWS SQS</th>
        <th>Google Cloud Pub/Sub</th>
        <th>Azure Service Bus Queue</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>maxReceiveCount (default: `10`)</td>
        <td>maxDeliveryAttempts (default: `5`, min: `5`, max: `100`)</td>
        <td>MaxDeliveryCount (default: `10`, max: `2000`)</td>
        </tr>
    </tbody>
</table>


### Serverless Database Streams

The following is a table of database stream configuration fields and how they map to different target environments when the Celerity application is deployed as a Serverless stream flow[^2].
Google Cloud Datastore event triggers aren't actually stream-based, but comes under database streams as is the closest analogue to DynamoDB Streams and Azure Cosmos DB Triggers.

<table>
    <thead>
        <tr>
            <th>Celerity Handler Events</th>
            <th>DynamoDB Stream Event Source for AWS Lambda</th>
            <th>Google Cloud Datastore Trigger for Cloud Functions</th>
            <th>Azure Cosmos DB Trigger for Azure Functions</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>batchSize</td>
            <td>batchSize (default: `100`, max: `10000`)</td>
            <td>N/A</td>
            <td>maxItemsPerInvocation</td>
        </tr>
        <tr>
            <td>dbStreamId</td>
            <td>eventSourceArn</td>
            <td>`{database}(:{namespace})?` (Maps to event filters)</td>
            <td>`{databaseName}:{collectionName}`</td>
        </tr>
        <tr>
            <td>partialFailures</td>
            <td>functionResponseTypes</td>
            <td>N/A</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td>startFromBeginning</td>
            <td>startingPosition = "TRIM_HORIZON"</td>
            <td>N/A</td>
            <td>startFromBeginning</td>
        </tr>
    </tbody>
</table>

### Serverless Data Streams

The following is a table of data stream configuration fields and how they map to different target environments when the Celerity application is deployed as a Serverless stream flow[^3].

<table>
    <thead>
        <tr>
            <th>Celerity Handler Events</th>
            <th>Kinesis Data Stream Event Source for AWS Lambda</th>
            <th>Azure Events Hub Trigger for Azure Functions</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>batchSize</td>
            <td>batchSize (default: `100`, max: `10000`)</td>
            <td>maxItemsPerInvocation</td>
        </tr>
        <tr>
            <td>dataStreamId</td>
            <td>eventSourceArn</td>
            <td>[Event Hub Trigger Attributes](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-hubs-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cfunctionsv2%2Cextensionv5&pivots=programming-language-csharp#attributes) - will map to a combination of attributes.</td>
        </tr>
        <tr>
            <td>partialFailures</td>
            <td>functionResponseTypes</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td>startFromBeginning</td>
            <td>startingPosition = "TRIM_HORIZON"</td>
            <td>N/A</td>
        </tr>
    </tbody>
</table>

## App Deploy Configuration

Configuration specific to a target environment can be defined for `celerity/consumer` resources in the [app deploy configuration](/cli/docs/app-deploy-configuration) file.

This section lists the configuration options that can be set in the `deployTarget.config` object in the app deploy configuration file.

### Compute Configuration

Compute configuration that can be used for the `celerity/api`, `celerity/consumer`, `celerity/schedule` and the `celerity/workflow` resource types is documented [here](/docs/applications/compute-configuration).

### Azure Configuration Options

#### azure.consumer.containerApps.minExecutions

The minimum number of executions for the consumer application when deployed to Azure Container Apps. This is used to determine the minimum number of tasks that will be running the consumer application.

This is used when the target environment is `azure` and [`azure.compute.containerService`](/docs/applications/compute-configuration#azurecomputecontainerservice) is set to `containerApps`.

**Type**

number

**Deploy Targets**

`azure`

**Default Value**

The default value is `0` for both production and development app environments.

**Example**

```json
{
  "deployTarget": {
    "name": "azure",
    "appEnv": "production",
    "config": {
      "azure.consumer.containerApps.minExecutions": 2
    }
  }
}
```

#### azure.consumer.containerApps.maxExecutions

The maximum number of executions for the consumer application when deployed to Azure Container Apps. This is used to determine the maximum number of tasks that will be running the consumer application.

This is used when the target environment is `azure` and [`azure.compute.containerService`](/docs/applications/compute-configuration#azurecomputecontainerservice) is set to `containerApps`.

**Type**

number

**Deploy Targets**

`azure`

**Default Value**

The default value is `10` for production app environments and `5` for development app environments.

**Example**

```json
{
  "deployTarget": {
    "name": "azure",
    "appEnv": "production",
    "config": {
      "azure.consumer.containerApps.maxExecutions": 10
    }
  }
}
```

[^1]: Examples of Serverless event-driven flows include [Amazon SQS Queues triggerring AWS Lambda Functions](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html), [Google Cloud Pub/Sub triggering Google Cloud Functions](https://cloud.google.com/functions/docs/calling/pubsub), and [Azure Queue Storage triggering Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-queue-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cextensionv5&pivots=programming-language-typescript).
[^2]: Examples of Serverless stream flows include [Amazon DynamoDB Streams and AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html), [Google Cloud Datastore triggering Google Cloud Functions](https://cloud.google.com/datastore/docs/extend-with-functions-2nd-gen) and [Azure Cosmos DB Streams triggering Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-cosmosdb?toc=%2Fazure%2Fcosmos-db%2Ftoc.json&bc=%2Fazure%2Fcosmos-db%2Fbreadcrumb%2Ftoc.json&tabs=csharp).
[^3]: Examples of Serverless stream flows include [Amazon Kinesis Streams and AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/with-kinesis.html) and [Azure Event Hubs triggering Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-hubs?tabs=csharp).