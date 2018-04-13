// TODO: Der er problemer med at ændre på budgettet, det ligner ikke at de bliver ordentligt lagt ind.
// Derudover så ligner det at vi kun regner CDKK som ud, det kan jo godt være BKK ud, bare til et andet firma, så det skal lige med


// Burde muligvis være med, men vi vil gerne være sikre på at metamask ikke fucker

var useMetaMask = false;
if (typeof web3 !== 'undefined' && useMetaMask) {
    console.log("MetaMask");
    provider = new Web3(web3.currentProvider);
} else {
    provider = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var simulation = false;

var changes_since_gui_update = 0;

var mintabletokenContract, treasuryContract, departmentContract;

var BKK, CDKK, treasury, department;
var address;

var departmentAddress = "0xcbddd08901fcf676bbba3a1d697bce16d66533dc"; // "0x1f1f3066bf200d9a1b5733d0487a6399326607f2";
var simpleDepartmentCreatorAddress = "0xd92380b56f2cdd5804b53faa098495b598cc51bd";

var departmentMappingAddressToString = {};
var departmentMappingStringToAddress = {};
var transfersTo = {};
var transfersDate = {};
var datesTransferred = [];

var economy = new Object();

var slider;

var companyData, companyChart, companyChartOptions;
var departmentData, departmentChart, departmentChartOptions;

$(document).ready(function () {
    var tempAddress = getAllUrlParams().address;
    if (tempAddress !== undefined) {
        departmentAddress = tempAddress;
    }
    $('ul.tabs').tabs({onShow: redrawChart});
    $('.modal').modal();

    setupSlider();
    setupDatePicker();
    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(googlePackagesLoaded);

    mintabletokenContract = provider.eth.contract(mintableTokenAbi);
    treasuryContract = provider.eth.contract(treasuryAbi);
    departmentContract = provider.eth.contract(departmentAbi);
    BKK = mintabletokenContract.at("0xd61d3a146f48e6c974e247f6cf5c44c5273c841b");
    CDKK = mintabletokenContract.at("0xf6af1efb72a32bfdfba6c7658b2e6b2903774494");
    treasury = treasuryContract.at("0x70b765c9af16d4baca664629a92c5d0804ccf8ee");
    department = departmentContract.at(departmentAddress);

    address = provider.eth.accounts[0];
    if (!useMetaMask) {
        provider.personal.unlockAccount(address, "SomePass", 0);
    }

    window.onresize = redrawChart;
    updateAll();

    if (simulation) {
        /*        generateBudget(new Date(2018, 0, 1), new Date(2018, 0, 365), 500, 400, "0xb731345673a17f91bf6b3b792390359db07aec15");
                console.log("First Budget");
                generateSpending(new Date(2018, 0, 1), new Date(2018, 0, 365), 400, 500, "0xb731345673a17f91bf6b3b792390359db07aec15");
                console.log("First Spend");
                generateBudget(new Date(2018, 0, 1), new Date(2018, 0, 365), 500, 400, "0x1d1c2362b47d2b04b6520468157c8427bd956068");
                console.log("Second Budget");
                generateSpending(new Date(2018, 0, 1), new Date(2018, 0, 365), 400, 500, "0x1d1c2362b47d2b04b6520468157c8427bd956068");
                console.log("Second spend");*/
        generateBudget(new Date(2018, 0, 1), new Date(2018, 0, 365), 250, 200, "0x827b1c94ada7597e8f6b8fabeb3d89182314857c");
        generateSpending(new Date(2018, 0, 1), new Date(2018, 0, 365), 200, 250, "0x827b1c94ada7597e8f6b8fabeb3d89182314857c");
    }
});

function setupDatePicker() {
    $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 5, // Creates a dropdown of 15 years to control year,
        today: 'Today',
        close: 'Ok',
        closeOnSelect: false // Close upon selecting a date,
    });
}

function setupSlider() {
    var beginMoment = moment("2018-01-01");
    var endMoment = moment((new Date(Date.now()).getFullYear() + 1) + "-01-01");
    slider = $("#dates_slider").ionRangeSlider({
        hide_min_max: false,
        keyboard: true,
        min: +moment(beginMoment).format("X"),
        max: +moment(endMoment).format("X"),
        from: +moment(beginMoment).format("X"),
        to: +moment(endMoment).format("X"),
        type: 'double',
        grid: true,
        prettify: function (num) {
            return moment(num, "X").format("MMM Do YYYY");
        },
        onFinish: function (data) {
            precisionChange();
            updateBudgetSpendingTable();
        }
    });
}

