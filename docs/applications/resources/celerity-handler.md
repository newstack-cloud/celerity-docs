---
sidebar_position: 5
---

# `celerity/handler`

**v2026-02-01 (draft)**

**blueprint transform:** `celerity-2026-02-01`

The `celerity/handler` resource type is used to define a handler that can carry out a step in a workflow, process HTTP requests, WebSocket messages, or events from queues/message brokers, scheduled events, or cloud services.

Handlers can be deployed to different target environments such as FaaS[^1], containerised environments, or custom servers.
For containerised and custom server environments, the Celerity runtime is responsible for setting up the appropriate server or polling mechanism to handle incoming requests or messages and route them to the appropriate handler.

In addition to being wired up to `celerity/*` resource types in the [linked from](#linked-from) section, handlers can be configured to respond to specific events in cloud services such as object storage, database streams, and other services where the event source is created outside of the blueprint; the `events` property of a handler is used to wire it up to these event sources created outside of a blueprint.

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.

### handlerName

The name to identify the handler that will be loaded by the runtime.
In FaaS[^1] target environments this will be the name of the function resource in the cloud provider.

**type**

string

**examples**

`Orders-SaveOrder-v1`


### codeLocation (required)

The location of the handler code that will be loaded by the runtime,
this can be a directory or a file path without the file extension.
In an OS-only runtime, this is expected to be a directory containing the handler binary.

**type**

string

**examples**

`./handlers`

### handler (required)

The name of the handler function that will be loaded by the runtime.
In an OS-only runtime, this is expected to be the name of the handler binary.

**type**

string

**examples**

`save_order`

### runtime (required)

The runtime that the handler will run in.
This can be any one of the [supported runtimes](#runtimes) depending on the chosen
target environment.

:::warning Using multiple runtimes in an application
When deploying your application to containerised or custom server environments, it is **not** possible to use different runtimes for different handlers in the same application.
:::

**type**

string

**examples**

`python3.13.x`

### memory

The amount of memory available to the handler at runtime. The default value is 512MB.
This value is used to configure the amount of memory available to the handler in a FaaS[^1] target environment. In containerised or custom server environments, the highest value across all handlers will be used as a guide to configure the memory available to the runtime.

The minimum and maximum values available depend on the target environment.

**type**

`integer`

**default value**

`512`

**examples**

`1024`

### timeout

The maximum amount of time in seconds that the handler can run for before being terminated.
This defaults to 30 seconds.

The minimum and maximum values available depend on the target environment.

**type**

`integer`

**default value**

`30`

### tracingEnabled

Whether or not to enable tracing for the handler.
The tracing behaviour will vary depending on the target environment.
Tracing is not enabled by default.

**type**

`boolean`

**default value**

`false`

### environmentVariables

A mapping of environment variables that will be available to the handler at runtime.
When a Celerity application is deployed to containerised or custom server environments, environment variables shared between functions will be merged and made available to the runtime.

:::warning
If you define an environment variable with the same key in multiple handlers, the value of the environment variable will be taken from the last handler that is loaded by the runtime.
:::

**type**

mapping[string, string]

**examples**

```yaml
environmentVariables:
  DB_HOST: "${variables.dbHost}"
  DB_PORT: "${variables.dbPort}"
```

### events

A mapping of cloud service event configurations that the handler will respond to,
this can include events from object storage, databases, and other services.
Depending on the target environment, the handler will be wired up to the appropriate event source (e.g. AWS S3, Google Cloud Storage, Azure Blob Storage).

**type**

mapping[string, [eventConfiguration](#eventconfiguration)]

## Annotations

Annotations define additional metadata that can determine the behaviour of the resource in relation to other resources in the blueprint or to add behaviour to a resource that is not in its spec.

### `celerity/api` 🔗 `celerity/handler`

The following are a set of annotations that activate a link that can be used to configure a handler to respond to HTTP requests or WebSocket messages for a Celerity API.

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.http</strong></p>

Enables the handler to respond to HTTP requests for a Celerity API.

**type**

boolean
___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.http.method</strong></p>

The HTTP method that the handler will respond to.

**type**

string

**allowed values**

`GET` | `POST` | `PUT` | `PATCH` | `DELETE` | `OPTIONS` | `HEAD` | `CONNECT` | `TRACE`

**default value**

`GET`

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.http.path</strong></p>

The HTTP path that the handler will respond to, this can include path parameters.
Path parameters are defined using curly braces `{}`.
For example, when defining a path parameter for an order ID, the path could be `/orders/{order_id}`.
Wildcard paths are supported to capture multiple path segments after a prefix such as `/{proxy+}` or `/api/v1/{proxy+}`.

**type**

string

**examples**

`/orders`

`/orders/{order_id}`

`/{proxy+}`

`/api/v1/{proxy+}`

**default value**

`/`

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.websocket</strong></p>

Enables the handler to respond to WebSocket messages for a Celerity API.

**type**

boolean
___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.websocket.route</strong></p>

The route that the handler will respond to for WebSocket messages.
This is the value of the configured `routeKey` of a WebSocket API.

A WebSocket API comes with predefined connection life cycle route keys and a default route key to fall back to  `$connect`, `$disconnect`, and `$default`.

**type**

string

**default value**

`$default`

**examples**

`$connect`

`$disconnect`

`myAction`
___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.guard.protectedBy</strong></p>

Enables the handler to use a specified guard for incoming requests.
The guard must be defined in the linked `celerity/api` resource.
This is only supported for HTTP handlers, WebSockets are authenticated at the connection level.

**type**

string
___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.guard.custom</strong></p>

Marks the handler to be used as a custom guard for incoming requests or messages.

**type**

boolean

### `celerity/queue` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.queue</strong></p>

Marks the handler to be used with a queue for handling messages from the queue.
This is only required when there is ambiguity where a handler is linked from multiple resources in a blueprint (e.g. a schedule, API and queue). If the handler is only linked to a queue, this annotation is not required and the default behaviour is to use the handler with the queue.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.queue.batchSize</strong></p>

The size of the batch of messages to retrieve from the queue. This value is used to configure the maximum
number of messages to retrieve in a single poll operation. Depending on the target environment, this value will be limited to different maximum values and may be ignored.

**type**

integer

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.queue.visibilityTimeout</strong></p>

The time in seconds that a message is hidden from other consumers after being retrieved from the queue.
Depending on the target environment, the value may be ignored.

**type**

integer

**default value**

An appropriate default value for the target environment is used.

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.queue.waitTimeSeconds</strong></p>

The time in seconds to wait for messages to become available in the queue before polling again.
Depending on the target environment, this value may be ignored.

**type**

integer

**default value**

An appropriate default value for the target environment is used.

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.queue.partialFailures</strong></p>

Whether partial failure reporting is supported. When enabled, the handler integration will report partial failures to the source queue, meaning that only failed messages will be retried.

This is only supported in some target environments.

**type**

boolean

**default value**

`false`

### `celerity/schedule` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.schedule</strong></p>

Marks the handler to be used with a schedule for handling scheduled events.
This is only required when there is ambiguity where a handler is linked from multiple resources in a blueprint (e.g. a consumer, API and schedule). If the handler is only linked to a schedule, this annotation is not required and the default behaviour is to use the handler with the schedule.

You should avoid using the same `linkSelector` for multiple schedules to avoid associating the wrong handler with a schedule, instead, it is best to be specific
in selecting the handler to associate with a schedule.

**type**

boolean

### `celerity/datastore` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.datastore</strong></p>

Marks the handler to be used with a NoSQL data store stream or trigger (e.g. DynamoDB stream) for handling events in the data store.
This is only required when there is ambiguity where a handler is linked from multiple resources in a blueprint (e.g. a consumer, API and data store). If the handler is only linked to a data store, this annotation is not required and the default behaviour is to use the handler with the data store.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.datastore.batchSize</strong></p>

The size of the batch of events to retrieve from the data store stream/trigger. The maximum value depends on the target environment.

**type**

integer

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.datastore.partialFailures</strong></p>

Whether partial failure reporting is supported. When enabled, the handler integration will report partial failures to the data store, meaning that only failed messages will be retried.

This is only supported in some target environments.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.datastore.startFromBeginning</strong></p>

Whether the handler should start processing events from the beggining of a stream (or earliest available point).

This is only supported in some target environments.

**type**

boolean

### `celerity/bucket` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.bucket</strong></p>

Marks the handler to be used with an object storage bucket for handling events from the bucket.
This is only required when there is ambiguity where a handler is linked from multiple resources in a blueprint (e.g. a consumer, API and bucket). If the handler is only linked to a bucket, this annotation is not required and the default behaviour is to use the handler with the bucket.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.bucket.events</strong></p>

The object storage events that should trigger the handler.

**type**

string - Comma-separated list of events

**allowed values**

`created` | `deleted` | `metadataUpdated`

**examples**

`created,deleted`

### `celerity/consumer` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.consumer</strong></p>

Marks the handler to be used with a consumer for incoming messages from a queue or message broker.
This is only required when there is ambiguity where a handler is linked to any combination of consumers, apis or schedules. If the handler is only linked to consumers, this annotation is not required and the default behaviour is to use the handler with the consumer.

**type**

boolean

### `celerity/workflow` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.workflow</strong></p>

Marks the handler to be used as a step in a workflow; a step in this context is a state of type `executeStep` in a workflow.
This is only required when there is ambiguity where a handler is linked from multiple resources in a blueprint (e.g. a consumer, API and workflow). If the handler is only linked to a workflow, this annotation is not required and the default behaviour is to use the handler with the workflow.

**type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.workflow.state</strong></p>

The unique name of the state that the handler will be used to execute in the workflow.
The state in the workflow must be of the `executeStep` type.

**type**

string

### `celerity/vpc` 🔗 `celerity/handler`

<p style={{fontSize: '1.2em'}}><strong>celerity.handler.vpc.subnetType</strong></p>

The type of subnet that the handler will be deployed to in a VPC.
This is only supported for serverless target environments where functions can be deployed to specific VPCs.

**type**

string

**allowed values**

`public` | `private`

**default value**

`public`

## Outputs

### id

The unique identifier of the handler resource.
For serverless environments, this will a unique ID for a function such as an AWS Lambda function ARN.
For containerised or custom server environments where handlers are loaded into the runtime in a single process, this will be the same value as the `spec.handlerName` field.

**type**

string

**examples**

`arn:aws:lambda:us-east-2:123456789012:function:example-handler-v1` (AWS Serverless)

`projects/123456789/locations/us-east1/functions/example-handler-v1` (Google Cloud Serverless)

`example-handler-v1` (Custom Server or Containerised Environment)

## Data Types

### eventConfiguration

Configuration for a cloud service event trigger that the handler will respond to.
This supports a limited set of event sources, such as object storage, NoSQL database streams/events, data streams and a few other services.

Due to the differences in event sources across cloud providers, the amount of options is kept minimal and as general as possible to support the most common event sources.

:::note
Blueprints with one or more handlers that all are configured with an event source directly do not need to have an application resource type defined. In containerised environments, the behaviour for the application that hosts the handlers will be configured to be that of the `celerity/consumer` resource type. This is because the handlers will be wired up to a queue or message broker that is polled by the runtime; at deploy time the queue or message broker is wired up to handle incoming messages from the external event sources.
:::

To support the a wider range of event sources, you will need to wire up an event source to a queue or message broker and use a `celerity/consumer` resource to handle the events.

#### FIELDS
___

<p style={{fontSize: '1.2em'}}><strong>sourceType (required)</strong></p>

The type of event source that the handler will respond to.

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

Configuration for an object storage event trigger that the handler will respond to.
This supports object storage services such as AWS S3, Google Cloud Storage, and Azure Blob Storage based on the target environment.

#### FIELDS
___

<p style={{fontSize: '1.2em'}}><strong>events (required)</strong></p>

The object storage events that should trigger the handler.

**field type**

array[string]

**allowed values**

`created` | `deleted` | `metadataUpdated`

**examples**

`["created", "deleted"]`
___


<p style={{fontSize: '1.2em'}}><strong>bucket (required)</strong></p>

The name of the bucket that the handler will respond to events from.

**field type**

string

**examples**

`order-invoice-bucket`
___

### dbStreamConfiguration

Configuration for a database stream event trigger that the handler will respond to.
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

The ID of the database stream that the handler will respond to events from.
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

Whether the handler should start processing events from the beginning of the stream (or earliest available point).

This is only supported in some target environments, see the [configuration mappings](#serverless-database-streams) section for more details.

**type**

boolean
___

### dataStreamConfiguration

Configuration for data stream event triggers that the handler will respond to.
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

The ID of the data stream that the handler will respond to events from.
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

Whether the handler should start processing events from the beginning of the stream (or earliest available point).

This is only supported in some target environments, see the [configuration mappings](#serverless-data-streams) section for more details.

**type**

boolean
___

## Linked From

#### [`celerity/api`](/docs/applications/resources/celerity-api)

When a handler is linked from an API, it will be used to respond to incoming HTTP requests or WebSocket messages. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the API.

#### [`celerity/queue`](/docs/applications/resources/celerity-queue)

When a handler is linked from a queue, it will be used to process messages from the queue. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the queue.

#### [`celerity/schedule`](/docs/applications/resources/celerity-schedule)

When a handler is linked from a schedule, it will be invoked by the scheduled trigger. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the schedule.

#### [`celerity/datastore`](/docs/applications/resources/celerity-datastore)

When a handler is linked from a datastore, it will be used to process events from the data store. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the datastore.

#### [`celerity/bucket`](/docs/applications/resources/celerity-bucket)

When a handler is linked from a bucket, it will be used to process events from the bucket. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the bucket.

#### [`celerity/consumer`](/docs/applications/resources/celerity-consumer)

When a handler is linked to a consumer, it will be used to process messages received from the external queue or message broker defined in the consumer. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the consumer.

#### [`celerity/workflow`](/docs/applications/resources/celerity-workflow)

When a handler is linked to a workflow, it will be used to execute a step in the workflow. The configuration defined in the handler annotations determines the behaviour of the handler in respect to the workflow.

#### [`celerity/vpc`](/docs/applications/resources/celerity-vpc)

When deploying handlers as serverless functions, individual handlers may be deployed to specific VPCs for private access.
When handlers are a part of a containerised or custom server application, the VPC associated with the application will be used and any links from VPCs to handlers will be ignored.

## Links To

#### [`celerity/queue`](/docs/applications/resources/celerity-queue)

When a handler links out to a queue, it will be configured with permissions and environment variables to interact with the queue. If a secret store is associated with the handler or the application that it is a part of, the queue configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to use the handlers SDK to interact with the queue. 

:::warning Opting out of the handlers SDK for queues
You don't have to use the handlers SDK abstraction for queues,
you can also grab the populated configuration directly and interact directly with the SDK for the queue service for the chosen target environment. Doing so will require application code changes if you decide to switch target environments.
:::

#### [`celerity/topic`](/docs/applications/resources/celerity-topic)

When a handler links out to a topic, it will be configured with permissions and environment variables that enable the handler to publish messages to the topic. If a secret store is associated with the handler or the application that it is a part of, the topic configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to use the handlers SDK to publish messages to a topic.

:::warning Opting out of the handlers SDK for topics
You don't have to use the handlers SDK abstraction for topics,
you can also grab the populated configuration directly and interact directly with the SDK for the pub/sub or messaging service for the chosen target environment. Doing so will require application code changes if you decide to switch target environments.
:::

#### [`celerity/datastore`](/docs/applications/resources/celerity-datastore)

When a handler links out to a NoSQL data store, it will be configured with permissions and environment variables that enable the handler to interact with the data store. If a secret store is associated with the handler or the application that it is a part of, the data store configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to source the configuration and interact with data store services using SDKs or libraries for the NoSQL data store service for the chosen target environment.

#### [`celerity/sqlDatabase`](/docs/applications/resources/celerity-sql-database)

When a handler links out to an SQL database, it will be configured with permissions and environment variables that enable the handler to interact with the data store. If a secret store is associated with the handler or the application that it is a part of, the SQL database configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to source the configuration and interact with SQL databases using SDKs or libraries for the SQL database service for the chosen target environment.

#### [`celerity/bucket`](/docs/applications/resources/celerity-bucket)

When a handler links out to a bucket, it will be configured with permissions and environment variables that enable the handler to interact with the bucket. If a secret store is associated with the handler or the application that it is a part of, the bucket configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to source the configuration and interact with object storage services using the handlers SDK.

:::warning Opting out of the handlers SDK for buckets
You don't have to use the handlers SDK abstraction for buckets,
you can also grab the populated configuration directly and interact directly with the SDK for the object storage service for the chosen target environment. Doing so will require application code changes if you decide to switch target environments.
:::

#### [`celerity/cache`](/docs/applications/resources/celerity-cache)

When a handler links out to a cache, it will be configured with permissions and environment variables that enable the handler to interact with the cache. If a secret store is associated with the handler or the application that it is a part of, the cache configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to source the configuration and interact with cache services using libraries that are compatible with the Redis 7.2.4 API, as all cache services supported by Celerity are compatible with the Redis 7.2.4 API.

:::note
Redis 7.2.4 was the last open-source version of Redis before the Redis Labs license change.
Celerity supports cache services that are compatible with the Redis 7.2.4 API.
:::

#### [`celerity/workflow`](/docs/applications/resources/celerity-workflow)

When a handler links out to a workflow, it will be configured with permissions and environment variables that enable the handler to trigger the workflow. If a secret store is associated with the handler or the application that it is a part of, the workflow configuration will be added to the secret store instead of environment variables. You can use guides and templates to get an intuition for how to source the configuration and trigger the workflow using the handlers SDK.

:::warning Opting out of the handlers SDK for workflows
You don't have to use the handlers SDK abstraction for workflows,
you can also grab the populated configuration directly and interact directly with the SDK for the workflow service for the chosen target environment. Doing so will require application code changes if you decide to switch target environments.
For example, you can use the AWS Step Functions SDK to trigger a workflow in AWS Step Functions but this will not translate to Google Cloud Workflows, Azure Logic Apps or the Celerity Workflow runtime.
:::

#### [`celerity/config`](/docs/applications/resources/celerity-config)

When a handler links out to a secret and configuration store, it will be configured with permissions and environment variables that will enable the handler to fetch secrets and configuration. These values will be fetched and passed into your handlers when they are created with the handlers SDK.

## Sharing Handler Configuration

There are often times when you want to share common configuration across multiple handlers.
Examples of shared configuration include environment variables, runtime, memory, and timeout values.

There are multiple approaches to sharing handler configuration in a Celerity application blueprint:

1. Use a `celerity/handlerConfig` resource type to define shared handler configuration and link it to specific handlers. This approach is useful when you want different groups of handlers to share different configurations.
2. Use a `metadata` field in the blueprint to define shared handler configuration that is applied to all handlers in the blueprint. This approach is useful when you want all handlers in the blueprint to share the same configuration.

For approach 1, see the [celerity/handlerConfig](/docs/applications/resources/celerity-handler-config) resource type documentation.

For approach 2, you would define a metadata section in the blueprint like this:

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
resources:
   # ...
metadata:
    sharedHandlerConfig:
        runtime: python3.13.x
        memory: 256
        timeout: 60
        environmentVariables:
            DB_HOST: "${variables.dbHost}"
            DB_PORT: "${variables.dbPort}"
```

In the above example, all handlers in the blueprint will share the same runtime, memory, timeout, and environment variables unless they are overridden in the handler definition.

The shared handler config has the same structure as the `spec` field of the `celerity/handlerConfig` resource type. You can find the available fields by taking a look at the [specification](/docs/applications/resources/celerity-handler-config#specification) section of the `celerity/handlerConfig` documentation.

## Examples

The following set of examples include different configurations for the `celerity/handler` resource type
along with resource types that can be linked to the handler resource type to add more context.

### Handlers for a HTTP API

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    ordersApi:
        type: "celerity/api"
        metadata:
            displayName: Orders API
        linkSelector:
            byLabel:
                application: "orders"
        spec:
            # API spec configuration ...

    saveOrderHandler:
        type: "celerity/handler"
        metadata:
            displayName: Save Order Handler
            annotations:
                celerity.handler.http: true
                celerity.handler.http.method: "POST"
                celerity.handler.http.path: "/orders"
                celerity.handler.guard.protectedBy: "authGuard"
            labels:
                application: "orders"
        spec:
            handlerName: "SaveOrderHandler-v1"
            codeLocation: "handlers/orders"
            handler: "save_order"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
    
    authoriseHandler:
        type: "celerity/handler"
        metadata:
            displayName: Authorise Handler
            annotations:
                celerity.handler.http: true
                celerity.handler.guard.custom: true
            labels:
                application: "orders"
        spec:
            handlerName: "AuthoriseHandler-v1"
            codeLocation: "handlers/auth"
            handler: "authorise"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
```

### Handlers for a WebSocket API

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    ordersApi:
        type: "celerity/api"
        metadata:
            displayName: Order Stream API
        linkSelector:
            byLabel:
                application: "orderStream"
        spec:
            # API spec configuration ...

    streamOrderHandler:
        type: "celerity/handler"
        metadata:
            displayName: Order Stream Handler
            annotations:
                celerity.handler.websocket: true
                celerity.handler.websocket.route: "orderStream"
            labels:
                application: "orders"
        spec:
            handlerName: "StreamOrdersHandler-v1"
            codeLocation: "handlers/orders"
            handler: "stream_orders"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
    
    authoriseHandler:
        type: "celerity/handler"
        metadata:
            displayName: Authorise Handler
            annotations:
                celerity.handler.websocket: true
                celerity.handler.guard.custom: true
            labels:
                application: "orders"
        spec:
            handlerName: "AuthoriseHandler-v1"
            codeLocation: "handlers/auth"
            handler: "authorise"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
```

### Handlers for a Message Queue

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    ordersQueue:
        type: "celerity/queue"
        metadata:
            displayName: Orders Queue
        linkSelector:
            byLabel:
                application: "ordersProcessing"
        spec:
            # Queue configuration ...

    orderProcessor:
        type: "celerity/handler"
        metadata:
            displayName: Order Processor
            annotations:
                celerity.handler.queue.batchSize: 10
                celerity.handler.queue.visibilityTimeout: 30
                celerity.handler.queue.waitTimeSeconds: 10
                celerity.handler.queue.partialFailures: true
            labels:
                application: "ordersProcessing"
        spec:
            handlerName: "OrderProcessor-v1"
            codeLocation: "handlers/orders"
            handler: "orders_processor"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
```

### Handlers for a Pub/Sub System

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    orderUpdatesConsumer:
        type: "celerity/consumer"
        metadata:
            displayName: Order Updates Consumer
        linkSelector:
            byLabel:
                application: "orderUpdates"
        spec:
            # Consumer configuration ...

    orderUpdateHandler:
        type: "celerity/handler"
        metadata:
            displayName: Order Update Handler
            labels:
                application: "orderUpdates"
        spec:
            handlerName: "OrderUpdateHandler-v1"
            codeLocation: "handlers/orders"
            handler: "order_update_processor"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
```

### Handlers for a Data Store Stream

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    ordersTable:
        type: "celerity/datastore"
        metadata:
            displayName: Orders Table
        linkSelector:
            byLabel:
                application: "orders"
        spec:
            # Queue configuration ...

    orderEventProcessor:
        type: "celerity/handler"
        metadata:
            displayName: Order Event Processor
            annotations:
                celerity.handler.datastore.batchSize: 10
                celerity.handler.datastore.partialFailures: true
                celerity.handler.datastore.startFromBeginning: true
            labels:
                application: "orders"
        spec:
            handlerName: "OrderEventProcessor-v1"
            codeLocation: "handlers/orders"
            handler: "order_event_processor"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
```

### Handlers for a Hybrid Application (Pub/Sub, HTTP, WebSocket)

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    ordersApi:
        type: "celerity/api"
        metadata:
            displayName: Orders API
        linkSelector:
            byLabel:
                application: "orders"
        spec:
            # API spec configuration ...

    orderUpdatesConsumer:
        type: "celerity/consumer"
        metadata:
            displayName: Order Updates Consumer
        linkSelector:
            byLabel:
                application: "orders"
        spec:
            # Consumer configuration ...

    streamOrderHandler:
        type: "celerity/handler"
        metadata:
            displayName: Order Stream Handler
            annotations:
                celerity.handler.websocket: true
                celerity.handler.websocket.route: "orderStream"
            labels:
                application: "orders"
        spec:
            handlerName: "StreamOrdersHandler-v1"
            codeLocation: "handlers/orders"
            handler: "stream_orders"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"

    saveOrderHandler:
        type: "celerity/handler"
        metadata:
            displayName: Save Order Handler
            annotations:
                celerity.handler.http: true
                celerity.handler.http.method: "POST"
                celerity.handler.http.path: "/orders"
                celerity.handler.guard.protectedBy: "authGuard"
            labels:
                application: "orders"
        spec:
            handlerName: "SaveOrderHandler-v1"
            codeLocation: "handlers/orders"
            handler: "save_order"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
    
    authoriseHandler:
        type: "celerity/handler"
        metadata:
            displayName: Authorise Handler
            annotations:
                celerity.handler.http: true
                celerity.handler.websocket: true
                celerity.handler.guard.custom: true
            labels:
                application: "orders"
        spec:
            handlerName: "AuthoriseHandler-v1"
            codeLocation: "handlers/auth"
            handler: "authorise"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false

    orderUpdateHandler:
        type: "celerity/handler"
        metadata:
            displayName: Order Update Handler
            annotations:
                celerity.handler.consumer: true
            labels:
                application: "orders"
        spec:
            handlerName: "OrderUpdateHandler-v1"
            codeLocation: "handlers/orders"
            handler: "order_update_processor"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
```

### Handlers for Scheduled Events

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    syncOrdersSchedule:
        type: "celerity/schedule"
        metadata:
            displayName: Sync Orders Schedule
        linkSelector:
            byLabel:
                application: "syncOrders"
        spec:
            # Schedule configuration ...

    syncOrdersHandler:
        type: "celerity/handler"
        metadata:
            displayName: Sync Orders Handler
            labels:
                application: "syncOrders"
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

### Handlers for Cloud Object Storage Events (External)

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    invoiceHandler:
        type: "celerity/handler"
        metadata:
            displayName: Invoice Handler
        spec:
            handlerName: "Invoice-Handler-v1"
            codeLocation: "handlers/invoices"
            handler: "invoice_handler"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            events:
                sourceType: "objectStorage"
                sourceConfiguration:
                    events: ["created", "deleted"]
                    bucket: "order-invoice-bucket"
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
```

### Handlers for Data Streams (External)

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    # Variable definitions ...
resources:
    orderEventHandler:
        type: "celerity/handler"
        metadata:
            displayName: Order Event Handler
        spec:
            handlerName: "OrderEvent-Handler-v1"
            codeLocation: "handlers/orders"
            handler: "event_handler"
            runtime: "python3.13.x"
            memory: 512
            timeout: 30
            tracingEnabled: false
            events:
                sourceType: "dataStream"
                sourceConfiguration:
                    batchSize: 100
                    # Hard-coding the ID of the data stream like this would couple your application
                    # to an AWS target environment, it would be better to parameterise
                    # the stream ID by passing it in as a variable.
                    dataStreamId: "arn:aws:kinesis:us-east-1:123456789012:stream/MyStream"
                    partialFailures: true
                    startFromBeginning: true
            environmentVariables:
                DB_HOST: "${variables.dbHost}"
                DB_PORT: "${variables.dbPort}"
```

## Runtimes

### Celerity Runtime

The Celerity runtime is used when you deploy your handlers to a containerised environment such as Kubernetes, Docker, and the container orchestration platforms that use these technologies such as Amazon ECS, Google Kubernetes Engine, and Azure Kubernetes Service.

You can choose from the following options for the Celerity runtime:

 Runtime         | Runtime ID   | Operating System     | Status              |
---------------- | ------------ | -------------------- | ------------------- |
 Node.js 22      | nodejs22.x   | Debian 12 (bookworm) | Actively maintained |
 .NET 8          | dotnet8.x    | Debian 12 (bookworm) | Actively maintained |
 Python 3.13     | python3.13.x | Debian 12 (bookworm) | Actively maintained |
 Java 21         | java21.x     | Debian 12 (bookworm) | Actively maintained |
 OS-only Runtime | os.deb2025   | Debian 12 (bookworm) | Actively maintained |

### AWS Lambda Runtime

The AWS Lambda runtime is used when you deploy your handlers to AWS Lambda.
You can choose from the [supported runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtimes-supported) for AWS lambda.

### Google Cloud Functions Runtime

The Google Cloud Functions runtime is used when you deploy your handlers to Google Cloud Functions.
You can choose from the [supported runtimes](https://cloud.google.com/functions/docs/concepts/execution-environment#runtimes) for Google Cloud Functions.

:::warning
Google Cloud Functions do not support OS-only runtimes where pre-compiled binaries are used for handlers.
The only supported language in Google Cloud Functions that is compiled in other environments is Go.
:::

### Azure Functions Runtime

The Azure Functions runtime is used when you deploy your handlers to Azure Functions.
You can choose from the [supported runtimes](https://docs.microsoft.com/en-us/azure/azure-functions/supported-languages) for Azure Functions.

:::note
Azure Functions do not support OS-only runtimes where pre-compiled binaries are used for handlers in the same way as the Celerity runtime and AWS Lambda.
Azure functions do support custom handlers that are compiled light-weight HTTP servers that run in the Azure Functions runtime environment.
Celerity will map OS-only runtimes (`os.*`) to custom handlers in Azure Functions.
:::

## Target Environments

### Celerity::1

In the Celerity::1 local environment, handlers are loaded into the Celerity runtime in a single process.
Depending on links and configuration, the handler will be wired up to the appropriate HTTP route, WebSocket route, event source, stream or scheduled trigger.

### AWS

In the AWS environment, handlers are loaded into the Celerity runtime in a single process.
Depending on links and configuration, the handler will be wired up to the appropriate HTTP route, WebSocket route, event source, stream or scheduled trigger.
Services such as Kinesis and SQS will be wired up directly to the application in the runtime that will forward messages to the handler, other event sources will have some glue components such as an SQS Queue that the application will poll for events. The Celerity runtime works in tandem with the Celerity deploy engine to make sure that handlers are wired up correctly to the event sources even when there is no direct connection between the application running in the Celerity runtime and the event source.

### AWS Serverless

In the AWS Serverless environment, handlers are deployed as AWS Lambda functions.
Depending on links and configuration, the handler will be wired up to the appropriate HTTP route, WebSocket route, event source, stream or scheduled trigger.
HTTP and WebSocket handlers will be wired up to API Gateway, event sources such as DynamoDB Streams and S3 will be wired up to the Lambda function directly.
For scheduled triggers, Amazon EventBridge rules will be configured to trigger the Lambda function at the specified schedule.
For queues, SQS queues will be configured as triggers for the Lambda function.
For workflows, AWS Step Functions will be configured to trigger the Lambda function as a step in the workflow.

### Google Cloud

In the Google Cloud environment, handlers are loaded into the Celerity runtime in a single process.
Depending on links and configuration, the handler will be wired up to the appropriate HTTP route, WebSocket route, event source, stream or scheduled trigger.
Google Cloud Pub/Sub will be wired up directly to the application in the runtime that will forward messages to the handler, other event sources will have some glue components such as a Pub/Sub topic that the application will poll for events. The Celerity runtime works in tandem with the Celerity deploy engine to make sure that handlers are wired up correctly to the event sources even when there is no direct connection between the application running in the Celerity runtime and the event source.

### Google Cloud Serverless

In the Google Cloud Serverless environment, handlers are deployed as Google Cloud Functions.
Depending on the links and configuration, the handler will be wired up to the appropriate HTTP route, event source, stream or scheduled trigger. HTTP handlers will be wired up to Google Cloud API Gateway, event sources such as Google Cloud Pub/Sub, Google Cloud Storage and Google Cloud Datastore will be wired up to the Cloud Function directly. For scheduled triggers, Cloud Scheduler and Pub/Sub will be combined to trigger the function. For queues, Google Cloud Pub/Sub topics will be configured as triggers for the Cloud Function. For workflows, Google Cloud Workflows will be configured to trigger the Cloud Function as a step in the workflow.

:::warning
Google Cloud Serverless does not support WebSocket APIs, meaning handlers linked from WebSocket APIs can not be deployed to Google Cloud Functions.
:::

### Azure

In the Azure environment, handlers are loaded into the Celerity runtime in a single process.
Depending on links and configuration, the handler will be wired up to the appropriate HTTP route, WebSocket route, event source, stream or scheduled trigger.
Azure Queue Storage queues will be wired up directly to the application in the runtime that will forward messages to the handler, other event sources will have some glue components such as a Queue Storage queue that the application will poll for events. The Celerity runtime works in tandem with the Celerity deploy engine to make sure that handlers are wired up correctly to the event sources even when there is no direct connection between the application running in the Celerity runtime and the event source.

### Azure Serverless

In the Azure Serverless environment, handlers are deployed as Azure Functions.
Depending on links and configuration, the handler will be wired up to the appropriate HTTP route, WebSocket route, event source, stream or scheduled trigger.
HTTP handlers will be wired up to Azure API Management, event sources such as Azure Event Hubs, Azure Blob Storage and Azure Queue Storage will be wired up to the Azure Function directly. For scheduled triggers, a timer trigger is configured for the function. For queues, Azure Queue Storage queues will be configured as triggers for the Azure Function. For workflows, Azure Logic Apps will be configured to trigger the Azure Function as a step in the workflow.

## Configuration Mappings

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

## Timeouts and long-running tasks

In a Serverless environment, the maximum execution time for a handler is limited.
Often, there are tasks that require more time to complete than the maximum timeout allowed by FaaS providers. In such cases, you can choose to deploy your application to the containerised alternative for your chosen cloud provider.

In the case that your application is a `celerity/workflow`, you could consider breaking down the long-running task into smaller tasks, if that isn't possible, you can switch to the containerised environment where the Celerity workflow runtime will be used to orchestrate your workflows instead of the cloud service equivalent.

:::note
When using the Celerity workflow runtime, you can still define timeouts for individual tasks, the limits are a lot higher than those of FaaS providers.
:::

:::warning
Using the Celerity workflow runtime as an alternative to cloud provider workflow orchestration services requires persistence of workflow state to a database, this is managed by Celerity but will use the resources in your cloud provider account. See the [`celerity/workflow`](/docs/applications/resources/celerity-workflow) documentation for more information.
:::

<table>
    <thead>
        <tr>
            <th>Celerity Runtime Maximum Timeout</th>
            <th>AWS Lambda Maximum Timeout</th>
            <th>Google Cloud Functions Maximum Timeout</th>
            <th>Azure Functions Maximum Timeout</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Unlimited when backed by self-managed VMs; otherwise, the timeout limit of a "serverless" container service (e.g. AWS Fargate or Google Cloud Run).</td>
            <td>900 seconds (15 minutes)</td>
            <td>3600 seconds (60 minutes)</td>
            <td>230 seconds for HTTP triggered functions, no maximum execution time-out is defined for functions that are triggered by other means.</td>
        </tr>
    </tbody>
</table>

[^1]: Function-as-a-Service such as AWS Lambda, Google Cloud Functions, and Azure Functions.
[^2]: Examples of Serverless stream flows include [Amazon DynamoDB Streams and AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html), [Google Cloud Datastore triggering Google Cloud Functions](https://cloud.google.com/datastore/docs/extend-with-functions-2nd-gen) and [Azure Cosmos DB Streams triggering Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-cosmosdb?toc=%2Fazure%2Fcosmos-db%2Ftoc.json&bc=%2Fazure%2Fcosmos-db%2Fbreadcrumb%2Ftoc.json&tabs=csharp).
[^3]: Examples of Serverless stream flows include [Amazon Kinesis Streams and AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/with-kinesis.html) and [Azure Event Hubs triggering Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-hubs?tabs=csharp).
