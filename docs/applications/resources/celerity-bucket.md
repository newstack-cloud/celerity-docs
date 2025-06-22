---
sidebar_position: 9
---

# `celerity/bucket`

**v2026-02-01 (draft)**

**blueprint transform:** `celerity-2026-02-01`

The `celerity/bucket` resource type defines an object storage bucket that can be used to store files and other data for a Celerity application.

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.
The rest of this section lists fields that are available to configure the `celerity/bucket` resource followed by examples of different configurations for the resource and how buckets are implemented in target environments along with additional documentation.

### name

A unique name to use for the bucket.
If a name is not provided, a unique name will be generated for the bucket based on the blueprint that the bucket is defined in.

:::warning
Depending on the target environment, when you specify a name, you may not be able to perform updates that require replacing the bucket, if you need to replace the bucket, you may need to specify a new name.
:::

**type**

string

### encryption

The encryption configuration for the bucket.
When not provided, default encryption settings will be used for the target environment.

**type**

[encryptionConfiguration](#encryptionconfiguration)

### cors

[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) configuration for objects in a bucket.

**type**

[corsConfiguration](#corsconfiguration)

### lifecycle

Lifecycle configuration for objects in the bucket.

**type**

[lifecycleConfiguration](#lifecycleconfiguration)

### logging

Logging configuration for the bucket.

**type**

[loggingConfiguration](#loggingconfiguration)

### versioning

Versioning configuration used to enable versioning for objects in the bucket.

**type**

[versioningConfiguration](#versioningconfiguration)

### replication

Replication configuration for the bucket.
This is used primarily for cross-region replication of objects in the bucket.

The replication configuration for Celerity buckets is a simplified approach that is designed to work across multiple target environments. In this simplified model, you can choose the regions to replicate to.

Some configuration will be specific to target environments and will need to be specified in the [app deploy configuration](#app-deploy-configuration).

**type**

[replicationConfiguration](#replicationconfiguration)

### website

Configuration for hosting a static website in the bucket.
Website configuration is a simplified model that is designed to work across multiple target environments.
You can specify the index and error documents for the website, more advanced configuration such as redirects and routing rules are not supported in this simplified model.

**type**

[websiteConfiguration](#websiteconfiguration)

## Annotations

There are no annotations required for linking other resources to a `celerity/bucket` resource or modifying the behaviour of a bucket resource.

`linkSelector.byLabel` can be used to target buckets from other resource types.

## Outputs

Outputs are computed values that are accessible via the `{resourceName}.spec.*` field accessor in a blueprint substitution.
For example, if the resource name is `myBucket`, the output would be accessible via `${myBucket.spec.id}`.

### id

The ID of the created object storage bucket in the target environment.

**type**

string

**examples**

`arn:aws:s3:::my-bucket` (AWS)

`projects/my-project/buckets/my-bucket` (Google Cloud)

`my-bucket` (Azure)

## Data Types

### encryptionConfiguration

Encryption configuration for the bucket.

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>encryptionKeyId</strong></p>

The ID of the encryption key to use for encrypting objects in the bucket.

**field type**

string

**examples**

`arn:aws:kms:us-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab` (AWS)

___

<p style={{fontSize: '1.2em'}}><strong>encryptionAlgorithm</strong></p>

The algorithm to use for encryption.

For example, in AWS, you can use `AES256` or `aws:kms`.

This is only supported in some target environments.

**field type**

string

**examples**

`arn:aws:kms:us-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab` (AWS)

___

### corsConfiguration

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>corsRules</strong></p>

An array of CORS rules to apply to the bucket.

**field type**

array[[corsRule](#corsrule)]

___

### corsRule

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>id</strong></p>

A unique identifier to be used for the rule.

**field type**

string

___

<p style={{fontSize: '1.2em'}}><strong>allowedOrigins</strong></p>

An array of allowed origins that your customers will be able to access the bucket from.

**field type**

array[string]

**examples**

`["http://example.com", "https://example.com"]`

___

<p style={{fontSize: '1.2em'}}><strong>allowedHeaders</strong></p>

An array of allowed headers that are specified in the `Access-Control-Request-Headers` header.
These headers are allowed in preflight OPTIONS requests.
In response to a preflight request, the object storage service will return the requested headers that are allowed.

**field type**

array[string]

**examples**

`["Content-Type", "Authorization"]`

___

<p style={{fontSize: '1.2em'}}><strong>allowedMethods</strong></p>

An array of HTTP methods that are allowed for the bucket across origins.

**field type**

array[string]

**examples**

`["GET", "POST"]`

___

<p style={{fontSize: '1.2em'}}><strong>exposedHeaders</strong></p>

An array of headers in the response that you want customers to be able to access from their applications.

**field type**

array[string]

**examples**

`["Content-Type"]`

___

<p style={{fontSize: '1.2em'}}><strong>maxAge</strong></p>

Time in seconds that the browser is to cache the preflight response for the requested resource
in the bucket.
This must be a positive integer, equal to or greater than 0.

**field type**

integer

___

### lifecycleConfiguration

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>rules</strong></p>

An array of lifecycle rules to apply to the bucket.

:::warning
Some provider-specific fields in lifecycle rule configurations may be excluded due to the lack
of an equivalent across all target environments.
:::

**field type**

array[[lifecycleRule](#lifecyclerule)]

___

### lifecycleRule

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>id (required)</strong></p>

A unique identifier to be used for the rule.

**field type**

string

___

<p style={{fontSize: '1.2em'}}><strong>enabled (required)</strong></p>

Whether or not the rule is enabled.

**field type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>abortIncompleteMultipartUpload</strong></p>

Specifies the number of days after initiating a multipart upload that the multipart upload must be completed. If the multipart upload is not completed within the specified number of days, the object storage service will abort the multipart upload and delete the parts that were uploaded.

This field is supported by the following target environments:

- AWS (Amazon S3)
- Google Cloud (Cloud Storage)

**field type**

[abortIncompleteMultipartUploadConfig](#abortincompletemultipartuploadconfig)

___

<p style={{fontSize: '1.2em'}}><strong>expirationDate</strong></p>

Specifies the date after which objects matching the rule in the bucket will expire.
This is expected to be an ISO 8601 date string.

This field is supported by the following target environments:

- AWS (Amazon S3)

**field type**

string

**examples**

`2024-07-22T00:00:00Z`

___

<p style={{fontSize: '1.2em'}}><strong>expirationInDays</strong></p>

Specifies the number of days after the creation date of an object that the object will expire.

This field is supported by the following target environments:

- AWS (Amazon S3)
- Google Cloud (Cloud Storage)
- Azure (Blob Storage)

**field type**

integer

**examples**

`365`

___

<p style={{fontSize: '1.2em'}}><strong>noncurrentVersionExpiration</strong></p>

Specifies when noncurrent versions of objects in the bucket will expire.

This field is supported by the following target environments:

- AWS (Amazon S3)
- Google Cloud (Cloud Storage)
- Azure (Blob Storage)

**field type**

[noncurrentVersionExpirationConfig](#noncurrentversionexpirationconfig)

**examples**

`365`

___

<p style={{fontSize: '1.2em'}}><strong>noncurrentVersionTransitions</strong></p>

Specifies when noncurrent versions are transitioned to a different storage class.
Storage classes are simplified to the closest equivalent to `hot`, `cool` and `archive` storage classes,
this does not give precise control over the exact storage class in target environments with more granular storage classes.

This field is supported by the following target environments:

- AWS (Amazon S3)
- Google Cloud (Cloud Storage)
- Azure (Blob Storage)

**field type**

array[[noncurrentVersionTransitionConfig](#noncurrentversiontransitionconfig)]

**examples**

`365`

___

<p style={{fontSize: '1.2em'}}><strong>prefix</strong></p>

Specifies a prefix for the rule to apply to objects in the bucket.

**field type**

string

**examples**

`logs/`

___

<p style={{fontSize: '1.2em'}}><strong>transitions</strong></p>

Specifies when objects in the bucket will transition to a different storage class.
Storage classes are simplified to the closest equivalent to `hot`, `cool` and `archive` storage classes,
this does not give precise control over the exact storage class in target environments with more granular storage classes.

This field is supported by the following target environments:

- AWS (Amazon S3)
- Google Cloud (Cloud Storage)
- Azure (Blob Storage)

**field type**

array[[transitionConfig](#transitionconfig)]

**examples**

`365`


### abortIncompleteMultipartUploadConfig

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>daysAfterInitiation</strong></p>

The number of days after initiating a multipart upload that the multipart upload must be completed.

**field type**

integer

**examples**

`7`

___

### noncurrentVersionExpirationConfig

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>noncurrentDays</strong></p>

The number of days after which noncurrent versions of objects in the bucket will expire.

**field type**

integer

**examples**

`30`

___

### noncurrentVersionTransitionConfig

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>targetStorageClass (required)</strong></p>

The storage class to transition noncurrent versions of objects to.

See [Storage Class Mappings](#storage-class-mappings) for more information on how provider-specific storage classes are mapped to the simplified model.

**field type**

string

**allowed values**

`cool` | `archive`

___

<p style={{fontSize: '1.2em'}}><strong>transitionInDays (required)</strong></p>

The number of days after which noncurrent versions of objects in the bucket will be transitioned to the target storage class.

**field type**

integer

___

### transitionConfig

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>targetStorageClass (required)</strong></p>

The storage class to transition objects to.

See [Storage Class Mappings](#storage-class-mappings) for more information on how provider-specific storage classes are mapped to the simplified model.

**field type**

string

**allowed values**

`cool` | `archive`

___

<p style={{fontSize: '1.2em'}}><strong>transitionInDays (required)</strong></p>

The number of days after which objects in the bucket will be transitioned to the target storage class.

**field type**

integer

___

### loggingConfiguration

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>destinationBucket</strong></p>

The name of the bucket to save server access log files to.
By default, logs will be saved to the same bucket.

**field type**

string

**examples**

`my-logs-bucket`

___

<p style={{fontSize: '1.2em'}}><strong>logFilePrefix</strong></p>

The prefix to apply to log files saved in the destination bucket.
If you store log files from multiple buckets in a single bucket, you can use this prefix to differentiate between them.

**field type**

string

**examples**

`logs/`

___

### versioningConfiguration

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>status</strong></p>

The status of versioning for the bucket.
This can be set to `Enabled` to enable versioning for the bucket, or `Suspended` to suspend versioning.
When versioning is suspended, new objects will not have versions created, but existing versions will still be retained.

For Google Cloud, `Suspended` is equivalent to a `Disabled` object versioning status with a soft delete status set to `Enabled`.

For Azure Blob Storage, `Suspended` is equivalent to disabling blob versioning for the bucket, which leaves the existing versions intact, see [Azure Blob Storage versioning](https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview#enable-or-disable-blob-versioning) for more information.

By default, if versioning configuration is not provided, versioning will be disabled.

**field type**

string

**allowed values**

`Enabled` | `Suspended`

**examples**

`Enabled`

___

### replicationConfiguration

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>enabled</strong></p>

Whether or not replication is enabled for the bucket.

**field type**

boolean

___

<p style={{fontSize: '1.2em'}}><strong>regions</strong></p>

The regions to replicate objects in the bucket to.

The region strings are expected to be in the format of the target environment's region identifiers, for example:

- AWS: `us-west-2`
- Google Cloud `US-WEST2`
- Azure: `westus2`

:::warning Google Cloud Dual-Region Replication
For Google Cloud, you can only specify a single region to replicate to, as Celerity uses the dual-region replication approach for Google Cloud Storage.
:::

**field type**

array[string]

**examples**

```json
["us-west-2", "us-east-1"]
```

___

### websiteConfiguration

#### FIELDS

___

<p style={{fontSize: '1.2em'}}><strong>mainPageDocument</strong></p>

The name of the main page document for the static website hosted in the bucket.

**field type**

string

**examples**

`index.html`

___

<p style={{fontSize: '1.2em'}}><strong>notFoundDocument</strong></p>

The name of the document to return when a requested object is not found in the bucket.
This is typically a custom 404 page that you can use to provide a better user experience when a requested object is not found.

For the AWS target environments, this will be used as the error document for the static website hosted in the bucket that is a catch-all for errors beyond 404 not found errors.

**field type**

string

**examples**

`404.html`

___

## Linked From

#### [`celerity/handler`](/docs/applications/resources/celerity-handler)

When a handler links out to a bucket, it will be configured with permissions and environment variables that enable the handler to interact with the bucket. If a `celerity/config` resource is associated with the handler or the application that it is a part of, the bucket configuration will be added to the config/secret store instead of environment variables. You can use guides and templates to get an intuition for how to source the configuration and interact with object storage services using the handlers SDK.

:::warning Opting out of the handlers SDK for buckets
You don't have to use the handlers SDK abstraction for buckets,
you can also grab the populated configuration directly and interact directly with the SDK for the object storage service for the chosen target environment. Doing so will require application code changes if you decide to switch target environments.
:::

## Links To

#### [`celerity/queue`](/docs/applications/resources/celerity-queue)

When a bucket is linked to a queue, the queue will be configured to receive notifications from the bucket for events such as object creation, deletion, and updates. This is useful for making events flow through a queue for processing by handlers in an application where the queue can be used to control the flow of events and ensure that they are processed in a reliable manner.

In cases where you deploy your application to a target environment that is not FaaS-based[^1], a queue will be used to receive notifications from the bucket that the Celerity runtime will poll for events and trigger handlers accordingly.

#### [`celerity/topic`](/docs/applications/resources/celerity-topic)

When a bucket is linked to a topic, the topic will be configured to receive notifications from the bucket for events such as object creation, deletion, and updates. This is useful for publishing events to a topic that can be subscribed to by consumers such as handlers in applications of the `celerity/consumer` resource type.

#### [`celerity/handler`](/docs/applications/resources/celerity-handler)

When a bucket is linked to a handler, the handler will be configured to receive notifications from the bucket for events such as object creation, deletion, and updates. This is useful for processing events in a handler that can then perform actions based on the events received from the bucket.

For FaaS-based target environments, the handler will be triggered directly through a rule in the cloud provider's event system (e.g. Amazon EventBridge). To gain greater control over throughput and processing of events, you can link the bucket to a queue or topic and have the application consume events from there.

#### [`celerity/workflow`](/docs/applications/resources/celerity-workflow)

When a bucket is linked to a workflow, a workflow execution will be triggered when an event occurs in the bucket, such as an object being created, deleted, or updated. For FaaS-based target environments, the notification will be used to trigger an execution of the cloud provider's workflow service (e.g. AWS Step Functions). For non-FaaS target environments, an intermediary serverless function will be triggered by the bucket event to start the workflow execution by calling the API of your workflow application provided by the Celerity Workflow Runtime.

## Examples

### Basic Bucket Configuration

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
resources:
  myAppBucket:
    type: "celerity/bucket"
    metadata:
      displayName: My App Bucket
    spec:
      name: "my-app-bucket"
```

### Complex Bucket Configuration

```yaml
version: 2025-05-12
transform: celerity-2026-02-01
variables:
    encryptionKeyId:
        type: string
        description: "The ID of the encryption key to use for the bucket."
    encryptionAlgorithm:
        type: string
        description: "The algorithm to use for encryption, e.g. 'AES256' or 'aws:kms'."
        default: "aws:kms"
    logsBucket:
        type: string
        description: "The name of the bucket to store logs in."

resources:
    myAppBucket:
        type: "celerity/bucket"
        metadata:
            displayName: My App Bucket
        spec:
            name: "my-app-bucket"
            encryption:
                encryptionKeyId: "${variables.encryptionKeyId}"
                encryptionAlgorithm: "${variables.encryptionAlgorithm}"
            cors:
                corsRules:
                    - id: "cors-rule-1"
                      allowedOrigins: ["http://example.com", "https://example.com"]
                      allowedHeaders: ["Content-Type", "Authorization"]
                      allowedMethods: ["GET", "POST"]
                      exposedHeaders: ["Content-Type"]
                      maxAge: 3600
            lifecycle:
                rules:
                    - id: "lifecycle-rule-1"
                      enabled: true
                      expirationInDays: 365
                      transitions:
                          - targetStorageClass: "cool"
                            transitionInDays: 30
            logging:
                destinationBucket: "${variables.logsBucket}"
                logFilePrefix: "logs/"
            versioning:
                status: "Enabled"
            replication:
                enabled: true
                regions: ["us-west-2", "us-east-1"]
            website:
                mainPageDocument: "index.html"
                notFoundDocument: "404.html"
```

## Storage Class Mappings

To simplify object lifecycle configuration, the concept of `hot`, `cool` and `archive` storage classes for object transitions is used for a `celerity/bucket` resource. (This is the simplified model provided by Azure Blob Storage)

Google Cloud Storage and Amazon S3 have more granular sets of storage classes. The following table shows the mapping of storage classes to the simplified model:

| Celerity Bucket Storage Class | Google Cloud Storage | Amazon S3   | Azure Blob Storage |
| ----------------------------- | -------------------- | ----------- | ------------------ |
| hot                           |  STANDARD            | STANDARD    |  hot               |
| cool                          |  NEARLINE            | GLACIER_IR  |  cool              |
| archive                       |  ARCHIVE             | GLACIER     |  archive           |

## Target Environments

### Celerity::1

In the Celerity::1 local environment, object storage is provided by a [minio](https://min.io/) instance running on a container network on the local or CI machine.
Replication and encryption configuration will be ignored in the Celerity::1 environment.

Bucket notifications are published from the minio instance to a [valkey](https://github.com/valkey-io/valkey) queue on the local or CI machine using the [Redis bucket notification](https://min.io/docs/minio/linux/administration/monitoring/publish-events-to-redis.html) support in minio. The runtime will poll the queue for notifications and trigger handlers in response to bucket events.

:::note
[valkey](https://github.com/valkey-io/valkey) is also used as the `celerity/queue` and `celerity/topic` implementation in Celerity::1, so the same behaviour is mostly reused for bucket notifications.
:::

:::warning No encryption in local & CI environments
Buckets are not encrypted in local & CI environment.
:::

### AWS

In AWS, the `celerity/bucket` resource is implemented using [Amazon S3](https://docs.aws.amazon.com/s3/) buckets.

When replication is enabled, Celerity will create a replication configuration for the bucket with a simple rule to replicate objects to the specified regions.
A bucket resource will be created in each of the specified regions in the same storage class as the primary bucket.

Prefix-based replication is not supported in AWS, so all objects in the bucket will be replicated to the specified regions.

If enabling replication for an existing bucket, you will need to initiate a batch replication job to copy existing objects to the replicated buckets, Celerity (or the underlying S3 service) will not automatically copy existing objects to the replicated buckets.

### Google Cloud

In Google Cloud, the `celerity/bucket` resource is implemented using [Google Cloud Storage](https://cloud.google.com/storage) buckets.

When replication is enabled, Celerity will create a dual-region replication configuration for the bucket with the region for the deployment of the bucket and a single region to replicate to.

:::warning
When more than one region is specified for replication, only the first region will be used, as Celerity only supports dual-region replication for Google Cloud Storage buckets.
:::

### Azure

In Azure, the `celerity/bucket` resource is implemented using [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/).

When replication is enabled, Celerity will create a replication configuration for the container with a simple rule to replicate objects to the specified regions.

A storage account will be created in each of the specified regions, and the container will be created in each of the storage accounts. A replication policy will be created to replicate objects to the configured regions.

Prefix-based replication is not supported in Azure Blob Storage, so all objects in the container will be replicated to the specified regions.

When updating an existing bucket with replication enabled, Celerity will set a `minCreationTime` (based on the time the container was created) on the replication policy to ensure existing and new objects are replicated to the specified regions.

:::warning Azure supports up to 2 regions for replication
When more than two regions are specified for replication, only the first two regions will be used, as Azure Blob Storage only supports replication to two regions (storage accounts).
:::

## App Deploy Configuration

Configuration specific to a target environment can be defined for `celerity/bucket` resources in the [app deploy configuration](/cli/docs/app-deploy-configuration) file.

This section lists the configuration options that can be set in the `deployTarget.config` object in the app deploy configuration file.

### AWS Configuration Options

#### aws.s3.replication.role

The IAM role to assume when replicating objects in an S3 bucket.

**Type**

string

**Deploy Targets**

`aws`, `aws-serverless`

**Default Value**

When not provided, a role to assume will be created automatically when the bucket is created.

**Example**

```javascript
{
  "deployTarget": {
    "name": "aws",
    "appEnv": "production",
    "config": {
      "aws.s3.replication.role": "arn:aws:iam::123456789012:role/my-replication-role"
    }
  }
}
```

#### aws.s3.\<bucketName\>.replication.role

The IAM role to assume when replicating objects in an S3 bucket with a specific name.
`<bucketName>` refers to the logical name (key) of the bucket resource in the blueprint, not the actual name of the bucket in the target environment.

**Type**

string

**Deploy Targets**

`aws`, `aws-serverless`

**Default Value**

When not provided, a role to assume will be created automatically when the bucket is created.

**Example**

```javascript
{
  "deployTarget": {
    "name": "aws",
    "appEnv": "production",
    "config": {
      "aws.s3.myAppBucket.replication.role": "arn:aws:iam::123456789012:role/my-replication-role"
    }
  }
}
```

[^1]: FaaS stands for Function-as-a-Service, which is a serverless compute model where applications are composed of functions that are triggered by events. Examples of FaaS include AWS Lambda, Google Cloud Functions and Azure Functions.
