---
sidebar_position: 2
---
# WebSocket Runtime Protocol

**v2026-02-28 (draft)**

The Celerity runtime supports WebSocket applications, allowing you to build real-time applications that can scale horizontally across multiple instances. This document describes the protocol used by the Celerity runtime to handle WebSocket connections and messages.

## Message Formats

The Celerity runtime supports two types of messages for WebSocket applications:

1. **JSON Text Messages**: Text containing a JSON object that must have a configured route key that will be defined for an application. The route key defaults to `event` if it is not specified in the application configuration.
2. **Binary Messages**: These messages will be in the [Celerity Binary Message Format](/docs/applications/resources/celerity-api#celerity-binary-message-format) which is prefixed with route information followed by the payload that will be forwarded to handlers.

These formats are important for messages sent from the client to the server so that the runtime can correctly route the messages to the appropriate handlers.
For server-to-client messages, the only limitation is that reserved object keys and binary prefixes can not be used for application level messages, other than that, the message format can be any text or binary data that the client application can handle.

### Reserved JSON Keys

The following top-level object keys are reserved for the Celerity runtime and should not be used in application level messages:

- `ping`: This top-level object key is used for heartbeat messages sent from the client to the server to check if the connection is still alive.
- `pong`: This top-level object key is used for heartbeat messages sent from the server to the client to acknowledge that the connection is still alive.

### Reserved Binary Prefixes

The following binary prefixes are reserved for the Celerity runtime and should not be used in application level messages:

- `[0x1 0x1 0x0]`: This binary prefix is used for ping messages.
- `[0x1 0x2 0x0]`: This binary prefix is used for pong messages.
- `[0x1 0x3 0x0]`: This binary prefix is used for informing clients of potentially lost messages.

The first byte of the binary prefix indicates the length of the route key (1 byte).
The second byte indicates the route key itself (in this case, a single byte indicating the type of message).
The third byte is for the length of the message ID, which is `0` for these reserved messages as they do not have a message ID.

To avoid conflicts with these reserved prefixes, binary messages from the server to the client should use a different prefix following the Celerity Binary Message Format, which includes the length of the route key, followed by the custom route key and the message payload. For example, a binary message with a route key of `my_route` and a payload of `[0x1 0x3 0x6 0x9 0x1]` would look like this:

```plaintext
[0x8 utf8_encode(my_route)... 0x0 0x1 0x3 0x6 0x9 0x1]
```

Where `0x8` is the length of the route key (8 bytes for `my_route`) and the `0x0` after the route key indicates that there is no message ID for this message. You may also use a message ID if you want to track messages at the application level, in which case the message would look like this:

```plaintext
[0x8 utf8_encode(my_route)... 0x5 utf8_encode("12345") 0x1 0x3 0x6 0x9 0x1]
```

Where `0x5` is the length of the message ID (5 bytes for `12345`).

There are utils available for clients to parse messages in the Celerity Binary Message Format.

### Custom Message IDs

Clients and server-side applications should be able to define custom message IDs that allow for a deeper integration with the application layer, this is especially useful for handling lost messages where the message ID in the "lost message" notification refers to something that the application can use to take appropriate action.

For JSON messages, the message ID can be included in the message body as the top-level `messageId` key, for example:

```json
{
  "messageId": "12345",
  "event": "myEvent",
  "data": {
    "key": "value"
  }
}
```

For binary messages, the message ID can be included after the route key in the [Celerity Binary Message Format](/docs/applications/resources/celerity-api#celerity-binary-message-format).

An example for a binary message would be:

```plaintext
[0x8 utf8_encode(my_route)... 0x5 utf8_encode("12345")... <payload>]
```

Where `0x5` is the length of the message ID (5 bytes for `12345`).

## Authentication

The WebSocket Runtime Protocol supports two approaches for authenticating WebSocket connections: `authMessage` and `connect`.
The protocol does not determine how the authentication is performed, only the way in which the authentication information is extracted and how it protects the WebSocket connection.
The process of authenticating the extracted token is determined by the configuration of the `celerity/api` resource in the application blueprint.

### `authMessage` approach

The `authMessage` approach allows the client to establish a WebSocket connection without any authentication information. Once the connection is established, the client must send an authentication message to the server to authenticate the connection.

On a successful connection, the client must send a message with token in the format:

```json
{
    "event": "authenticate",
    "data": {
        "token": "..."
    }
}
```
This is an example where the `$.data.token` field is configured as the source of the authentication token in the `celerity/api` resource configuration.

`event` in this example is the route key that the server will use to route the message to the authentication handler. When you specify a custom route key, that will be expected instead of `event`.

Upon successful authentication, the client will receive a message with the event `authenticated` in the following format:

```json
{
    "event": "authenticated",
    "data": {
        "success": true,
        "userInfo": {
            "id": "12345",
            "name": "John Doe"
        },
        "message": "Authenticated successfully"
    }
}
```

Upon failed authentication, the client will receive a message with the event `authenticated` in the following format:

```json
{
    "event": "authenticated",
    "data": {
        "success": false,
        "message": "Authentication failed"
    }
}
```

After sending the failed authentication message, the connection will be closed from the server-side. The purpose of sending the failed authentication message is to provide a clear reason for failure to the client before closing the connection, this is essential in environments that do not support custom WebSocket status codes.

the `event` field in the response message is not related to the route key, this will always be event.

The client SDKs will implement this behaviour automatically if configured for the `authMessage` approach, exposing callbacks for successful and failed authentication.

### `connect` approach

The `connect` approach allows the client to send authentication information as part of the WebSocket connection request. This is done by including the authentication token as a HTTP header in the WebSocket connection request.

Upon successful authentication, the connection will be upgraded to WebSockets and the client will be able to send and receive messages.

After upgrading the connection, the server should also send a message to the client with the event `authenticated` in the following format:

```json
{
    "event": "authenticated",
    "data": {
        "success": true,
        "userInfo": {
            "id": "12345",
            "name": "John Doe"
        },
        "message": "Authenticated successfully"
    }
}
```

Upon failed authentication, the connection will be closed with the custom status code `4001` (Unauthorized). The client should handle this status code as an authentication failure. The custom status code is in the range reserved for application-specific status codes, see [RFC 6455](https://tools.ietf.org/html/rfc6455#section-7.4.2) for more information.

The client SDKs will implement this behaviour automatically if configured for the `connect` approach, exposing callbacks for successful and failed authentication.

## Resilience & Reconnection Behaviour

Clients of Celerity WebSocket APIs compatible with the Celerity runtime should provide reconnection behaviour and a way to inform clients of messages that may have been lost.

This protocol provides heartbeat mechanisms to help clients detect lost connections and implement reconnection logic. It also provides a way for the server to inform clients about messages that may have been lost, which is especially used in multi-node deployments of a WebSocket API.

### Heartbeats and Reconnections

Heartbeats for the WebSocket Runtime Protocol are client-driven.
A server doesn't need to instigate a heartbeat to check if the connection is alive, if a message needs to be delivered to a client that is not accessible, the message will eventually be considered lost and relevant clients will be [notified of the lost message](#lost-messages-and-redriving).

The client should send a ping message to the server at regular intervals to check if the connection is still alive. If the server does not respond with a pong message within a certain timeout period, the client should attempt to reconnect.

The client should allow for a configurable interval and timeout for the ping messages with retry limits and exponential backoff for reconnection attempts. The client should also handle the case where the server is temporarily unavailable and retry the connection after a certain period of time.

#### Ping and Pong Messages

Ping messages can either be binary messages or JSON messages.

The binary message must have the following content:

```plaintext
[0x1 0x1 0x0]
```

This is following the Celerity Binary Message Format, where the first byte indicates the length of the route key (1 byte) and the second byte indicates the route key itself (in this case a single byte `0x1` indicating a ping message). The third byte is `0x0` indicating that there is no message ID for this ping message.


The JSON message must have the following content:

```json
{
  "ping": true
}
```

Pong messages can also be either binary messages or JSON messages.

The binary message must have the following content:

```plaintext
[0x1 0x2 0x0]
```

This is following the Celerity Binary Message Format, where the first byte indicates the length of the route key (1 byte) and the second byte indicates the route key itself (in this case a single byte `0x2` indicating a pong message). The third byte is `0x0` indicating that there is no message ID for this pong message.

The JSON message must have the following content:

```json
{
  "pong": true
}
```

### Lost Messages

Lost messages must be taken into account for messages sent from the server to the client.
Applications deployed on the Celerity runtime will want to send messages to multiple clients, either to forward messages from one client to others in a shared session, channel or room, or to send messages to clients that are listening for a specific event that occurs on the server.

In multi-node deployments, messages sent from the server to a specific client via a connection ID will often be sent across different nodes in the cluster via a network protocol, which can lead to messages being lost if there is an issue with the network or a node failure.
There is also the case where a message sent from the server-side application to a client is lost due to the client disconnecting due to network issues or other reasons.

For these cases, a mechanism must be provided to inform specific clients connected to the current node of messages that may have been lost, so that the client can take appropriate action, such as asking the user to retry the action that caused the message to be sent. The responsibility of retrying actions and preventing duplicate messages is left to the application logic both client and server-side.

The Celerity runtime provides 2 ways of handling lost messages:

1. Synchronous server-side error handling when using the SDK to send messages to clients, the `waitForAck` or similarly named option can be used to wait for an acknowledgement that the client has received the message in a multi-node deployment. This option is only required for multi-node deployments, in a single node deployment, if the target client is not connected to the server, an immediate lost message error will be returned.
2. Asynchronous client-side handling of lost messages, where the server-side application code sending a message to a specific client can use an `informClientsOnLoss` or similarly named option to provide a list of clients (connection IDs) that should be informed if the message is considered lost. In this case, the runtime will send a message to the specified clients (if they are connected to the current node) with a message indicating that the message may have been lost allowing the client to take appropriate action.


Lost messages are sent to clients using a binary message of the following format:

```plaintext
[0x1 0x3 0x0 utf8_encode("{"messageId":"<messageId>","caller":"<caller>"}")...]
```

Where:
- `0x1` is the length of the route key (1 byte).
- `0x3` is the route key itself (in this case a single byte `0x3` indicating a lost message).
- `0x0` is the length of the message ID (0 bytes, as this is a reserved message).
- `utf8_encode("{"messageId":"<messageId>","caller":"<caller>"}")` is the JSON-encoded message that contains the ID of the message that may have been lost and an ID for the caller context. When an application-defined message ID is provided on the server-side attempt to send the message, this may correspond to a persisted ID at the application level that can be used by the client when taking appropriate action. If the message ID is generated by the runtime, then it won't be very useful to the client, and the caller ID should instead be used to identify the context or purpose of the message.

When it comes to messages sent from the client to the server, as clients send messages directly to the server that they are intended for, the only way a message can be lost is if there is a network issue or the server is temporarily unavailable. In this case, the client should handle the reconnection logic and retry sending the message after a certain period of time. The client SDKs will provide a way to handle the reconnection automatically but the application logic needs to determine what messages to retry (if any) after a reconnection.
