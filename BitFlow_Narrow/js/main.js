// Burde muligvis være med, men vi vil gerne være sikre på at metamask ikke fucker

var useMetaMask = false;
if (typeof web3 !== 'undefined' && useMetaMask) {
    console.log("MetaMask");
    provider = new Web3(web3.currentProvider);
} else {
    provider = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var mintabletokenContract, treasuryContract, departmentContract;

var BKK, CDKK, treasury, department;
var address;

var departmentAddress = "0x7ec1548be550fc10232dfa7082ced95225c68586";
var simpleDepartmentCreatorAddress = "0xff2d7dc1576d4ce1613d1b2a69b2f3bc9c74a29a";

var departmentMappingAddressToString = {};
var departmentMappingStringToAddress = {};
var transfersFrom = {};
var transfersTo = {};
var budget = {};

var lineDataSpending, lineDataSpendingAccumulative, lineChartSpending;
var lineDataSpendingDepartment, lineDataSpendingDepartmentAccumulative, lineChartSpendingDepartment;
var sankeyDataBudget, sankeyChartBudget;
var sankeyDataSpending, sankeyChartSpending;
var sankeyDataSpendingDepartment, sankeyChartSpendingDepartment;

var lineOptions = {
    colors: ['#097138', '#a52714'],
    animation: {
        duration: 600
    }
};
var sankeyOptions = {
    height: 300,
    tooltip: {
        trigger: 'none'
    },
    sankey: {
        iterations: 0,
        node: {
            colorMode: 'unique',
            label: {
                fontName: 'Times-Roman',
                fontSize: 14,
                bold: true
            }
        },
        link: {
            interactivity: true,
            colorMode: 'target'
        }
    }
};

$(document).ready(function () {
    google.charts.load('current', {packages: ['corechart', 'sankey']});
    google.charts.setOnLoadCallback(drawCharts);

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

    updateAll();
});

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
        console.log(result);
        var p = document.createElement("p");
        for (var i = 0; i < result; i++) {
            department.employeeList(i, function (error, data) {
                if (data !== "0x0000000000000000000000000000000000000000") {
                    p.innerText += data + " \n";
                }
            })
        }
        document.getElementById("employees_div").appendChild(p);
    });

    var node = document.createElement("div");
    node.innerHTML = "Top department\n";
    document.getElementById("companyContainer").appendChild(node);

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
        provider.eth.getBalance(accounts[0], function (err, balance) {
            document.getElementById("myAddress").innerHTML = address;
            var balance = provider.fromWei(balance, 'ether');
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

// Some utils
function getValueInCoins(amount, coin) {
    return (amount / Math.pow(10, 2));
}

function getDateFromTime(value) {
    return new Date(1000 * value).toLocaleString();
}

function drawCharts() {
    updateDepartmentMapping(department.address);
    drawSankeyChartBudget();
    updateBudget();
    drawLineChart();
    drawLineChartDepartment();
    drawSankeyChartSpending();
    drawSankeyChartSpendingDepartment();
    setupData();
}

function drawLineChart() {
    lineDataSpending = new google.visualization.DataTable();
    lineDataSpending.addColumn('datetime', 'Time');
    lineDataSpending.addColumn('number', 'Forbrug');
    lineDataSpending.addColumn('number', 'Budget');
    lineDataSpendingAccumulative = new google.visualization.DataTable();
    lineDataSpendingAccumulative.addColumn('datetime', 'Time');
    lineDataSpendingAccumulative.addColumn('number', 'Forbrug');
    lineDataSpendingAccumulative.addColumn('number', 'Budget');
    lineChartSpending = new google.visualization.LineChart(document.getElementById('line_chart_div'));
    lineChartSpending.draw(lineDataSpendingAccumulative, lineOptions);
}

function drawLineChartDepartment() {
    lineDataSpendingDepartment = new google.visualization.DataTable();
    lineDataSpendingDepartment.addColumn('datetime', 'Time');
    lineDataSpendingDepartment.addColumn('number', 'Forbrug');
    lineDataSpendingDepartment.addColumn('number', 'Budget');
    lineDataSpendingDepartmentAccumulative = new google.visualization.DataTable();
    lineDataSpendingDepartmentAccumulative.addColumn('datetime', 'Time');
    lineDataSpendingDepartmentAccumulative.addColumn('number', 'Forbrug');
    lineDataSpendingDepartmentAccumulative.addColumn('number', 'Budget');
    lineChartSpendingDepartment = new google.visualization.LineChart(document.getElementById('department_line_chart_div'));
    lineChartSpendingDepartment.draw(lineDataSpendingDepartmentAccumulative, lineOptions);
}

// Ineffektiv af helvede til, nu prøver vi bare lige at få noget vist ordentligt.
function addDatapointTransfer(date, value) {
    var tempDate = new Date(date * 1000);
    var tempValue = value;
    lineDataSpending.addRow([tempDate, value, budget["12"]]);
    lineDataSpending.sort([{column: 0}]);
    lineDataSpendingAccumulative.removeRows(0, lineDataSpendingAccumulative.getNumberOfRows());

    var index = -1;
    for (var i = 0; i < lineDataSpending.getNumberOfRows(); i++) {
        tempDate = lineDataSpending.getValue(i, 0);
        tempValue = lineDataSpending.getValue(i, 1);
        if (index === -1) {
            lineDataSpendingAccumulative.addRow([tempDate, tempValue, budget["12"]]);
            index++;
        } else if (tempDate.getHours() === lineDataSpendingAccumulative.getValue(index, 0).getHours()) {
            var temp2 = lineDataSpendingAccumulative.getValue(index, 1);
            lineDataSpendingAccumulative.addRow([tempDate, temp2 + tempValue, budget["12"]]);
            index++;
        } else {
            lineDataSpendingAccumulative.addRow([tempDate, tempValue, budget["12"]]);
            index++;
        }
    }
    lineChartSpending.draw(lineDataSpendingAccumulative, lineOptions);
}

// Ineffektiv af helvede til, nu prøver vi bare lige at få noget vist ordentligt.
function addDatapointTransferDepartment(date, value) {

    var tempDate = new Date(date * 1000);
    var tempValue = value;
    lineDataSpendingDepartment.addRow([tempDate, value, budget["12"]]);
    lineDataSpendingDepartment.sort([{column: 0}]);

    lineDataSpendingDepartmentAccumulative.removeRows(0, lineDataSpendingDepartmentAccumulative.getNumberOfRows());

    var index = -1;
    for (var i = 0; i < lineDataSpendingDepartment.getNumberOfRows(); i++) {
        tempDate = lineDataSpendingDepartment.getValue(i, 0);
        tempValue = lineDataSpendingDepartment.getValue(i, 1);
        if (index === -1) {
            lineDataSpendingDepartmentAccumulative.addRow([tempDate, tempValue, budget["12"]]);
            index++;
        } else if (tempDate.getHours() === lineDataSpendingDepartmentAccumulative.getValue(index, 0).getHours()) {
            var temp2 = lineDataSpendingDepartmentAccumulative.getValue(index, 1);
            lineDataSpendingDepartmentAccumulative.addRow([tempDate, temp2 + tempValue, budget["12"]]);
            index++;
        } else {
            lineDataSpendingDepartmentAccumulative.addRow([tempDate, tempValue, budget["12"]]);
            index++;
        }
    }
    lineChartSpendingDepartment.draw(lineDataSpendingDepartmentAccumulative, lineOptions);
}

/////////////
// SANKEYS //
/////////////

function drawSankeyChartSpending() {
    sankeyDataSpending = new google.visualization.DataTable();
    sankeyDataSpending.addColumn('string', 'From');
    sankeyDataSpending.addColumn('string', 'To');
    sankeyDataSpending.addColumn('number', 'Usage');
    sankeyChartSpending = new google.visualization.Sankey(document.getElementById('spending_sankey_chart_div'));

    function handler() {
        if (sankeyChartSpending.getSelection().length == 0) return;
        var row = sankeyChartSpending.getSelection()[0].row;
        var fromAddress = sankeyDataSpending.getValue(row, 0);
        if (transfersFrom[fromAddress] === undefined) {
            fromAddress = departmentMappingStringToAddress[fromAddress];
        }
        console.log(transfersFrom[fromAddress]);
    }

    google.visualization.events.addListener(sankeyChartSpending, 'select', handler);
    sankeyChartSpending.draw(sankeyDataSpending, sankeyOptions);
}

function drawSankeyChartSpendingDepartment() {
    sankeyDataSpendingDepartment = new google.visualization.DataTable();
    sankeyDataSpendingDepartment.addColumn('string', 'From');
    sankeyDataSpendingDepartment.addColumn('string', 'To');
    sankeyDataSpendingDepartment.addColumn('number', 'Usage');
    sankeyChartSpendingDepartment = new google.visualization.Sankey(document.getElementById('spending_department_sankey_chart_div'));

    function handler() {
        if (sankeyChartSpendingDepartment.getSelection().length == 0) return;
        var row = sankeyChartSpendingDepartment.getSelection()[0].row;
        var fromAddress = sankeyDataSpendingDepartment.getValue(row, 0);
        console.log(transfersFrom[fromAddress]);
    }

    google.visualization.events.addListener(sankeyChartSpendingDepartment, 'select', handler);
    sankeyChartSpendingDepartment.draw(sankeyDataSpendingDepartment, sankeyOptions);
}

function addDatapointSankeySpending(_from, _to, _value) {
    var howMany = sankeyDataSpending.getNumberOfRows();
    var found = false;
    /*
        if (departmentMappingAddressToString[_from] !== undefined) {
            _from = departmentMappingAddressToString[_from];
        }
        if (departmentMappingAddressToString[_to] !== undefined) {
            _to = departmentMappingAddressToString[_to];
        }
    */
    for (var i = 0; i < howMany; i++) {
        if (sankeyDataSpending.getValue(i, 0) === _from && sankeyDataSpending.getValue(i, 1) === _to) {
            var temp = sankeyDataSpending.getValue(i, 2);
            sankeyDataSpending.setValue(i, 2, temp + _value);
            found = true;
            break;
        }
    }

    if (!found) {
        sankeyDataSpending.addRow(["" + _from, "" + _to, _value]);
    }
    sankeyChartSpending.draw(sankeyDataSpending, sankeyOptions);
}

function addDatapointSankeySpendingDepartment(_from, _to, _value) {
    var howMany = sankeyDataSpendingDepartment.getNumberOfRows();
    var found = false;
    /*
        if (departmentMappingAddressToString[_from] !== undefined) {
            _from = departmentMappingAddressToString[_from];
        }
        if (departmentMappingAddressToString[_to] !== undefined) {
            _to = departmentMappingAddressToString[_to];
        }
    */
    for (var i = 0; i < howMany; i++) {
        if (sankeyDataSpendingDepartment.getValue(i, 0) === _from && sankeyDataSpendingDepartment.getValue(i, 1) === _to) {
            var temp = sankeyDataSpendingDepartment.getValue(i, 2);
            sankeyDataSpendingDepartment.setValue(i, 2, temp + _value);
            found = true;
            break;
        }
    }

    if (!found) {
        sankeyDataSpendingDepartment.addRow(["" + _from, "" + _to, _value]);
    }
    sankeyChartSpendingDepartment.draw(sankeyDataSpendingDepartment, sankeyOptions);
}

function setupData() {
    setupListenerTransferSubtree(department.address);
}

function updateDepartmentMapping(_contractAddress) {
    var tempDepartment = departmentContract.at(_contractAddress);
    tempDepartment.name(function (error, departmentName) {
        departmentMappingAddressToString[_contractAddress] = departmentName;
        departmentMappingStringToAddress[departmentName] = _contractAddress;
        tempDepartment.getChildDepartmentCount(function (error, howMany) {
            for (var i = 0; i < howMany; i++) {
                tempDepartment.childDepartmentList(i, function (error, childAddress) {
                    updateDepartmentMapping(childAddress);
                });
            }
        });
    });
}

function updateBudget() {
    budget["total"] = 0;
    buildBudgetSpendingTable(department.address, budget["total"], document.getElementById("table_ul"));
    budget["12"] = budget["total"] / 12;
    budget["4"] = budget["total"] / 4;
}

// Inefficient
function updateBudgetSpendingTable(_contractAddress) {
    if (document.getElementById(_contractAddress) == undefined || transfersFrom[_contractAddress] == undefined) {
        return;
    }
    var value = 0;

    for (var i = 0; i < transfersFrom[_contractAddress].length; i++) {
        value += transfersFrom[_contractAddress][i].amount;
    }
    value = getValueInCoins(value, BKK);

    var li = document.getElementById(_contractAddress);
    li.removeChild(li.childNodes[0]);
    li.prepend(document.createTextNode(departmentMappingAddressToString[_contractAddress] + " : " + budget[_contractAddress] + ", used: " + value));
}

function buildBudgetSpendingTable(_contractAddress, amount, div) {
    var tempDepartment = departmentContract.at(_contractAddress);
    budget[_contractAddress] = parseFloat(amount);

    tempDepartment.getBudgetCount(function (error, howMany) {
        if (howMany <= 0) {
            budget["total"] = budget["total"] + parseFloat(amount);
            var li = document.createElement("li");
            li.id = _contractAddress;
            li.innerText = departmentMappingAddressToString[_contractAddress] + " : " + parseFloat(amount);
            div.appendChild(li);
            updateBudgetSpendingTable(_contractAddress);
        } else {
            var ul = document.createElement("ul");

            if (_contractAddress !== departmentAddress) {
                var li = document.createElement("li");
                li.id = _contractAddress;
                if (departmentMappingAddressToString[_contractAddress] !== undefined) {
                    li.innerText = departmentMappingAddressToString[_contractAddress] + " : " + parseFloat(amount);
                } else {
                    li.innerText = _contractAddress + " : " + parseFloat(amount);
                }
                li.appendChild(ul);
            }


            for (var i = 0; i < howMany; i++) {
                tempDepartment.budgetList(i, function (error, result) {
                    var tempAddress = result;
                    tempDepartment.budgetMapping(tempAddress, function (error, budgetMappingValue) {
                        addDatapointSankeyBudget(_contractAddress, tempAddress, parseFloat(budgetMappingValue));
                        buildBudgetSpendingTable(tempAddress, parseFloat(budgetMappingValue), ul);
                    });
                });
            }
            if (_contractAddress !== departmentAddress) {
                div.appendChild(li);
                updateBudgetSpendingTable(_contractAddress);
            } else {
                div.appendChild(ul);
            }
        }
    });
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
    });
    events_transferAround.watch(function (error, event) {
        if (error) return;
        event_spend(event, false, true);
    });
}

