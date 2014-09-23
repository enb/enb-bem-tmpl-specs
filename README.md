enb-bem-tmpl-specs
==================

[![NPM version](http://img.shields.io/npm/v/enb-bem-tmpl-specs.svg?style=flat)](http://npmjs.org/package/enb-bem-tmpl-specs) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-tmpl-specs/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem-tmpl-specs) [![Dependency Status](http://img.shields.io/david/enb-bem/enb-bem-tmpl-specs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-tmpl-specs)

Инструмент для сборки и запуска спеков на шаблоны. В процессе сборки генерируются сеты из бандлов со спеками
на шаблоны БЭМ-блоков с помощью [ENB](http://enb-make.info/).

Установка:
----------

```sh
$ npm install --save-dev enb-bem-tmpl-specs
```

Для работы модуля требуется зависимость от пакета `enb-magic-factory` версии `0.2.x`.

Как создать тест?
-----------------

Чтобы добавить тест для БЭМ-сущности, нужно в её директории на требуемом уровне переопределения создать каталог с названием `bem-name.tmpl-specs` для хранения файлов тестов.

Каждый тест состоит из пары файлов в технологиях BEMJSON и HTML. Таких пар файлов у блока может быть несколько. Имена файлов произвольные, но они (не включая расширения) для каждого теста должны совпадать. Например, **10-default**.bemjson.js и **10-default**.html.

В BEMJSON-файле находится пример для БЭМ-сущности, в HTML – эталонный HTML-код, который должен получиться после выполнения шаблонов с данным BEMJSON.

```sh
$ tree -a <level>.blocks/<block-name>/<block-name>.tmpl-specs

<block-name>/
 └── <block-name>.tmpl-specs/
      ├── 10-default.bemjson.js
      ├── 10-default.html
      ├── 20-advanced.bemjson.js
      └── 20-advanced.html
```

Результат сборки
----------------

В результате будет построен уровень-сет из примеров, каждый из которых представляет собой обычный бандл (`nested`-уровнень):

```sh
$ tree -a <set-name>.examples

<set-name>.tmpl-specs/
 └── <block-name>/
      ├── <block-name>.references.js  # Набор из пар эталонов (BEMJSON + HTML).
      ├── <block-name>.bemhtml.js     # Код BEMHTML-шаблонов, необходимый для
                                      #  выполнения эталонов из `references.js`.
      ├── <block-name>.bh.js          # Код BH-шаблонов, необходимый для
                                      #  выполнения эталонов из `references.js`.
      └── <block-name>.tmpl-spec.js   # Код спеков в BDD-стиле.
```

Поддержка шаблонизаторов
------------------------

* BEMHTML на основе [`xjst`](https://github.com/veged/xjst), базовые шаблоны находятся в [`bem-bl`](https://github.com/bem/bem-bl).
* BEMHTML на основе [`bem-xjst`](https://github.com/bem-/bem-xjst), базовые шаблоны находятся в [`bem-core`](https://github.com/bem/bem-bl).
* [`BH`](https://github.com/bem/bh).

Запуск спеков
-------------

После сборки уровней-сетов произойдёт запуск спеков на шаблоны для указанных БЭМ-сущностей.

Собранные `tmpl-spec.js`-файлы для каждой БЭМ-сущности подключают необходимые для выполнения шаблоны
и наборы эталонов, а так же содержат код спеков в BDD-стиле. Эти файлы подаются на вход для [`mocha`](https://github.com/visionmedia/mocha).

![2014-09-22 12 50 05](https://cloud.githubusercontent.com/assets/2225579/4353599/5f4a146c-4235-11e4-9ed2-410405df62bd.png)

Вывод ошибок
------------

Если результат применения шаблона не совпадает с эталонным HTML, то в логе будет ошибка с указанием отличий от эталона.

![2014-09-22 13 01 29](https://cloud.githubusercontent.com/assets/2225579/4353728/ecaa52da-4236-11e4-84f1-d7cfc623cff7.png)

Для вывода различий используется [`html-differ`](https://github.com/bem/html-differ).

Как использовать?
-----------------

В `make`-файле (`.enb/make.js`) нужно подключить `enb-bem-tmpl-specs` модуль.
С помощью этого модуля следует создать конфигуратор, указав название таска в рамках которого будет происходить сборка
уровней сетов из спеков на шаблоны.

Конфигуратор имеет единственный метод `configure`. Его можно вызывать несколько раз, чтобы задекларировать сборку
нескольких уровней-сетов.

```js
module.exports = function (config) {
    config.includeConfig('enb-bem-tmpl-specs'); // Подключаем `enb-bem-tmpl-specs` модуль.

    var examples = config.module('enb-bem-tmpl-specs') // Создаём конфигуратор сетов
        .createConfigurator('tmpl-specs');             //  в рамках `specs` таска.

    examples.configure({
        destPath: 'desktop.tmpl-specs',
        levels: ['blocks'],
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: 'blocks', check: true }
        ],
        engines: {
            bh: {
                tech: 'enb-bh/techs/bh-server',
                options: {
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }
            },
            'bemhtml-dev': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                options: { devMode: true }
            },
            'bemhtml-prod': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                options: { devMode: false }
            }
        }
    });
};
```

### Опции

* *String* `destPath` &mdash;&nbsp;Путь относительный корня до&nbsp;нового уровня-сета со&nbsp;спеками на шаблоны, которые нужно собрать. Обязательная опция.
* *String[] | Object[]* `levels` &mdash;&nbsp;Уровни, в&nbsp;которых следует искать эталоны. Обязательная опция.
* *String[] | Object[]* `sourceLevels` &mdash;&nbsp;Уровни, в&nbsp;которых следует искать код шаблоноы, необходимый для шаблонизации эталонных BEMJSON-файлов.
* *String[]* `referenceDirSuffixes` &mdash;&nbsp;Суффиксы папок-технологий с&nbsp;эталонами. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['tmpl-specs']`.
* *Object* `engines` &mdash;&nbsp; Опция определяет какие ENB-технологии следует использовать для сборки шаблонов. Обязательная опция.

Запуск из консоли
-----------------

В `make`-файле декларируется таск, в котором будет выполняться сборка уровней-сетов из спеков на шаблоны.

В ENB запуск таска осуществляется с помощью команды `make`, которой передаётся имя таска:

```sh
$ ./node_modules/.bin/enb make <task-name>
```

### Сборка и запуск всех спеков на шаблоны

Если сборка уровней-сетов из спеков была задекларарована в `tmpl-specs`-таске:

```sh
$ ./node_modules/.bin/enb make tmpl-specs
```

### Сборка всех спеков на шаблоны для указанной БЭМ-сущности

Чтобы собрать спеки БЭМ-сущности `block__elem` для уровня-сета `desktop.tmpl-specs`:

```sh
$ ./node_modules/.bin/enb make tmpl-specs desktop.tmpl-specs/block__elem
```