function updateAll() {
    updateMyUser();
    updateCompany();
}

function updateCompany() {
    $("#companyContainer").empty();
    $("#employees_div").empty();

    var name;
    department.name(function (error, result) {
        name = result;
        document.getElementById("nameOfCompany").innerHTML = name;
    });

    department.getEmployeeCount(function (error, result) {
        var p = document.createElement("p");
        for (var i = 0; i < result; i++) {
            department.employeeList(i, function (error, data) {
                if (data !== "0x0000000000000000000000000000000000000000") {
                    p.innerText += data + "\n";
                }
            })
        }
        document.getElementById("employees_div").appendChild(p);
    });

    department.getChildDepartmentCount(function (error, howMany) {
        $("#child_department_div").empty();

        for (var i = 0; i < howMany; i++) {
            department.childDepartmentList(i, function (error, data) {
                if (data !== "0x0000000000000000000000000000000000000000") {
                    var a = document.createElement("a");
                    a.href = "./index.html?address=" + data;
                    a.innerText = data;
                    document.getElementById("child_department_div").appendChild(a);
                    var br = document.createElement("br");
                    document.getElementById("child_department_div").appendChild(br);
                }
            });
        }
    });

    BKK.balanceOf(departmentAddress, function (error, result) {
        var balanceDiv = document.createElement("div");
        balanceDiv.innerHTML = "BKK balance: " + getValueInCoins(result, BKK) + "\n";
        document.getElementById("companyContainer").appendChild(balanceDiv);
    });

    department.getLiquidity(function (error, result) {
        var balanceDivSubTree = document.createElement("div");
        balanceDivSubTree.innerHTML = "BKK balance, subtree: " + getValueInCoins(result, BKK) + "\n";
        document.getElementById("companyContainer").appendChild(balanceDivSubTree);
    });

}

function updateMyUser() {
    provider.eth.getAccounts(function (err, accounts) {
        address = accounts[0];
        updateActionsAvailable(address);
        provider.eth.getBalance(accounts[0], function (err, _balance) {
            document.getElementById("myAddress").innerHTML = address;
            var balance = provider.fromWei(_balance, 'ether');
            document.getElementById("myBalance").innerHTML = balance;
        });
        BKK.balanceOf(address, function (error, result) {
            document.getElementById("myBalanceBKK").innerHTML = getValueInCoins(result, BKK);
        });
        CDKK.balanceOf(address, function (error, result) {
            document.getElementById("myBalanceCDKK").innerHTML = getValueInCoins(result, CDKK);
        });
    });
}

function updateActionsAvailable(_userAddress) {
    $("#supervisor_and_so_div").hide();
    $("#employee_div").hide();
    $("#actions_div").hide();
    if (_userAddress === department.owner() || _userAddress === department.departmentSupervisor()) {
        $("#actions_div").show();
        $("#supervisor_and_so_div").show();
    }
    if (department.employeeMapping(_userAddress)) {
        $("#actions_div").show();
        $("#employee_div").show();
    }
}

// Some utils
function getValueInCoins(amount, coin) {
    return (amount / Math.pow(10, 2));
}

function googlePackagesLoaded() {
    initDepartmentChart();
    initCompanyChart();

    buildCompanyObject(economy, departmentAddress);
    console.log(economy);

    updateDepartmentMapping(department.address);
    updateBudgetSpendingTable();

    precisionChange();

    setInterval(function () {
            if (changes_since_gui_update > 0) {
                changes_since_gui_update = 0;
                updateBudgetSpendingTable();
                precisionChange();
            }
        }

        ,
        2000
    )
    ;

    setupData();
}

function setupData() {
    setupListenerTransferSubtree(department.address);
    setupListenerBudget(department.address);
}