function event_spend(event, old, intern) {
    if (event.args == undefined) return;

    if (old) {
        subfunction(event.args._from, event.args._to.c[0], event.args._amount, event.args._timeStamp, intern, event.address);
    } else {
        subfunction(event.args._from, event.args._to, event.args._amount, event.args._timeStamp, intern, event.address);
    }

    function subfunction(_from, _to, _amount, _timeStamp, _isIntern, _contractAddress) {
        var coinType = _isIntern ? BKK : CDKK;
        var value = getValueInCoins(_amount, coinType);
        addDatapointSankeySpending(_contractAddress, _to, value);
        if (_contractAddress === departmentAddress) {
            addDatapointSankeySpendingDepartment(_contractAddress, _to, value);
            addDatapointTransferDepartment(_timeStamp, value);
        }
        if (!_isIntern) {
            addDatapointTransfer(_timeStamp, value);
        }
        addTransactionToTransactions(_contractAddress, _from, _to, _amount, _timeStamp);
        updateBudgetSpendingTable(_contractAddress);
    }
}

function addTransactionToTransactions(_contractAddress, _from, _to, _amount, _timestamp) {
    if (transfersFrom[_contractAddress] === undefined) {
        transfersFrom[_contractAddress] = [];
    }

    if (transfersTo[_to] === undefined) {
        transfersTo[_to] = [];
    }

    var object = new Object();
    object.contract = _contractAddress;
    object.from = _from;
    object.to = _to;
    object.amount = _amount.c[0];
    object.timestamp = _timestamp.c[0];

    transfersFrom[_contractAddress].push(object);
    transfersTo[_to].push(object);
}

