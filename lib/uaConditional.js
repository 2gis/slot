function testUserAgentConditional(conditional, browser) {
    if (typeof conditional != 'string' || !conditional.length) {
        return false;
    }

    var re = /([a-z\s]+[a-z])\s?([><=!]+)?\s?([0-9]+)?/i;

    conditional = conditional.match(re).slice(1);

    // Приводим к нижнему регистру для сравнения
    conditional[0] = conditional[0] && conditional[0].toLowerCase();
    browser.name = browser.name && browser.name.toLowerCase();

    // Приводим к числу для сравнения
    conditional[2] = Number(conditional[2]);
    browser.major = Number(browser.major);

    // Если не совпадает название браузера
    if (conditional[0] != browser.name) return false;

    // Если не указана версия и тип сравнения
    if (!conditional[1] && !conditional[2]) return true;

    // Сравнение по версии
    switch (conditional[1]) {
        case '<' : return browser.major <  conditional[2]; break;
        case '<=': return browser.major <= conditional[2]; break;
        case '>' : return browser.major >  conditional[2]; break;
        case '>=': return browser.major >= conditional[2]; break;
        case '!=': return browser.major != conditional[2]; break;

        default: return browser.major == conditional[2];
    }
}

module.exports = testUserAgentConditional;