function updateDepartmentMapping(_contractAddress) {
    var tempDepartment = departmentContract.at(_contractAddress);
    var departmentName = tempDepartment.name();
    departmentMappingAddressToString[_contractAddress] = departmentName;
    departmentMappingStringToAddress[departmentName] = _contractAddress;
    for (var i = 0; i < tempDepartment.getChildDepartmentCount(); i++) {
        var childAddress = tempDepartment.childDepartmentList(i);
        updateDepartmentMapping(childAddress);
    }
}

function updateBudgetSpendingTable() {
    $('#table_ul').empty();
    buildingBudgetSpendingTable(economy, document.getElementById("table_ul"));
    $('.collapsible').collapsible();
}

// Returning the budget inclusive start date, exclusive end date
function getBudgetOutOfDepartment(_start, _end, _subtree) {
    if (_subtree === undefined) {
        _subtree = economy;
    }
    var value = 0;
    var startDay = getTimeFromValue(_start.getTime());
    var endDay = getTimeFromValue(_end.getTime());

    for (var i = 0; i < _subtree.budget.length; i++) {
        var tempAddress = _subtree.budget[i];
        for (var j = 0; j < _subtree.budgetMapping[tempAddress].dates.length; j++) {
            var date = _subtree.budgetMapping[tempAddress].dates[j];
            if (startDay <= date && date < endDay) {
                value += parseInt(_subtree.budgetMapping[tempAddress].amounts[date]) / 100;
            } else {
                // Sort dates when creating the object, then we can break when we miss.
            }
        }
    }
    return value;
}

function getSpendingOutOfDepartment(_start, _end, _subtree) {
    if (_start === undefined || _end === undefined) {
        return 0;
    }
    if (_subtree === undefined) {
        _subtree = economy;
    }

    var value = 0;
    var startDay = getTimeFromValue(_start.getTime());
    var endDay = getTimeFromValue(_end.getTime());

    for (var i = 0; i < datesTransferred.length; i++) {
        var tempDay = datesTransferred[i];
        if (startDay <= tempDay && tempDay < endDay) {
            for (var j = 0; j < transfersDate[tempDay].length; j++) {
                if (transfersDate[tempDay][j].contract === _subtree.id) {
                    value += parseInt(transfersDate[tempDay][j].amount) / 100;
                }
            }
        }
    }
    return value;
}

function getBudgetOutOfCompany(_start, _end, _subtree) {
    if (_subtree === undefined) {
        _subtree = economy;
    }

    var value = 0;
    var startDay = getTimeFromValue(_start.getTime());
    var endDay = getTimeFromValue(_end.getTime());

    for (var i = 0; i < _subtree.budget.length; i++) {
        var tempAddress = _subtree.budget[i];
        var isChild = false;
        for (var j = 0; j < _subtree.childrens.length; j++) {
            if (_subtree.childrens[j].id === tempAddress) {
                isChild = true;
                break;
            }
        }
        if (isChild) {
            continue;
        }

        for (var j = 0; j < _subtree.budgetMapping[tempAddress].dates.length; j++) {
            var date = _subtree.budgetMapping[tempAddress].dates[j];
            if (startDay <= date && date < endDay) {
                value += parseInt(_subtree.budgetMapping[tempAddress].amounts[date]) / 100;
            } else {
                // Sort dates when creating the object, then we can break when we miss.
            }
        }
    }

    for (var i = 0; i < _subtree.childrens.length; i++) {
        value += getBudgetOutOfCompany(_start, _end, _subtree.childrens[i]);
    }

    return value;
}

function getSpendingOutOfCompany(_start, _end, _subtree) {
    if (_subtree === undefined) {
        _subtree = economy;
    }

    var value = 0;
    var startDay = getTimeFromValue(_start.getTime());
    var endDay = getTimeFromValue(_end.getTime());

    for (var i = 0; i < _subtree.spending.length; i++) {
        var tempAddress = _subtree.spending[i];
        var isChild = false;
        for (var j = 0; j < _subtree.childrens.length; j++) {
            if (_subtree.childrens[j].id === tempAddress) {
                isChild = true;
                break;
            }
        }
        if (isChild) {
            continue;
        }
        for (var j = 0; j < transfersTo[tempAddress].length; j++) {
            if (transfersTo[tempAddress][j].contract === _subtree.id) {
                var date = getTimeFromEventValue(transfersTo[tempAddress][j].timestamp);
                if (startDay <= date && date < endDay) {
                    value += parseInt(transfersTo[tempAddress][j].amount) / 100;
                }
            }
        }
    }

    for (var i = 0; i < _subtree.childrens.length; i++) {
        value += getSpendingOutOfCompany(_start, _end, _subtree.childrens[i]);
    }

    return value;
}

