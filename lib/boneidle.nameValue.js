module.exports = {
    NameValue: NameValue,
    nameValue: nameValue
}

function NameValue(nameParam, valueParam) {
    var name = nameParam;
    var value = valueParam;
    this.__defineGetter__("name", function () {
        return name;
    });
    this.__defineGetter__("value", function () {
        return value;
    });
}

function nameValue(name, value) {
    return new NameValue(name, value);
}