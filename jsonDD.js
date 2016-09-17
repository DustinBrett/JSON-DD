/*

  JSON Drop-Down Search Tool

  Author: Dustin Brett
  Date: July 2016

*/

// ############### Global variables ###############
var
  ddYear = document.querySelectorAll('select[data-type="year"]'),
  ddMake = document.querySelectorAll('select[data-type="make"]'),
  ddModel = document.querySelectorAll('select[data-type="model"]'),

  arrData = [], arrSubModels = [],
  makeById = [], makeByName = [],
  modelById = [], modelByName = [],

  popularMakes = ['Chevy', 'Dodge', 'Ford', 'GMC', 'Honda', 'Jeep', 'Nissan', 'Subaru', 'Toyota', 'Volkswagen'],

  imgArrow = 'arrow-yellow-right',
  imgCheckmark = 'checkmark-yellow',

  cssOutline = '4px solid #fdb813',

  navColor = 'swatchColorId',

  navYears = 'aryYears',
  navMakes = 'aryMakes',
  navModels = 'aryModels',

  jsonURL = '/assets/json/models.json'
;
// ################################################

// ############### Array Functions ###############
function arrAppend(modelEntry, SupplierId, startPos) {
  var
    currYear = modelEntry[startPos],
    endYear = (currYear + modelEntry[startPos + 1]),
    exceptionList = modelEntry[startPos + 2],

    ModelId = modelEntry[0],
    MakeId = modelEntry[1],
    ModelName = modelEntry[2]
  ;

  for (currYear; currYear <= endYear; currYear++) { // Add model to year array elements
    if ((exceptionList.length === 0) || (exceptionList.indexOf(currYear) < 0)) {
      if (typeof arrData[currYear] === 'undefined') { arrData[currYear] = []; } // Init
      if (typeof arrData[currYear][SupplierId] === 'undefined') { arrData[currYear][SupplierId] = []; } // Init
      if (typeof arrData[currYear][SupplierId][MakeId] === 'undefined') { arrData[currYear][SupplierId][MakeId] = []; } // Init

      arrData[currYear][SupplierId][MakeId][ModelId] = ModelName;
    }
  }
}

function checkElement(supplierElement, MakeId, ModelId) {
  var returnBool = false;

  if (ModelId !== 0) {
    if (typeof supplierElement[MakeId] === 'object') {
      if (typeof supplierElement[MakeId][ModelId] === 'string') { returnBool = true; }
      else if (typeof arrSubModels[ModelId] === 'object') {        
        for (var arrIndex = 0; arrIndex < arrSubModels[ModelId].length; arrIndex++) {
          if (typeof supplierElement[MakeId][arrSubModels[ModelId][arrIndex]] === 'string') { returnBool = true; }
        }
      }
    }
  } else if (MakeId !== 0) {
    if (typeof supplierElement[MakeId] === 'object') { returnBool = true; }
  } else { returnBool = true; }

  return returnBool;
}

function filterData(ddSelect, selectedYear, selectedMake) { // Find makes/models for drop-downs based on selection
  var
    returnArr = [],
    groupIndex = ddFindIndex(ddSelect)
  ;

  function addElements(supplierElement) {
    if (selectedMake) {
      if (typeof supplierElement[selectedMake] === 'object') {
        for (var ddIndex = 0; ddIndex < supplierElement[selectedMake].length; ddIndex++) {
          if ((typeof supplierElement[selectedMake][ddIndex] === 'string') && (returnArr.indexOf(modelById[ddIndex]) < 0)) { returnArr.push(modelById[ddIndex]); }
        };
      }
    } else {
      for (var ddIndex = 0; ddIndex < supplierElement.length; ddIndex++) {
        if ((typeof supplierElement[ddIndex] === 'object') && (returnArr.indexOf(makeById[ddIndex]) < 0)) { returnArr.push(makeById[ddIndex]); }
      };
    }
  }

  if (typeof ddYear[groupIndex].dataset.supplier === 'undefined') { // All Suppliers
    for (var ddIndex = 0; ddIndex < arrData[selectedYear].length; ddIndex++) { if (typeof arrData[selectedYear][ddIndex] === 'object') { addElements(arrData[selectedYear][ddIndex]); } };
  } else if (typeof arrData[selectedYear][ddYear[groupIndex].dataset.supplier] === 'object') { // Specific Supplier
    addElements(arrData[selectedYear][ddYear[groupIndex].dataset.supplier]);
  }

  return returnArr;
}
// ###############################################

