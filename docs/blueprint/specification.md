---
sidebar_position: 2
toc_max_heading_level: 4
---

# Specification

**v2025-05-12**

This section provides the first version of the Blueprint Specification with accompanying examples.

This is a specification of resources that can be deployed such as a Celerity application.

This specification is agnostic to the type of resources and is similar to tools like Terraform in the fact that it is abstract enough to support all kinds of resources (e.g. Cloud service resources, REST API resources, Docker containers etc.)

A blueprint will typically contain a bundle of resources that represent a logical deployable unit. One example of this would be a micro-service and its associated data stores.

The blueprint spec utilises a way of defining labels and link selectors that can be used to automatically link resources together without in-depth knowledge
of what powers the relationships. 
For example, this could abstract away a significant portion of dealing with permissions and networking for resources in a cloud provider.

The purpose of the blueprint specification and supporting implementations is to provide the backbone of scalable
code and infrastructure deployment tools and to be a part of an ecosystem of composable tools that super charge developers to deliver high quality products and services at a fast pace.

A blueprint can either be in JWCC ([JSON with Commas and Comments](https://nigeltao.github.io/blog/2021/json-with-commas-comments.html)) or YAML format.
The JWCC format is a JSON-based format that allows for comments and trailing commas, making it easier to read and write for the purpose of configuration.
The `.jsonc` extension is typically used for JWCC files, and is the recommended extension to be used with implementations of this spec.

## Yet another specification for resources?

You might be thinking, why on earth do we need another language/specification for defining resources?

That is a completely reasonable question. However, with a clean slate and an ability to focus on simplicity from the beginning we believe the blueprint framework having its own specification is fundamental.

What sets the blueprint specification apart from pre-existing specs of a similar nature is that it is designed to simplify relationships between resources
with pre-defined rules about how resources can be linked together that are implemented as a part of providers in an implementation of the spec such as the blueprint framework.

This means as a user, you will only have to define relationships between resources with labels, link selectors and accompanying annotations and not have to deal with the inner workings
of said relationships. This is a huge advantage especially when dealing with resources with very complex relationships that represent a standard practise or pattern that can be simplified.

## Spec

This is a specification conveying a valid structure for a blueprint along with additional context that goes beyond the schema.

You might be familiar with some of the concepts as the specification is inspired by Terraform, AWS CloudFormation and Kubernetes.

<br/>

### version

_**required**_

The version of the blueprint specification to use.

**type** 

string

**allowed values** 

2025-05-12

For the v2025-05-12 version of the specification, the only valid value is `2025-05-12`.

<br/>

### transform

One or more specialised transforms to be applied to the template at the preprocessing stage.

An example use case for a transform would be to provide "virtual" resources that abstract away a lot of complexity
that can then be expanded into the underlying resources as a part of preprocessing.

**type**

string | array[string]

**example**

celerity-2026-02-01

*Representing a hypothetical transform for a celerity application.*

<br/>

### variables

Variables provide a way to add dynamic inputs to a blueprint that can be referenced in resources, data sources in the spec along with the include section
that allows importing child blueprints.

Variables can be referenced in resources and data sources using the following syntax:

```
${variables.[variableName]}
```

For example:
```
${variables.databaseHost}
```

For more information about referencing variables, see the [references](#references--substitutions) section.

**type**

mapping[name(string), [variableDefinition](#variabledefinition)]

**example**

JSON With Commas and Comments

```javascript
{
  // The initial version of the blueprint spec.
  "version": "2025-05-12",
  // The transform to be applied to the blueprint.
  "transform": "celerity-2026-02-01",
  "variables": {
    "databaseHost": {
      "type": "string",
      "description": "The host of the database"
    },
    "databasePort": {
      "type": "integer",
      "description": "The port of the database"
    },
    "databaseUser": {
      "type": "string",
      "description": "The user of the database to connect with"
    },
    "databasePassword": {
      "type": "string",
      "description": "The password of the user to connect to the database with",
      // This is important to keep the database password out of any logs.
      "secret": true
    },
    "instanceSize": {
      "type": "aws/ec2/instanceSize",
      "description": "The size of the instance to use for the service",
      "default": "t3.micro"
    },
    "deploymentTarget": {
      "type": "string",
      "description": "Whether the application should be deployed as a containerised service or cloud functions",
      "allowedValues": ["container", "cloudFunctions"],
      "default": "container"
    }
  }
}
```

YAML

```yaml
variables:
  databaseHost:
    type: string
    description: The host of the database
  databasePort:
    type: integer
    description: The port of the database
  databaseUser:
    type: string
    description: The user of the database to connect with
  databasePassword:
    type: string
    description: The password of the user to connect to the database with
    secret: true
  instanceSize:
    type: aws/ec2/instanceSize
    description: The size of the instance to use for the service
    default: t3.micro
  deploymentTarget:
    type: string
    description: Whether the application should be deployed as a containerised service or cloud functions
    allowedValues:
      - container
      - cloudFunctions
    default: container
```
<br/>

### values

Values provide a way to define static and computed values that can be used in various sections of a blueprint such as resources, data sources and exports.
Values are mostly useful for storing computed and complex static values that can be reused in multiple places
or exported to be used in other blueprints or external systems.

For example, a value could be used to store the names of a list of dynamically generated s3 bucket names to be exported from the blueprint as follows:

```yaml
resources:
  s3Bucket1:
    type: aws/s3/bucket
    spec:
      objectLockEnabled: true
  
  s3Bucket2:
    type: aws/s3/bucket
    spec:
      objectLockEnabled: true

  s3Bucket3:
    type: aws/s3/bucket
    spec:
      objectLockEnabled: false

values:
  s3BucketNames:
    type: array
    value: |
      ${list(
        resources.s3Bucket1.spec.name,
        resources.s3Bucket2.spec.name,
        resources.s3Bucket3.spec.name
      )}

exports:
  s3Buckets:
    type: array
    field: values.s3BucketNames
```



Values can be referenced using the following syntax:
```
${values.[valueName]}
```

For more information about referencing values, see the [references](#references--substitutions) section.

:::tip
Exports can not carry out any computation for the `field` property as it is a reference to a value that is **not** a part of a `${..}` substitution. Functions can only be called in `${..}` substitutions.

To get around this limitation, you can use a value to store the computed value and then reference the value in the exports definition.
:::

**type**

mapping[string, [valueDefinition](#valuedefinition)]

**example**

JSON with Commas and Comments

```javascript
{
  "values": {
    "s3BucketNames": {
      "type": "array",
      "value": "${list(resources.s3Bucket1.spec.name, resources.s3Bucket2.spec.name, resources.s3Bucket3.spec.name)}"
    }
  }
}
```

YAML

```yaml
values:
  s3BucketNames:
    type: array
    value: |
      ${list(
        resources.s3Bucket1.spec.name,
        resources.s3Bucket2.spec.name,
        resources.s3Bucket3.spec.name
      )}
```

YAML Static Object

```yaml
values:
  logsPolicyDoc:
    type: object
    value:
      policyName: "LambdaExecutionPolicy"
      policyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: "Allow"
            Action:
              - "logs:CreateLogGroup"
              - "logs:CreateLogStream"
              - "logs:PutLogEvents"
            Resource: "*"
```

YAML Static Array

```yaml
values:
  allowedOrigins:
    type: array
    value:
      - "https://example.com"
      - "https://another-example.com"
```

### datasources

Data sources provide a way to source dynamic values to be used in resources and other data sources from external sources that will have been created outside
the scope of a blueprint.

Data sources can be from any provider configured in an implementation of the spec.
A data source will always resolve a single value when applying the filter to the external resources, if there are multiple external resources that match the filter, the first one is expected to be returned.

The order in which data sources are resolved is implicitly determined by where data sources are referenced.

Data sources can be referenced using the following syntax:
```
${datasources.[datasourceName].[exportedField]}
```

For example, for a data source definition like the following:

```yaml
datasources:
  network:
    type: aws/vpc
    metadata:
      displayName: Network source
    filter:
      field: tags
      operator: has key
      search: ${variables.environment}
    exports:
      subnets:
        type: array
      securityGroups:
        type: array
      vpc:
        type: string
        aliasFor: vpcId
```

You will be able to access the id of the VPC that was found using the filter like so:

```
${datasources.network.vpc}
```

For more information about referencing data source fields, see the [references](#references--substitutions) section.

**type**

mapping[string, [datasourceDefinition](#datasourcedefinition)]

**example**

JSON with Commas and Comments

```javascript
{
  "datasources": {
    "network": {
      "type": "aws/vpc",
      "metadata": {
        "displayName": "Network source"
      },
      "filter": {
        "field": "tags",
        "operator": "has key",
        // Dynamic values can be used in the search value
        // for a data source filter.
        "search": "${variables.environment}"
      },
      "exports": {
        "subnets": {
          "type": "array"
        },
        "securityGroups": {
          "type": "array"
        },
        "vpc": {
          "type": "string",
          "aliasFor": "vpcId"
        }
      }
    }
  }
}
```

YAML

```yaml
datasources:
  network:
    type: aws/vpc
    metadata:
      displayName: Network source
    filter:
      field: tags
      operator: has key
      search: ${variables.environment}
    exports:
      subnets:
        type: array
      securityGroups:
        type: array
      vpc:
        type: string
        aliasFor: vpcId
```

YAML with multiple filters

```yaml
datasources:
  network:
    type: aws/vpc
    metadata:
      displayName: Network source
    filter:
      - field: tags
        operator: has key
        search: ${variables.environment}
      - field: region
        operator: in
        search: ${variables.awsRegions}
    exports:
      subnets:
        type: array
      securityGroups:
        type: array
      vpc:
        type: string
        aliasFor: vpcId
```

YAML exporting all fields

```yaml
datasources:
  network:
    type: aws/vpc
    metadata:
      displayName: Network source
    filter:
      - field: tags
        operator: has key
        search: ${variables.environment}
      - field: region
        operator: in
        search: ${variables.awsRegions}
    exports: "*"
```

<br/>

### resources

**_conditionally required_**

Resources are the most important part of the blueprint spec, providing a way to define the key components that make up a blueprint
and the relationships between them.

An implementation of the spec is responsible for managing the lifecycle of resources, synchronising with underlying services
interfaced with through providers and keeping track of their state.

Resources in the blueprint spec are not meant to be tied to any specific notion of a resource.
If there is a resource/entity as a part of a domain model in any type of system and you can build
a provider for it, then it can be represented as a resource in a blueprint.

The most common use cases are likely to be managing cloud infrastructure and backend applications. (e.g. AWS services or a Celerity application)

When defined in a blueprint, resources are mappings keyed by a name for the resource that is unique to a blueprint.

At least one resource must be defined in a blueprint if there are no [includes](#include).

**type**

mapping[string, [resourceDefinition](#resourcedefinition)]

**example**

JSON with Commas and Comments

```javascript
{
  "resources": {
    "saveOrderFunction": {
      "type": "aws/lambda/function",
      "description": "The function responsible for saving a new order to the system.",
      "metadata": {
        "displayName": "Save Order Function",
        "annotations": {
          "aws.lambda.function.populateEnvVars": true
        }
      },
      "linkSelector": {
        "byLabel": {
          "service": "ordersApi"
        }
      },
      "spec": {
        "functionName": "ordersApi-${variables.environment}-saveOrderFunction-v1",
        "codeUri": "./orders",
        "handler": "save_order.handler",
        "runtime": "python3.9",
        "tracing": "Active",
        "architectures": "arm64",
        "environment": {
          "variables": {
            "DATABASE_HOST": "${variables.databaseHost}",
            "DATABASE_PORT": "${variables.databasePort}",
            "DATABASE_USER": "${variables.databaseUser}",
            "DATABASE_PASSWORD": "${variables.databasePassword}",
            "DATABASE_NAME": "${variables.databaseName}"
          }
        },
        "timeout": 120
      }
    }
  }
}
```

YAML
  
```yaml
resources:
  saveOrderFunction:
    type: aws/lambda/function
    description: The function responsible for saving a new order to the system.
    metadata:
      displayName: "Save Order Function"
      annotations:
        aws.lambda.function.populateEnvVars: true
    linkSelector:
      byLabel:
        service: 'ordersApi'
    spec:
      functionName: ordersApi-${variables.environment}-saveOrderFunction-v1
      codeUri: ./orders
      handler: save_order.handler
      runtime: python3.9
      tracing: Active
      architectures: arm64
      environment:
        variables:
          DATABASE_HOST: ${variables.databaseHost}
          DATABASE_PORT: ${variables.databasePort}
          DATABASE_USER: ${variables.databaseUser}
          DATABASE_PASSWORD: ${variables.databasePassword}
          DATABASE_NAME: ${variables.databaseName}
      timeout: 120
```

<br/>

### include

**_conditionally required_**

Include provides a way to include other blueprints in a given blueprint.
Included blueprints are treated as children and their properties can be accessed from the parent using `${children.{childName}.{property}}`.
Child blueprints can be referenced in resources, as inputs to other child blueprints and in exports.
See the [references](#references--substitutions) section for more information on how values from child blueprints can be referenced.

This is the primary way to compose blueprints that is a part of the core specification, see [Modular Blueprints](#modular-blueprints) for other approaches.

The order of deployment and change staging for child blueprints is determined based on references to the outputs of one child blueprint used as
the input to another.

At least one blueprint include must be defined in a blueprint if there are no [resources](#resources).


**type**

mapping[string, [includeDefinition](#includedefinition)]

**example**

JSON with Commas and Comments

```javascript
{
  "include": {
    // Consider changing the name to something other than coreInfra.
    "coreInfra": {
      "path": "core-infra.yaml",
      "description": "core infra (including database) for the Orders API",
      "variables": {
        "databaseName": "${variables.databaseName}"
      },
      "metadata": {
        "sourceType": "aws/s3",
        "bucket": "order-system-blueprints",
        "region": "eu-west-1"
      }
    },
    "ordersApi": {
      "path": "api.yaml",
      "description": "The stack for the Orders API",
      "variables": {
        "databaseHost": "${children.coreInfra.databaseHost}",
        "databasePort": "${children.coreInfra.databasePort}",
        "databaseUser": "${children.coreInfra.databaseUser}",
        "databasePassword": "${children.coreInfra.databasePassword}",
        "databaseName": "${variables.databaseName}"
      }
    }
  }
}
```

YAML

```yaml
include:
  coreInfra:
    path: core-infra.yaml
    description: core infra (including database) for the Orders API
    variables:
      databaseName: ${variables.databaseName}
    metadata:
      sourceType: aws/s3
      bucket: order-system-blueprints
      region: eu-west-1
  ordersApi:
    path: api.yaml
    description: The stack for the Orders API
    variables:
      databaseHost: ${children.coreInfra.databaseHost}
      databasePort: ${children.coreInfra.databasePort}
      databaseUser: ${children.coreInfra.databaseUser}
      databasePassword: ${children.coreInfra.databasePassword}
      databaseName: ${variables.databaseName}
```

<br/>

### exports

Exports are a way to define a set of values from the blueprint that are publicly accessible attributes of
the blueprint that can be used in other blueprints as data sources or in external applications or systems that interface with
an implementation of the spec via an API.

**type**

mapping[string, [exportDefinition](#exportdefinition)]

**example**

JSON with Commas and Comments

```javascript
{
  "exports": {
    "saveOrdersFunctionArn": {
      "type": "string",
      "description": "The ARN of the function used to save orders to the system.",
      // ${..} substitutions are not allowed in the field property
      // so we must reference the path to a field as a string.
      "field": "resources.saveOrdersFunction.spec.functionArn"
    },
    "saveOrdersFunctionName": {
      "type": "string",
      "description": "The name of the function used to save orders to the system.",
      "field": "resources.saveOrdersFunction.spec.functionName"
    }
  }
}
```

YAML

```yaml
exports:
  saveOrdersFunctionArn:
    type: string
    description: The ARN of the function used to save orders to the system.
    field: resources.saveOrdersFunction.spec.functionArn
  saveOrdersFunctionName:
    type: string
    description: The name of the function used to save orders to the system.
    field: resources.saveOrdersFunction.spec.functionName
```

<br/>


### metadata

Metadata is for blueprint-level metadata used in transformers and resource providers to carry out functionality
that spans multiple resources in a blueprint.

**type**

mapping[string, ( string | object | array | boolean | float | integer ) ]

**example**

JSON with Commas and Comments

```javascript
{
  "metadata": {
    "function.builder": "ESM",
    // The benefits of minifying are still being evaluated,
    // it might be worth removing this in the future if it doesn't
    // provide a significant benefit. 
    "function.builder.minify": false
  }
}
```

```yaml
metadata:
  function.builder: ESM
  function.builder.minify: false
```

<br/>

## Spec Data Types

### variableDefinition

A definition for a variable that can be referenced in resources and data sources in the spec.
The name of the variable is not in this definition as it is the key in the mapping of variables that makes use of this data type.

The custom type (`{customType}`) referenced in the variable fields is a type defined by a specific provider in an implementation of the spec
that exists for convenience when dealing with variables with a large set of fixed possible values.

A custom variable type must be of the format `{provider}/{type}`.
An example of a custom variable type would be `aws/region` with a fixed set of supported AWS regions served by an AWS resource provider.

With custom types, labels should be used as references to the values of the variable instead of the values themselves. Custom types should be treated as enums.

:::tip
Only scalar values are supported for variables. If you want to pass in complex structures such as arrays or objects, you will need to pass them in as strings and use the `jsondecode` function in a substitution to interact with the array or object structure.

For example, if you are using a provider with a custom function that takes a specific object structure as input you would do the following:

```
${custom_provider_function(
  jsondecode(variables.deploymentConfig)
)}
```

Where `variables.deploymentConfig` would be a serialised JSON string defined in:

```yaml
variables:
  deploymentConfig:
    type: string
    description: The deployment configuration for the service
    default: '{"replicas": 3, "memory": 512}'
```
:::

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>type (required)</strong></p>

The type of the variable that can be referenced throughout the spec.

**field type**

string

**allowed values** 

string | integer |  float | boolean | `{customType}`

___

<p style={{fontSize: '1.2em'}}><strong>allowedValues</strong></p>

A list of allowed values for the variable.
All possible values must be of the same type
as the one defined for the field.

Allowed values can be used with custom variable types to restrict the set of the possible values further.

_For custom types, allowed values must be provided as the label for an option._

_Boolean variables do not support allowed values as binary enumeration does not make much sense,
it is better to set boolean variables that can be true or false and use other types for enumerable lists of options._

**field type** 

`array[conditional based on "type" ( string | integer | float | boolean | {customType} )]`

___

<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of the variable.

**field type**

string

___

<p style={{fontSize: '1.2em'}}><strong>secret</strong></p>

Indicates whether or not the variable is a secret. This is useful as it allows implementations to mask sensitive values in a blueprint.

**field type** 

boolean

**default value**

false

___

<p style={{fontSize: '1.2em'}}><strong>default</strong></p>

Provides a default value for the variable as a fallback when a value for the variable is not provided.

_For custom types, the default value must be provided as the label for an option._

**field type**

conditional based on "type" `( string | integer | float | boolean | {customType} )`


<br/>
<br/>

### valueDefinition

A definition for a value that can be referenced in resources, data sources, exports and other values in the spec.
The name of the value is not in this definition as it is the key in the mapping of values that makes use of this data type.

Values can be scalar types, arrays or objects.

Values can not have defaults as the `value` field is required and will always contain a static or computed value.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>type (required)</strong></p>

The type of the value that can be referenced throughout the spec.

**field type**

string

**allowed values** 

string | integer | float | boolean | array | object

___

<p style={{fontSize: '1.2em'}}><strong>value (required)</strong></p>

The computed or static value that can be accessed from other values, resources, data sources, exports and metadata in a blueprint.

**field type**

string | integer | float | boolean | object | array

**examples**

```
${list(
  resources.s3Bucket1.spec.name, 
  resources.s3Bucket2.spec.name, 
  resources.s3Bucket3.spec.name
)}
```

`"t3.micro"`

`"${variables.databaseHost}"`

`${normalize(values.s3BucketNames)}`

```json
{
  "policyName": "LambdaExecutionPolicy",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "*"
      }
    ]
  }
}
```

___

<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of the value, useful for providing context in tools built on top of the blueprint specification.

**field type**

string

___

<p style={{fontSize: '1.2em'}}><strong>secret</strong></p>

Indicates whether or not the value is a secret. This is useful as it allows implementations to mask sensitive values in a blueprint.

**field type** 

boolean

**default value**

false

<br/>
<br/>

### datasourceDefinition

A definition for a data source that can be referenced in resources and other data sources in the spec.
The name of the data source is not in this definition as it is the key in the mapping of data sources that makes use of this data type.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>type (required)</strong></p>

The type of data source, must be a valid namespace for a type of one of the providers configured with the
spec implementation/engine that is being used. (e.g. `aws/vpc`)

**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>metadata</strong></p>

Metadata provides useful information about the data source including things like
annotations that can be used to provide extra context about the data source which can
be used by provider implementations. 

**field type** 

[dataSourceMetadataDefinition](#datasourcemetadatadefinition)

___

<p style={{fontSize: '1.2em'}}><strong>filter (required)</strong></p>

Filter provides a way to select a specific resource managed outside of the blueprint for a data source.
A filter can simply be an equality check (`=` or `!=`), or it can be a more complex search using operators like `in`, `not in` etc.
One or more filter definitions can be defined for a data source. 

:::note
When an array is supplied, all filters must match for the data source to be considered a match, implementations must treat the array of filters as a logical `and` operation.
:::

In the case there are multiple externally-managed resources that match a filter, the first one should be used.

**field type** 

[dataSourceFilterDefinition](#datasourcefilterdefinition) | array[[dataSourceFilterDefinition](#datasourcefilterdefinition)]

___

<p style={{fontSize: '1.2em'}}><strong>exports (required)</strong></p>

Exports provides a way to define the fields that should be exported from the data source and exposed to resources
and other data sources in a blueprint.

The names of the fields exported from the data source should be the keys in the mapping of exports
unless the `aliasFor` property is used, in which case the value of `aliasFor` should be a valid field name
in the data source object.

The `*` wildcard can be used to export all fields from the data source to be used by other elements in the blueprint.

**field type** 

mapping[name(string), [dataSourceExportDefinition](#datasourceexportdefinition)] | string

___

<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of a data source that can be used to provide extra context in UI or CLI tools
that make use of the blueprint specification.

**field type** 

string

<br/>
<br/>

### dataSourceMetadataDefinition

A definition for the metadata that can be associated with a data source.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>displayName</strong></p>

A name of the data source that should be used when displaying it to the user in UI or CLI tools.

**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>annotations</strong></p>

Annotations provide extra context that can be used by data source implementations.

Annotations should be well documented by providers for data sources
to allow for easy discovery of the available options and required context needed for a data
source to do its job.

The value of an annotation must be a string, when `${..}` substitutions are used, the value must resolve to a string.

It is good practise to namespace annotation keys and use dot notation.

**field type**

mapping[string, string]

___

<p style={{fontSize: '1.2em'}}><strong>custom</strong></p>

Custom is set aside for any custom metadata outside the scope of the blueprint specification
implementation.

An implementation of the spec should persist the custom metadata associated with a blueprint instance
so that it can be accessed by other tools that may use the custom metadata.
Providers can also make use of the custom metadata where annotations do not suffice, however its usage must be
well documented.

An example use case would be for visual information in a UI diagramming tool for resources and data sources.

**field type** 

mapping[string, ( string | object | integer | float | array | boolean )]

<br/>
<br/>

### dataSourceFilterDefinition

A definition of a filter that can be used to select a specific resource managed outside of the blueprint for a data source.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>field (required)</strong></p>

The name of the field in the external resource that should be compared to the search value(s) using the configured operator.
Object paths using dot notation can be used for nested fields in external resources (e.g. `metadata.name`).

:::caution
A filter `field` does **not** correspond to the field name in the data source specification for fields that can be exported from the data source.
These fields can be any data type and are not limited to the fields that can be exported from the data source.
You can check the documentation of a data source provider to see the fields that can be used in a filter.
:::

**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>operator (required)</strong></p>

The operator used to compare the search value(s) with the configured field in the external resource.

Operators should be read with the field on the left and the search value(s) on the right.

**field type** 

string

**allowed values**

`=` | `!=` | in | not in | has key | not has key | contains | not contains | starts with | not starts with | 
ends with | not ends with | `>` | `<` | `>=` | `<=`

For more precise information on how the operators should behave with certain inputs, see the [Operator Behaviours](#operator-behaviours) section.

___

<p style={{fontSize: '1.2em'}}><strong>search (required)</strong></p>

A value or list of values that should be compared to the value of the configured field in the resource using the configured operator.

**field type** 

string | integer | float | boolean | array[ ( string | integer | float | boolean ) ]

<br/>
<br/>

### dataSourceExportDefinition

A definition of an exported field from a data source that is exposed to resources and other data sources in
a blueprint.

:::tip
As only primitive values and primitive arrays are supported, data source developers should model complex data structures using field names such as `loggingConfig.applicationLogLevel` to represent nested fields in the data source object or populate exported data source fields with JSON-encoded strings that can be parsed in blueprints using the [`jsondecode`](/docs/blueprint/core-functions#jsondecode) function in a `${..}` substitution.

When using names with dot notation to represent nested fields, you will need to reference the field like so:
`${datasources.myFunction["loggingConfig.applicationLogLevel"]}`

This is due to `.` being a reserved character to access data from multiple blueprint element types such as resources, data sources and values.
:::

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>type (required)</strong></p>

The type of the field being exported from the data source.

**field type** 

`array | string | integer | float | boolean`

_only arrays of primitive values are supported as exported data source fields._

___

<p style={{fontSize: '1.2em'}}><strong>aliasFor</strong></p>

Determines the name of the field in the data source object that should be exported
to the blueprint with an alias.

When this field is set, the alias would be the key in the `datasources` mapping.
See the [datasources](#datasources) examples for more information.


**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of the exported field that can be used to provide extra context in UI or CLI tools
that make use of the blueprint specification.

**field type** 

string

<br/>
<br/>

### resourceDefinition

A definition for a resource in a blueprint.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>type (required)</strong></p>

The type of the resource, namespaced by its provider.

The format for a resource type should be one of the following:

`{provider}/{service}/{resourceType}` 

`{provider}/{resourceType}`
<br/>

An example of a valid namespace for a resource type would be `aws/ec2/instance` or `celerity/handler`.
When the `{resourceType}` segment contains multiple words, `lowerCamelCase` should be used. An example of this would be `aws/ec2/autoScalingGroup`.

**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>metadata</strong></p>

Metadata provides useful information about the resource including things like
annotations and labels.

For resources, annotations can be used to provide optional and required context for relationships between resources (linking).

For resources, labels are essential for an implementation of the specification to be
able to link resources together in an implicit, declarative fashion.

**field type** 

[resourceMetadataDefinition](#resourcemetadatadefinition)
___

<p style={{fontSize: '1.2em'}}><strong>dependsOn</strong></p>

One or more resource names that a given resource depends on.
This should be used for defining explicit dependencies between resources that can't be inferred from references
or links within a blueprint.

_This **should not** be used as the primary way to define relationships between resources, it should only be used when relationships can't be inferred from references or links._

**field type**

string | array[string]
___

<p style={{fontSize: '1.2em'}}><strong>condition</strong></p>

Condition provides a way to conditionally create resources based on the state of other resources,
variables, values or data sources in the blueprint.

The condition can be defined in 2 ways. 1, as a boolean expression in a `${..}` substitution that evaluates to `true` or `false`; 2, as a condition object that allows conditions to be combined with `and`, `or` and `not` operators.

:::tip
`${..}` substitutions can also support more complex logical expression utilising the `and`, `or` and
`not` functions. 

For example:

```
${or(
  eq(variables.deploymentTarget, "container"),
  eq(variables.deploymentTarget, "cloudFunctions")
)}
```
:::

An example of a condition for a resource would be:

```yaml
resources:
  saveOrderFunction:
    type: aws/lambda/function
    condition:
      and:
        - ${eq(variables.deploymentTarget, "serverless")}
        - ${eq(variables.environment, "production")}
    spec:
      functionName: ordersApi-${variables.environment}-saveOrderFunction-v1
      codeUri: ./orders
      handler: save_order.handler
      runtime: python3.12
      tracing: Active
      architectures: arm64
      environment:
        variables:
          DATABASE_HOST: ${variables.databaseHost}
          DATABASE_PORT: ${variables.databasePort}
          DATABASE_USER: ${variables.databaseUser}
          DATABASE_PASSWORD: ${variables.databasePassword}
          DATABASE_NAME: ${variables.databaseName}
      timeout: 120
```


**field type** 

string | [conditionDefinition](#conditiondefinition)
___

<p style={{fontSize: '1.2em'}}><strong>each</strong></p>

Provides a way to create multiple resources based on a list of values that can be referenced in the blueprint. The current item in the list can be accessed by referencing `elem` in a `${..}` substitution. The current index can be accessed by referencing `i` in a `${..}` substitution.

See the [references](#references--substitutions) section for more information on how to reference the current item (`elem`) and current index (`i`) in the each array.

:::tip
`each` does not support substitution references that resolve to objects or mappings, you can do the following to feed an object into an `each`:

```
${vals(values.bucketsConfig)}
```
:::

An example of using `each` for a resource would be:

```yaml
resources:
  s3Buckets:
    type: aws/s3/bucket
    each: ${values.bucketsToCreate}
    spec:
      bucketName: ${elem.bucketName}
      objectLockEnabled: ${elem.objectLockEnabled}
      tags:
        - key: "bucketNumber"
          value: bucket-${i}
```

Then to reference resources from an `each` resource template, you can use the following syntax:

```
${resources.s3Buckets[1].spec.bucketName}
```

:::caution Limited Substitution Support
`each` can not contain values derived from another resource or included blueprints.
If a resource or included blueprint is a direct or transitive dependency of a reference
used in the `each` substitution, validation of a blueprint should fail.

The reasoning for this is that implementations of this specification, in most cases, should process
resource templates before staging changes or deploying resources in a blueprint. This will allow
for a single way to model resources and their relationships when orchestrating deployments.
:::

**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>linkSelector</strong></p>

A specification of selectors that can be used to link to resources that match the given criteria where there is an implementation
in a provider that facilitates the relationship.

linkSelector should be set for a resource that is going to be making use of other resources that match the criteria.
For example, a cloud function that will make use of a cloud data store will set a linkSelector criteria to link out to
the cloud data store.

:::caution
The linkSelector query is only applied to resources within the same blueprint, it can **not** select resources that match the criteria in another blueprint. For example, resources in a child blueprint can **not** be selected by a linkSelector in a parent blueprint. Instead, blueprints must share data through [`variables`](#variables) and [`exports`](#exports).
:::

**field type** 

[linkSelectorDefinitions](#linkselectordefinitions)

___

<p style={{fontSize: '1.2em'}}><strong>spec (required)</strong></p>

The specification for the resource that will be used to create/update and synchronise blueprint lifecylce state with the resource in the provider.

An example for a cloud function resource spec in AWS would be the spec object in the following:

```yaml
  saveOrderFunction:
    type: aws/lambda/function
    spec:
      codeUri: ./orders
      handler: save_order.handler
      runtime: python3.9
      tracing: Active
      timeout: 120
```

The above example just shows a small subset of the fields avaiable for an AWS Lambda spec.
Resource implementations should provide a fully featured spec that conforms to the API of the provider service.

**field type** 

mapping[string, ( string | object | integer | float | array | boolean ) ]

___


<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of the resource that can be used to provide extra context in UI or CLI tools
that make use of the blueprint specification.

**field type** 

string

<br/>
<br/>

### resourceMetadataDefinition

A definition for the metadata that can be associated with a resource that primarily enables
implicit linking between resources when combined with selectors.


<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>displayName</strong></p>

A name of the resource that should be used when displaying it to the user in UI or CLI tools.

**field type** 

string

___

<p style={{fontSize: '1.2em'}}><strong>annotations</strong></p>

Annotations provide extra context that can be used in links that represent the relationships
between resources.

_All values that do not represent a property of a relationship between resources should be a part
of the resource spec._

Annotations should be well documented by providers for resources and their links
to allow for easy discovery of the available options and required context needed for a data
source to do its job.

The value of an annotation must be a string, when `${..}` substitutions are used, the value must resolve to a string.

It is good practise to namespace annotation keys and use dot notation.

**field type** 

mapping[string, string]

___

<p style={{fontSize: '1.2em'}}><strong>labels</strong></p>

Labels provide a way of grouping resources that can be linked to by a selector based on predefined rules.

For example, let's create a scenario where you have a serverless application that you want to deploy to a cloud service like AWS.
In this scenario you have some lambda functions that need to talk to a DynamoDB table and a Secrets Manager store.
In the blueprint specification, in order to make the DynamoDB table and SecretsManager store available to the cloud functions,
you will set a shared label on the DynamoDB table and SecretsManager store and then set a selector on the cloud functions like the following.

```yaml
resources:

  ordersTable:
    type: aws/dynamodb/table
    metadata:
      labels:
        displayName: "Orders Table"
        service: "ordersApi"
    spec:
      attributeDefinitions:
        - attributeName: "order_id"
          attributeType: "N"
        - attributeName: "product_id"
          attributeType: "N"
        - attributeName: "amount"
          attributeType: "N"
      keySchema:
        - attributeName: "order_id"
          keyType: "HASH"
        - attributeName: "product_id"
          keyType: "RANGE"
      tableName: "orders"
    
  ordersSecrets:
    type: aws/secretsmanager/secret
    metadata:
      displayName: "Orders Secrets"
      labels:
        displayName: "Orders Secrets"
        service: "ordersApi"
    spec:
      secretName: "ordersApi"

  getOrdersFunction:
    type: aws/lambda/function
    metadata:
      displayName: "Get Orders Function"
      annotations:
        # A hypothetical annotation that indicates that
        # each resource that meets the criteria of the link selector
        # should be made available to the lambda function as an environment variable.
        aws.lambda.function.populateEnvVars: true
    linkSelector:
      byLabel:
        service: 'ordersApi'
    spec:
      codeUri: ./orders
      handler: get_orders.handler
      runtime: python3.9
      tracing: Active
      timeout: 120

  saveOrderFunction:
    type: aws/lambda/function
    metadata:
      displayName: "Save Order Function"
      annotations:
        aws.lambda.function.populateEnvVars: true
    linkSelector:
      byLabel:
        service: 'ordersApi'
    spec:
      codeUri: ./orders
      handler: save_order.handler
      runtime: python3.9
      tracing: Active
      timeout: 120
```

Some predefined rules about the relationships between lambda functions and the resources they need to talk to (e.g. DynamoDB tables and SecretsManager stores)
will be used in the selection process to determine what links are supported.
The link implementation will then be responsible for ensuring everything needed to "activate" the link is provisioned.
In this example, this would include ensuring the correct roles and policies are attached to the lambda functions.
With a set of enhacement annotations indicating env var names to store DB and secret store info in, 
environment variables could also be pre-populated in lambda functions with DynamoDB and SecretsManager store details.

**field type** 

mapping[string, string]

___

<p style={{fontSize: '1.2em'}}><strong>custom</strong></p>

Custom is set aside for any custom metadata outside the scope of the blueprint specification
implementation.

An implementation of the spec should persist the custom metadata associated with a blueprint instance
so that it can be accessed by other tools that may use the custom metadata.
Providers can also make use of the custom metadata where annotations do not suffice, however its usage must be
well documented.

An example use case would be for visual information in a UI diagramming tool for resources and data sources.

**field type** 

mapping[string, ( string | object | integer | float | array | boolean )]

<br/>
<br/>

### conditionDefinition

A definition for a condition that can be used to conditionally create resources based on the state of other resources, variables, values or data sources in the blueprint.

A condition **must** only have **one** of the following fields set: `or`, `and`, `not`.

If more than one of the fields are set, an implementation of the spec should fail with an informative error.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>or</strong></p>

A list of conditions that should be evaluated with a logical OR operator.

**field type** 

array[[conditionDefinition](#conditiondefinition) | string]

___

<p style={{fontSize: '1.2em'}}><strong>and</strong></p>

A list of conditions that should be evaluated with a logical AND operator.

**field type** 

array[[conditionDefinition](#conditiondefinition) | string]

___

<p style={{fontSize: '1.2em'}}><strong>not</strong></p>

A condition that should be evaluated with a logical NOT operator, negating the result of the condition.

**field type** 

[conditionDefinition](#conditiondefinition) | string

<br/>
<br/>

### linkSelectorDefinitions

A definition for supported link selectors that can be used to implicitly link resources together.

In this version of the specification, the only supported linkSelector type is `byLabel`.


<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>byLabel</strong></p>

A selector that can be used to select resources that match a set of labels.
When multiple labels are defined, implementations of the specification should require **ALL** labels to match.

**field type** 

mapping[string, string]

<br/>
<br/>

### includeDefinition

A definition for a child blueprint that should be included in the current blueprint.
A child blueprint can be on the same file system as the parent blueprint or sourced remotely
depending on the implementation of the spec.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>path (required)</strong></p>

The path of the child blueprint to include.

This can be a relative path to the current blueprint, relative to the current working directory in
a tool implementing the spec or the key/name of the blueprint in a remote file system
or object store.

Relative path example:

```
-- main-blueprint.yaml
-- child-blueprint.yaml
```

```yaml
# main-blueprint.yaml
include:
  child:
    path: child-blueprint.yaml
```


Working directory path example:


```
-- app_infra
---- main-blueprint.yaml
-- core_infra
---- child-blueprint.yaml
```

```yaml
# app_infra/main-blueprint.yaml
include:
  child:
    path: ${cwd()}/core_infra/child-blueprint.yaml
```

Remote file system example:

```yaml
# main-blueprint.yaml
include:
  coreInfrastructure:
    path: core-infra-2025-05-12.yaml
    metadata:
      sourceType: aws/s3
      bucket: order-system-blueprints
      region: eu-west-1
```

**field type**

string

___

<p style={{fontSize: '1.2em'}}><strong>variables</strong></p>

A mapping of variable names to values to be used in the child blueprint.

The names (mapping keys) must match the variable names defined in the child blueprint.
The value type must match the same type as the variable definition in the child blueprint.

**field type**

`mapping[string, ( string | integer | float | boolean ) ]`

___

<p style={{fontSize: '1.2em'}}><strong>metadata</strong></p>

Metadata that is designed for implementations to provide custom context/information for dealing with a child
blueprint.

For example, an implementation would add metadata about a remote location to source a child blueprint from.

**field type**

mapping[string, ( string | object | array | boolean | float | integer ) ]

___

<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of the child blueprint providing context for its usage in the parent blueprint.

**field type**

string

<br/>
<br/>

### exportDefinition

A definition for data exported from the blueprint that can be referenced by other blueprints or external systems.
The name of the exported attribute is the key in the mapping in the [exports](#exports) section of the blueprint.

<p style={{fontSize: '1em'}}><strong>FIELDS</strong></p>
___

<p style={{fontSize: '1.2em'}}><strong>type (required)</strong></p>

The type of the exported field.

Implementations of the specification should explicitly fail with an informative error
when the exported field type does not match the type of the field being exported.

**field type**

string

**allowed values** 

string | integer | float | boolean | array | object

___

<p style={{fontSize: '1.2em'}}><strong>field (required)</strong></p>

The name/path of the resource field, data source field, child blueprint field, variable or value to export.

When it comes to resources, any attribute can be exported, including fields in the spec and metadata.

In addition to user-defined fields, computed fields from the final state of a resources can be referenced using the `spec` property
following this format:

```
resources.{resourceName}.spec.{field}
```

See the [references](#references--substitutions) section for more information on referencing resources, data sources, child blueprints, variables and values.

**field type**

string

**examples** 

`resources.saveOrderFunction.spec.functionName`

`resources.saveOrderFunction.metadata.displayName`

`variables.environment`

`values.contentBucketNames`

`children.networking.vpcId`

`datasources.secretStore.secretId`

___

<p style={{fontSize: '1.2em'}}><strong>description</strong></p>

A description of the exported field that will help in navigating the blueprints, especially useful in UI and CLI tools built around the spec.

**field type**

string

<br/>
<br/>

## Spec Behaviours

This section provides in-depth information on how parts of the spec should behave that goes beyond the schema definition.

_It's worth noting that some contextual information about spec behaviour that can be presented concisely will be found amongst the schema definitions._

### Operator Behaviours

The following sections describe how the operators in [data source filters](#datasourcefilterdefinition) should behave with different inputs.

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Equality Operators ( = | != )</strong></p>

The same rules apply to the `=` and `!=` operators, `!=` will be the negation of the behaviour for the comparisons described below.

primitive = string | integer | float | boolean

<br/>

_field(primitive) **=** search(primitive)_

When the field in the external resource is a primitive and the search value is of the same primitive type then the search value must be an exact match.

_field(array[primitive]) **=** search(array[primitive])_

When the field in the external resource is an array of primitives and the search value is an array of primitives of the same type, then each search value
must match the field value in the corresponding position in the array.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Comparative Operators ( `>` | `>=` | `<` | `>=` )</strong></p>

The `>` (greater than), `>=` (greater than or equal), `<` (less than) and `<=` (less than or equal) operators can be applied to compare strings (based on lexicographical order), integers and floats.

comparable = string | integer | float

<br/>

_field(comparable) **`>`** search(comparable)_

When the field in the external resource is a comparable primitive and the search value is of the same primitive type then the field value must be greater than the search value.

_field(comparable) **`>=`** search(comparable)_

When the field in the external resource is a comparable primitive and the search value is of the same primitive type then the field value must be greater than or equal to the search value.

_field(comparable) **`<`** search(comparable)_

When the field in the external resource is a comparable primitive and the search value is of the same primitive type then the field value must be less than the search value.

_field(comparable) **`<=`** search(comparable)_

When the field in the external resource is a comparable primitive and the search value is of the same primitive type then the field value must be less than or equal to the search value.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>In Operators ( in | not in )</strong></p>

The same rules apply to the `in` and `not in` operators, `not in` will be the negation of the behaviour for the comparisons described below.

primitive = string | integer | float | boolean

<br/>

_field(primitive) **in** search(array[primitive])_

When the field value is a primitive and the search value is an array of the same primitive type, the field value must have an exact match with at least one of the search values.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Has Key Operators ( has key | not has key )</strong></p>

The same rules apply to the `has key` and `not has key` operators, `not has key` will be the negation of the behaviour for the comparisons described below.

<br/>

_field(mapping[string, any]) **has key** search(string)_

When the field value is a mapping of strings to any value and the search value is a string, the field must have at least one
key that is an exact match with the search value.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Contains Operators ( contains | not contains )</strong></p>

The same rules apply to the `contains` and `not contains` operators, `not contains` will be the negation of the behaviour for the comparisons described below.

primitive = string | integer | float | boolean

<br/>

_field(array[primitive]) **contains** search(primitive)_

When the field value is a primitive and the search value is an array of the same primitive type, the search value must have an exact match with at least one of the field values.

_field(string) **contains** search(string)_

When the field value is a string and the search value is a string, the search value must be a substring that can be found within the field value.

_field(mapping[string, primitive]) **contains** search(primitive)_

When the field value is a mapping of strings to primitive values and the search value is of the same primitive type,
the search value must be an exact match with at least one of the mapping values.
In this use case the keys should not be taken into account and the mapping should be treated as a list of values.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Starts With Operators ( starts with | not starts with )</strong></p>

The same rules apply to the `starts with` and `not starts with` operators, `not contains` will be the negation of the behaviour for the comparisons described below.

<br/>

_field(string) **starts with** search(string)_

When the field value is a string and the search value is a string, the field value must begin with a substring that is an exact match with the search value.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Ends With Operators ( ends with | not ends with )</strong></p>

The same rules apply to the `ends with` and `not ends with` operators, `not ends with` will be the negation of the behaviour for the comparisons described below.

<br/>

_field(string) **ends with** search(string)_

When the field value is a string and the search value is a string, the field value must end with a substring that is an exact match with the search value.

<br/>

Any other combinations of search value and field type outside of those listed above should be invalid.
In these cases the filter operation should fail and the implementation should report an informative error to the user.
<br/>
<br/>

## References & Substitutions

In a blueprint, references are ways to access values from a number of different types of objects in a blueprint.
References can be used to make use of variables, values, resource fields, data source fields, and exported fields from child blueprints.

In most cases references are made with the `${..}` syntax with a few exceptions such as the export
"field" attribute which expects a reference to be made to a resource field as a regular string.

`${..}` is a substitution that can be used for references and to apply one of a limited set of functions to a value.

### Accessing Nested Fields

Nested properties that are a part of a field that is a mapping can be accessed with `.` notation.
This is the same for accessing properties in nested mappings too.

`[\d+]` can be used to access items in a field or a nested field property that is an array by index.
`[]` can be used as shorthand in references to get the first item in an array. For example `${myResource.myArray[0]}` can be written as `${myResource.myArray[]}`.

Example of accessing nested fields:

```
${resources.cacheCluster.spec.hostConfig[].hostInfo.endpoints[]}
```
:::caution
_Not all reference object types support deep nesting like this, be sure to check the documentation for the object type you are referencing._
:::

### Variable References

Variable references are simple references that allow access to primitive values or custom enum types
that have been defined in the blueprint.

Variable values include strings, integers, floats, booleans, and `{customType}` enum labels.

Variables must be referenced with the `variables.*` prefix.

The following is an example of a variable reference:

```
${variables.saveOrderFunctionName}
```

Variables can not have any nested properties or array indexes as they are primitives.


:::caution
If you had a string variable containing serialised json, the following would not be valid:


```
${variables.cacheClusterConfig.host}
```

:::

:::tip
To reference a variable that contains serialised json, you can use the `fromjson` function to extract values from the serialised array or mapping.

```
${fromjson(variables.cacheClusterConfig, "host")}
```
:::

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Variable Reference Format</strong></p>

The precise format for a variable reference notated in [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) would be the following:

```
variable reference     =   "variables" , name accessor ;
name accessor          =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
name in quotes         =   { name in quotes char }- ;
name in quotes char    =   letter | digit | "_" | "-" | "." ;
name                   =   start name char , name chars ;
name chars             =   { name char } ;
name char              =   letter | digit | "_" | "-" ;
start name char        =   letter | "_" ;
letter                 =   ? [A-Za-z] ? ;
digit                  =   ? [0-9] ? ;
```

### Value References

Value references are references that allow access to static and computed values defined in a blueprint.

Values can be strings, integers, floats, booleans, arrays, or mappings.

Values must be referenced with the `values.*` prefix.

The following is an example of a value reference:

```
${values.s3BucketNames}
```

An example of accessing a nested field in value would be:

```
${values.s3BucketConfig.buckets[0].name}
```

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Value Reference Format</strong></p>

The precise format for a value reference notated in [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) would be the following:

```
value reference       =   value name , [ { ( name accessor | index accessor ) } ] ;
value name            =   ( "values." , name accessor ) ;
index accessor        =   "[" , [ natural number ] , "]" ;
name accessor         =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
name in quotes        =   { name in quotes char }- ;
name in quotes char   =   letter | digit | "_" | "-" | "." ;
name                  =   start name char , name chars ;
name chars            =   { name char } ;
name char             =   letter | digit | "_" | "-" ;
start name char       =   letter | "_" ;
natural number        =   { digit }- ;
letter                =   ? [A-Za-z] ? ;
digit                 =   ? [0-9] ? ;
```

### Resource References

Resource references are those that allow access to fields on resources,
where fields can be from the resource's spec or metadata
of the resource as defined in the blueprint.

Resource field values can be strings, integers, floats, booleans, arrays, or mappings.

Resources can be referenced directly by name or with the `resources.*` prefix.
For example, `cacheCluster` and `resources.cacheCluster` are both valid ways to reference a resource named `cacheCluster`.

Fields of a resource must be accessed via `.spec.*` or `.metadata.*`.

To access a computed field from the resource's current state, use `.spec.*` like so:

```
${resources.cacheCluster.spec.nodes[].endpoint}
```

To access a user-defined field from the resource's spec, use `.spec.*` like so:

```
${resources.cacheCluster.spec.clusterSize}
```

To access a field from the resource's metadata, use `.metadata.*` like so:

```
${resources.cacheCluster.metadata.annotations["myAnnotation.populateEnvVars"]}
```

To access a resource element in an array from a resource template using the `each` property:

```
${resources.cacheClusters[].spec.nodes[1].endpoint}
```

When accessing metadata for a resource, fields must be accessed from either `.metadata.labels`, `.metadata.annotations`, or `.metadata.custom`
as per the specification. `.metadata.displayName` is also supported to reference the display name of a resource.


:::tip
Any fields with names that contain `.`, such as annotations where it is encouraged
can be referenced using quotation marks like so:

```
${*.annotations["myAnnotation.populateEnvVars"]}
```
:::

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Resource Reference Format</strong></p>

The precise format for a resource reference notated in [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) would be the following:

```
resource reference    =   resource name , [ { ( name accessor | index accessor ) } ] ;
resource name         =   ( "resources." , name accessor ) | name ;
index accessor        =   "[" , [ natural number ] , "]" ;
name accessor         =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
name in quotes        =   { name in quotes char }- ;
name in quotes char   =   letter | digit | "_" | "-" | "." ;
name                  =   start name char , name chars ;
name chars            =   { name char } ;
name char             =   letter | digit | "_" | "-" ;
start name char       =   letter | "_" ;
natural number        =   { digit }- ;
letter                =   ? [A-Za-z] ? ;
digit                 =   ? [0-9] ? ;
```

### Data Source References

Data source references are those that allow access to the exported fields of a data source.

Data source field values can be strings, integers, floats, booleans or arrays of either one of the aforementioned primitives.

Data sources must be referenced with the `datasources.*` prefix.

A data source field must be accessed via `datasources.{name}.*`.

The following is an example of a data source reference:

```
${datasources.network.vpc}
```

For a data source field that is an array, the following is an example of how to access the first item in the array:

```
${datasources.network.subnets[]}
``` 

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Data Source Reference Format</strong></p>

The precise format for a data source reference notated in [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) would be the following:

```
data source reference     =   "datasources" , name accessor , name accessor , [ index accessor ] ;
index accessor            =   "[" , [ natural number ] , "]" ;
name accessor             =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
name in quotes            =   { name in quotes char }- ;
name in quotes char       =   letter | digit | "_" | "-" | "." ;
name                      =   start name char , name chars ;
name chars                =   { name char } ;
name char                 =   letter | digit | "_" | "-" ;
start name char           =   letter | "_" ;
natural number            =   { digit }- ;
letter                    =   ? [A-Za-z] ? ;
digit                     =   ? [0-9] ? ;
```

### Current Element References (each)

Current element references are those that allow access the current element in an array that is being iterated over with the [`each`](#resourcedefinition) feature of a resource.

`elem` is the keyword used to reference the current element in an array, if `elem` is used outside of a resource type with the `each` property set, the implementation should report an informative error to the user.

Element values can be strings, integers, floats, booleans, arrays or objects.

Elements must be referenced with the `elem.*` prefix.

The following is an example of an element reference:

```
${elem["config"].attrs[0]}
```

For an element that is an array, the following is an example of how to access the first item in the array:

```
${elem[]}
``` 

For an element that is a primitive value you can reference it directly like so:

```
${elem}
```

The index of the current element can be accessed with the `i` keyword.

The following is an example of how to access the index of the current element:

```
${i}
```

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Element Reference Format</strong></p>

The precise format for an element reference notated in [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) would be the following:

```
elem reference        =   "elem" , [ { ( name accessor | index accessor ) } ] ;
elem index reference  =   "i" ;
index accessor        =   "[" , [ natural number ] , "]" ;
name accessor         =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
name in quotes        =   { name in quotes char }- ;
name in quotes char   =   letter | digit | "_" | "-" | "." ;
name                  =   start name char , name chars ;
name chars            =   { name char } ;
name char             =   letter | digit | "_" | "-" ;
start name char       =   letter | "_" ;
natural number        =   { digit }- ;
letter                =   ? [A-Za-z] ? ;
digit                 =   ? [0-9] ? ;
```

### Child Blueprint References

Child blueprint references are those that allow access to the exported fields of a child blueprint.

Child blueprint field values can be strings, integers, floats, booleans, arrays or mappings.

Child blueprints must be referenced with the `children.*` prefix.

A child blueprint field must be accessed via `children.{name}.*`.

The following is an example of a child blueprint reference:

```
${children.coreInfra.ordersTopicInfo.arn}
```

<p style={{fontSize: "var(--ifm-h4-font-size)"}}><strong>Child Blueprint Reference Format</strong></p>

The precise format for a child blueprint reference notated in [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) would be the following:

```
child blueprint reference     =   "children." , name accessor , { name accessor | index accessor }- ;
index accessor                =   "[" , [ natural number ] , "]" ;
name accessor                 =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
name in quotes                =   { name in quotes char }- ;
name in quotes char           =   letter | digit | "_" | "-" | "." ;
name                          =   start name char , name chars ;
name chars                    =   { name char } ;
name char                     =   letter | digit | "_" | "-" ;
start name char               =   letter | "_" ;
natural number                =   { digit }- ;
letter                        =   ? [A-Za-z] ? ;
digit                         =   ? [0-9] ? ;
```

### Functions

There are a set of utility functions that can be used in references when accessed
via the `${..}` syntax.

:::caution
Functions are not supported in any other context where references might be used.
They should only ever be used inside `${..}`.
:::

Functions are required to be inclusive of but not limited to the set of core functions defined in the spec;
implementations are free to add additional functions as they see fit.

Regular expressions are not supported in the core functions, however, implementations are free to add regular expression support in their own functions.

#### Core Function Definitions

The following section contains the defnitions of the core utility functions that should be supported by all implementations of the spec.

Function definitions for the specification are defined in a separate document to allow for better navigation and discovery of the core functions.

[Core Function Definitions](./core-functions)

#### Complex Return Types

Functions can return complex types such as arrays and mappings.

When a function returns an array, the array items can be accessed with an index accessor `[]`.

For example:
```
${map(variables.cacheClusterConfig.hosts, trimprefix_g("http://"))[0]}
```


When a function returns a mapping, the mapping can be accessed with a name accessors `.` and `[]`.

For example:
```
${get_network_config(resources.vpc.spec).info["host"]}
```

As displayed in the example above, multiple levels of nesting within a more complex structure can be accessed with the `.` and `[]` accessors.

### Complex Types

References can be used to reference complex types including arrays and mappings.
There is also the `jsondecode` function that can be used to decode a json string which will more often than not yield a complex type.

Dynamic value substitution is always performed with the `${..}` syntax, this can be as a standalone string or part of a string interpolation;
for example, `${cacheCluster.spec.config.host}` or `https://${cacheCluster.spec.config.host}:3000`.

In the case of a reference that yields a complex type, string interpolation isn't particularly useful and can lead to unexpected results.
For this reason, implementations of the spec should explicitly report informative errors to the user when string interpolation is attempted on a reference that yields a complex type.

### `${..}` Substitution Reference Usage

There are restrictions on where reference substitutions can be used to simplify the specification and allow dynamic values to be provided
where they are most useful.

The following is a set of rules about the usage of reference substitutions.

<br/>

#### Keys/Property Names

References can **not** be used in mapping keys/property names in any part of a blueprint specification.

Some examples of this would be the following:

:::danger ❌ Invalid
```yaml
resources:
  ${variables.getOrderFunctionName}:
    type: aws/ec2/instance
```
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    spec:
      ${variables.timeoutKey}: 3000
```
:::

<br/>

#### Transforms

References can **not** be used in any part of a transform.

An example of this would be the following:

:::danger ❌ Invalid
```yaml title="blueprint.yaml"
transforms:
  - ${variables.transform1}
  - ${variables.transform2}
```
:::

<br/>

#### Variables

References can **not** be used in any part of a variable definition.

An example of this would be the following:
:::danger ❌ Invalid
```yaml title="blueprint.yaml"
variables:
  dynamoDBTable:
    type: string
    description: ${datasources.databases[0].description}
  ordersTopicName:
    type: string
    description: ${datasources.topics[0].description}
```
:::

<br/>

#### Values

References can **not** be used in the value type property.

An example of this would be the following:

:::danger ❌ Invalid
```yaml title="blueprint.yaml"
values:
  s3BucketName:
    type: ${variables.bucketType}
```
:::

References can be used in the **value** field which stores the contents of the value.

An example of this would be the following:

:::success ✅ Valid
```yaml
values:
  s3BucketName:
    type: string
    value: ${resources.s3Bucket.spec.name}
```
:::

References can be used in the `description` of a value, however it is not recommended
for better readability of a blueprint.

An example of this would be the following:

:::caution Not Recommended
```yaml
values:
  s3BucketName:
    type: string
    value: ${resources.s3Bucket.spec.name}
    description: The name of the ${variables.environment} s3 bucket.
```
:::

#### Resources

References can **not** be used in the resource type property.

An example of this would be the following:

:::danger ❌ Invalid
```yaml title="blueprint.yaml"
resources:
  getOrderFunction:
    type: ${variables.functionType}
```
:::

References can **not** be used in the dependencies (`dependsOn`) property.

An example of this would be the following:

:::danger ❌ Invalid
```yaml title="blueprint.yaml"
resources:
  getOrderFunction:
    type: aws/lambda/function
    dependsOn:
      - ${variables.cacheCluster}
```
:::

References can be used in any **value** in a resource condition.

An example of this would be the following:

:::success ✅ Valid
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    condition: 
      and:
        - ${variables.getOrderFunctionCondition}
        - ${variables.getOrdersActionCondition}
    spec:
      functionName: Prod-getOrderFunction-v1
      timeout: 3000
      runtime: nodej20.x
      codeUri: ..
      handler: index.handler
```
:::

References can be used in the **each** property of a resource.

An example of this would be the following:

:::success ✅ Valid
```yaml
resources:
  getOrderFunction:
    type: aws/s3/bucket
    each: ${jsondecode(variables.buckets)}
    spec:
      bucketName: ${elem}
```
:::

References can be used in any **value** in a resource spec.

An example of this would be the following:

:::success ✅ Valid
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    spec:
      functionName: ${variables.environment}-${variables.getOrderFunctionName}
      timeout: ${variables.timeout}
      runtime: nodejs16.x
      codeUri: ..
      handler: index.handler
```
:::

References can be used in the `description` of a resource, however it is not recommended
for better readability of a blueprint.

An example of this would be the following:

:::caution Not Recommended
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    description: The function that ${variables.getOrdersAction} in the system.
    spec:
      functionName: ${variables.environment}-${variables.getOrderFunctionName}
      timeout: ${variables.timeout}
      runtime: nodejs16.x
      codeUri: ..
      handler: index.handler
```
:::

References can be used in any **value** in a resource's metadata `displayName`, `custom` and `annotations` properties.

An example of this would be the following:

:::success ✅ Valid
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    spec:
      functionName: Prod-getOrderFunction-v1
      timeout: 3000
      runtime: nodejs16.x
      codeUri: ..
      handler: index.handler
    metadata:
      displayName: ${variables.getOrderFunctionDisplayName}
      annotations:
        aws.cloudformation.roleArn: ${variables.getOrderFunctionRoleArn}
      labels:
        app: orderApi
      custom:
        customAppTag: ${variables.getOrderFunctionAppTag}
```
:::

References can **not** be used in the `labels` property of a resource's metadata.

An example of this would be the following:

:::danger ❌ Invalid
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    spec:
      functionName: Prod-getOrderFunction-v1
      timeout: 3000
      runtime: nodejs16.x
      codeUri: ..
      handler: index.handler
    metadata:
      displayName: Get Orders
      labels:
        app: ${variables.getOrderFunctionApp}
```
:::

References can **not** be used in the `linkSelector` property of a resource.

An example of this would be the following:

:::danger ❌ Invalid
```yaml
resources:
  getOrderFunction:
    type: aws/lambda/function
    spec:
      functionName: Prod-getOrderFunction-v1
      timeout: 3000
      runtime: nodejs16.x
      codeUri: ..
      handler: index.handler
    metadata:
      displayName: Get Orders
    linkSelector:
      byLabel:
        app: ${variables.ordersApp}
```
:::

<br/>

#### Child Blueprint Includes

References can be used in any **value** in a child blueprint include.
This includes the path, variables, metadata and description properties.

An example of this would be the following:

:::success ✅ Valid
```yaml
include:
  coreInfrastructure:
    path: core-infra-${variables.coreInfraVersion}.yaml
    variables:
      environment: ${variables.environment}
      region: ${variables.region}
    metadata:
      sourceType: aws/s3
      bucket: ${variables.blueprintsBucket}
      region: ${variables.region}
```
:::

#### Data Sources

References can **not** be used in the data source type property.

An example of this would be the following:

:::danger ❌ Invalid
```yaml
datasources:
  network:
    type: ${variables.networkDataSourceType}
```
:::

References can be used in the `description` of a data source, however it is not recommended
for better readability of a blueprint.

An example of this would be the following:

:::caution Not Recommended
```yaml
datasources:
  network:
    type: aws/vpc
    description: The network to deploy the ${variables.orderApiName} to.
    filter:
      field: subnets[].availabilityZone
      operator: in
      search:
        - eu-west-1a
        - eu-west-1b
    exports:
      vpc:
        type: string
        aliasFor: vpcId
```
:::

References can be used in any **value** in a data source's metadata properties.

An example of this would be the following:

:::success ✅ Valid
```yaml
datasources:
  network:
    type: aws/vpc
    filter:
      field: subnets[].availabilityZone
      operator: in
      search:
        - eu-west-1a
        - eu-west-1b
    exports:
      vpc:
        type: string
        aliasFor: vpcId
    metadata:
      displayName: ${variables.getNetworkDataSourceDisplayName}
      annotations:
        aws.cloudformation.roleArn: ${variables.getNetworkDataSourceRoleArn}
      custom:
        customAppTag: ${variables.getNetworkDataSourceAppTag}
```
:::

References can **not** be used in the `exports`, `filter.field` and `filter.operator` properties of a data source.

An example of this would be the following:

:::danger ❌ Invalid
```yaml
datasources:
  network:
    type: aws/vpc
    filter:
      field: subnets[].${variables.availabilityZoneField}
      operator: ${variables.networkFilterOperator}
      search:
        - eu-west-1a
        - eu-west-1b
    exports:
      vpc:
        type: string
        aliasFor: ${variables.vpcAliasFor}
```
:::

References can be used in the `filter.search` property of a data source.

An example of this would be the following:

:::success ✅ Valid
```yaml
datasources:
  network:
    type: aws/vpc
    filter:
      field: subnets[0].availabilityZone
      operator: in
      search:
        - ${variables.availabilityZone1}
        - ${variables.availabilityZone2}
    exports:
      vpc:
        type: string
        aliasFor: vpcId
```
:::

<br/>

#### Blueprint Exports

References can **not** be used in the export `type` or `field` properties;
they can only be used in the `description` property but generally this is not recommended
for readability of a blueprint.

An example of an invalid export would be the following:

:::danger ❌ Invalid
```yaml
exports:
  saveOrdersFunctionArn:
    type: ${variables.saveOrdersFunctionArnType}
    description: The ARN of the function used to save orders to the system.
    field: resources.saveOrdersFunction.${variables.functionArnFieldPath}
```
:::

An example of a valid export would be the following:

:::success ✅ Valid
```yaml
exports:
  saveOrdersFunctionArn:
    type: string
    description: The ARN of the function used to ${variables.saveOrdersAction} to the system.
    field: resources.saveOrdersFunction.spec.functionArn
```
:::

<br/>

#### Blueprint Metadata

References can be used in all **values** at any level of nesting in the metadata of a blueprint.

An example of this would be the following:

:::success ✅ Valid
```yaml
metadata:
  function.builder: ${variables.functionBuilder}
  function.builder.minify: false
  function.builder.buildArgs:
    - --build-arg
    - NODE_ENV=${variables.nodeEnvironment}
```
:::

<br/>
<br/>

### Substitution Grammar

Substitutions are made up of a small language that can be defined formally as a [context-free grammar](https://web.stanford.edu/class/archive/cs/cs103/cs103.1164/lectures/18/Small18.pdf).
In this specification, [Extended Backus-Naur form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) is used to represent the grammar.

Everything that goes in a `${..}` substitution block must adhere to the rules of this grammar.

```
substitution                 =   function call expr | variable reference | datasource reference | child reference | resource reference | literal ;
function call expr           =   name , "(" , function args , ")" , [ { ( name accessor | index accessor ) } ] ;
function args                =   [ ( named function arg | substitution ) , { "," , ( named function arg | substitution ) } ] ;
named function arg           =   name , "=" , substitution ;
variable reference           =   "variables" , name accessor ;
value reference              =   value name , [ { ( name accessor | index accessor ) } ] ;
value name                   =   ( "values." , name accessor ) ;
elem reference               =   "elem" , [ { ( name accessor | index accessor ) } ] ;
elem index reference         =   "i" ;
data source reference        =   "datasources" , name accessor , name accessor , [ index accessor ] ;
child blueprint reference    =   "children" , name accessor , { name accessor | index accessor }- ;
resource reference           =   resource name , [ { ( name accessor | index acessor ) } ] ;
resource name                =   ( "resources." , name accessor ) | name ;
name accessor                =   ( "." , name ) | ( "[" , name in quotes , "]" ) ;
index accessor               =   "[" , [ natural number ] , "]" ;
literal                      =   bool literal | float literal | int literal | string literal ;

# Lex tokens

string literal               =   '"' , string chars , '"' ;
bool literal                 =   "true" | "false" ;
int literal                  =   [ "-" ] , natural number ;
float literal                =   [ "-" ] , natural number , "." , natural number ;
natural number               =   { digit }- ;
string chars                 =   { string char } ;
string char                  =   ? utf-8 char excluding quote ? | escaped quote ;
escaped quote                =   "\" , '"' ;
name in quotes               =   { name in quotes char }- ;
name in quotes char          =   letter | digit | "_" | "-" | "." ;
name                         =   start name char , name chars ;
name chars                   =   { name char } ;
name char                    =   letter | digit | "_" | "-" ;
start name char              =   letter | "_" ;
letter                       =   ? [A-Za-z] ? ;
digit                        =   ? [0-9] ? ;
```

### Caveats

#### Dealing with environment variables

The use of `${..}` conflicts with shell environment variables so attempts to pre-process a blueprint template file by expanding environment variables are not advised. Environment variables should instead be fed in at runtime and mapped to [variables](#variables) in the blueprint.

#### YAML Tags and Aliases

The usage of YAML tags and aliases is not supported for blueprints in this version of the specification.
The portable substitution language is sufficient for referencing elements in a blueprint and providing more advanced functionality with the extensible set of functions.

## Modular Blueprints

A blueprint does not neccessarily need to be a single file, it can be split into multiple files and directories.

Making blueprints modular is useful for organising blueprints into logical groups and for reusing common parts of a blueprint across multiple blueprints.

There are two ways in which you can make a blueprint modular, the first is to use the `include` property to reference another blueprint file.
The second is to use a `blueprint` resource type provided by an implementation of the spec that allows the use of a blueprint with a pre-packaged set
of resources and data sources as if it is a regular resource.

The first of the two options must be available to users in all implementations of the spec, the second is optional and exactly how it is approached is at the discretion of the implementation.

### Using Include

The following section contains a set of examples of how you can pull in one or more blueprints from other local or remote files using the `include` property.

#### In the Same Directory

```
-- main-blueprint.yaml
-- core-infra.yaml
-- app-infra.yaml
```

`main-blueprint.yaml`

```yaml
version: 2025-05-12

variables:

  orderTopicType:
    type: string
    description: The type of topic to be used for order events
    default: "standard"
    allowedValues:
      - standard
      - fifo

  appRegion:
    type: aws/region
    description: The region in which the application will be deployed
    default: "eu-west-1"

include:

  coreInfrastructure:
    path: core-infra.yaml
    variables:
      orderTopicType: ${variables.orderTopicType}

  appInfrastructure:
    path: app-infra.yaml
    variables:
      # Implementations of the spec should allow users to reference exports from
      # included blueprints, correctly determining the order in which blueprints
      # are executed to ensure that exports are available when they are referenced.
      # See the include section of the spec for more information on how this should
      # work.
      orderTopicId: ${children.coreInfrastructure.ordersTopicId}
      region: ${variables.appRegion}

exports:

  coreOrdersTopic:
    type: string
    description: The unique identifier of the orders topic for the system
    field: children.coreInfrastructure.ordersTopicId
  
  apiBaseUrl:
    type: string
    description: The base URL of the API for the system
    field: children.appInfrastructure.apiBaseUrl

```

`core-infra.yaml`
```yaml
version: 2025-05-12

variables:
    orderTopicType:
      type: string
      description: The type of topic to be used for order events
      default: "standard"
      allowedValues:
        - standard
        - fifo

resources:
  ordersTopic:
    type: aws/sns/topic
    description: The topic to which order events will be published
    spec:
      topicType: ${variables.orderTopicType}

exports:
    ordersTopicId:
      type: string
      description: The unique identifier of the orders topic for the system
      field: resources.ordersTopic.spec.id
```

`app-infra.yaml`

```yaml
version: 2025-05-12

variables:
  region:
    type: aws/region
    description: The region in which the application will be deployed
    default: "eu-west-1"

resources:
  api:
    type: aws/api-gateway/rest-api
    description: The API for the system
    spec:
      region: ${variables.region}

exports:
  apiBaseUrl:
    type: string
    description: The base URL of the API for the system
    field: resources.api.spec.endpoint
```

<br/>
<br/>

#### Relative to the Current Working Directory

```
-- app-infra
  -- main-blueprint.yaml
  -- api.yaml
-- core-infra
  -- topics.yaml
  -- event-bus.yaml
```

`app-infra/main-blueprint.yaml`

```yaml
version: 2025-05-12

variables:

  orderTopicType:
    type: string
    description: The type of topic to be used for order events
    default: "standard"
    allowedValues:
      - standard
      - fifo

  appRegion:
    type: aws/region
    description: The region in which the application will be deployed
    default: "eu-west-1"

include:

  topics:
    # Explicitly specifying working directory removes ambiguity around how paths are resolved.
    path: ${cwd()}/core-infra/topics.yaml
    variables:
      orderTopicType: ${variables.orderTopicType}

  eventBus:
    path: ${cwd()}/core-infra/event-bus.yaml
    variables:
      eventBusName: ${variables.eventBusName}

  appInfrastructure:
    path: ${cwd()}/app-infra/api.yaml
    variables:
      orderTopicId: ${children.topics.ordersTopicId}
      region: ${variables.appRegion}

exports:

  coreOrdersTopic:
    type: string
    description: The unique identifier of the orders topic for the system
    field: children.topics.ordersTopicId

  coreEventBus:
    type: string
    description: The unique identifier of the event bus for the system
    field: children.eventBus.eventBusId
  
  apiBaseUrl:
    type: string
    description: The base URL of the API for the system
    field: children.appInfrastructure.apiBaseUrl

```


`core-infra/topics.yaml`
```yaml
version: 2025-05-12

variables:
  orderTopicType:
    type: string
    description: The type of topic to be used for order events
    default: "standard"
    allowedValues:
      - standard
      - fifo

resources:
  ordersTopic:
    type: aws/sns/topic
    description: The topic to which order events will be published
    spec:
      topicType: ${variables.orderTopicType}

exports:
    ordersTopicId:
      type: string
      description: The unique identifier of the orders topic for the system
      field: resources.ordersTopic.spec.arn
```

`core-infra/event-bus.yaml`
```yaml
version: 2025-05-12

variables:
  eventBus:
    type: string
    description: The name of the event bus to be used for order events
    default: "default"

resources:
  eventBus:
    type: aws/eventbridge/event-bus
    description: The event bus to which order events will be published
    spec:
      eventBusName: ${variables.eventBus}

exports:
    eventBusId:
      type: string
      description: The unique identifier of the event bus for the system
      field: resources.eventBus.spec.arn
```

`app-infra/api.yaml`

```yaml
version: 2025-05-12

variables:
  region:
    type: aws/region
    description: The region in which the application will be deployed
    default: "eu-west-1"

resources:
  api:
    type: aws/api-gateway/rest-api
    description: The API for the system
    spec:
      region: ${variables.region}

exports:
  apiBaseUrl:
    type: string
    description: The base URL of the API for the system
    field: resources.api.spec.endpoint
```

<br/>
<br/>

#### From a Remote Source

To pull in child blueprints from a remote source, implementations of the spec with their own CLIs, APIs or UIs
must provide one or more ways to allow users to fetch blueprints from a remote source.

An example would be allowing the use of a remote object store such as AWS S3 or Google Cloud Storage to store blueprints.

Implementations are expected to implement support for remote sources using the metadata section of an include entry.

For example, if the remote source was an AWS S3 bucket:

```yaml
include:
  coreInfrastructure:
    path: core-infra-2025-05-12.yaml
    metadata:
      sourceType: aws/s3
      bucket: order-system-blueprints
      region: eu-west-1
```

_This example is purely to show-case how remote sources could be implemented._

You can find out more about this in the [include](#include) section.

<br/>
<br/>

### With Blueprint Resources

The following is an example of how an implementation might go about supporting blueprints as resources.


```yaml
version: 2025-05-12
variables:

  region:
    type: aws/region
    description: The region in which the application will be deployed
    default: "eu-west-1"

  orderTopicType:
    type: string
    description: The type of topic to be used for order events
    default: "standard"
    allowedValues:
      - standard
      - fifo

resources:

  api:
    type: celerity/blueprint
    description: The API for the system
    spec:
      # Assuming a celerity/blueprint provider has a module system
      # for blueprint resources.
      module:
        name: company/ordersApi
        version: 2.0
      variables:
        region: ${variables.region}
        ordersTopicId: ${resources.coreInfra.spec.ordersTopicId}

  coreInfra:
    type: celerity/blueprint
    description: The core infrastructure for an orders system
    spec:
      # Assuming a celerity/blueprint provider has a module system
      # for blueprint resources.
      module:
        name: company/ordersCoreInfra
        version: 1.0
      variables:
        orderTopicType: ${variables.orderTopicType}

exports:

  apiBaseUrl:
    type: string
    description: The base URL of the API for the system
    field: resources.api.spec.endpoint

  ordersTopicId:
    type: string
    description: The unique identifier of the orders topic for the system
    field: resources.coreInfra.spec.ordersTopicId
```