function transferToCompanyObject(_contractAddress, _to, _amount, _subRoot) {
    if (_subRoot.id === _contractAddress) {
        if (_subRoot.spendingMapping[_to] !== undefined) {
            _subRoot.spendingMapping[_to] = _subRoot.spendingMapping[_to] + parseFloat(_amount);
        } else {
            _subRoot.spending.push(_to);
            _subRoot.spendingMapping[_to] = parseFloat(_amount);
        }
    } else {
        for (var i = 0; i < _subRoot.childrens.length; i++) {
            transferToCompanyObject(_contractAddress, _to, _amount, _subRoot.childrens[i]);
        }
    }
}

function buildCompanyObject(_subRoot, _contractAddress) {
    _subRoot.id = _contractAddress;
    _subRoot.childrens = [];
    _subRoot.budget = [];
    _subRoot.spending = [];
    _subRoot.spendingMapping = {};
    _subRoot.budgetMapping = {};
    try {
        var subRootDepartment = departmentContract.at(_contractAddress);
        departmentMappingAddressToString[_contractAddress] = subRootDepartment.name();
        departmentMappingStringToAddress[subRootDepartment.name()] = _contractAddress;
        for (var i = 0; i < subRootDepartment.getBudgetCount(); i++) {
            var tempAddress = subRootDepartment.budgetList(i);
            _subRoot.budget.push(tempAddress);
            _subRoot.budgetMapping[tempAddress] = new Object();
            _subRoot.budgetMapping[tempAddress].dates = [];
            _subRoot.budgetMapping[tempAddress].amounts = {};

            for (var j = 0; j < subRootDepartment.getBudgetElementDatesLength(tempAddress); j++) {
                var date = subRootDepartment.getBudgetElementDate(tempAddress, j);
                _subRoot.budgetMapping[tempAddress].dates.push(date);
                _subRoot.budgetMapping[tempAddress].amounts[date] = subRootDepartment.getBudgetElementDateValue(tempAddress, date);
            }
        }
        for (var i = 0; i < subRootDepartment.getChildDepartmentCount(); i++) {
            var tempAddress = subRootDepartment.childDepartmentList(i);
            var nextSubRoot = new Object();
            _subRoot.childrens.push(nextSubRoot);
            buildCompanyObject(nextSubRoot, tempAddress);
        }
    } catch (error) {
        console.log(error);
    }
}

function getSpendingBetween(_parentAddress, _childAddress, _fromTime, _toTime) {
    if (transfersTo[_childAddress] === undefined) {
        return 0;
    }

    var value = 0;
    for (var i = 0; i < transfersTo[_childAddress].length; i++) {
        if (transfersTo[_childAddress][i].contract === _parentAddress) {
            if (_fromTime <= transfersTo[_childAddress][i].timestamp && transfersTo[_childAddress][i].timestamp < _toTime) {
                value += parseFloat(transfersTo[_childAddress][i].amount)
            }
        }
    }

    return value;
}

function getStringForHeader(_departmentAddress, _budget, _spending, _parentAddress) {
    var output = _departmentAddress;
    if (departmentMappingAddressToString[_departmentAddress] !== undefined) {
        output = departmentMappingAddressToString[_departmentAddress];
    }
    var valueSplit = slider[0].value.split(";");
    var fromTime = getTimeFromValue(valueSplit[0] * 1000);
    var toTime = getTimeFromValue(valueSplit[1] * 1000);

    var budgetAmount = 0;

    if (_budget === undefined) {
        output += "&nbsp;" + "<strong> budget </strong>: none";
    } else {
        for (var i = 0; i < _budget.dates.length; i++) {
            if (fromTime <= _budget.dates[i] && _budget.dates[i] < toTime) {
                budgetAmount += parseFloat(_budget.amounts[_budget.dates[i]]);
            }
        }
        output += "&nbsp; " + "<strong> budget </strong>: " + getValueInCoins(budgetAmount, BKK);
    }

    var spendingAmount = getSpendingBetween(_parentAddress, _departmentAddress, valueSplit[0], valueSplit[1]);
    if (_spending === undefined) {
        output += "&nbsp;" + "<strong> spending </strong>: none ";
    } else {
        output += "&nbsp;" + "<strong> spending </strong>: " + getValueInCoins(spendingAmount, BKK);
    }

    if (spendingAmount > budgetAmount) {
        output += '<i class="material-icons red-text">sentiment_very_dissatisfied</i>';
    } else {
        output += '<i class="material-icons green-text">sentiment_very_satisfied</i>';
    }

    output += "<i class='material-icons' onclick='showTransactionsInModal(\"" + _departmentAddress + "\",\"" + _parentAddress + "\");'>list</i>";

    return output;
}

