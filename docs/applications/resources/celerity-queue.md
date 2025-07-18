---
sidebar_position: 11
---

# `celerity/queue`

**v2026-02-28 (draft)**

**blueprint transform:** `celerity-2026-02-28`

The `celerity/queue` resource type is used to define a queue that can be used for asynchronous processing of messages in a Celerity application. This resource type is typically used in conjunction with the `celerity/consumer` resource type to process messages from the queue and a handler in any application type that can write messages to the queue.

Queues are usually used within the context of a single application to carry out asynchronous processing. For asynchronous messaging between decoupled applications, you should use a `celerity/topic` defined in a producer application or shared blueprint in conjunction with a `celerity/consumer` application.

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.
The rest of this section lists fields that are available to configure the `celerity/queue` resource followed by examples of different configurations for the resource and how queues are implemented in target environments along with additional documentation.

### name

The unique name of the queue. If a name is not provided, a unique name will be generated for the queue based on the blueprint that the queue is defined in.

Depending on the target environment, if `fifo` is set to `true`, the name must end with `.fifo` to indicate that the topic is a FIFO (first in, first out) queue.

:::warning
Depending on the target environment, when you specify a name, you may not be able to perform updates that require replacing the queue, if you need to replace the queue, you may need to specify a new name.
:::

**type**

string

### fifo

If set to `true`, the queue will be configured as a FIFO (first in, first out) queue. This means that messages are guaranteed be processed in the order they are received and that duplicates will not be introduced.

**type**

boolean

**default**

`false`

### visibilityTimeout

