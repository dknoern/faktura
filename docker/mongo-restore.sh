#!/bin/sh
# Restore mongoexport JSON files into the compose Mongo instance.
#
# Each file in $DUMP_PATH named <collection>.json is imported into that
# collection of $MONGO_DB. Files are mongoexport output: either one JSON
# document per line (default) or a single JSON array.
#
# Runs once per data volume: a marker doc in _restore_state makes repeated
# `docker compose up` cheap. Set FORCE_RESTORE=1 to re-import anyway.
set -eu

HOST="${MONGO_HOST:-mongo:27017}"
DB="${MONGO_DB:-lager}"
REPLICA_SET="${MONGO_REPLICA_SET:-rs0}"
DUMP_PATH="${DUMP_PATH:-/dump}"
FORCE_RESTORE="${FORCE_RESTORE:-0}"

ADMIN_URI="mongodb://${HOST}/admin?directConnection=true"
DB_URI="mongodb://${HOST}/${DB}?replicaSet=${REPLICA_SET}"

mongosh_admin() { mongosh "$ADMIN_URI" --quiet --eval "$1"; }

echo "==> waiting for mongod at ${HOST}"
i=0
until mongosh_admin 'db.adminCommand({ ping: 1 })' >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -lt 60 ] || { echo "mongod never answered a ping"; exit 1; }
  sleep 2
done

echo "==> ensuring replica set ${REPLICA_SET} is initiated"
mongosh_admin "
  let initiated = false;
  try { rs.status(); initiated = true; } catch (e) { initiated = false; }
  if (!initiated) {
    print('initiating ${REPLICA_SET}');
    rs.initiate({ _id: '${REPLICA_SET}', members: [{ _id: 0, host: '${HOST}' }] });
  }
"

echo "==> waiting for a writable primary"
i=0
until [ "$(mongosh_admin 'print(db.hello().isWritablePrimary)' 2>/dev/null)" = "true" ]; do
  i=$((i + 1))
  [ "$i" -lt 60 ] || { echo "no primary was elected"; exit 1; }
  sleep 2
done

if [ "$FORCE_RESTORE" != "1" ]; then
  done_at=$(mongosh "$DB_URI" --quiet --eval \
    'const d = db.getCollection("_restore_state").findOne({ _id: "restore" }); print(d ? d.finishedAt : "")' 2>/dev/null || echo "")
  if [ -n "$done_at" ]; then
    echo "==> ${DB} was already restored at ${done_at} — skipping"
    echo "    (FORCE_RESTORE=1 docker compose up mongo-restore to re-import)"
    exit 0
  fi
fi

count=0
for file in "$DUMP_PATH"/*.json; do
  [ -f "$file" ] || continue
  collection=$(basename "$file" .json)

  # mongoexport writes one doc per line by default, but --jsonArray output
  # starts with '['. Sniff the first non-whitespace byte.
  if [ "$(tr -d '[:space:]' < "$file" | head -c 1)" = "[" ]; then
    array_flag="--jsonArray"
  else
    array_flag=""
  fi

  echo "==> importing ${collection} ($(du -h "$file" | cut -f1))"
  # shellcheck disable=SC2086
  mongoimport \
    --uri "$DB_URI" \
    --collection "$collection" \
    --file "$file" \
    --drop \
    --numInsertionWorkers 4 \
    $array_flag
  count=$((count + 1))
done

if [ "$count" -eq 0 ]; then
  echo "!!! no *.json files found in ${DUMP_PATH}"
  echo "    point DUMP_DIR at a mongoexport directory (see docker-compose.yml)"
  exit 1
fi

mongosh "$DB_URI" --quiet --eval "
  db.getCollection('_restore_state').replaceOne(
    { _id: 'restore' },
    { _id: 'restore', finishedAt: new Date().toISOString(), collections: ${count} },
    { upsert: true }
  );
  print('==> restored ' + ${count} + ' collections into ${DB}');
  db.getCollectionNames().filter(n => !n.startsWith('_')).forEach(n => print('    ' + n + ': ' + db[n].countDocuments()));
"
