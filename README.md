Node Red Mongo Storage Plugin with synchronization with other instances
===============================

This plugin replaces Node-RED's default file-based flow storage with MongoDB, providing a scalable solution for multi-instance Node-RED deployments. When flows are modified in any instance, the plugin automatically notifies all other instances in the cluster to reload their flows, ensuring consistency across your distributed Node-RED infrastructure.

The plugin creates a collection per entity type and save each entity seperatly which lead to increased performance.

Getting Started
-----

Firstly, install the module:

```bash
npm install --save node-red-mongo-storage-plugin
```

Then, in your Node-RED settings, add:

```javascript
var settings = {
	...
    storageModule : require("node-red-mongo-storage-plugin"),
    storageModuleOptions: {        
        mongoUrl: 'mongodb://localhost:27017',
        //also possible
        //mongoUrl: 'PROCESS.ENV.MONGOURL',
        database: 'local',
        //optional
        //set the collection name that the module would be using
        collectionNames:{
            flows: "nodered-flows",
            credentials: "nodered-credentials",
            settings: "nodered-settings",
            sessions: "nodered-sessions"
        }
    },
	...
};
```

Your `storageModuleOptions` could also be injected with env variables

Architecture
-----

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Node-RED #1 │    │ Node-RED #2 │    │ Node-RED #3 │
│   Instance  │◄──►│   Instance  │◄──►│   Instance  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌─────────────┐
                  │   MongoDB   │
                  │   Database  │
                  └─────────────┘
```
