#!/bin/bash

STATUS=0
STASHABLE=$(git stash --keep-index)

for hook in $(ls git-hooks/run-* 2> /dev/null)
do
    bash $hook
    if [ $? -ne 0 ]
    then
        STATUS=`expr $STATUS + 1` ### STATUS++
    fi
done

if [ "$STASHABLE" != "No local changes to save" ]; then
    git stash pop -q
fi

exit $STATUS
