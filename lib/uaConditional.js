function testUserAgentConditional(conditional, browser) {
    if (typeof conditional != 'string' || !conditional.length) {
        return false;
    }

    var re = /([a-z\s]+[a-z])\s?([><=!]+)?\s?([0-9]+)?/i,
        name = browser.name && browser.name.toLowerCase(),
        major = Number(browser.major);

    conditional = conditional.match(re).slice(1);

    conditional[0] = conditional[0] && conditional[0].toLowerCase();
    conditional[2] = Number(conditional[2]);

    // Если не совпадает название браузера
    if (conditional[0] != name) return false;

    // Если не указана версия и тип сравнения
    if (!conditional[1] && !conditional[2]) return true;

    // Сравнение по версии
    switch (conditional[1]) {
        case '<' : return major <  conditional[2];
        case '<=': return major <= conditional[2];
        case '>' : return major >  conditional[2];
        case '>=': return major >= conditional[2];
        case '!=': return major != conditional[2];

        default: return major == conditional[2];
    }
}

module.exports = testUserAgentConditional;