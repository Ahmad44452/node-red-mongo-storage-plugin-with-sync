# Node Red Mongo Storage Plugin with synchronization with other instances

This plugin replaces Node-RED's default file-based flow storage with MongoDB, while providing a scalable solution for multi-instance Node-RED deployments. Flow changes deployed on one instances will automatically be used by other instances using the same MongoDB database.

All instances of Node-RED listen for changes on the collection specified to store flows. When a change event is received by the listener, it reloads the flow on the current instance, ensuring consistency across your distributed Node-RED infrastructure. The event is ignored, if the change was made by the current instance.

The plugin creates a collection per entity type and save each entity seperatly which lead to increased performance.

## Acknowledgement

Special thanks to [@adibenmati](https://github.com/adibenmati) for creating the original [node-red-mongo-storage-plugin](https://github.com/adibenmati/node-red-mongo-storage-plugin). This project builds upon their excellent work and wouldn’t be possible without the solid foundation they provided.

## Enhancements

This fork introduces several improvements over the original version:

- Upgraded the MongoDB Node.js driver to version 6.18.0.
- Flows now automatically reload when changes are detected in the database, which is really useful for horizontal scaling.
- Replaced the legacy when.js promise library with native JavaScript Promise syntax for cleaner and more maintainable code.

## Getting Started

Firstly, install the module:

```bash
npm install --save node-red-mongo-storage-plugin-with-sync
```

Then, in your Node-RED settings, add:

```javascript
var settings = {
	...
    storageModule : require("node-red-mongo-storage-plugin-with-sync"),
    storageModuleOptions: {
        mongoUrl: 'mongodb://localhost:27017',
        database: 'nodered',
        //optional
        //set the collection name that the module would be using
        collectionNames:{
            flows: "nodered-flows",
            credentials: "nodered-credentials",
            settings: "nodered-settings",
            sessions: "nodered-sessions"
        },
        adminApiUrl: "http://localhost:1880" // The URL that will be called by this module to reload flows on the instance.
        // since the module execution is happening locally, this should be a local URL, that can be called from within the running Node-RED process
    },
	...
};
```

Your `storageModuleOptions` could also be injected with env variables

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Node-RED #1 │    │ Node-RED #2 │    │ Node-RED #3 │
│   Instance  │    │   Instance  │    │   Instance  │
└─────────────┘    └─────────────┘    └─────────────┘
       ↑                   ↑                   ↑
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ↓
                    ┌─────────────┐
                    │   MongoDB   │
                    │   Database  │
                    └─────────────┘
```
