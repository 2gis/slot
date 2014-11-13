#!/bin/bash
STASHABLE=$(git stash create)
if [ "$STASHABLE" ]; then
    git reset --hard HEAD
fi

gulp hooks.run

STATUS=$?
if [ "$STASHABLE" ]; then
    git stash apply $STASHABLE -q
fi

exit $STATUS