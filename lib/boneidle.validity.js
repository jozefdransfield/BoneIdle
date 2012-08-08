module.exports = {
    Validity:Validity,
    valid: valid,
    invalid: invalid
}

function valid(obj) {
    return new Validity(obj, true);
}

function invalid(obj) {
    return new Validity(obj, false);
}

function Validity(value, valid) {
    this.isValid = function() {
        return valid;
    }
    this.value = function() {
        return value;
    }
}
