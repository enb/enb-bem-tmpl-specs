enb-bem-tmpl-specs
==================

[![NPM version](https://img.shields.io/npm/v/enb-bem-tmpl-specs.svg?style=flat)](http://npmjs.org/package/enb-bem-tmpl-specs) [![Build Status](https://img.shields.io/travis/enb/enb-bem-tmpl-specs/master.svg?style=flat)](https://travis-ci.org/enb/enb-bem-tmpl-specs) [![Dependency Status](https://img.shields.io/david/enb/enb-bem-tmpl-specs.svg?style=flat)](https://david-dm.org/enb/enb-bem-tmpl-specs)

Инструмент для сборки и запуска тестов на шаблоны. В процессе сборки генерируются сеты из бандлов с тестами на шаблоны БЭМ-блоков с помощью [ENB](http://enb-make.info/).

<!-- TOC -->
- [Установка](#Установка)
- [Как создать тест?](#Как-создать-тест)
- [Результат сборки](#Результат-сборки)
- [Поддержка шаблонизаторов](#Поддержка-шаблонизаторов)
- [Запуск тестов](#Запуск-тестов)
- [Вывод ошибок](#Вывод-ошибок)
- [Формат вывода ошибок](#Формат-вывода-ошибок)
- [Сохранение результатов](#Сохранение-результатов)
- [Фильтрация тестов](#Фильтрация-тестов)
  - [Доступные форматы отчетов](#Доступные-форматы-отчетов)
- [Как использовать?](#Как-использовать)
  - [Опции для всех уровней-сетов](#Опции-для-всех-уровней-сетов)
  - [Опции для определенного уровня-сета](#Опции-для-определенного-уровня-сета)
- [Запуск из консоли](#Запуск-из-консоли)
  - [Сборка и запуск всех тестов на шаблоны](#Сборка-и-запуск-всех-тестов-на-шаблоны)
  - [Сборка всех тестов на шаблоны для указанной БЭМ-сущности](#Сборка-всех-тестов-на-шаблоны-для-указанной-БЭМ-сущности)
- [Лицензия](#Лицензия)

<!-- TOC END -->

Установка
---------

```sh
$ npm install --save-dev enb-bem-tmpl-specs
```

Для работы модуля требуется зависимость от пакетов `enb-magic-factory` версии `0.3.x` или выше, а также `enb` версии `0.15.0` или выше.

Как создать тест?
-----------------

Чтобы добавить тест для БЭМ-сущности, нужно в её директории на требуемом уровне переопределения создать каталог с названием `bem-name.tmpl-specs` для хранения файлов тестов.

Каждый тест состоит из пары файлов «пример» и «эталон», где каждый файл создаётся в своей технологии, например BEMJSON и HTML. Таких пар файлов у блока может быть несколько. Имена файлов произвольные, но они (не включая расширения) для каждого теста должны совпадать. Например, **10-default**.bemjson.js и **10-default**.html.

```sh
$ tree -a <level>.blocks/<block-name>/<block-name>.tmpl-specs

<block-name>/
 └── <block-name>.tmpl-specs/
      ├── 10-default.bemjson.js  # Эталонный BEMJSON-код сравниваемый с результатом
      │                          #  обработки BEMTREE, а также пример для BEMHTML
      ├── 10-default.data.js     # Пример в технологии BEMJSON для обработки BEMTREE 
      │                          #  шаблонизатором
      ├── 10-default.html        # Эталонный HTML-код сравниваемый с результатом 
      │                          #  обработки BEMHTML
      ├── 20-advanced.bemjson.js
      └── 20-advanced.html
```

Результат сборки
----------------

В результате будет построен уровень-сет из примеров, каждый из которых представляет собой обычный бандл (`nested`-уровень):

```sh
$ tree -a <set-name>.tmpl-specs

<set-name>.tmpl-specs/
 └── <block-name>/
      ├── <block-name>.references.js  # Набор из пар эталонов (data + bemjson для BEMTREE
      │                               #  и bemjson + html для BEMHTML).
      ├── <block-name>.bemhtml.js     # Код BEMHTML-шаблонов, необходимый для
      │                               #  выполнения эталонов из `references.js`.
      ├── <block-name>.bemtree.js     # Код BEMTREE-шаблонов, необходимый для
      │                               #  выполнения эталонов из `references.js`.
      ├── <block-name>.bh.js          # Код BH-шаблонов, необходимый для
      │                               #  выполнения эталонов из `references.js`.
      └── <block-name>.tmpl-spec.js   # Код тестов в BDD-стиле.
```

Поддержка шаблонизаторов
------------------------

* BEMHTML на основе [XJST](https://ru.bem.info/tools/templating-engines/xjst/). Базовые шаблоны находятся в [bem-bl](https://ru.bem.info/libs/bem-bl/dev/).
* BEMHTML на основе [BEM-XJST](https://ru.bem.info/tools/templating-engines/bemxjst/). Базовые шаблоны находятся в [bem-core](https://ru.bem.info/libs/bem-core/current/).
* [BH](https://ru.bem.info/technology/bh/).
* BEMTREE на основе [BEM-XJST](https://ru.bem.info/tools/templating-engines/bemxjst/).

Запуск тестов
-------------

После сборки уровней-сетов произойдёт запуск тестов на шаблоны для указанных БЭМ-сущностей.

Собранные `tmpl-spec.js`-файлы для каждой БЭМ-сущности подключают необходимые для выполнения шаблоны и наборы эталонов, а так же содержат код тестов в BDD-стиле. Эти файлы подаются на вход для [mocha](https://github.com/visionmedia/mocha).

![2014-09-22 12 50 05](https://cloud.githubusercontent.com/assets/2225579/4353599/5f4a146c-4235-11e4-9ed2-410405df62bd.png)

Вывод ошибок
------------

Если результат применения шаблона не совпадает с эталонным HTML, то в логе будет ошибка с указанием отличий от эталона.

![2014-09-22 13 01 29](https://cloud.githubusercontent.com/assets/2225579/4353728/ecaa52da-4236-11e4-84f1-d7cfc623cff7.png)

Для вывода различий используется:
* html — [html-differ](https://ru.bem.info/tools/testing/html-differ/).
* json — [deep-diff](https://github.com/flitbit/diff).

Формат вывода ошибок
--------------------

По умолчанию используется консольный отчет - `spec`.
Другие форматы можно использовать, перечислив их в переменной окружения:

```sh
BEM_TMPL_SPECS_REPORTERS=html,summary,spec
```

Сохранение результатов
----------------------

Для сохранения результатов отрисовки HTML вы можете либо выставить явно флаг `saveHtml` при конфигурации технологии, либо через переменную окружения — `BEM_TMPL_SPECS_SAVE_HTML=1`.

Файл будет сохранён в `<set-name>.tmpl-specs/<block-name>/*.html`, рядом со сгенерированными файлами тестов.

Создание эталонов
----------------------
Для создания/обновления HTML эталонов вы можете либо выставить явно флаг `saveReferenceHtml` при конфигурации технологии, либо через переменную окружения — `BEM_TMPL_SPECS_SAVE_REFERENCE_HTML=1`

Файл будет сохранён в `<level>.blocks/<block-name>/<block-name>.tmpl-specs/*.{html,js}`, рядом с исходным кодом блока.

Или можно использовать флаг `autoAddReference` для автоматической генерации недостающего эталона если таковой не найден, при условии что существует входной пример.

Фильтрация тестов
-----------------

Чтобы запустить только нужные тесты можно указать в `grep` регулярное выражение или строку, фильтрующее тесты по названию,
либо передать его через переменную окружения:
```sh
BEM_TMPL_SPECS_GREP='10-'
BEM_TMPL_SPECS_GREP='/specs.+rocks/i'
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
        .createConfigurator('tmpl-specs', {            // в рамках таска `specs`.
            coverage: {                                // Определяем общие опции для всех уровней-сетов.
                engines: ['bh'],
                reportDirectory: 'coverage',
                exclude: ['**/node_modules/**', '**/libs/**'],
                reporters: ['lcov']
            }
        });

    examples.configure({
        destPath: 'desktop.tmpl-specs',
        levels: ['blocks'],
        langs: ['ru','en'],
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
            },
            bemtree: {
                tech: 'enb-bemxjst/techs/bemtree',
                options: {
                    sourceSuffixes: ['bemtree', 'bemtree.js'],
                    exportName: 'BEMTREE',
                }
            }
        }
    });
};
```

### Опции для всех уровней-сетов

* *Object* `coverage` – собирать информацию о покрытии кода тестами.
  - *String[]* `engines` – список шаблонизаторов, которые необходимо учитывать при формировании отчета;
  - *String* `reportDirectory` – название папки, в которой необходимо создать отчет. По умолчанию – `coverage`;
  - *String[]* `exclude` – маски путей, которые необходимо исключить при формировании отчета. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['**/node_modules/**', '**/libs/**']`;
  - *String[]* `reporters` – форматы отчетов (env: `BEM_TMPL_SPECS_COV_REPORTERS`, названия форматов отчётов передаются через запятую), см.&nbsp;[istanbul#report](https://github.com/gotwarlost/istanbul/tree/master/lib/report). По умолчанию – `['lcov']`.
* *Object* `htmlDiffer` — настройки сравнения HTML при помощи [html-differ](https://ru.bem.info/tools/testing/html-differ/). По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`{ preset: 'bem' }`.
* *Number* `timeout` — время ожидания тест-кейса в миллисекундах (env: `BEM_TMPL_SPECS_TIMEOUT`).
* *String|RegExp* `grep` — фильтр тестов по названию (env: `BEM_TMPL_SPECS_GREP`), см. [mocha#grep](http://mochajs.org/#grep-option).

### Опции для определенного уровня-сета

* *String* `destPath` &mdash;&nbsp;путь относительно корня до&nbsp;нового уровня-сета с&nbsp;тестами на шаблоны, которые нужно собрать. Обязательная опция.
* *String[] | Object[]* `levels` &mdash;&nbsp;уровни, в&nbsp;которых следует искать эталоны. Обязательная опция.
* *String[] | Object[]* `sourceLevels` &mdash;&nbsp;уровни, в&nbsp;которых следует искать код шаблонов, необходимый для шаблонизации эталонных BEMJSON-файлов.
* *String[]* `referenceDirSuffixes` &mdash;&nbsp;суффиксы папок технологий с&nbsp;эталонами. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`['tmpl-specs']`.
* *String[] | Boolean* `langs` &mdash;&nbsp; использование `BEM.I18N` в шаблонах. Если указать массив языков, то необходимо будет создавать эталоны на каждый из перечисленных языков. Например `10-name.ru.bemjson.js` , `10-name.en.bemjson.js`.
Если использовать значение `langs: true`, то эталоны по языкам писать не нужно. В код собранных шаблонов будет всталенно только ядро BEM.I18N, без кейсетов. По&nbsp;умолчанию&nbsp;&mdash;&nbsp;`false`.
* *String[]* `prependFiles` — опция позволяет указать набор файлов для подмешивания в начало тестируемых шаблонов.
* *String[]* `appendFiles` — опция позволяет указать набор файлов для подмешивания в конец тестируемых шаблонов.
* *Object* `engines` &mdash;&nbsp; опция определяет какие ENB-технологии следует использовать для сборки шаблонов. Обязательная опция.
  - *String* `tech` — путь к ENB-технологии;
  - *Object* `options` — опции для ENB-технологии;
  - *Boolean* `async` — асинхронный шаблонизатор;
* *String* `completeBundle` – имя бандла, в котором будут собраны все БЭМ-сущности из уровней `levels`. По умолчанию `completeBundle` не будет собран.
* *Boolean* `saveHtml` — сохранять результат HTML при успешной отрисовке в файл (env: `BEM_TMPL_SPECS_SAVE_HTML`);
* *Boolean* `saveReferenceHtml` — создать/обновить эталон HTML рядом с BEMJSON (env: `BEM_TMPL_SPECS_SAVE_REFERENCE_HTML`);
* *Boolean* `autoAddReference` — автоматически создавать недостающие эталоны, при условии что существуют входные примеры;
* *String|Function* `depsTech` — технология для раскрытия зависимостей. По умолчанию — `deps-old`.
* *Function* `mockI18N` — функция будет использована вместо ядра `i18n`, если указана опция `langs: true`.
* *String* `stringifyIndent` — предпочтительный отступ для подсветки различий JSON объектов. По умолчанию два пробела.

Запуск из консоли
-----------------

В `make`-файле декларируется таск, в котором будет выполняться сборка уровней-сетов из тестов на шаблоны.

В ENB запуск таска осуществляется с помощью команды `make`, которой передаётся имя таска:

```sh
$ ./node_modules/.bin/enb make <task-name>
```

### Сборка и запуск всех тестов на шаблоны

Если сборка уровней-сетов из тестов была задекларирована в таске `tmpl-specs`:

```sh
$ ./node_modules/.bin/enb make tmpl-specs
```

### Сборка всех тестов на шаблоны для указанной БЭМ-сущности

Чтобы собрать тесты БЭМ-сущности `block__elem` для уровня-сета `desktop.tmpl-specs`:

```sh
$ ./node_modules/.bin/enb make tmpl-specs desktop.tmpl-specs/block__elem
```

Лицензия
--------

© 2014 YANDEX LLC. Код лицензирован [Mozilla Public License 2.0](LICENSE.txt).