// ############### Drop-down Functions ###############
function ddFindIndex(ddSelect) { // Find group index
  var returnInt = -1;

  switch (ddSelect.dataset.type) {
    case 'year': for (var ddIndex = 0; ddIndex < ddYear.length; ddIndex++) { if (ddYear[ddIndex] === ddSelect) { returnInt = ddIndex; } }; break;
    case 'make': for (var ddIndex = 0; ddIndex < ddMake.length; ddIndex++) { if (ddMake[ddIndex] === ddSelect) { returnInt = ddIndex; } }; break;
    case 'model': for (var ddIndex = 0; ddIndex < ddModel.length; ddIndex++) { if (ddModel[ddIndex] === ddSelect) { returnInt = ddIndex; } }; break;
  }

  return returnInt;
}

function ddLabel(ddSelect, ddText) { // Insert label to top of drop-down and display
    if ((typeof ddSelect.options[0] === 'undefined') || (ddSelect.options[0].text !== ddText)) {
        var newOption = document.createElement('option');

        newOption.text = ddText;
        newOption.disabled = true;

        ddSelect.insertBefore(newOption, ddSelect.firstChild);
        ddSelect.options[0].selected = true;
    }
}

var
  eYears = document.getElementById(navYears),
  eMakes = document.getElementById(navMakes),
  eModels = document.getElementById(navModels)
;

function ddShowCheck(eCurr, ePrev) { // Show next drop-down and checkmark previous one
    eCurr.style.display = 'inline';
    eCurr.children[0].className = imgArrow;

    ePrev.children[0].className = imgCheckmark;
}

function ddOutline(yearDD, makeDD, modelDD) { // Display outline on active drop-down
  ddYear[0].style.outline = (yearDD ? cssOutline : 'none');
  ddMake[0].style.outline = (makeDD ? cssOutline : 'none');
  ddModel[0].style.outline = (modelDD ? cssOutline : 'none');
}

function ddCSS() { // Refreshes visuals for main (first) drop-down
  if ((ddYear.length > 0) && (ddMake.length > 0) && (ddModel.length > 0)) {
    if (typeof ddYear[0].dataset.display === 'undefined') { // Index pages (Outline)
      if (ddYear[0].selectedIndex === 0) { ddOutline(true, false, false); }
      else if (ddMake[0].selectedIndex === 0) { ddOutline(false, true, false); }
      else if (ddModel[0].selectedIndex === 0) { ddOutline(false, false, true); }

    } else if (["All", "Make", "Model", "Product"].indexOf(ddYear[0].dataset.display) > -1) { // Make, Model & Product pages (Show & Check)
      var makeUndefined = (typeof ddMake[0].dataset.make === 'undefined');

      if ((ddYear[0].selectedIndex !== 0) && (ddMake[0].selectedIndex === 0) && makeUndefined) { ddShowCheck(eMakes, eYears); }
      else if (((typeof ddMake[0].selectedIndex === 'number') && (ddMake[0].length > 1)) && (ddModel[0].selectedIndex === 0)) {
        ddShowCheck(eModels, (makeUndefined ? eMakes : eYears));
      }
    }
  }
}

function ddPreSelect(ddSelect) { // Pre-select drop-down value if possible
  var optionLen = ddSelect.options.length;

  for (var ddIndex = 0; ddIndex < optionLen; ddIndex++) {
    if (ddSelect.options[ddIndex].text === ddSelect.dataset[ddSelect.dataset.type]) {
      ddSelect.value = ddSelect.options[ddIndex].value; // Change DD to data-[make/model/year]="#"
      ddChange({ target: ddSelect });
    }
  }
}

