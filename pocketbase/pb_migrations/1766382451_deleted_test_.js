/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4285667772");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1542800728",
        "max": 0,
        "min": 0,
        "name": "field",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "convertURLs": false,
        "hidden": false,
        "id": "editor2134807182",
        "maxSize": 0,
        "name": "field2",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "hidden": false,
        "id": "number137994776",
        "max": null,
        "min": null,
        "name": "field3",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool2522691515",
        "name": "field4",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "exceptDomains": [],
        "hidden": false,
        "id": "email3780773677",
        "name": "field5",
        "onlyDomains": [],
        "presentable": false,
        "required": true,
        "system": false,
        "type": "email"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "url2018727575",
        "name": "field6",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "date257189377",
        "max": "",
        "min": "",
        "name": "field7",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select3907799814",
        "maxSelect": 1,
        "name": "field9",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "test",
          "test2",
          "test3"
        ]
      },
      {
        "hidden": false,
        "id": "select58316182",
        "maxSelect": 3,
        "name": "field9_2",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "test",
          "test2",
          "test3"
        ]
      },
      {
        "hidden": false,
        "id": "file3582532695",
        "maxSelect": 1,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "field10",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2727226561",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "field11",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation1410607750",
        "maxSelect": 999,
        "minSelect": 0,
        "name": "field11_2",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "json998735227",
        "maxSize": 0,
        "name": "field12",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "geoPoint1283476973",
        "name": "field13",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "geoPoint"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate2683009936",
        "name": "field8",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_4285667772",
    "indexes": [],
    "listRule": "",
    "name": "test",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
