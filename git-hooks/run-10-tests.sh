#!/usr/bin/env bash

echo ""
echo -en "\033[36m"
echo "Запускаю тесты, тыдыщ"
echo -en "\033[0m"

gulp test --no-notify
RESULT=$?

if [ $RESULT -ne 0 ]
then
    echo -en "\033[41m"
    echo -en "Тесты провалены, иди фиксить!"
    echo -e "\033[0m"
    exit $RESULT
else
    echo -en "\033[42m"
    echo -en "С тестами всё ок, молодцом!"
    echo -e "\033[0m"
    exit 0
fi
