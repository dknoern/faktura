#!/usr/bin/env bash
# Throwaway Mongo replica set for local verification.
#
# .env's MONGODB_URI is mongodb://localhost:27017/lager?replicaSet=rs0 — the
# driver refuses to connect unless the server really is a replica set member,
# so a plain `docker run mongo:8` is not enough: it needs --replSet + rs.initiate.
#
# Uses its OWN volume (faktura_verify_data). It deliberately does NOT mount the
# existing lager2_mongodb_data volume: rs.initiate() writes local.oplog.rs into
# the data directory, which mutates that data in place.
#
#   ./mongo.sh start   # boot docker if needed, start mongod, initiate rs0
#   ./mongo.sh stop    # remove container + throwaway volume
#   ./mongo.sh shell   # mongosh into it
set -euo pipefail

NAME=faktura-verify-mongo
VOL=faktura_verify_data
URI='mongodb://localhost:27017/lager?replicaSet=rs0'

case "${1:-start}" in
start)
  # Docker here is colima, and it is usually stopped.
  if ! docker info >/dev/null 2>&1; then
    echo "starting colima (this takes ~1 min)..."
    colima start
  fi

  if [ -n "$(docker ps -q -f name="^${NAME}$")" ]; then
    echo "already running"
  else
    # A colima restart auto-starts other projects' containers (restart policies);
    # if one of them owns 27017 our container silently fails to bind and every
    # localhost:27017 client talks to the WRONG mongod — possibly real data.
    FOREIGN=$(docker ps --format '{{.Names}} {{.Ports}}' | grep 27017 | grep -v "^${NAME} " || true)
    if [ -n "$FOREIGN" ]; then
      echo "ERR port 27017 is owned by another container: ${FOREIGN}" >&2
      echo "    stop it first (docker stop <name>) — refusing to risk seeding real data" >&2
      exit 1
    fi
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    docker run -d --name "$NAME" -p 27017:27017 -v "$VOL":/data/db \
      mongo:8 --replSet rs0 --bind_ip_all >/dev/null
    sleep 1
    if [ "$(docker inspect -f '{{.State.Running}}' "$NAME")" != "true" ]; then
      echo "ERR ${NAME} failed to start (port conflict?):" >&2
      docker logs "$NAME" 2>&1 | tail -3 >&2
      exit 1
    fi
  fi

  for _ in $(seq 1 60); do
    docker exec "$NAME" mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1 && break
    sleep 1
  done

  docker exec "$NAME" mongosh --quiet --eval \
    'try { rs.status().ok } catch (e) { rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]}) }' >/dev/null

  for _ in $(seq 1 60); do
    docker exec "$NAME" mongosh --quiet --eval "db.hello().isWritablePrimary" 2>/dev/null | grep -q true && {
      # Marker proving this is the throwaway instance; seed.mjs refuses to
      # write to any mongod that lacks it.
      docker exec "$NAME" mongosh --quiet --eval \
        'db.getSiblingDB("lager").faktura_verify_marker.updateOne({_id:"marker"},{$set:{throwaway:true}},{upsert:true})' >/dev/null
      echo "PRIMARY ready on 27017"
      exit 0
    }
    sleep 1
  done
  echo "ERR mongod never became primary" >&2
  exit 1
  ;;
stop)
  docker rm -f "$NAME" >/dev/null 2>&1 && echo "container removed" || true
  docker volume rm "$VOL" >/dev/null 2>&1 && echo "volume removed" || true
  ;;
shell)
  # Extra args pass through, e.g. ./mongo.sh shell --quiet --eval 'db.proposals.countDocuments()'
  shift
  TTY=()
  [ -t 0 ] && TTY=(-it)
  exec docker exec "${TTY[@]}" "$NAME" mongosh "$URI" "$@"
  ;;
*)
  echo "usage: $0 {start|stop|shell}" >&2
  exit 2
  ;;
esac