function buildingBudgetSpendingTable(_subRoot, _div) {
    var tempUsed = {};
    if (_subRoot.childrens.length <= 0) {
        if (_subRoot.budget.length + _subRoot.spending.length <= 0) {
            return;
        }
        var ul = document.createElement("ul");
        ul.className = "collapsible";
        ul.setAttribute("data-collapsible", "expandable");

        for (var i = 0; i < _subRoot.budget.length; i++) {
            var li = document.createElement("li");
            var header = document.createElement("div");
            header.className = "collapsible-header";

            li.appendChild(header);

            header.innerHTML = getStringForHeader(_subRoot.budget[i], _subRoot.budgetMapping[_subRoot.budget[i]], _subRoot.spendingMapping[_subRoot.budget[i]], _subRoot.id);

            tempUsed[_subRoot.budget[i]] = true;
            ul.appendChild(li);
        }

        for (var i = 0; i < _subRoot.spending.length; i++) {
            if (tempUsed[_subRoot.spending[i]]) {
                continue;
            }
            var li = document.createElement("li");
            var header = document.createElement("div");
            header.className = "collapsible-header";
            header.innerHTML = getStringForHeader(_subRoot.spending[i], _subRoot.budgetMapping[_subRoot.spending[i]], _subRoot.spendingMapping[_subRoot.spending[i]], _subRoot.id);

            ul.appendChild(li);
        }
        _div.appendChild(ul);
    } else {
        var ul = document.createElement("ul");
        ul.className = "collapsible";
        ul.setAttribute("data-collapsible", "expandable");

        for (var i = 0; i < _subRoot.childrens.length; i++) {
            var nextSubRoot = _subRoot.childrens[i];
            tempUsed[_subRoot.childrens[i].id] = true;

            var li = document.createElement("li");
            var header = document.createElement("div");
            header.className = "collapsible-header";
            header.innerHTML = getStringForHeader(_subRoot.childrens[i].id, _subRoot.budgetMapping[_subRoot.childrens[i].id], _subRoot.spendingMapping[_subRoot.childrens[i].id], _subRoot.id);

            if (_subRoot.childrens[i].spending.length + _subRoot.childrens[i].budget.length > 0) {
                var bullet = document.createElement("i");
                bullet.className = "material-icons";
                bullet.innerHTML = "keyboard_arrow_down";
                header.appendChild(bullet);
            }

            var body = document.createElement("div");
            body.className = "collapsible-body";

            buildingBudgetSpendingTable(nextSubRoot, body);
            li.appendChild(header);
            if (body.innerHTML.length > 0) {
                li.appendChild(body);
            }
            ul.appendChild(li);
        }

        for (var i = 0; i < _subRoot.budget.length; i++) {
            if (tempUsed[_subRoot.budget[i]]) {
                continue;
            } else {
                tempUsed[_subRoot.budget[i]] = true;
            }
            var li = document.createElement("li");
            var header = document.createElement("div");
            header.className = "collapsible-header";
            header.innerHTML = getStringForHeader(_subRoot.budget[i], _subRoot.budgetMapping[_subRoot.budget[i]], _subRoot.spendingMapping[_subRoot.budget[i]], _subRoot.id);

            li.appendChild(header);
            ul.appendChild(li);
        }

        for (var i = 0; i < _subRoot.spending.length; i++) {
            if (tempUsed[_subRoot.spending[i]]) {
                continue;
            } else {
                tempUsed[_subRoot.spending[i]] = true;
            }
            var li = document.createElement("li");
            var header = document.createElement("div");
            header.className = "collapsible-header";
            header.innerHTML = getStringForHeader(_subRoot.spending[i], _subRoot.budgetMapping[_subRoot.spending[i]], _subRoot.spendingMapping[_subRoot.spending[i]], _subRoot.id);

            li.appendChild(header);
            ul.appendChild(li);
        }

        _div.appendChild(ul);
    }
}

