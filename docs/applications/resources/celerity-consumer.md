---
sidebar_position: 3
---

# `celerity/consumer`

**v2026-02-01 (draft)**

**blueprint transform:** `celerity-2026-02-01`

The `celerity/consumer` resource type is used to define a subscriber to messages on a `celerity/topic`, an externally defined queue or message broker.

A consumer can be deployed to different target environments such as a Serverless event-driven flow[^1], a containerised environment, or a custom server.
For containerised and custom server environments, the default mode is for the Celerity runtime provides a polling mechanism to check for new messages in a queue or message broker. There are some exceptions like the Google Cloud Run target environment where a push model is used to deliver messages to the consumer application.

In some target environments, infrastructure resources are created for a consumer when the `sourceId` is a Celerity topic, this will often be a queue that subscribes to the topic to implement a reliable and scalable fan-out approach.
When the `sourceId` is an external queue or message broker, the consumer is configured to listen to the external queue or message broker.

:::note
Links between consumers and topics are not supported as part of a blueprint.
The reason for this is that pub/sub systems are designed to be decoupled applications and a blueprint in the context of Celerity is to define a single application.
A topic should be defined in blueprints for producer applications and a consumer should be defined in blueprints for consumer applications. The outputs of a topic can be used to configure a consumer. Multiple producers can publish to the same topic, different blueprints can define the same topic, read more about it in the [`celerity/topic` documentation](/docs/applications/resources/celerity-topic).
:::

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.
The rest of this section lists fields that are available to configure the `celerity/consumer` resource followed by examples of different configurations for the resource type, a section outlining the behaviour in supported target environments along with additional documentation.

### sourceId (required)

The source ID is a unique identifier for the queue or message broker that the consumer will listen to for messages.
For example, this could be a Celerity topic ID, the URL of an Amazon SQS queue, a Google Cloud Pub/Sub topic, or a name of an Azure Storage Queue.
The type of source is based on the provided target environment at build/deploy time.

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

## Outputs

Outputs are computed values that are accessible via the `{resourceName}.spec.*` field accessor in a blueprint substitution.
For example, if the resource name is `myConsumer`, the output would be accessible via `${myConsumer.spec.id}`.

### queueId (optional)

The ID of the queue subscriber that is created for the consumer when the `sourceId` is a Celerity topic.
This output is **only** present in the outputs when the `sourceId` is a Celerity topic and the target environment requires a queue to be created to subscribe to the topic to follow best practises in creating a scalable and resilient architecture.

**type**

string | null

**examples**

`arn:aws:sqs:us-east-1:123456789012:example-queue-NZJ5JSMVGFIE` - An Amazon SQS Queue ARN

## Linked From

#### [`celerity/vpc`](/docs/applications/resources/celerity-vpc)

Depending on the target environment, a consumer application may be deployed to a VPC.
When a consumer is combined into a single application with an API, schedule or other triggers for handlers,
a single VPC will be created for the application and all resource types that make up the application will be deployed into the VPC.
When deploying to serverless environments, a consumer is a placeholder for a connection between a topic or queue and a handler, and does not require a VPC.

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
transform: celerity-2026-02-01
variables:
    ordersQueue:
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
            sourceId: "${variables.ordersQueue}"
            batchSize: 10
            visibilityTimeout: 30
            waitTimeSeconds: 20
            partialFailures: true
