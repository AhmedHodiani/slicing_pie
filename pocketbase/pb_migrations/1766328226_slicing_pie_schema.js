/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Update users collection
  const users = app.findCollectionByNameOrId("_pb_users_auth_");

  users.fields.add(new Field({
    "name": "market_salary_monthly",
    "type": "number",
    "min": 0,
    "max": null,
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false
  }));

  users.fields.add(new Field({
    "name": "hourly_rate",
    "type": "number",
    "min": 0,
    "max": null,
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false
  }));

  users.fields.add(new Field({
    "name": "role",
    "type": "select",
    "values": ["admin", "viewer"],
    "maxSelect": 1,
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false
  }));

  app.save(users);

  // 2. Create contributions collection
  const contributions = new Collection({
    "name": "contributions",
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "fields": [
      {
        "name": "id",
        "type": "text",
        "required": true,
        "primaryKey": true,
        "autogeneratePattern": "[a-z0-9]{15}",
        "pattern": "^[a-z0-9]+$",
        "max": 15,
        "min": 15,
        "system": true,
        "hidden": false,
        "presentable": false
      },
      {
        "name": "user",
        "type": "relation",
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": false,
        "minSelect": 0,
        "maxSelect": 1,
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "category",
        "type": "select",
        "values": ["time", "money"],
        "maxSelect": 1,
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "amount",
        "type": "number",
        "min": null,
        "max": null,
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "fair_market_value",
        "type": "number",
        "min": null,
        "max": null,
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "multiplier",
        "type": "number",
        "min": null,
        "max": null,
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "slices",
        "type": "number",
        "min": null,
        "max": null,
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "description",
        "type": "text",
        "min": null,
        "max": null,
        "required": false,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "date",
        "type": "date",
        "min": "",
        "max": "",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "created",
        "type": "autodate",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "name": "updated",
        "type": "autodate",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "hidden": false
      }
    ]
  });

  app.save(contributions);

}, (app) => {
  // Revert
  try {
    const users = app.findCollectionByNameOrId("_pb_users_auth_");
    users.fields.removeByName("market_salary_monthly");
    users.fields.removeByName("hourly_rate");
    users.fields.removeByName("role");
    app.save(users);
  } catch (e) {
    console.log("Error reverting users collection changes", e);
  }

  try {
    const contributions = app.findCollectionByNameOrId("contributions");
    app.delete(contributions);
  } catch (e) {
    console.log("Error deleting contributions collection", e);
  }
})