function ddPrepare(ddSelectArray, ddText) { // Prepare drop-downs for user interaction
  for (var ddIndex = 0; ddIndex < ddSelectArray.length; ddIndex++) {
    var ddSelect = ddSelectArray[ddIndex];

    if (typeof ddText === 'undefined') { // Label based on data-display=""
      if (typeof ddSelect.dataset.display === 'string') {
        switch (ddSelect.dataset.display) {
          case 'Make': ddLabel(ddSelect, 'Start Here: Select Your ' + ddMake[0].dataset.make + ' Year'); break;
          case 'Model': ddLabel(ddSelect, 'Start Here: Select Your ' + ddModel[0].dataset.model + ' Year'); break;
          case 'All': case 'Product': ddLabel(ddSelect, 'Start Here: Select Your Vehicle'); break;
          case 'Color': case 'Top': ddLabel(ddSelect, 'Select Year of Your Vehicle'); break;
        }
      } else { ddLabel(ddSelect, 'Year'); }
    } else { ddLabel(ddSelect, ddText); }

    if (typeof ddSelect.dataset[ddSelect.dataset.type] === 'string') { ddPreSelect(ddSelect); }

    ddSelect.addEventListener('change', ddChange); // Monitor drop-down
  };
}

function ddEmpty(ddSelect) { // Clear items from drop-down
  for (var ddIndex = (ddSelect.options.length - 1) ; ddIndex >= 0; ddIndex--) { // Options
    ddSelect.remove(ddIndex);
  }

  var optGroups = ddSelect.getElementsByTagName('optgroup');
  if (optGroups.length > 0) { // Optgroups
    for (ddIndex = (optGroups.length - 1) ; ddIndex >= 0; ddIndex--) {
      ddSelect.removeChild(optGroups[ddIndex]);
    }
  }
}

function ddAddOption(ddSelect, optionValue, optionText) { // Add option to drop-down
  var newOption = document.createElement('option');

  newOption.value = optionValue;
  newOption.text = ((typeof optionText === 'undefined') ? optionValue : optionText);

  ddSelect.add(newOption);
}

function ddPopular(ddSelect) { // Sort makes based on popularity list
  var
    ddEnd = ddSelect.options.length,

    groupPopular = document.createElement('optgroup'),
    groupOther = document.createElement('optgroup')
  ;

  for (var ddIndex = 0; ddIndex < ddEnd; ddIndex++) {
    if (popularMakes.indexOf(ddSelect.options[ddIndex].text) < 0) { groupOther.appendChild(ddSelect.options[ddIndex].cloneNode(true)); }
    else { groupPopular.appendChild(ddSelect.options[ddIndex].cloneNode(true)); }
  }

  if ((groupPopular.children.length > 0) && (groupOther.children.length > 0)) {
    ddEmpty(ddSelect);

    groupPopular.label = 'Most Popular Makes';
    groupOther.label = 'Other Makes';

    ddSelect.appendChild(groupPopular);
    ddSelect.appendChild(groupOther);
  }
}

