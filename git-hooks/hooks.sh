#!/bin/bash

exec < /dev/tty

STATUS=0
STASHABLE=$(git stash create)

for hook in $(ls git-hooks/run-* 2> /dev/null)
do
    bash $hook "$(ps -ocommand= -p $PPID)"
    RET=$?
    if [ $RET -eq 130 ]
    then
        echo "Interrupting.."
        exit 130
    fi
    if [ $RET -ne 0 ]
    then
        STATUS=`expr $STATUS + 1` ### STATUS++
    fi
done

if [ "$STASHABLE" ]; then
    git stash apply $STASHABLE -q
fi

exit $STATUS