function setupListenerTransferSubtree(_contractAddress) {
    setupListenerTransfer(_contractAddress);
    var tempDepartment = departmentContract.at(_contractAddress);

    tempDepartment.getChildDepartmentCount(function (error, howMany) {
        for (var i = 0; i < howMany; i++) {
            tempDepartment.childDepartmentList(i, function (error, childAddress) {
                setupListenerTransferSubtree(childAddress);
            });
        }
    });
}

function setupListenerTransfer(_contractAddress) {

    var events_transferOut = departmentContract.at(_contractAddress).TransferFundsOut({}, {fromBlock: 0});
    events_transferOut.get(function (error, events) {
        if (error) return;
        for (var event in events) {
            event_spend(event, true, false);
        }
        //updateBudgetSpendingTable();
        //redrawChart();
    });
    events_transferOut.watch(function (error, event) {
        if (error) return;
        event_spend(event, false, false);
    });

    var events_transferAround = departmentContract.at(_contractAddress).TransferFundsIntern({}, {fromBlock: 0});
    events_transferAround.get(function (error, events) {
        if (error) return;
        for (var event in events) {
            event_spend(event, true, true);
        }
        //updateBudgetSpendingTable();
        //redrawChart();
    });
    events_transferAround.watch(function (error, event) {
        if (error) return;
        event_spend(event, false, true);
    });
}

function event_spend(event, old, intern) {
    if (event.args === undefined) return;
    changes_since_gui_update++;

    if (old) {
        subfunction(event.args._from, event.args._to.c[0], event.args._amount, event.args._timeStamp, intern, event.address, old);
    } else {
        subfunction(event.args._from, event.args._to, event.args._amount, event.args._timeStamp, intern, event.address, old);
    }

    function subfunction(_from, _to, _amount, _timeStamp, _isIntern, _contractAddress, _old) {
        addTransactionToTransactions(_contractAddress, _from, _to, _amount, _timeStamp, intern);
        transferToCompanyObject(_contractAddress, _to, _amount, economy);
        if (!_old) {
            //updateBudgetSpendingTable();
            //redrawChart();
        }
    }
}

function setupListenerBudget(_contractAddress) {
    var events_budget = departmentContract.at(_contractAddress).BudgetChange({}, {fromBlock: 0});
    events_budget.watch(function (error, event) {
        if (!error) {
//            updateBudgetSpendingTable();
        }
    });
}

function addTransactionToTransactions(_contractAddress, _from, _to, _amount, _timestamp, intern) {
    var time = getTimeFromValue(_timestamp.c[0] * 1000);
    if (transfersTo[_to] === undefined) {
        transfersTo[_to] = [];
    }
    if (transfersDate[time] === undefined) {
        transfersDate[time] = [];
        datesTransferred.push(time);
    }

    var object = new Object();
    object.contract = _contractAddress;
    object.from = _from;
    object.to = _to;
    object.amount = _amount.c[0];
    object.timestamp = _timestamp.c[0];
    object.intern = intern;

    transfersTo[_to].push(object);
    transfersDate[time].push(object);
}

