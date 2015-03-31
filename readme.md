[![Slot](https://raw.githubusercontent.com/2gis/artwork/master/slot/logo-multi.png)](http://github.com/2gis/slot)

JavaScript фреймворк, позволяющий быстро и просто создавать модульные изоморфные приложения.

[![Join the chat at https://gitter.im/2gis/slot](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/2gis/slot?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/2gis/slot.svg?branch=master)](https://travis-ci.org/2gis/slot)
[![Coverage Status](https://coveralls.io/repos/2gis/slot/badge.svg?branch=master)](https://coveralls.io/r/2gis/slot?branch=master)
[![Dependency Status](https://gemnasium.com/2gis/slot.svg)](https://gemnasium.com/2gis/slot)

## Особенности

### Изоморфность
Вы пишете код приложения на одном языке, как на сервере, так и на клиенте.

Вы пишете код практически не задумываясь о том, в какой среде он исполняется(браузер или сервер) в рамках одного приложения.

Специфичный код для браузера вы пишете в строго отведённом для этого месте. Всю остальную работу делает за вас фреймворк.
        
### Single Page App + SEO
Вы создаёте <a href="https://ru.wikipedia.org/wiki/Single_Page_Application">одностраничное приложение</a>.

Каждое состояние(страница) приложения описывается конкретным URL.
На стороне сервера состояние приложения восстанавливается из URL и генерируется соответствующая HTML-страница.
Поисковые роботы получают готовую для индексации страницу в конкретном состоянии.
                
### Модульность + БЭМ
Стройте свой UI из <a href="https://github.com/2gis/slot/blob/master/docs/conception.md#Архитектура">независимых переиспользуемых модулей</a>.

Модуль - это стандартный CommonJS-модуль в рамках платформы <a href="http://nodejs.org">NodeJS</a>.

Фреймворк по умолчанию поддерживает <a href="https://ru.bem.info/method/">БЭМ-методологию</a>. Модуль - это блок в терминах БЭМ.

### Сборка на gulp из коробки
Для сборки проектов по умолчанию используется потоковый сборщик <a href="http://gulpjs.com">Gulp</a>.

Собираете и запускаете проект <a href="https://github.com/2gis/slot/blob/master/docs/cli.md#Сборка-приложений">одной командой</a>.

Автоматическая пересборка проекта при изменении кода.

Всё что вам нужно - дописать к сборке особенности своего приложения.

### Работает вместе с модулем MakeUp
В комплект входит специальный модуль для изолированной разработки модулей <a href="http://2gis.github.io/makeup/">MakeUp</a>.

##Установка

###### Установите глобально gulp и slot:
```bash
$ npm install -g gulp
$ npm install -g slot
```

###### Создайте и перейдите в пустую папку:
```bash
$ mkdir myApp
$ cd myApp
```

###### Разверните в папке базовую структуру приложения:
```bash
$ slot init
```

###### Установите зависимости:
```bash
$ npm install
```

###### Соберите приложение:
```bash
$ gulp dev
```

###### По умолчанию приложение доступно по адресу [http://localhost:3000/](http://localhost:3000/)

## Документация
Вся документация находится в папке `docs`.

- [Быстрый обзор](https://github.com/2gis/slot/blob/master/docs/quickTour.md)
- [Использование CLI](https://github.com/2gis/slot/blob/master/docs/cli.md)
- [Описание архитектуры](https://github.com/2gis/slot/blob/master/docs/conception.md)
- [Принять участие в разработке](https://github.com/2gis/slot/blob/master/contributing.md).
