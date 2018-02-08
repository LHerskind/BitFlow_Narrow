function generateBudget(_start, _end, _mean, _maxVariance, _toWhom) {

    var daysBetween = getTimeFromValue(_end.getTime()) - getTimeFromValue(_start.getTime());

    for (var i = 0; i < daysBetween; i++) {

        _start.setDate(_start.getDate() + 1);
        var value = _mean - _maxVariance / 2 + Math.random() * _maxVariance;
        var time = _start.getTime();
        var amount = Math.floor(value * 100);

        changeBudget(_toWhom, time, amount);
    }

}

function generateSpending(_start, _end, _mean, _maxVariance, _toWhom) {

    var daysBetween = getTimeFromValue(_end.getTime()) - getTimeFromValue(_start.getTime());

    for (var i = 0; i < daysBetween; i++) {
        _start.setDate(_start.getDate() + 1);
        var value = _mean - _maxVariance / 2 + Math.random() * _maxVariance;
        var time = _start.getTime() / 1000;
        var amountInCDKK = Math.floor(value * 100);

        simulateTransferCDKK(_toWhom, time, amountInCDKK);
    }

}