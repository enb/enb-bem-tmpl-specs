enb-bem-tmpl-specs
==================

[![NPM version](http://img.shields.io/npm/v/enb-bem-tmpl-specs.svg?style=flat)](http://npmjs.org/package/enb-bem-tmpl-specs) [![Build Status](http://img.shields.io/travis/enb-bem/enb-bem-tmpl-specs/master.svg?style=flat)](https://travis-ci.org/enb-bem/enb-bem-tmpl-specs) [![Dependency Status](http://img.shields.io/david/enb-bem/enb-bem-tmpl-specs.svg?style=flat)](https://david-dm.org/enb-bem/enb-bem-tmpl-specs)

Инструмент для сборки и запуска тестов на шаблоны. В процессе сборки генерируются сеты из бандлов с тестами на шаблоны БЭМ-блоков с помощью [ENB](http://enb-make.info/).

Установка
---------

```sh
$ npm install --save-dev enb-bem-tmpl-specs
```

Для работы модуля требуется зависимость от пакетов `enb-magic-factory` версии `0.3.x` или выше, а также `enb` версии `0.13.0` или выше.

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
      └── <block-name>.tmpl-spec.js   # Код тестов в BDD-стиле.
```

Поддержка шаблонизаторов
------------------------

* BEMHTML на основе [XJST](http://bem.info/tools/templating-engines/xjst/). Базовые шаблоны находятся в [bem-bl](http://ru.bem.info/libs/bem-bl/dev/).
* BEMHTML на основе [BEM-XJST](http://ru.bem.info/tools/templating-engines/bemxjst/). Базовые шаблоны находятся в [bem-core](http://ru.bem.info/libs/bem-core/current/).
* [BH](http://ru.bem.info/bh/).

Запуск тестов
-------------

После сборки уровней-сетов произойдёт запуск тестов на шаблоны для указанных БЭМ-сущностей.

Собранные `tmpl-spec.js`-файлы для каждой БЭМ-сущности подключают необходимые для выполнения шаблоны и наборы эталонов, а так же содержат код тестов в BDD-стиле. Эти файлы подаются на вход для [mocha](https://github.com/visionmedia/mocha).

![2014-09-22 12 50 05](https://cloud.githubusercontent.com/assets/2225579/4353599/5f4a146c-4235-11e4-9ed2-410405df62bd.png)

Вывод ошибок
------------

Если результат применения шаблона не совпадает с эталонным HTML, то в логе будет ошибка с указанием отличий от эталона.

![2014-09-22 13 01 29](https://cloud.githubusercontent.com/assets/2225579/4353728/ecaa52da-4236-11e4-84f1-d7cfc623cff7.png)

Для вывода различий используется [html-differ](http://ru.bem.info/tools/testing/html-differ/).

Формат вывода ошибок
--------------------

По умолчанию используется консольный отчет - `spec`.
Другие форматы можно использовать, перечислив их в переменной окружения:

```sh
BEM_TMPL_SPECS_REPORTERS=html,summary,spec
```

#### Доступные форматы отчетов

Все генерируемые в файл отчеты сохранятся в директорию - `tmpl-specs-reports/`

 - `summary` - Генерирует отчет в `JSON` формате и сохраняет его в файл (`summary.json`).

 ```json
 {
      "suites": 4,
      "tests": 16,
      "passes": 10,
      "pending": 0,
      "failures": 6,
      "start": "2014-10-14T12:02:10.800Z",
      "end": "2014-10-14T12:02:11.207Z",
      "duration": 407,
      "skipped": 0
 }
```

 - `html` - Генерирует отчет в `HTML` формате и сохраняет его в файл (`report.html`).

Как использовать?
-----------------

В `make`-файле (`.enb/make.js`) нужно подключить модуль `enb-bem-tmpl-specs`.
С помощью этого модуля следует создать конфигуратор, указав название таска, в рамках которого будет происходить сборка уровней сетов из тестов на шаблоны.

Конфигуратор имеет единственный метод `configure`. Его можно вызывать несколько раз, чтобы задекларировать сборку нескольких уровней-сетов.

```js
module.exports = function (config) {
    config.includeConfig('enb-bem-tmpl-specs'); // Подключаем `enb-bem-tmpl-specs` модуль.

    var examples = config.module('enb-bem-tmpl-specs') // Создаём конфигуратор сетов
        .createConfigurator('tmpl-specs');             //  в рамках таска `specs`.

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
                options: {
                    exportName: 'BEMHTML',
                    devMode: true
                }
            },
            'bemhtml-prod': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                options: {
                    exportName: 'BEMHTML',
                    devMode: false
                }
            }
        }
    });
};
```

### Опции

* *String* `destPath` &mdash;&nbsp;путь относительно корня до&nbsp;нового уровня-сета с&nbsp;тестами на шаблоны, которые нужно собрать. Обязательная опция.
* *String[] | Object[]* `levels` &mdash;&nbsp;уровни, в&nbsp;которых следует искать эталоны. Обязательная опция.
* *String[] | Object[]* `sourceLevels` &mdash;&nbsp;уровни, в&nbsp;которых следует искать код шаблонов, необходимый для шаблонизации эталонных BEMJSON-файлов.
* *String[]* `referenceDirSuffixes` &mdash;&nbsp;суффиксы папок технологий с&nbsp;эталонами. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['tmpl-specs']`.
* *Object* `engines` &mdash;&nbsp; опция определяет какие ENB-технологии следует использовать для сборки шаблонов. Обязательная опция.

Запуск из консоли
-----------------

В `make`-файле декларируется таск, в котором будет выполняться сборка уровней-сетов из тестов на шаблоны.

В ENB запуск таска осуществляется с помощью команды `make`, которой передаётся имя таска:

```sh
$ ./node_modules/.bin/enb make <task-name>
```

### Сборка и запуск всех тестов на шаблоны

Если сборка уровней-сетов из тестов была задекларарована в таске `tmpl-specs`:

```sh
$ ./node_modules/.bin/enb make tmpl-specs
```

### Сборка всех тестов на шаблоны для указанной БЭМ-сущности

Чтобы собрать тесты БЭМ-сущности `block__elem` для уровня-сета `desktop.tmpl-specs`:

```sh
$ ./node_modules/.bin/enb make tmpl-specs desktop.tmpl-specs/block__elem
```
