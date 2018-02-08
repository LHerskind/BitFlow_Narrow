function redrawChart() {
//    lineChartSpending.draw(lineDataSpendingAccumulative, lineOptions);
//    lineChartSpendingDepartment.draw(lineDataSpendingDepartmentAccumulative, lineOptions);
    if (companyChart !== undefined) {
        companyChart.draw(companyData, companyChartOptions);
    }
    if (departmentChart !== undefined) {
        departmentChart.draw(departmentData, departmentChartOptions);
    }
}

function precisionChange() {
    var value = $("input:radio[name='groupPrecision']:checked")[0].id;
    var valueSplit = slider[0].value.split(";");
    var from = new Date(parseInt(valueSplit[0]) * 1000);
    var to = new Date(parseInt(valueSplit[1]) * 1000);

    if (value === "years") {
        companyChartOptions.hAxis.title = "Years";
        departmentChartOptions.hAxis.title = "Years";
        drawCompanyChartYear(from, to);
        drawDepartmentChartYear(from, to);
    } else if (value === "months") {
        companyChartOptions.hAxis.title = "Months";
        departmentChartOptions.hAxis.title = "Months";
        drawCompanyChartMonth(from, to);
        drawDepartmentChartMonth(from, to);
    } else if (value === "weeks") {
        companyChartOptions.hAxis.title = "Weeks";
        departmentChartOptions.hAxis.title = "Weeks";
        drawCompanyChartWeek(from, to);
        drawDepartmentChartWeek(from, to);
    } else {
        companyChartOptions.hAxis.title = "Days";
        departmentChartOptions.hAxis.title = "Days";
        drawCompanyChartDay(from, to);
        drawDepartmentChartDay(from, to);
    }
}

function barLineChange() {
    var value = document.getElementById("bar_or_line_checkbox").checked;
    if (value) {
        companyChartOptions.seriesType = "lines";
        departmentChartOptions.seriesType = "lines";
    } else {
        companyChartOptions.seriesType = "bars";
        departmentChartOptions.seriesType = "bars";
    }
    redrawChart();
}

function initCompanyChart() {
    companyChartOptions = {
        animation: {
            duration: 600,
            easing: 'out'
        },
        height: 400,
        title: 'Budget and expenses for the department subtree',
        vAxis: {title: 'DKK'},
        hAxis: {
            title: 'Month',
            viewWindow: {}
        },
        curveType: 'function',
        seriesType: 'bars'
    };

    companyData = new google.visualization.DataTable();

    companyData.addColumn('date', 'Time');
    companyData.addColumn('number', 'Budget');
    companyData.addColumn('number', 'Expenses');

    companyChart = new google.visualization.ComboChart(document.getElementById('company_chart'));
    companyChart.draw(companyData, companyChartOptions);
}

function drawCompanyChartDay(_start, _end) {
    companyData.removeRows(0, companyData.getNumberOfRows());

    var daysBetween = getTimeFromValue(_end.getTime()) - getTimeFromValue(_start.getTime());

    var year = _start.getFullYear();
    var month = _start.getMonth();
    var day = _start.getDate();


    for (var i = 0; i < daysBetween + 1; i++) {
        companyData.addRow([new Date(year, month, day + i), getBudgetOutOfCompany(new Date(year, month, day + i), new Date(year, month, day + i + 1)), getSpendingOutOfCompany(new Date(year, month, day + i), new Date(year, month, day + i + 1))]);
    }
    _start.setDate(_start.getDate() - 1);
    _end.setDate(_end.getDate() + 1);

    companyChartOptions.hAxis.viewWindow.min = _start;
    companyChartOptions.hAxis.viewWindow.max = _end;
    companyChart.draw(companyData, companyChartOptions);
}

function drawCompanyChartWeek(_start, _end) {
    companyData.removeRows(0, companyData.getNumberOfRows());

    var daysBetween = getTimeFromValue(_end.getTime()) - getTimeFromValue(_start.getTime());

    var year = _start.getFullYear();
    var month = _start.getMonth();
    var day = _start.getDate();

    for (var i = 0; i < daysBetween + 1; i += 7) {
        companyData.addRow([new Date(year, month, day + i), getBudgetOutOfCompany(new Date(year, month, day + i), new Date(year, month, day + i + 7)), getSpendingOutOfCompany(new Date(year, month, day + i), new Date(year, month, day + i + 7))]);
    }
    _start.setDate(_start.getDate() - 7);
    _end.setDate(_end.getDate() + 7);

    companyChartOptions.hAxis.viewWindow.min = _start;
    companyChartOptions.hAxis.viewWindow.max = _end;
    companyChart.draw(companyData, companyChartOptions);
}

function drawCompanyChartMonth(_start, _end) {
    companyData.removeRows(0, companyData.getNumberOfRows());
    var year = _start.getFullYear();

    for (var i = _start.getMonth(); i < _start.getMonth() + getDifferenceInMonths(_start, _end) + 1; i++) {
        companyData.addRow([new Date(year, i), getBudgetOutOfCompany(new Date(year, i), new Date(year, i + 1)), getSpendingOutOfCompany(new Date(year, i), new Date(year, i + 1))]);
    }

    _start.setMonth(_start.getMonth() - 1);
    _end.setMonth(_end.getMonth() + 1);

    companyChartOptions.hAxis.viewWindow.min = _start;
    companyChartOptions.hAxis.viewWindow.max = _end;
    companyChart.draw(companyData, companyChartOptions);
}