function drawSankeyChartBudget() {
    sankeyDataBudget = new google.visualization.DataTable();
    sankeyDataBudget.addColumn('string', 'From');
    sankeyDataBudget.addColumn('string', 'To');
    sankeyDataBudget.addColumn('number', 'Weight');

    sankeyChartBudget = new google.visualization.Sankey(document.getElementById('budget_sankey_chart_div'));
    sankeyChartBudget.draw(sankeyDataBudget, sankeyOptions);
}

function addDatapointSankeyBudget(_from, _to, _value) {
    /*
    if (departmentMappingAddressToString[_from] !== undefined) {
        _from = departmentMappingAddressToString[_from];
    }
    if (departmentMappingAddressToString[_to] !== undefined) {
        _to = departmentMappingAddressToString[_to];
    }*/

    var amount = sankeyDataBudget.getNumberOfRows();
    var found = false;
    for (var i = 0; i < amount; i++) {
        if (sankeyDataBudget.getValue(i, 0) == _from && sankeyDataBudget.getValue(i, 1) == _to) {
            sankeyDataBudget.setValue(i, 2, _value);
            found = true;
            break;
        }
    }
    if (!found) {
        sankeyDataBudget.addRow(["" + _from, "" + _to, _value]);
    }
    sankeyChartBudget.draw(sankeyDataBudget, sankeyOptions);
}

function transferBKKButton() {
    var to = document.getElementById("send_bkk_to").value;
    var amount = document.getElementById("amount_bkk_to_send").value;
    transferBKK(to, amount);
}

function transferCDKKButton() {
    var to = document.getElementById("send_cdkk_to").value;
    var amount = document.getElementById("amount_cdkk_to_send").value;
    transferCDKK(to, amount);
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