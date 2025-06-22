---
sidebar_position: 11
---

# `celerity/queue`

**v2026-02-01 (draft)**

**blueprint transform:** `celerity-2026-02-01`

The `celerity/queue` resource type is used to define a queue that can be used for asynchronous processing of messages in a Celerity application. This resource type is typically used in conjunction with the `celerity/consumer` resource type to process messages from the queue and a handler in any application type that can write messages to the queue.

Queues are usually used within the context of a single application to carry out asynchronous processing. For asynchronous messaging between decoupled applications, you should use a `celerity/topic` defined in a producer application or shared blueprint in conjunction with a `celerity/consumer` application.

## Specification

The specification is the structure of the resource definition that comes under the `spec` field of the resource in a blueprint.
The rest of this section lists fields that are available to configure the `celerity/queue` resource followed by examples of different configurations for the resource and how queues are implemented in target environments along with additional documentation.