```

## Target Environments

### Celerity::1

In the Celerity::1 local environment, a consumer is deployed as a containerised version of the Celerity runtime that polls a queue or message broker for messages.
If the consumer `sourceId` is a Celerity topic, the topic will be directly polled by the consumer application in the Celerity::1 environment. 

Links from VPCs to consumers are ignored for this environment as the consumer application is deployed to a local container network on a developer or CI machine.

### AWS

In the AWS environment, a consumer is deployed as a containerised version of the Celerity runtime that polls a queue or message broker for messages.

When the `sourceId` is a Celerity topic, an SQS Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The consumer application is then configured to poll the SQS Queue for messages.

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

In the AWS Serverless environment, consumer applications are deployed as triggers for the AWS Lambda handlers defined for the consumer application.

When the `sourceId` is a Celerity topic, an SQS Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The queue will be configured as the trigger for the handlers linked to from the consumer application.

When tracing is enabled, an [ADOT lambda layer](https://aws-otel.github.io/docs/getting-started/lambda) is bundled with and configured to instrument each handler to collect traces and metrics. Traces are only collected when tracing is enabled for the handlers that process messages.

### Google Cloud

In the Google Cloud environment, consumer applications are deployed as a containerised version of the Celerity runtime.

consumer applications can be deployed to [Cloud Run](https://cloud.google.com/run), as well as [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) in [Autopilot](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview) or [Standard](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-regional-cluster) mode using [deploy configuration](/cli/docs/deploy-configuration) for the Google Cloud target environment.

#### Cloud Run

Cloud Run is a relatively simple environment to deploy applications to, the consumer application is deployed as a containerised application.

When the `sourceId` is a Celerity topic, a Pub/Sub subscription is created without the need for any intermediary infrastructure.

For consumer applications, Cloud Run uses a push model where a [Pub/Sub push subscription](https://cloud.google.com/run/docs/tutorials/pubsub) is configured for a Cloud Run app. Due to this, the Celerity runtime will not be configured to poll a message source, a HTTP API will be set up instead to receive messages from the Pub/Sub push subscription.

Autoscaling is configured with the use of Cloud Run annotations through `autoscaling.knative.dev/minScale` and `autoscaling.knative.dev/maxScale` [annotations](https://cloud.google.com/run/docs/reference/rest/v1/ObjectMeta). The knative autoscaler will scale the number of instances based on the number of requests and the CPU and memory usage of the instances. By default, for production app environments, the application will be configured to scale the number of instances with a minimum of 2 instances and a maximum of 5 instances. The default values for development app environments are a minimum of 1 instance and a maximum of 3 instances. Deploy configuration can be used to override this behaviour.

For Cloud Run, the consumer application will not be associated with a VPC, defining custom VPCs for Cloud Run applications is not supported. Creating and linking a VPC to the consumer application will enable the `Internal` networking mode in the [network ingress settings](https://cloud.google.com/run/docs/securing/ingress). `celerity.consumer.vpc.subnetType` has no effect for Cloud Run deployments, the application will always be deployed to a network managed by Google Cloud. Setting `celerity.consumer.vpc.ingressType` to `private` will have the same affect as attaching a VPC to the application, making the run trigger endpoint private. Setting `celerity.consumer.vpc.ingressType` to `public` will have the same effect as not attaching a VPC to the consumer application, making the Cloud Run service public if an external application load balancer is configured to route traffic to the Cloud Run service. `public` is equivalent to the "Internal and Cloud Load Balancing" [ingress setting](https://cloud.google.com/run/docs/securing/ingress#settings).

Memory and CPU resources allocated to the consumer application can be defined in the deploy configuration, when not defined, memory and CPU will be derived from the handlers configured for the application.
If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. The Cloud Run service will be allocated a limit of 2GB of memory and 1 vCPU per instance in production app envirionments. For develompent app environments, the service will be allocated a limit of 1GB of memory and 0.5 vCPUs per instance.

A sidecar [OpenTelemetry Collector](https://github.com/GoogleCloudPlatform/opentelemetry-cloud-run) container is deployed in the service with the consumer application to collect traces and metrics, this will take up a small portion of the memory and CPU allocated to the application. Traces will only be collected if tracing is enabled for the handlers that process messages.

#### GKE

In the GKE environment, the Celerity runtime will use a [pull subscription](https://cloud.google.com/pubsub/docs/pull) to poll a Pub/Sub topic for messages from a Pub/Sub topic.

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

When tracing is enabled, the built-in Google Cloud metrics and tracing offerings will be used to collect traces and metrics for the handlers. Traces and metrics can be collected in to tools like Grafana with plugins that use Google Cloud Trace as a data source. You can export logs and metrics to other tools like Grafana with plugins that use Google Cloud Logging and Monitoring as a data source.

### Azure

In the Azure environment, consumer applications are deployed as a containerised version of the Celerity runtime.

Consumer applications can be deployed to [Azure Container Apps](https://azure.microsoft.com/en-us/products/container-apps/) or [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/products/kubernetes-service) using [deploy configuration](/cli/docs/deploy-configuration) for the Azure target environment.

#### Container Apps

Container Apps is a relatively simple environment to deploy applications to, the consumer application is deployed as an [event-driven job](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-event-driven-jobs).

When the `sourceId` is a Celerity topic, an Azure Storage Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The Azure Container Apps job environment is then configured to poll the Azure Storage Queue for messages.

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

When the `sourceId` is a Celerity topic, an Azure Storage Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The Celerity runtime is configured to poll the Azure Storage Queue for messages.

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

When the `sourceId` is a Celerity topic, an Azure Storage Queue is created to subscribe to the topic to implement a reliable and scalable fan-out approach. The Azure Storage Queue will then be configured as a [trigger](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-queue-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cextensionv5&pivots=programming-language-csharp) for the deployed Azure Function(s).

When it comes metrics and tracing for the Azure Functions that process messages, traces and metrics go to Application Insights by default, from which you can export logs, traces and metrics to other tools like Grafana with plugins that use Azure Monitor as a data source.
[OpenTelemetry for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/opentelemetry-howto?tabs=otlp-export&pivots=programming-language-csharp) is also supported for some languages, you can use the deploy configuration to enable OpenTelemetry for Azure Functions.

Consumers can be deployed to Azure Functions with Azure Storage Queue triggers using [deploy configuration](/cli/docs/deploy-configuration) for the Azure Serverless target environment.

## Configuration Mappings

### Serverless Event-Driven Flows

The following is a table of `celerity/consumer` configuration fields and how they map to different target environments when the Celerity application is deployed as a Serverless event-driven flow[^1].

<table>
    <thead>
        <tr>
        <th>Celerity Consumer</th>
        <th>AWS SQS</th>
        <th>Google Cloud Pub/Sub</th>
        <th>Azure Storage Queue</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>batchSize</td>
        <td>batchSize (default: `10`, min: `1`, max: `10000`)</td>
        <td>N/A</td>
        <td>batchSize (default: `16`, max: `32`)</td>
        </tr>
        <tr>
        <td>visibilityTimeout</td>
        <td>N/A</td>
        <td>N/A</td>
        <td>visibilityTimeout (default: `0s`)</td>
        </tr>
        <tr>
        <td>waitTimeSeconds</td>
        <td>N/A</td>
        <td>N/A</td>
        <td>maxPollingInterval (default: `60s`, min: `100ms`)</td>
        </tr>
        <tr>
        <td>partialFailures</td>
        <td>functionResponseTypes</td>
        <td>N/A</td>
        <td>N/A</td>
        </tr>
    </tbody>
</table>

[^1]: Examples of Serverless event-driven flows include [Amazon SQS Queues triggerring AWS Lambda Functions](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html), [Google Cloud Pub/Sub triggering Google Cloud Functions](https://cloud.google.com/functions/docs/calling/pubsub), and [Azure Queue Storage triggering Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-queue-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cextensionv5&pivots=programming-language-typescript).

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