The time in seconds that a message is hidden from all but the current consumer after it has been received from the queue. This maps to different underlying properties for different target environments, see the [Target Environments](#target-environments) section for more details.

**type**

integer

### encryptionKeyId

The ID of the encryption key to use for encrypting messages in the queue at rest and in transit (depending on the target environment). This is an optional field and can be used to specify a custom encryption key for the queue. If not specified, default encryption will be used if the target environment comes with encryption by default.

**type**

string

**example**

`arn:aws:kms:us-east-1:123456789012:key/abcd1234-56ef-78gh-90ij-klmnopqrstuv` (AWS)

`projects/your-project-id/locations/us-east1/keyRings/your-key-ring-name/cryptoKeys/your-key-name` (Google Cloud)

`https://mykeyvault.vault.azure.net/keys/MyRSAKey/859e54971b3e4866a51595456f64f1dd` (Azure)

## Annotations

Annotations define additional metadata that can determine the behaviour of the resource in relation to other resources in the blueprint to add behaviour to a resource that is not in the spec.

### `celerity/queue` 🔗 `celerity/queue`

The following annotations determine the behaviour of a queue in relation to another queue in the blueprint.

The only supported relationship between queues is that the parent queue (defining a `linkSelector`) uses the linked to queue (matches `linkSelector` condition of parent) as a dead-letter queue after the maximum number of attempts to process a message has been reached.

#### celerity.queue.deadLetterMaxAttempts

The maximum number of attempts to process a message before it is sent to the dead letter queue. This is an optional annotation and if not specified, the default value will be used based on the target environment.
This is **only** applicable to the linked to queue that is used as a dead-letter queue for the parent queue.

**type**

integer

___

## Outputs

Outputs are computed values that are accessible via the `{resourceName}.spec.*` field accessor in a blueprint substitution.
For example, if the resource name is `myQueue`, the output would be accessible via `${myQueue.spec.id}`.

### id

The ID of the created queue in the target environment.


**type**

string

**examples**

`arn:aws:sqs:us-east-1:123456789012:my-queue` (AWS)

`projects/your-project-id/locations/us-central1/queues/my-queue` (Google Cloud)

`my-queue` (Azure)

## Linked From

#### [`celerity/handler`](/docs/applications/resources/celerity-handler)

When a queue is linked from a handler, the handler will be configured with permissions and environments to interact with the queue. If a secret store is associated with the handler or the application that is a part of, the queue configuration will be added sto the secret store instead of environment variables. You can use guides and templates to get an intuition for how to use the handlers SDK to interact with the queue or use a native SDK for the target environment.

## Links To

#### `celerity/queue`

A queue can link to another queue. The target queue will be used as a dead-letter queue for messages that cannot be processed after the maximum number of attempts have been reached by the parent queue.

:::warning
In some target environments, the dead-letter queue must match the FIFO configuration of the parent queue, so if the parent queue is a FIFO queue, the dead-letter queue must also be a FIFO queue and vice versa.
:::

#### [`celerity/consumer`](/docs/applications/resources/celerity-consumer)

A queue can link to a consumer application. The consumer application will be configured to process messages from the queue. The consumer application can be configured with a batch size to control how many messages it processes at once along with other configurations specific to consuming messages from a queue.

## Examples

### Queue with Consumer Application and DLQ

This example shows how to define a queue and a consumer application that processes messages from the queue with a dead-letter queue for messages that cannot be processed after the maximum number of attempts have been reached.

```yaml
version: 2025-05-12
transform: celerity-2026-02-28
variables:
    dbHost:
      type: string
    dbPort:
      type: number
    encryptionKeyId:
      type: string
resources:
  orderQueue:
    type: "celerity/queue"
    metadata:
      displayName: Order Queue
    linkSelector:
      byLabel:
        app: orderProcessing
    spec:
      name: "Orders"
      encryptionKeyId: "${variables.encryptionKeyId}"

  orderDLQ:
    type: "celerity/queue"
    metadata:
      displayName: Order DLQ
      labels:
        app: orderProcessing
    spec:
      name: "Orders-DLQ"
      encryptionKeyId: "${variables.encryptionKeyId}"

  orderConsumer:
    type: "celerity/consumer"
    metadata:
      displayName: Order Consumer
      labels:
        app: orderProcessing
    linkSelector:
      byLabel:
        app: orderProcessing
    spec:
      batchSize: 10

  handler:
    type: "celerity/handler"
    metadata:
      displayName: Order Handler
      labels:
        app: orderProcessing
    spec:
      handlerName: "SyncOrders-Handler-v1"
      codeLocation: "handlers/orders"
      handler: "sync"
      runtime: "python3.13.x"
      memory: 512
      timeout: 30
      tracingEnabled: false
      environmentVariables:
        DB_HOST: "${variables.dbHost}"
        DB_PORT: "${variables.dbPort}"
```

## Target Environments

### Celerity::1

In the Celerity::1 local environment, a queue is implemented as a [stream](https://valkey.io/topics/streams-intro/) in Valkey. Using a stream allows for reliable message delivery that provides parity with the behaviour of cloud queue services. The consumer will treat the stream as a queue by keeping track of an ID for the last message processed, this ID is stored as a key/value pair in the same valkey instance. On initialisation, the consumer reads the last processed ID from valkey and starts consuming messages from the stream that have an ID greater than the last processed ID. The last processed ID is set after each message has been successfully processed by a handler in the consumer application.

A consumer of the queue will receive messages in the order they were aded to the stream, configuring FIFO (first in, first out) is not supported in the Celerity::1 local environment.

A visibility timeout (or lock duration) is implemented by using a Valkey list to store the IDs of messages that are currently being processed by a given consumer, where the consumer has an ID that is used to form the key for the list.

A single instance of a valkey server is shared across the `celerity/topic`, `celerity/queue` and `celerity/cache` resource types in a Celerity application.

:::warning No encryption in local & ci environments
Queue messages ar enot encrypted at rest in local & CI envrionments, the `encryptionKeyId` field is not used.
:::

### AWS

In the AWS environment, a queue is implemented as an [Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html) queue.

The message retention period for SQS queues is set to 4 days by default, but can be configured in the [`app deploy configuration`](#aws-configuration-options) file.

When a queue is configured to be a FIFO (first in, first out) queue, the name of the queue must end with `.fifo` to indicate that it is a FIFO queue. This is a requirement of SQS.

The maximum message size for SQS queues is `262,144` bytes (256 KiB) which is the default maximum message size and the maximum size that can be configured for a queue. This can be reduced to a minimum of `1,024` bytes (1 KiB) if needed in the [`app deploy configuration`](#aws-configuration-options) file.

The `visibilityTimeout` in the queue spec maps to the `VisibilityTimeout` property of the SQS queue.

When a queue is configured as the dead-letter queue for another queue, it will be configured in the redrive policy of the parent queue. The dead-letter queue must match the FIFO configuration of the parent queue, so if the parent queue is a FIFO queue, the dead-letter queue must also be a FIFO queue and vice versa.

### Google Cloud

In the Google Cloud environment, a queue is either implemented with [Google Cloud Pub/Sub](https://cloud.google.com/pubsub/docs) or [Google Cloud Tasks](https://cloud.google.com/tasks/docs).

#### Pub/Sub

A queue is implemented with Google Cloud Pub/Sub when the queue is configured to be FIFO as only Pub/Sub supports FIFO semantics in Google Cloud with [ordering keys](https://cloud.google.com/pubsub/docs/ordering). A queue is also implemented with Google Cloud Pub/Sub when the queue is a part of a dead-letter queue link. In these cases, a Pub/Sub topic is created with a subscription that are combined to act as a queue.

The maximum size for a message is fixed at `10 MB`, with a request limit of `10 MB` and a maximum message size of `1,000` messages per request.

Message retention can be configured for topics in Google Cloud Pub/Sub, with a default of `7 days` and a maximum of `31 days`. This can be configured in the [`app deploy configuration`](#google-cloud-configuration-options) file.

The `visibilityTimeout` in the queue spec is not applicable for Pub/Sub queues as they are pull-based and do not have a visibility timeout. Instead, the subscription will be configured with a `ackDeadline` that determines how long a message will be retained in the subscription before it is considered unacknowledged and can be redelivered.

When a `celerity/queue` is configured to be a dead-letter queue for another, when deployed to Google Cloud Pub/Sub, it will be configured as a dead-letter topic configured at the subscription level for the Celerity consumer(s) that process messages from the queue.

#### Cloud Tasks

A queue is implemented with Google Cloud Tasks when the queue is not configured to be FIFO and is not part of a dead-letter queue link. In this case, the queue is created as a Cloud Tasks queue with a push integration via a webhook to the consumer application that processes messages from the queue. The Celerity runtime will configure a webhook endpoint in the consumer application to receive messages from the Cloud Tasks queue.

You can find a detailed comparison of the two services [here](https://cloud.google.com/tasks/docs/comp-pub-sub#detailed-feature-comparison). If you don't require FIFO semantics but Cloud Tasks is not suitable for your use case, you should consider using a `celerity/topic` instead of a queue.

The maximum size for a message in Cloud Tasks is fixed at `1 MB`.

The message retention period for Cloud Tasks is 30 days and cannot be configured.

As Cloud Tasks is a push-based service with a single target, the `visibilityTimeout` in the queue spec is not applicable.

There is no support for dead-letter queues in Cloud Tasks, when a relationship is identified in a blueprint that indicates that a queue is a dead-letter queue for another queue, Celerity will opt to use Pub/Sub instead of Cloud Tasks for the queue.

### Azure

In the Azure environment, a queue is implemented as an [Azure Service Bus queue](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions).
Due to the many advantanges of Azure Service Bus queues over Azure Storage queues, Celerity only supports Service Bus queues for the `celerity/queue` resource type.
See the comparison of the two services [here](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-azure-and-service-bus-queues-compared-contrasted).
If you need queues that are large in capacity (above `80 GB`), you should consider building a custom solution using Azure Storage queues that is either completely vendor-specific or integrates with a Celerity application through an API endpoint or a `celerity/topic`.

For the standard messaging tier, the maximum message size is `256 KB`. For the premium messaging tier, the maximum message size can be up to `100 MB`. The maximum message size can be configured in the [`app deploy configuration`](#azure-configuration-options) file but is dependent on the messaging tier that is used for the queue.

The `visibilityTimeout` in the queue spec maps to the `LockDuration` property of the Azure Service Bus queue.

When a `celerity/queue` is configured to be a dead-letter queue for another, when deployed to Azure Service Bus, it will be configured as a dead-letter queue configured at the subscription level for the Celerity consumer(s) that process messages from the queue.

## App Deploy Configuration

### AWS Configuration Options

#### aws.sqs.messageRetentionPeriod

The message retention period for SQS queues in AWS, in seconds.
This can be a period ranging from `60` to `1,209,600` seconds (1 minute to 14 days).

**Type**

integer

**Deploy Targets**

`aws`, `aws-serverless`

**Default Value**

`345,600` (4 days)

**Minimum Value**

`60`

**Maximum Value**

`1,209,600` (14 days)

**Example**

```javascript
{
  "deployTarget": {
    "name": "aws",
    "appEnv": "production",
    "config": {
        "aws.sqs.messageRetentionPeriod": 3600 // 1 day
    }
  }
}
```

#### aws.sqs.\<queue\>.messageRetentionPeriod

The message retention period for a specific SQS queue in AWS, in seconds.
This can be a period ranging from `60` to `1,209,600` seconds (1 minute to 14 days).
`<queue>` is the name (key) of the queue resource in the blueprint, not the queue name in AWS.

**Type**

integer

**Deploy Targets**

`aws`, `aws-serverless`

**Default Value**

`345,600` (4 days)

**Minimum Value**

`60`

**Maximum Value**

`1,209,600` (14 days)

**Example**

```javascript
{
  "deployTarget": {
    "name": "aws",
    "appEnv": "production",
    "config": {
        "aws.sqs.myQueue.messageRetentionPeriod": 3600 // 1 day
    }
  }
}
```

#### aws.sqs.maxMessageSize

The limit of how many bytes that a message can contain before Amazon SQS will reject the message.
This can be a value ranging from `1,024` to `262,144` bytes (1 KiB to 256 KiB).

**Type**

integer

**Deploy Targets**

`aws`, `aws-serverless`

**Default Value**

`262,144` (256 KiB)

**Minimum Value**

`1,024` (1 KiB)

**Maximum Value**

`262,144` (256 KiB)

**Example**

```javascript
{
  "deployTarget": {
    "name": "aws",
    "appEnv": "production",
    "config": {
        "aws.sqs.maxMessageSize": 1024 // 1 KiB
    }
  }
}
```

#### aws.sqs.\<queue\>.maxMessageSize

The limit of how many bytes that a message can contain before Amazon SQS will reject the message for a specific queue.
This can be a value ranging from `1,024` to `262,144` bytes (1 KiB to 256 KiB).
`<queue>` is the name (key) of the queue resource in the blueprint, not the queue name in AWS.

**Type**

integer

**Deploy Targets**

`aws`, `aws-serverless`

**Default Value**

`262,144` (256 KiB)

**Minimum Value**

`1,024` (1 KiB)

**Maximum Value**

`262,144` (256 KiB)

**Example**

```javascript
{
  "deployTarget": {
    "name": "aws",
    "appEnv": "production",
    "config": {
        "aws.sqs.myQueue.maxMessageSize": 1024 // 1 KiB
    }
  }
}
```

TODO: add more configuration options for AWS SQS queues.

### Google Cloud Configuration Options


#### gcloud.pubsub.topicAsQueue.messageRetentionPeriod

The message retention period for Google Cloud Pub/Sub topics used for queues.
You can disable message retention by setting this property to `disabled`.

**Type**

string

**Deploy Targets**

`gcloud`, `gcloud-serverless`

**Default Value**

`7d`

**Minimum Value**

`10m`

**Maximum Value**

`31d`

**Example**

```javascript
{
  "deployTarget": {
    "name": "gcloud",
    "appEnv": "production",
    "config": {
        "gcloud.pubsub.topicAsQueue.messageRetentionPeriod": "14d"
    }
  }
}
```

#### gcloud.pubsub.topicAsQueue.\<queue\>.messageRetentionPeriod

The message retention period for a specific Google Cloud Pub/Sub topic used for queues.
`<queue>` is the name (key) of the queue resource in the blueprint, not the topic name in Google Cloud.

You can disable message retention by setting this property to `disabled`.

**Type**

string

**Deploy Targets**

`gcloud`, `gcloud-serverless`

**Default Value**

`7d`

**Minimum Value**

`10m`

**Maximum Value**

`31d`

**Example**

```javascript
{
  "deployTarget": {
    "name": "gcloud",
    "appEnv": "production",
    "config": {
        "gcloud.pubsub.topicAsQueue.myQueue.messageRetentionPeriod": "14d"
    }
  }
}
```

TODO: add more configuration options for Google Cloud Pub/Sub and Cloud Tasks queues.

### Azure Configuration Options

TODO: add configuration options for Azure Service Bus queues and Azure Storage queues.