function drawCompanyChartYear(_start, _end) {
    companyData.removeRows(0, companyData.getNumberOfRows());
    for (var i = _start.getFullYear(); i < _end.getFullYear() + 1; i++) {
        companyData.addRow([new Date(i, 0), getBudgetOutOfCompany(new Date(i, 0), new Date(i + 1, 0)), getSpendingOutOfCompany(new Date(i, 0), new Date(1 + i, 0))]);
    }
    _start.setFullYear(_start.getFullYear() - 1);
    _end.setFullYear(_end.getFullYear() + 1);
    companyChartOptions.hAxis.viewWindow.min = _start;
    companyChartOptions.hAxis.viewWindow.max = _end;
    companyChart.draw(companyData, companyChartOptions);
}

function initDepartmentChart() {
    departmentChartOptions = {
        animation: {
            duration: 600,
            easing: 'out'
        },
        height: 400,
        title: 'Budget and expenses for the department subtree',
        vAxis: {title: 'DKK'},
        hAxis: {
            title: 'Month',
            viewWindow: {}
        },
//        curveType: 'function',
        seriesType: 'bars'
    };

    departmentData = new google.visualization.DataTable();

    departmentData.addColumn('date', 'Time');
    departmentData.addColumn('number', 'Budget');
    departmentData.addColumn('number', 'Expenses');

    departmentChart = new google.visualization.ComboChart(document.getElementById('department_chart'));
    departmentChart.draw(departmentData, departmentChartOptions);
}


function drawDepartmentChartDay(_start, _end) {
    departmentData.removeRows(0, departmentData.getNumberOfRows());

    var daysBetween = getTimeFromValue(_end.getTime()) - getTimeFromValue(_start.getTime());

    var year = _start.getFullYear();
    var month = _start.getMonth();
    var day = _start.getDate();

    for (var i = 0; i < daysBetween + 1; i++) {
        departmentData.addRow([new Date(year, month, day + i), getBudgetOutOfDepartment(new Date(year, month, day + i), new Date(year, month, day + i + 1)), getSpendingOutOfDepartment(new Date(year, month, day + i), new Date(year, month, day + i + 1))]);
    }
    _start.setDate(_start.getDate() - 1);
    _end.setDate(_end.getDate() + 1);

    departmentChartOptions.hAxis.viewWindow.min = _start;
    departmentChartOptions.hAxis.viewWindow.max = _end;
    departmentChart.draw(departmentData, departmentChartOptions);
}

function drawDepartmentChartWeek(_start, _end) {
    departmentData.removeRows(0, departmentData.getNumberOfRows());

    var daysBetween = getTimeFromValue(_end.getTime()) - getTimeFromValue(_start.getTime());

    var year = _start.getFullYear();
    var month = _start.getMonth();
    var day = _start.getDate();

    for (var i = 0; i < daysBetween + 1; i += 7) {
        departmentData.addRow([new Date(year, month, day + i), getBudgetOutOfDepartment(new Date(year, month, day + i), new Date(year, month, day + i + 7)), getSpendingOutOfDepartment(new Date(year, month, day + i), new Date(year, month, day + i + 7))]);
    }
    _start.setDate(_start.getDate() - 7);
    _end.setDate(_end.getDate() + 7);

    departmentChartOptions.hAxis.viewWindow.min = _start;
    departmentChartOptions.hAxis.viewWindow.max = _end;
    departmentChart.draw(departmentData, departmentChartOptions);
}

function drawDepartmentChartMonth(_start, _end) {
    departmentData.removeRows(0, departmentData.getNumberOfRows());
    var year = _start.getFullYear();

    for (var i = _start.getMonth(); i < _start.getMonth() + getDifferenceInMonths(_start, _end) + 1; i++) {
        departmentData.addRow([new Date(year, i), getBudgetOutOfDepartment(new Date(year, i), new Date(year, i + 1)), getSpendingOutOfDepartment(new Date(year, i), new Date(year, i + 1))]);
    }

    _start.setMonth(_start.getMonth() - 1);
    _end.setMonth(_end.getMonth() + 1);

    departmentChartOptions.hAxis.viewWindow.min = _start;
    departmentChartOptions.hAxis.viewWindow.max = _end;
    departmentChart.draw(departmentData, departmentChartOptions);
}

function drawDepartmentChartYear(_start, _end) {
    departmentData.removeRows(0, departmentData.getNumberOfRows());
    for (var i = _start.getFullYear(); i < _end.getFullYear() + 1; i++) {
        departmentData.addRow([new Date(i, 0), getBudgetOutOfDepartment(new Date(i, 0), new Date(i + 1, 0)), getSpendingOutOfDepartment(new Date(i, 0), new Date(1 + i, 0))]);
    }
    _start.setFullYear(_start.getFullYear() - 1);
    _end.setFullYear(_end.getFullYear() + 1);
    departmentChartOptions.hAxis.viewWindow.min = _start;
    departmentChartOptions.hAxis.viewWindow.max = _end;
    departmentChart.draw(departmentData, departmentChartOptions);
}
