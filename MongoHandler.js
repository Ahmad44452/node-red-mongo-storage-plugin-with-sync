const { MongoClient, ServerApiVersion } = require("mongodb");
const crypto = require("crypto");
const HttpNotifier = require("./HttpNotifier");

let MongoHandler = class MongoHandler {
  constructor(url, databaseName, adminApiUrl, collectionToWatch) {
    this.url = url;
    this.dbInstace = null;
    this.client = null;
    this.databaseName = databaseName;
    this.instanceId = crypto.randomUUID();
    this.httpNotifier = new HttpNotifier(adminApiUrl);
    this.collectionToWatch = collectionToWatch;
  }

  connect() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(
          "[mongo-storage] Initiating connection to MonogoDB: ",
          this.url
        );
        this.client = new MongoClient(this.url, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
        });

        await this.client.connect();

        this.dbInstace = this.client.db(this.databaseName, {
          useUnifiedTopology: true,
        });
        this.watchFlowsCollection();
        console.log("[mongo-storage] Connected to MonogDB Successfully");
        resolve(this.client);
      } catch (err) {
        console.log("[mongo-storage] Error connecting to MongoDB.");
        console.error(err);
        reject(err);
      }
    });
  }

  watchFlowsCollection() {
    try {
      console.log(
        "[mongo-storage] Listening for changes on collection: ",
        this.collectionToWatch
      );
      const collection = this.dbInstace.collection(this.collectionToWatch);
      const changeStream = collection.watch();

      let debounceTimer;
      changeStream.on("change", (change) => {
        console.log(
          "[mongo-storage] Change event received from MonogDB. Operation type: ",
          change.operationType
        );
        if (
          change.operationType === "insert" ||
          change.operationType === "replace" ||
          change.operationType === "update"
        ) {
          if (
            change.fullDocument &&
            change.fullDocument.instanceId !== this.instanceId
          ) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              this.httpNotifier.triggerReload();
            }, 500);
          }
        } else if (change.operationType === "invalidate") {
          this.watchFlowsCollection();
        }
      });

      changeStream.on("error", (error) => {
        console.error("[mongo-storage] Change stream error:", error);
        setTimeout(() => this.watchFlowsCollection(), 30000);
      });
    } catch (err) {
      console.log(
        "[mongo-storage] Error initiating listener on collection: ",
        this.collectionToWatch
      );
      console.log("[mongo-storage] Trying again after 30 seconds");
      console.error(err);
      setTimeout(() => this.watchFlowsCollection(), 30000);
    }
  }

  findAll(collectionName) {
    return new Promise(async (resolve, reject) => {
      try {
        const collection = this.dbInstace.collection(collectionName);
        const storageDocuments = await collection.find({}).toArray();
        if (storageDocuments == null) {
          resolve({});
        } else {
          resolve(storageDocuments);
        }
      } catch (ex) {
        reject(ex);
      }
    });
  }

  saveAll(collectionName, objects) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.dropCollectionIfExists(collectionName);

        if (objects.length > 0) {
          const collection = this.dbInstace.collection(collectionName);
          const bulkOps = objects.map((obj) => ({
            insertOne: {
              document: { ...obj, instanceId: this.instanceId },
            },
          }));
          await collection.bulkWrite(bulkOps);
        }

        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  async dropCollectionIfExists(collectionName) {
    const collections = await this.dbInstace
      .listCollections({ name: collectionName })
      .toArray();
    if (collections.length > 0) {
      await this.dbInstace.collection(collectionName).drop();
    }
  }

  findOneByPath(collectionName, path) {
    return new Promise(async (resolve, reject) => {
      try {
        const collection = this.dbInstace.collection(collectionName);
        const storageDocument = await collection.findOne({ path: path });
        if (storageDocument == null) {
          resolve({});
        } else {
          if (storageDocument.body) {
            if (typeof storageDocument.body == "string") {
              resolve(JSON.parse(storageDocument.body));
            } else {
              resolve(storageDocument.body);
            }
          } else {
            resolve({});
          }
        }
      } catch (ex) {
        reject(ex);
      }
    });
  }

  saveOrUpdateByPath(collectionName, path, meta, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const collection = this.dbInstace.collection(collectionName);
        const storageDocument = await collection.findOne({ path: path });

        if (storageDocument == null) {
          await collection.insertOne({
            path: path,
            meta: JSON.stringify(meta),
            body: JSON.stringify(body),
            instanceId: this.instanceId,
          });
        } else {
          await collection.updateOne(
            { path: path },
            {
              $set: {
                meta: JSON.stringify(meta),
                body: JSON.stringify(body),
                instanceId: this.instanceId,
              },
            }
          );
        }
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }
};

module.exports = MongoHandler;
