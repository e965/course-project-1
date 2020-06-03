'use strict';

import createTextTable from './vendors/text-table.js';

const qs = (selector, from = document) => from.querySelector(selector);
const ce = nodeName => document.createElement(nodeName);

const getNumValue = (form, key) => Number(form[key].value);

const getSelectOptions = node => {
    let values = [];

    for (let i = 0; i < node.length; i++) {
        values.push(Number(node[i].value));
    }

    return values;
};

const formatResultNum = (num, digit = 2) => Number(num.toFixed(digit));

const mainCalculation = ({ beta, u_k, phi_k, phi_2 }) => beta * u_k * (Math.cos(phi_k) * Math.cos(phi_2) + Math.sin(phi_k) * Math.sin(phi_2));

const printResult = (results = []) => {
    let resultsContainer = qs('#content .result');

    resultsContainer.innerText = '';

    if (results.length === 0) {
        return;
    }

    let table = ce('table');
    let textTable = [];

    let tableHeading = ce('tr');
    let textHeading = [];

    let data = {};

    let headings = ['#', 'β', 'U<sub>k2</sub>, %', 'cos φ<sub>2</sub>', 'cos φ<sub>k</sub>', 'ΔU, %'];
    headings.forEach(heading => {
        let headingCell = ce('th');
        headingCell.innerHTML = heading;
        tableHeading.appendChild(headingCell);

        textHeading.push(heading.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/g, ''));
    });

    table.appendChild(tableHeading);
    textTable.push(textHeading);

    results.forEach((result, i) => {
        let tableRow = ce('tr');
        let textRow = [];

        let numCell = ce('td');
        numCell.innerText = i + 1;
        tableRow.appendChild(numCell);
        textRow.push(numCell.innerText);

        let betaCell = ce('td');
        betaCell.innerText = formatResultNum(result.data.beta);
        tableRow.appendChild(betaCell);
        textRow.push(betaCell.innerText);

        let ukCell = ce('td');
        ukCell.innerText = formatResultNum(result.data.u_k);
        tableRow.appendChild(ukCell);
        textRow.push(ukCell.innerText);

        let phi2Result = formatResultNum(Math.cos(result.data.phi_2));

        let phi2Cell = ce('td');
        phi2Cell.innerText = phi2Result;
        tableRow.appendChild(phi2Cell);
        tableRow.dataset.phi2 = phi2Result;
        textRow.push(phi2Cell.innerText);

        if (!(phi2Result in data)) {
            data[phi2Result] = [];
        }

        let phikCell = ce('td');
        phikCell.innerText = formatResultNum(Math.cos(result.data.phi_k));
        tableRow.appendChild(phikCell);
        textRow.push(phikCell.innerText);

        let duResult = formatResultNum(result.result);

        let duCell = ce('td');
        duCell.innerText = duResult;
        tableRow.appendChild(duCell);
        tableRow.dataset.result = duResult;
        textRow.push(duCell.innerText);

        data[phi2Result].push(duResult);

        table.appendChild(tableRow);
        textTable.push(textRow);
    });

    let dataKeys = Object.keys(data);

    if (results.length > 1) {
        dataKeys.forEach(phi_2 => {
            let maxResult = Math.max(...data[phi_2]);

            qs(`tr[data-phi2="${phi_2}"][data-result="${maxResult}"]`, table).dataset.max = '';

            textTable.forEach(row => {
                if (row[3] == phi_2 && row[5] == maxResult) {
                    row[5] += ' [max]';
                }
            });
        });
    }

    let downloadLinkBox = ce('div');
    downloadLinkBox.classList.add('result__download');

    let downloadLink = ce('a');

    downloadLink.setAttribute('href', 'data:text/plain;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(createTextTable(textTable)))));
    downloadLink.setAttribute('download', 'result.txt');

    downloadLink.innerText = 'Сохранить результаты';

    downloadLinkBox.appendChild(downloadLink);

    resultsContainer.appendChild(table);
    resultsContainer.appendChild(downloadLinkBox);

    resultsContainer.scrollIntoView({ behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', () => {
    let mainForm = qs('#content form');

    mainForm.addEventListener('submit', e => {
        e.preventDefault();

        let form = e.target;

        let data = {
            beta: getNumValue(form, 'beta'),
            u_k: getNumValue(form, 'u_k'),
            phi_k: Math.acos(getNumValue(form, 'phi_k')),
            phi_2: Math.acos(getNumValue(form, 'phi_2')),
        };

        let results = [];

        if (getNumValue(form, 'phi_2') === 1) {
            let valuesPhi2 = getSelectOptions(form['phi_2']);
            let valuesBeta = getSelectOptions(form['beta']);

            valuesPhi2.forEach(phi_2 => {
                valuesBeta.forEach(beta => {
                    let newData = { ...data, beta: beta, phi_2: Math.acos(phi_2) };

                    results.push({ result: mainCalculation(newData), data: newData });
                });
            });
        } else {
            results.push({ result: mainCalculation(data), data: data });
        }

        printResult(results);
    });
});