function ddChange(e) { // Update drop-down group after a change
  var
    ddSelect = e.target,
    groupIndex = ddFindIndex(ddSelect)    
  ;
  
  switch (ddSelect.dataset.type) {

    case 'year': // Filter Make by Year
      var makeOptions = filterData(ddMake[groupIndex], ddSelect.value).sort();

      ddEmpty(ddMake[groupIndex]);
      for (var optionIndex = 0; optionIndex < makeOptions.length; optionIndex++) { ddAddOption(ddMake[groupIndex], makeById.indexOf(makeOptions[optionIndex]), makeOptions[optionIndex]); };

      if (typeof ddMake[groupIndex].dataset.make === 'undefined') {
        ddPopular(ddMake[groupIndex]);
        ddLabel(ddMake[groupIndex], 'Make');
        ddCSS();

        if (ddModel[groupIndex].length > 1) {
          ddEmpty(ddModel[groupIndex]);
          ddLabel(ddModel[groupIndex], 'Model');
        }
      } else { ddPreSelect(ddMake[groupIndex]); }
      break;

    case 'make': // Filter Model by Year & Make
      var modelOptions = filterData(ddModel[groupIndex], ddYear[groupIndex].value, ddSelect.value).sort();
      
      ddEmpty(ddModel[groupIndex]);

      for (var optionIndex = 0; optionIndex < modelOptions.length; optionIndex++) {
        var currModelId = modelByName[makeById[ddSelect.value]][modelOptions[optionIndex]]

        if ((typeof ddModel[groupIndex].dataset.model === 'undefined') || (ddModel[groupIndex].dataset.model === modelOptions[optionIndex])) {
          ddAddOption(ddModel[groupIndex], currModelId, modelOptions[optionIndex]);
        } else {
          var ModelId = modelByName[ddMake[groupIndex].dataset.make][ddModel[groupIndex].dataset.model];

          if ((typeof arrSubModels[ModelId] === 'object') && (arrSubModels[ModelId].indexOf(currModelId) > -1)) {
            ddAddOption(ddModel[groupIndex], currModelId, modelOptions[optionIndex]);
          }
        }
      };

      if ((typeof ddModel[groupIndex].dataset.model === 'undefined') || (ddModel[groupIndex].options.length > 1) || (ddModel[groupIndex].options.length === 1 && ddModel[groupIndex].options[0].text !== ddModel[groupIndex].dataset.model)) {
        ddLabel(ddModel[groupIndex], 'Model');
        ddCSS();
      } else { ddPreSelect(ddModel[groupIndex]); }
      break;

    case 'model': // URL redirect
      var
        Product = ddYear[groupIndex].dataset.product,
        ColorId = (((groupIndex > 0) && document.getElementById(navColor)) ? document.getElementById(navColor).value : 0),
        redirectURL = ''
      ;
      
      if (typeof Product === 'string') {
          if (isNaN(Product)) { redirectURL = '../' + Product.replace('Neo-Supreme', 'Neoprene').replace('Mesh', 'Super-Mesh') + '-Seat-Covers-for-' + ddYear[groupIndex].value + '-' + encodeURIComponent(ddMake[groupIndex].options[ddMake[groupIndex].selectedIndex].text + '-' + ddSelect.options[ddSelect.selectedIndex].text).replace(/%20/g, '-').replace(/%2F/g, '') + '.asp'; }
        else { redirectURL = '../Seat-Options/' + Product + '/' + ddSelect.value + '/' + ddYear[groupIndex].value + '/' + ((ColorId > 0) ? ColorId : '0'); }
      } else { redirectURL = '../Seat-Covers-for-' + ddYear[groupIndex].value + '-' + encodeURIComponent(ddMake[groupIndex].options[ddMake[groupIndex].selectedIndex].text + '-' + ddSelect.options[ddSelect.selectedIndex].text).replace(/%20/g, '-').replace(/%2F/g, ''); }

      if ((typeof ddYear[0].dataset.year === 'string') && (typeof ddMake[0].dataset.make === 'string') && (typeof ddModel[0].dataset.model === 'string') && document.getElementById('ModelSelectViewPrices')) {
        var btnViewPrices = document.getElementById('ModelSelectViewPrices');
        var btnChooseThis = document.getElementById('colorURL');

        btnViewPrices.href = btnViewPrices.href.replace('$MODEL$', ddModel[0][ddModel[0].selectedIndex].value);
        btnChooseThis.value = btnChooseThis.value.replace('$MODEL$', ddModel[0][ddModel[0].selectedIndex].value);
      } else { window.location.assign(redirectURL); }
      break;

  }
}
// ###################################################

// ############### Load JSON data ###############
function querySelection() {
  var queryString = window.location.search.substring(1).split(/=|&/);

  if (queryString.indexOf('Year') > -1) { for (var ddIndex = 0; ddIndex < ddYear.length; ddIndex++) { ddYear[ddIndex].dataset.year = queryString[queryString.indexOf('Year') + 1]; } }
  if (queryString.indexOf('Make') > -1) { for (var ddIndex = 0; ddIndex < ddMake.length; ddIndex++) { ddMake[ddIndex].dataset.make = queryString[queryString.indexOf('Make') + 1]; } }
  if (queryString.indexOf('Model') > -1) { for (var ddIndex = 0; ddIndex < ddModel.length; ddIndex++) { ddModel[ddIndex].dataset.model = queryString[queryString.indexOf('Model') + 1]; } }
}

