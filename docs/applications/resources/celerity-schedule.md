---
sidebar_position: 4
---

# `celerity/schedule`

**v2026-02-28 (draft)**

**blueprint transform:** `celerity-2026-02-28`

The `celerity/schedule` resource type is used to define a scheduled rule to trigger handlers at a specific time or interval based on a schedule.

A schedule rule can be deployed to different target environments such as a Serverless event-driven flow[^1], a containerised environment, or a custom server.
For containerised and custom server environments, the default mode is for the Celerity runtime provides a polling mechanism to check for new messages in a queue or message broker. There are some exceptions like the Google Cloud Run target environment where a push model is used to trigger a scheduled run for a schedule application.

Multiple schedule rules can be defined in a blueprint to trigger different handlers at different times or intervals.

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.
The rest of this section lists fields that are available to configure the `celerity/schedule` resource followed by examples of different configurations for the resource type and a table outlining what each configuration value maps to in different target environments.

### schedule (required)

A cron or rate expression that defines the schedule for the rule to trigger handlers.
The expected format follows the Amazon EventBridge cron and rate expression syntax that can be found [here](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html#eb-cron-expressions). This will then be converted into the appropriate format for the target environment at build/deploy time.

**type**

string

## Annotations

Annotations define additional metadata that can determine the behaviour of the resource in relation to other resources in the blueprint or to add behaviour to a resource that is not in its spec.

### `celerity/schedule`

The following are a set of annotations that are specific to the `celerity/schedule` resource type.
These annotations are nothing to do with relationships between resources, but are used to configure the behaviour of the schedule.

<p style={{fontSize: '1.2em'}}><strong>celerity.app</strong></p>

Provides a way to group schedules together that are part of the same application.
This is especially useful when deploying to a containerised or custom server environment as it allows you to deploy multiple schedules as a part of a single deployed application.

**type**

string
___

### `celerity/vpc` 🔗 `celerity/schedule`

The following are a set of annotations that determine the behaviour of the schedule in relation to a VPC.
Appropriate security groups are managed by the VPC to schedule link.

When a VPC is not defined for the container-backed AWS, Google Cloud and Azure target environments, the default VPC for the account will be used.

VPC annotations and links do not have any effect for serverless environments.
Serverless schedules are no more than configuration of a schedule trigger for a serverless function.

:::warning
When a VPC is not defined for container-backed cloud environments, annotations in the `celerity/schedule` will apply to the default VPC for the account.
:::

<p style={{fontSize: '1.2em'}}><strong>celerity.schedule.vpc.subnetType</strong></p>

The kind of subnet that the schedule application should be deployed to.

**type**

string

**allowed values**

`public` | `private`

**default value**

`public` - When a VPC links to a schedule, the schedule will be deployed to a public subnet.

___

<p style={{fontSize: '1.2em'}}><strong>celerity.schedule.vpc.ingressType</strong></p>

The kind of ingress used for the schedule application.
This is only applicable when the schedule app is deployed to a containerised environment that subscribes to a queue or topic via a push model. (e.g. Google Cloud Run)

**type**

string

**allowed values**

`public` | `private`

**default value**

`public` - When a VPC links to a schedule, traffic will be accepted from the public internet via an application load balancer if one is configured for the application.

## Outputs

Outputs are computed values that are accessible via the `{resourceName}.spec.*` field accessor in a blueprint substitution.
For example, if the resource name is `mySchedule`, the output would be accessible via `${mySchedule.spec.id}`.

### queueId (optional)

The ID of the queue or pub/sub topic that is created for the schedule.
This output is **only** present in the outputs when the `sourceId` is a Celerity topic and the target environment requires a queue or pub/sub topic as an intermediary between the scheduler and the scheduled handler.

**type**

string | null

**examples**

`arn:aws:sqs:us-east-1:123456789012:example-queue-NZJ5JSMVGFIE` - An Amazon SQS Queue ARN

`projects/my-project/topics/my-topic` - A Google Cloud Pub/Sub Topic

## Linked From

#### [`celerity/vpc`](/docs/applications/resources/celerity-vpc)

Depending on the target environment, a schedule application may be deployed to a VPC.
When a schedule is combined into a single application with an API, consumer or other triggers for handlers,
a single VPC will be created for the application and all resource types that make up the application will be deployed into the VPC.
When deploying to serverless environments, a schedule is a placeholder for a connection between a scheduler, possible queue or pub/sub subscription and a handler, which does not require a VPC.

## Links To

#### [`celerity/handler`](/docs/applications/resources/celerity-handler)

Handlers contain the work the functionality that runs when a schedule is triggered.

#### [`celerity/config`](/docs/applications/resources/celerity-config)

The `celerity/config` resource type can be used to store configuration and sensitive information such as API keys, database passwords, and other credentials that are used by the application.
A schedule application can link to a secret and configuration store to access config at runtime, linking an application to a `celerity/config` resource type will automatically make secrets and configuration accessible to all handlers in the application without having to link each handler to the store.

:::note
Where an application is made up of a composition of consumers, an API, schedules or other triggers, a `celerity/config` resource only needs to be linked to one of the application resource types.
:::

## Examples

```yaml
version: 2025-05-12
transform: celerity-2026-02-28
resources:
    jobSchedule:
        type: "celerity/schedule"
        metadata:
            displayName: Job Schedule
        linkSelector:
            byLabel:
                application: "jobs"
        spec:
            schedule: "rate(1 hour)"
```

## Target Environments

### Celerity::1

In the Celerity::1 local environment, a schedule application is deployed as a containerised version of the Celerity runtime that consumes a stream from Valkey as per the behaviour defined in the [`celerity/consumer`](./celerity-consumer#celerity1) resource type.
Schedules are registered as a cron job running on a local container that will send a message to a stream dedicated to scheduled events in Valkey that will be consumed by the Celerity runtime.

Links from VPCs to schedules are ignored for this environment as the schedule application is deployed to a local container network on a developer or CI machine.

### AWS

In the AWS environment, a schedule application is deployed as a containerised version of the Celerity runtime that polls a queue for scheduled event payloads.

An SQS queue is created and wired up to the scheduled trigger in an Amazon EventBridge rule that is provisioned with the value of the `schedule` field defined in the `celerity/schedule` resource as the trigger.
The queue is then polled by the Celerity runtime for messages that contain the payload to trigger the handler(s) in the schedule application.

Schedule applications can be deployed to [ECS](https://aws.amazon.com/ecs/) or [EKS](https://aws.amazon.com/eks/) backed by [Fargate](https://aws.amazon.com/fargate/) or [EC2](https://aws.amazon.com/ec2/) using [deploy configuration](/cli/docs/deploy-configuration) for the AWS target environment.

#### ECS

When a schedule application is deployed to ECS, a new cluster is created for the application. A service is provisioned within the cluster to run the application.

The service is deployed with an auto-scaling group that will scale the number of tasks running the application based on the CPU and memory usage of the tasks. The auto-scaling group will scale the desired task count with a minimum of 1 task and a maximmum of `N` tasks depending on the [app environment](/cli/docs/app-deploy-configuration#structure).

The default maximum number of tasks is 3 for `development` app environments and 6 for `production` app environments. Deploy configuration can be used to override this behaviour.

If backed by EC2, the auto-scaling group will scale the number instances based on CPU utilisation of the instances with a minimum of 1 instance and a maximum of `N` instances depending on the [app environment](/cli/docs/app-deploy-configuration#structure).

The default maximum number of EC2 instances is 3 for `development` app environments and 6 for `production` app environments. Deploy configuration can be used to override this behaviour.

When it comes to networking, ECS services need to be deployed to VPCs; if a VPC is defined in the blueprint and linked to the schedule application, it will be used, otherwise the default VPC for the account will be used. The service for the application will be deployed to a public subnet by default, but can be configured to be deployed to a private subnet by setting the `celerity.schedule.vpc.subnetType` annotation to `private`. By default, 2 private subnets and 2 public subnets are provisioned for the associated VPC, the subnets are spread across 2 availability zones, the ECS resources that need to be associated with a subnet will be associated with these subnets, honouring the subnet type defined in the annotations.

The CPU to memory ratio used by default for AWS deployments backed by EC2 is that of the `t3.*` instance family. The auto-scaling launch configuration will use the appropriate instance type based on the requirements of the application, these requirements will be taken from the deploy configuration or derived from the handlers configured for the schedule application. If the requirements can not be derived, a default instance type will be selected. For production app environments, the default instance type will be `t3.medium` with 2 vCPUs and 4GB of memory. For development app environments, the default instance type will be `t3.small` with 2 vCPUs and 2GB of memory.

Fargate-backed ECS deployments use the same CPU to memory ratios allowed for Fargate tasks as per the [task definition parameters](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size).

If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. For an EC2-backed cluster, the task housing the containers that make  up the service for the schedule application will be deployed with less than 50 percent of memory and 0.8 vCPUs. Less than half of the memory and CPU is allocated to the EC2 instance to allow for smooth deployments of new versions of the application, this is done by making sure there is enough memory and CPU available to the ECS agent. The exact memory usage values for the defaults would be 1,792MB for production app environments and 870MB for development app environments.

For a Fargate-backed cluster, in production app environments, the task housing the containers that make up the service for the application will be deployed with 2GB of memory and 1 vCPU. In development app environments, the task for the schedule application will be deployed with 1GB of memory and 0.5 vCPUs.

A sidecar [ADOT collector](https://aws-otel.github.io/docs/getting-started/collector) container is deployed with the application to collect traces and metrics for the application, this will take up a small portion of the memory and CPU allocated to the schedule application. Traces are only collected when tracing is enabled for the handler that is processing messages.

#### EKS

When a schedule application is first deployed to EKS, a new cluster is created for the application unless you specify an existing cluster to use in the deploy configuration.

:::warning using existing clusters
When using an existing cluster, the cluster must be configured in a way that is compatible with the VPC annotations configured for the schedule application as well as the target compute type.
For example, a cluster without a Fargate profile can not be used to deploy a schedule application that is configured to use Fargate. Another example would be a cluster with a node group only associated with public subnets not being compatible with a schedule application with the `celerity.schedule.vpc.subnetType` annotation set to `private`.
You also need to make sure there is enough memory and CPU allocated for node group instances to run the application in addition to other workloads running in the cluster.
:::

:::warning cost of running on EKS
Running a Celerity application on EKS will often not be the most cost-effective way to run consumer applications that are not expected to use a lot of resources. All EKS clusters have a fixed cost of $74 per month for the control plane, in addition to the cost of the EC2 instances or Fargate tasks that are used to run the application along with the cost of data transfer and networking components. If you are looking for a cost-effective solution for low-load applications on AWS, consider using [ECS](#ecs) or switching to a [serverless deployment](#aws-serverless) instead.
:::

The cluster is configured with a private endpoint for the Kubernetes API server by default, this can be overridden in the deploy configuration. (VPC links will be required to access the Kubernetes API server with the default configuration)

For an EKS cluster backed by EC2, a node group is configured with auto-scaling configuration to have a minimum size of 2 nodes and a maximum size of 6 nodes by default for production app environments. For development app environments, the minimum size of a node group is 1 with a maximum size of 3 by default. Auto-scaling is handled by the [Kubernetes Cluster Autoscaler](https://github.com/kubernetes/autoscaler#kubernetes-autoscaler). The instance type configured for node groups is determined by the CPU and memory requirements defined in the deploy configuration or derived from the handlers of the schedule application, if the requirements can not be derived, a default instance type will be selected. For production app environments, the default instance type will be `t3.medium` with 2 vCPUs and 4GB of memory. For development app environments, the default instance type will be `t3.small` with 2 vCPUs and 2GB of memory.

For an EKS cluster backed by Fargate, a [Fargate profile](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html) is configured to run the schedule application.

The [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) is used to scale the number of pods running the API based on CPU utilisation and average memory utilisation. In development app environments, the minimum number of pods is set to 1 and the maximum number of pods is set to 3 by default. In production app environments, the minimum number of pods is set to 2 and the maximum number of pods is set to 6 by default. The minimum and maximum number of pods can be overridden in the deploy configuration.

Once the cluster is up and running, Kubernetes services are provisioned to run the application.

When it comes to networking, EKS services need to be deployed to VPCs; if a VPC is defined in the blueprint and linked to the schedule application, it will be used, otherwise the default VPC for the account will be used.

By default, 2 private subnets and 2 public subnets are provisioned for the associated VPC, the subnets are spread across 2 availability zones. For EC2-backed clusters, the EKS node group will be associated with all 4 subnets when `celerity.schedule.vpc.subnetType` is set to `public`; when `celerity.schedule.vpc.subnetType` is set to `private`, the node group will only be associated with the 2 private subnets. The orchestrator will take care of assigning one of the subnets defined for the node group.

For Fargate-backed clusters, the Fargate profile will be associated with the private subnets due to the [limitations with Fargate profiles](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html). For Fargate, the schedule application will be deployed to one of the private subnets associated with the profile. 

:::warning
`celerity.schedule.vpc.subnetType` has no effect for Fargate-based EKS deployments, the application will always be deployed to a private subnet.
:::

If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set.
For an EC2-backed cluster, the containers that make up the service for the schedule application will be deployed with less than 50 percent of memory and 0.8 vCPUs. Less than half of the memory and CPU is allocated to a node that will host the containers to allow for smooth deployments of new versions of the schedule application, this is done by making sure there is enough memory and CPU available to the Kubernetes agents. The exact memory usage values for the defaults would be 1,792MB for production app environments and 870MB for development app environments.

For a Fargate-backed cluster, in production app environments, the pod for the application will be deployed with 2GB of memory and 0.5 vCPUs. In development app environments, the pod for the application will be deployed with 1GB of memory and 0.5 vCPUs. Fargate has a [fixed set of CPU and memory configurations](https://docs.aws.amazon.com/eks/latest/userguide/fargate-pod-configuration.html) that can be used.

A sidecar [ADOT collector](https://aws-otel.github.io/docs/getting-started/collector) container is deployed in the pod with the application to collect traces and metrics for the application, this will take up a small portion of the memory and CPU allocated to the schedule application. Traces are only collected when tracing is enabled for the application.

### AWS Serverless

In the AWS Serverless environment, schedule applications are deployed as EventBridge scheduled rule triggers for the AWS Lambda handlers defined for the schedule application.

When tracing is enabled, an [ADOT lambda layer](https://aws-otel.github.io/docs/getting-started/lambda) is bundled with and configured to instrument each handler to collect traces and metrics. Traces are only collected when tracing is enabled for the handlers that process messages.

### Google Cloud

In the Google Cloud environment, schedule applications are deployed as a containerised version of the Celerity runtime.

schedule applications can be deployed to [Cloud Run](https://cloud.google.com/run), as well as [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) in [Autopilot](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview) or [Standard](https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-regional-cluster) mode using [deploy configuration](/cli/docs/deploy-configuration) for the Google Cloud target environment.

#### Cloud Run

Cloud Run is a relatively simple environment to deploy applications to, the schedule application is deployed as a containerised application.

For scheduled applications, a Cloud Scheduler job is created to run on the schedule defined in the `schedule` field of the `celerity/schedule` resource. The Cloud Scheduler job is configured to send a message to a Pub/Sub topic that is then pushed to the Cloud Run service.

For schedule applications, Cloud Run uses a push model where a [Pub/Sub push subscription](https://cloud.google.com/run/docs/tutorials/pubsub) is configured for a Cloud Run app. Due to this, the Celerity runtime will not be configured to poll a message source, a HTTP API will be set up instead to receive messages from the Pub/Sub push subscription.

Autoscaling is configured with the use of Cloud Run annotations through `autoscaling.knative.dev/minScale` and `autoscaling.knative.dev/maxScale` [annotations](https://cloud.google.com/run/docs/reference/rest/v1/ObjectMeta). The knative autoscaler will scale the number of instances based on the number of requests and the CPU and memory usage of the instances. By default, for production app environments, the application will be configured to scale the number of instances with a minimum of 2 instances and a maximum of 5 instances. The default values for development app environments are a minimum of 1 instance and a maximum of 3 instances. Deploy configuration can be used to override this behaviour.

For Cloud Run, the schedule application will not be associated with a VPC, defining custom VPCs for Cloud Run applications is not supported. Creating and linking a VPC to the application will enable the `Internal` networking mode in the [network ingress settings](https://cloud.google.com/run/docs/securing/ingress). `celerity.schedule.vpc.subnetType` has no effect for Cloud Run deployments, the application will always be deployed to a network managed by Google Cloud. Setting `celerity.schedule.vpc.ingressType` to `private` will have the same affect as attaching a VPC to the application, making the run trigger endpoint private. Setting `celerity.schedule.vpc.ingressType` to `public` will have the same effect as not attaching a VPC to the application, making the Cloud Run service public if an external application load balancer is configured to route traffic to the Cloud Run service. `public` is equivalent to the "Internal and Cloud Load Balancing" [ingress setting](https://cloud.google.com/run/docs/securing/ingress#settings).

Memory and CPU resources allocated to the schedule application can be defined in the deploy configuration, when not defined, memory and CPU will be derived from the handlers configured for the application.
If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. The Cloud Run service will be allocated a limit of 2GB of memory and 1 vCPU per instance in production app environments. For development app environments, the service be allocated a limit of 1GB of memory and 0.5 vCPUs per instance.

A sidecar [OpenTelemetry Collector](https://github.com/GoogleCloudPlatform/opentelemetry-cloud-run) container is deployed in the service with the schedule application to collect traces and metrics, this will take up a small portion of the memory and CPU allocated to the application. Traces will only be collected if tracing is enabled for the handlers that process messages.

#### GKE

When a schedule application is deployed to GKE, a Cloud Scheduler job is created to run on the schedule defined in the `schedule` field of the `celerity/schedule` resource. The Cloud Scheduler job is configured to send a message to a Pub/Sub topic which the Celerity runtime will poll for messages.

In the GKE environment, the Celerity runtime will use a [pull subscription](https://cloud.google.com/pubsub/docs/pull) to poll a Pub/Sub topic for messages from a Pub/Sub topic.

When a schedule application is first deployed to GKE, a new cluster is created for the application unless you specify an existing cluster to use in the deploy configuration.

:::warning Using existing clusters
When using an existing cluster, the cluster must be configured in a way that is compatible with the VPC annotations configured for the application as well as the target compute type.
:::

:::warning Cost of running on GKE
Running a Celerity application on GKE will often not be the most cost-effective option for APIs with low traffic or applications that are not expected to use a lot of resources. All GKE clusters have a fixed cost of around $72 per month for cluster management (control plane etc.), in addition to the cost of the nodes (VMs) that are used to run the application pods along with cost of data transfer and networking components.
If you are looking for a cost-effective solution for low-load applications on Google Cloud, consider using [Cloud Run](#cloud-run) or switching to a [serverless deployment](#google-cloud-serverless) instead.
:::

When in standard mode, for production app environments, the cluster will be regional with 2 zones for better availability guarantees. A node pool is created with autoscaling enabled, by default, the pool will have a minimum of 1 node and a maximum of 3 nodes per zone. As the cluster has 2 zones, this will be a minimum of 2 nodes and a maximum of 6 nodes overall. The [cluster autoscaler](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-autoscaler) is used to manage scaling and choosing the appropriate instance type to use given the requirements of the schedule application service. For development app environments, the cluster will be regional with 1 zone. The node pool will have a minimum of 1 node and a maximum of 3 nodes in the single zone. The minimum and maximum number of nodes can be overridden in the deploy configuration.

When in autopilot mode, Google manages scaling, security and node pools. Based on memory and CPU limits applied at the pod-level, appropriate node instance types will be selected and will be scaled automatically. There is no manual autoscaling configuration when running in autopilot mode, GKE Autopilot is priced per pod request rather than provisioned infrastructure, depending on the nature of your workloads, it could be both a cost-effective and convenient way to run your applications. [Read more about autopilot mode pricing](https://cloud.google.com/kubernetes-engine/pricing#autopilot_mode).

For standard mode, the machine type configured for node pools is determined by the CPU and memory requirements defined in the deploy configuration or derived from the handlers of the schedule aplication, if the requirements can not be derived, a default machine type will be selected. For production app environments, the default machine type will be `n2-highcpu-4` with 4 vCPUs and 4GB of memory. For development app environments, the default machine type will be `n1-highcpu-2` with 2 vCPUs  and 2GB of memory. The machine type for node pools can be overridden in the deploy configuration.

When it comes to networking, a GKE cluster is deployed as a [private cluster](https://cloud.google.com/kubernetes-engine/docs/concepts/private-cluster-concept), nodes that the pods for the application run on only use internal IP addresses, isolating them from the public internet. The Control plane has both internal and external endpoints, the external endpoint can be disabled from the Google Cloud/Kubernetes side.

:::warning
`celerity.schedule.vpc.subnetType` has no effect for GKE clusters, the application will always be deployed to a private network.
:::

If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. Limits of 1,792MB of memory and 1.6 vCPUs will be set for pods that run the application in production app environments. For development app environments, the pods will be deployed with 870MB of memory and 0.8 vCPUs.

The [OpenTelemetry Operator](https://cloud.google.com/blog/topics/developers-practitioners/easy-telemetry-instrumentation-gke-opentelemetry-operator/) is used to configure a sidecar collector container for the application to collect traces and metrics. Traces will only be collected if tracing is enabled for the handlers that process messages.

### Google Cloud Serverless

In the Google Cloud Serverless environment, scheduled applications are deployed as Google Cloud Functions that are triggered by a Pub/Sub topic to which a Cloud scheduler job sends messages at the scheduled time or interval defined in the `schedule` field of the `celerity/schedule` resource.

When tracing is enabled, the built-in Google Cloud metrics and tracing offerings will be used to collect traces and metrics for the handlers. Traces and metrics can be collected in to tools like Grafana with plugins that use Google Cloud Trace as a data source. You can export logs and metrics to other tools like Grafana with plugins that use Google Cloud Logging and Monitoring as a data source.

### Azure

In the Azure environment, schedule applications are deployed as a containerised version of the Celerity runtime.

Schedule applications can be deployed to [Azure Container Apps](https://azure.microsoft.com/en-us/products/container-apps/) or [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/products/kubernetes-service) using [deploy configuration](/cli/docs/deploy-configuration) for the Azure target environment.

#### Container Apps

Container Apps is a relatively simple environment to deploy applications to, the schedule application is deployed as an [event-driven job](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-event-driven-jobs) with the [schedule trigger type](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli#scheduled-jobs).

Autoscaling is determined based on CPU and memory usage of the underlying VMs running the workload. By default, the [scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/jobs?tabs=azure-cli#event-driven-jobs) are set to scale the number of instances with a minimum of 0 executions and a maximum of 10 executions in production app environments. For development app environments, the default configuration is set to scale from 0 to 5 executions. [Deploy configuration](#app-deploy-configuration) can be used to override this behaviour.

Container Apps will not be associated with a private network by default, a VNet is automatically generated for you and generated VNets are publicly accessible over the internet. [Read about networking for Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/networking?tabs=workload-profiles-env%2Cazure-cli). When you define a VPC and link it to the schedule application, a custom VNet will be provisioned and the schedule application will be deployed to either a private or public subnet based on the `celerity.schedule.vpc.subnetType` annotation, defaulting to a public subnet if not specified. As schedule applications are triggered by the the Container Apps Jobs service, availability guarantees for a schedule application relies on the Azure Container Apps platform.

Memory and CPU resources allocated to the application can be defined in the deploy configuration, when not defined, memory and CPU will be derived from the handlers configured for the application. If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. For production app environments, the Container App job will be allocated a limit of 2GB of memory and 1 vCPU per instance in the consumption plan, [see allocation requirements](https://learn.microsoft.com/en-us/azure/container-apps/containers#allocations). For development app environments, the Container App job will be allocated a limit of 1GB of memory and 0.5 vCPUs per instance in the consumption plan.

The [OpenTelemetry Data Agent](https://learn.microsoft.com/en-us/azure/container-apps/opentelemetry-agents?tabs=arm) is used to collect traces and metrics for the application. Traces will only be collected if tracing is enabled for the handlers that process messages.

:::warning
When deploying to the Azure environment with Container Apps, schedule applications can **not** be combined into a single application with an API. To utilise the [Azure Container Apps jobs](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-event-driven-jobs) environment to do the heavy lifting when it comes to scaling and launching jobs, schedule applications must be background jobs that are not accessible from the public internet and only run when triggered by a message in the queue.
:::

#### AKS

When a schedule application is first deployed to AKS, a new cluster is created for the application unless you specify an existing cluster to use in the deploy configuration.

:::warning Using existing clusters
When using an existing cluster, it must be configured in a way that is compatible with the VPC annotations configured for the application as well as the target compute type.
:::

:::warning Cost of running on AKS
Running a Celerity application on AKS will often not be the most cost-effective option for schedule applications that are not expected to use a lot of resources. The default configuration uses instances that meet the minimum requirements to run Kubernetes in AKS that will cost hundreds of US dollars a month to run.
If you are looking for a cost-effective solution for low-load applications on Azure, consider using [Azure Container Apps](#container-apps) instead.
:::

[Azure Logic App triggers](https://learn.microsoft.com/en-us/azure/logic-apps/concepts-schedule-automated-recurring-tasks-workflows#schedule-triggers) are created to send messages to an Azure Storage Queue at the scheduled time or interval defined in the `schedule` field of the `celerity/schedule` resource. The Celerity runtime will poll the queue for messages to trigger the handlers in the schedule application.

The cluster is created across 2 availability zones for better availability guarantees. Best effort zone balancing is used with [Azure VM Scale Sets](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-use-availability-zones?tabs=portal-2#zone-balancing). 2 separate node pools will be configured for the cluster, 1 for the Kubernetes system components and 1 for your application. When using an existing cluster, a new node pool will be created specifically for this application.

The cluster is configured with an [autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler?tabs=azure-cli) for each node pool. For production app environments, by default, the autoscaler for the application node pool will be configured with a minimum of 3 nodes and a maximum of 6 nodes distributed across availability zones as per Azure's zone balancing. For development app environments, the autoscaler for the application node pool will be configured with a minimum of 1 node and a maximum of 4 nodes by default.

The autoscaler for the system node pool will be configured with a minimum of 2 nodes and a maximum of 3 nodes for production app environments. For development app environments, the autoscaler for the system node pool will be configured with a minimum of 1 node and a maximum of 2 nodes by default.

For both production and development app environments, the default node size for the system node pool is `Standard_D4d_v5` with 4 vCPUs and 16GB of memory. This size has been chosen because of the [minimum requirements for system Node Pools](https://learn.microsoft.com/en-us/azure/aks/use-system-pools?tabs=azure-cli#system-and-user-node-pools).
For the application node pool, the default node size differs based on the app environment. For production app environments, the default node size is `Standard_D4ls_v6` with 4 vCPUs and 8GB of memory. For development app environments, the default node size is `Standard_D2ls_v6` with 2 vCPUs and 4GB of memory.
If the CPU or memory requirements of the application defined in the app blueprint cause the default node size to not be able to comfortably run 2 instances of the schedule application, a larger node size will be selected.
Min and max node count along with the node size for both system and application node pools can be overridden in the deploy configuration.

The [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) is used to scale the number of pods running the application based on CPU utilisation and average memory utilisation. In development app environments, the minimum number of pods is set to 1 and the maximum number of pods is set to 6 by default. In production app environments, the minimum number of pods is set to 2 and the maximum number of pods is set to 12 by default. The minimum and maximum number of pods can be overridden in the deploy configuration.

When it comes to networking, the application will be deployed with the overlay network model in a public network as per the default AKS access mode. [Read about private and public clusters for AKS](https://techcommunity.microsoft.com/t5/core-infrastructure-and-security/public-and-private-aks-clusters-demystified/ba-p/3716838).
When you define a VPC and link it to the application, it will be deployed as a private cluster using the VNET integration feature of AKS where the control plane will not be made available through a public endpoint. The `celerity.schedule.vpc.subnetType` annotation has **no** effect for AKS deployments as the networking model for Azure with it's managed Kubernetes offering is different from other cloud providers and all services running on a cluster are private by default.

Memory and CPU resources allocated to the schedule application pod can be defined in the deploy configuration, if not specified, the application will derive memory and CPU from handlers configured for the application.
If memory and CPU is not defined in the deploy configuration and can not be derived from the handlers, some defaults will be set. For production app environments, the pod that runs the schedule application will be allocated a limit of 1,792MB of memory and 0.8 vCPUs. For development app environments, the pod that runs the consumer application will be allocated a limit of 870MB of memory and 0.4 vCPUs.

The [OpenTelemetry Operator](https://opentelemetry.io/docs/kubernetes/operator/) is used to configure a sidecar collector container for the scheudle application to collect traces and metrics. Traces will only be collected if tracing is enabled for the handlers that process messages.

### Azure Serverless

In the Azure Serverless environment, Azure Functions with [timer triggers](https://learn.microsoft.com/en-us/azure/azure-functions/functions-create-scheduled-function) are deployed for the handlers.

When it comes to metrics and tracing for the Azure Functions that process messages, traces and metrics go to Application Insights by default, from which you can export logs, traces and metrics to other tools like Grafana with plugins that use Azure Monitor as a data source.
[OpenTelemetry for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/opentelemetry-howto?tabs=otlp-export&pivots=programming-language-csharp) is also supported for some languages, you can use the deploy configuration to enable OpenTelemetry for Azure Functions.

Schedule applications can be deployed to Azure Functions with timer triggers using [deploy configuration](/cli/docs/deploy-configuration) for the Azure Serverless target environment.

## Configuration Mappings

### Serverless Event-Driven Flows

The following is a table of `celerity/schedule` configuration fields and how they map to different target environments when the Celerity application is deployed as a Serverless event-driven flow[^1].

Celerity Schedule      | AWS EventBridge                                          | Google Cloud Scheduler       | Azure Function Trigger
---------------------- | -------------------------------------------------------- | ---------------------------- | ------------------------------------
schedule               | schedule - [cron and rate expressions](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html#eb-cron-expressions)                                              | schedule - [cron expression](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules)                        | schedule - [NCRONTAB expression](https://github.com/atifaziz/NCrontab)


[^1]: Examples of Serverless event-driven flows include [Amazon Event Bridge triggerring AWS Lambda Functions](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-run-lambda-schedule.html), [Google Cloud Scheduler with Pub/Sub and Google Cloud Functions](https://cloud.google.com/scheduler/docs/tut-gcf-pub-sub), and [Timer triggers for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer?tabs=python-v2%2Cisolated-process%2Cnodejs-v4&pivots=programming-language-javascript).

## App Deploy Configuration

Configuration specific to a target environment can be defined for `celerity/schedule` resources in the [app deploy configuration](/cli/docs/app-deploy-configuration) file.

This section lists the configuration options that can be set in the `deployTarget.config` object in the app deploy configuration file.

### Compute Configuration

Compute configuration that can be used for the `celerity/api`, `celerity/consumer`, `celerity/schedule` and the `celerity/workflow` resource types is documented [here](/docs/applications/compute-configuration).

### Azure Configuration Options

#### azure.schedule.containerApps.minExecutions

The minimum number of executions for the schedule application when deployed to Azure Container Apps. This is used to determine the minimum number of tasks that will be running the schedule application.

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
      "azure.schedule.containerApps.minExecutions": 2
    }
  }
}
```

#### azure.schedule.containerApps.maxExecutions

The maximum number of executions for the schedule application when deployed to Azure Container Apps. This is used to determine the maximum number of tasks that will be running the schedule application.

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
      "azure.schedule.containerApps.maxExecutions": 10
    }
  }
}
```