function showTransactionsInModal(_toAddress, _fromAddress) {
    var valueSplit = slider[0].value.split(";");
    $("#modal_transaction_content").empty();

    var header = document.createElement("p");
    header.className = "flow-text";
    header.innerHTML = "Transactions from " + _fromAddress + " to " + _toAddress;
    document.getElementById("modal_transaction_content").appendChild(header);

    var table = document.createElement("table");
    table.className = "centered responsive-table"
    table.id = "transaction_table";

    var thead = document.createElement("thead");
    var trh = document.createElement("tr");
    var thh1 = document.createElement("th");
    var thh2 = document.createElement("th");
    var thh3 = document.createElement("th");
    var thh4 = document.createElement("th");
    var tbody = document.createElement("tbody");

    thh1.innerText = "Employee";
    thh2.innerText = "Time";
    thh3.innerText = "Amount";
    thh4.innerText = "Coin";

    trh.appendChild(thh1);
    trh.appendChild(thh2);
    trh.appendChild(thh3);
    trh.appendChild(thh4);
    thead.appendChild(trh);
    table.append(thead);
    if (transfersTo[_toAddress] !== undefined) {
        for (var i = 0; i < transfersTo[_toAddress].length; i++) {
            if (_fromAddress !== undefined) {
                if (_fromAddress !== transfersTo[_toAddress][i].contract || transfersTo[_toAddress][i].timestamp >= valueSplit[1] || transfersTo[_toAddress][i].timestamp < valueSplit[0]) {
                    continue;
                }
            }
            var trow = document.createElement("tr");
            var tdFrom = document.createElement("td");
            var tdTime = document.createElement("td");
            var tdAmount = document.createElement("td");
            var tdCoin = document.createElement("td");

            tdFrom.innerText = transfersTo[_toAddress][i].from;
            tdTime.innerText = new Date(transfersTo[_toAddress][i].timestamp * 1000).toLocaleString();
            tdAmount.innerText = getValueInCoins(transfersTo[_toAddress][i].amount, BKK);
            tdCoin.innerText = transfersTo[_toAddress][i].intern ? "BKK" : "CDKK";

            trow.appendChild(tdFrom);
            trow.appendChild(tdTime);
            trow.appendChild(tdAmount);
            trow.appendChild(tdCoin);
            tbody.appendChild(trow);
        }
    }

    table.appendChild(tbody);
    document.getElementById("modal_transaction_content").appendChild(table);
    $('#modal_for_transactions').modal('open');
}

///////////
//Actions//
///////////

function transferBKKButton() {
    var to = document.getElementById("send_bkk_to").value;
    var amount = document.getElementById("amount_bkk_to_send").value;
    var amountInBKK = Math.floor(amount * 100);
    transferBKK(to, amountInBKK);
}

function transferCDKKButton() {
    var to = document.getElementById("send_cdkk_to").value;
    var amount = document.getElementById("amount_cdkk_to_send").value;
    var amountInCDKK = Math.floor(amount * 100);
    transferCDKK(to, amountInCDKK);
}

function changeBudgetButton() {
    var to = document.getElementById("address_to_budget").value;
    var amount = document.getElementById("amount_to_budget").value;
    var amountInToken = amount * Math.pow(10, 2);
    var date = new Date(document.getElementById("date_to_budget").value);
    changeBudget(to, date.getTime(), amountInToken);
}

function setSupervisorButton() {
    var newSupervisor = document.getElementById("new_supervisor").value;
    setSupervisor(newSupervisor);
}

function setSupervisorChildButton() {
    var childDepartment = document.getElementById("child_department_for_supervisor").value;
    var newSupervisor = document.getElementById("child_department_new_supervisor").value;
    setSupervisorChild(childDepartment, newSupervisor);
}

function setTreasuryAddressButton() {
    var treasuryAddress = document.getElementById("new_treasury_address").value;
    setTreasuryAddress(treasuryAddress);
}

function createChildDepartmentButton() {
    var creatorAddress = document.getElementById("department_creator").value;
    var childName = document.getElementById("child_department_name").value;
    createChildDepartment(creatorAddress, childName);
}

function addChildDepartmentButton() {
    var childAddress = document.getElementById("child_department_address_new").value;
    addChildDepartment(childAddress);
}

function removeChildDepartmentButton() {
    var childDepartment = document.getElementById("child_department_address_remove").value;
    removeChildDepartment(childDepartment);
}

function transferChildDepartmentOwnershipButton() {
    var childDepartment = document.getElementById("child_department_address_transfer").value;
    var newOwner = document.getElementById("child_department_new_owner").value;
    transferChildDepartmentOwnership(childDepartment, newOwner);
}

function addEmployeeButton() {
    var employee = document.getElementById("employee_address_add").value;
    addEmployee(employee);
}

function removeEmployeeButton() {
    var employee = document.getElementById("employee_address_remove").value;
    removeEmployee(employee);
}


// https://github.com/highcharts/highcharts/issues/7295
// https://stackoverflow.com/questions/33492736/show-text-on-google-chart-sankey-diagram