function processData(jsonData) {
  var yearOptions = [];

  for (var makeIndex = 0; makeIndex < jsonData.makes.length; makeIndex++) { // Make Array (MakeId)
    makeById[jsonData.makes[makeIndex][0]] = jsonData.makes[makeIndex][1];
    makeByName[jsonData.makes[makeIndex][1]] = jsonData.makes[makeIndex][0];
  }

  for (var modelIndex = 0; modelIndex < jsonData.models.length; modelIndex++) {
    modelById[jsonData.models[modelIndex][0]] = jsonData.models[modelIndex][2];

    if (typeof modelByName[makeById[jsonData.models[modelIndex][1]]] === 'undefined') { modelByName[makeById[jsonData.models[modelIndex][1]]] = []; }
    modelByName[makeById[jsonData.models[modelIndex][1]]][jsonData.models[modelIndex][2]] = jsonData.models[modelIndex][0];

    if (jsonData.models[modelIndex][12] > 0) { // Sub-models
      if (arrSubModels[jsonData.models[modelIndex][12]]) { arrSubModels[jsonData.models[modelIndex][12]].push(jsonData.models[modelIndex][0]); }
      else { arrSubModels[jsonData.models[modelIndex][12]] = [jsonData.models[modelIndex][0]]; }
    }

    if (jsonData.models[modelIndex][3] > 0) { arrAppend(jsonData.models[modelIndex], 1, 3); } // Sheepskin
    if (jsonData.models[modelIndex][6] > 0) { arrAppend(jsonData.models[modelIndex], 3, 6); } // SCC
    if (jsonData.models[modelIndex][9] > 0) { arrAppend(jsonData.models[modelIndex], 4, 9); } // CalTrend
  }

  querySelection(); // Check for pre-selected make/model in query string

  for (var ddIndex = 0; ddIndex < ddYear.length; ddIndex++) {
    var
      SupplierId = ((typeof ddYear[ddIndex].dataset.supplier === 'undefined') ? 0 : ddYear[ddIndex].dataset.supplier),
      MakeId = ((typeof ddMake[ddIndex].dataset.make === 'undefined') ? 0 : makeByName[ddMake[ddIndex].dataset.make]),
      ModelId = ((typeof ddModel[ddIndex].dataset.model === 'undefined') ? 0 : modelByName[ddMake[ddIndex].dataset.make][ddModel[ddIndex].dataset.model])
    ;

    yearOptions[ddIndex] = []; // Init

    for (var yearIndex = 0; yearIndex < arrData.length; yearIndex++) { // Filter years
      if (typeof arrData[yearIndex] === 'object') {
        if (SupplierId === 0) { // All Suppliers
          for (var supplierIndex = 0; supplierIndex < arrData[yearIndex].length; supplierIndex++) {
            if (typeof arrData[yearIndex][supplierIndex] === 'object') {
              if (checkElement(arrData[yearIndex][supplierIndex], MakeId, ModelId) && (yearOptions[ddIndex].indexOf(yearIndex) < 0)) { yearOptions[ddIndex].push(yearIndex); }
            }
          }
        } else if (typeof arrData[yearIndex][SupplierId] === 'object') { if (checkElement(arrData[yearIndex][SupplierId], MakeId, ModelId)) { yearOptions[ddIndex].push(yearIndex); } } // Specific Supplier
      }
    }

    yearOptions[ddIndex].reverse(); // Sort Decreasing

    for (var optionIndex = 0; optionIndex < yearOptions[ddIndex].length; optionIndex++) { // Populate year drop-downs
      ddAddOption(ddYear[ddIndex], yearOptions[ddIndex][optionIndex]);
    }
  };

  ddPrepare(ddYear);
  ddPrepare(ddMake, 'Make');
  ddPrepare(ddModel, 'Model');

  ddCSS(); // Init
}

if (ddYear.length > 0) { // Back button DD fix
    document.addEventListener('DOMContentLoaded', function () {
        ddYear[0].selectedIndex = 0;
        ddMake[0].selectedIndex = 0;
        ddModel[0].selectedIndex = 0;
    }, false);
}

(function getJSON(URL) {
  var objHTTP = new XMLHttpRequest();

  objHTTP.addEventListener('load', function (e) { processData(JSON.parse(e.target.response)); });
  objHTTP.open('GET', URL, true);
  objHTTP.send();
} (jsonURL)); // Init
// ##############################################