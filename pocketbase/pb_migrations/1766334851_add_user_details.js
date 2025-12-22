/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add title field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_title",
    "max": 0,
    "min": 0,
    "name": "title",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add avatar_options field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "json_avatar_options",
    "maxSize": 0,
    "name": "avatar_options",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove title field
  const titleField = collection.fields.findByName("title")
  if (titleField) {
    collection.fields.remove(titleField)
  }

  // remove avatar_options field
  const avatarOptionsField = collection.fields.findByName("avatar_options")
  if (avatarOptionsField) {
    collection.fields.remove(avatarOptionsField)
  }

  return app.save(collection)
})
