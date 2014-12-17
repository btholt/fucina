/*jshint camelcase: false */

(function(window, module, undefined) {
  'use strict';

  // lifted from Underscore then bastardized
  var _flatten = function(input, output) {
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (value.type === 'div') {
        _flatten(value.contents, output);
      }
      else if (value.type !== 'button') {
        output.push(formBuilder.determineFieldName(value));
      }
    }
    return output;
  };
  var flatten = function(array) {
    return _flatten(array, []);
  };

  var copyObject = function(obj) {
    return window.JSON.parse(window.JSON.stringify(obj));
  };

  var unionArrays = function (x, y) {
    var obj = {};
    for (var ix = x.length-1; ix >= 0; -- ix) {
       obj[x[ix]] = x[ix];
    }
    for (var iy = y.length-1; iy >= 0; -- iy) {
       obj[y[iy]] = y[iy];
    }
    var res = [];
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        res.push(obj[k]);
      }
    }
    return res;
  };

  var formBuilder = {
    buildForm: function(buildArray, config) {
      return this.buildRecurse(buildArray, config);
    },
    buildRecurse: function(buildArray, config) {
      var htmlString = "";
      for (var i = 0; i < buildArray.length; i++) {
        var current = buildArray[i];
        if(['number', 'text', 'email', 'tel', 'week', 'url', 'date', 'datetime', 'datetime-local', 'color', 'search', 'password'].indexOf(current.type) >= 0) {
          htmlString += formBuilder.input(current, config);
        }
        else if(current.type === 'select') {
          htmlString += formBuilder.select(current, config);
        }
        else if (current.type === 'div') {
          var className = formBuilder.determineClassString(current, config);
          var openTag = "<div>";
          if (className) {
            openTag = "<div class='" + className + "'>";
          }
          htmlString += openTag + this.buildRecurse(current.contents, config) + "</div>";
        }
        else if (current.type === 'textarea') {
          htmlString += formBuilder.textarea(current, config);
        }
        else if (current.type === 'button') {
          htmlString += formBuilder.button(current, config);
        }
        else if (current.type === 'hidden') {
          htmlString += formBuilder.hidden(current, config);
        }
        else if (current.type === 'checkbox') {
          htmlString += formBuilder.checkbox(current, config);
        }
      }
      return htmlString;
    },
    camelcase: function(input) {
      return input.toLowerCase().replace(/[- ](.)/g, function(match, group1) {
        return group1.toUpperCase();
      });
    },
    determineFieldName: function(config) {
      return config.fieldName || this.camelcase(config.name);
    },
    determineClassString: function(config, global) {
      var className = "";
      if (!config.noDefaultClasses && global.defaultClass) {
        className = global.defaultClass;
      }
      if (config.className) {
        if (className) {
          className += " ";
        }
        className += config.className;
      }
      return className;
    },
    input: function(config, global) {
      var className = this.determineClassString(config, global);
      var placeholder = config.placeholder || config.name;
      var fieldName = this.determineFieldName(config);
      var options = " ";
      if (config.required) {
        options += "required ";
      }
      if (config.charLimit) {
        options += "maxlength='" + config.charLimit + "' ";
      }

      return "<input type='" + config.type + "' class='" + className +
        "' placeholder='" + placeholder + "' data-forge-key='" + fieldName + "'" + options +"/>";
    },
    select: function(config, global) {
      var className = this.determineClassString(config, global);
      var fieldName = (config.fieldName) ? config.fieldName : this.camelcase(config.name);
      var options = " ";
      if (config.required) {
        options += "required ";
      }

      var html = "<select class='" + className + "' data-forge-key='" + fieldName + "'" + options +">";

      for (var i = 0; i < config.options.length; i++) {
        html += "<option value='" + config.options[i][0] + "'>" + config.options[i][1] + "</option>";
      }
      html += "</select>";
      return html;
    },
    textarea: function(config, global) {
      var className = this.determineClassString(config, global);
      var placeholder = config.placeholder || config.name;
      var fieldName = this.determineFieldName(config);
      var options = " ";
      if (config.required) {
        options += "required ";
      }
      if (config.charLimit) {
        options += "maxlength='" + config.charLimit + "' ";
      }

      return "<textarea class='" + className + "' placeholder='" + placeholder +
        "' data-forge-key='" + fieldName + "'" + options +"></textarea>";
    },
    button: function(config, global) {
      return "<button type='submit' class='" + this.determineClassString(config, global) + "'>" + config.name + "</button>";
    },
    hidden: function(config, global) {
      var fieldName = this.determineFieldName(config);
      return "<input value='' type='" + config.type + "' data-forge-key='" + fieldName + "'/>";
    },
    checkbox: function(config, global) {
      return "<label class='" + config.label.className + "'><input data-forge-key=" + this.determineFieldName(config, global) + " class='" + config.className + "' type='checkbox' /> " + config.label.text + "</label>";
    }
  };

  var mergeObjects = function(obj1, obj2) {
    var impureMerge = function(fromObj, toObj) {
      for (var key in fromObj) {
        if (fromObj.hasOwnProperty(key)) {
          toObj[key] = fromObj[key];
        }
      }
      return toObj;
    };
    var newObj = {};

    newObj = impureMerge(obj1, newObj);
    newObj = impureMerge(obj2, newObj);
    return newObj;
  };

  var discoverWatches = function(form) {
    var watches = {};
    for (var i = 0; i < form.length; i++) {
      var current = form[i];
      if (current.type === 'div') {
        var newWatches = discoverWatches(current.contents);
        watches = mergeObjects(watches, newWatches);
      }
      else if (current.conditional) {
        if (current.conditional.callback && current.conditional.dependencies) {
          for (var j = 0; j < current.conditional.dependencies.length; j++) {
            if (!watches[current.conditional.dependencies[j]]) {
              watches[current.conditional.dependencies[j]] = [];
            }
            var clone = {
              targets: formBuilder.determineFieldName(current),
              dependencies: current.conditional.dependencies,
              callback: current.conditional.callback
            };
            watches[current.conditional.dependencies[j]].push(clone);
          }
        }
        else {
          window.console.warn('To register a conditional watch, you must include both callback and dependencies. Watch skipped for ', current);
        }
      }
    }
    return watches;
  };

  var isEmptyObject = function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  };

  var gatherArgs = function(deps, values, config) {
    var ans = [];
    for (var i = 0, l = deps.length; i < l; i++) {
      if (deps[i] !== '$internals') {
        ans.push(values[deps[i]]);
      }
      else {
        ans.push(config.internals);
      }
    }
    return ans;
  };

  var gatherNodes = function(domTree, values) {
    var nodes = {};
    for (var key in values) {
      if (values.hasOwnProperty(key)) {
        var node = domTree.querySelector("[data-forge-key='" + key +"']");
        nodes[key] = node;
        if (node.type !== 'checkbox') {
          this._values[key] = nodes[key].value;
        }
        else {
          this._values[key] = nodes[key].checked;
        }
      }
    }
    return nodes;
  };

  var Forge = function(form, config){
    this._form = form;
    this._config = config;
    this._target = null;
    this._innerHTML = "";
    this._values = {};
    this._domNode = null;
    this._watches = {};
    this._nodes = {};

    this._init();
  };

  Forge.prototype._init = function() {
    var flattened = flatten(this._form);
    var obj = {};
    flattened.map(function(el) {
      obj[el] = "";
    });
    this._values = obj;
    this._watches = discoverWatches(this._form);
    this._hasWatches = !isEmptyObject(this._watches);
    this._generateCss();
  };

  Forge.prototype._generateCss = function() {
    if (!window.document.getElementById('forge-generated-styles')) {
      var style = window.document.createElement('style');
      style.type = 'text/css';
      style.id = "forge-generated-styles";
      style.innerHTML = '.forge-hidden { display: none !important; }';
      window.document.getElementsByTagName('head')[0].appendChild(style);
    }
  };

  Forge.prototype._runAllConditionals = function() {
    for (var key in this._watches) {
      if (this._watches.hasOwnProperty(key)) {
        this._checkValueForConditionals(key);
      }
    }
  };

  Forge.prototype.render = function(target) {
    var node = window.document.querySelector(target);
    this._innerHTML = formBuilder.buildForm(this._form, this._config);
    var form = window.document.createElement('form');
    form.innerHTML = this._innerHTML;
    form.id = this._config.formId;
    form.addEventListener('change', this.eventDispatch.bind(this));
    form.addEventListener('keydown', this.eventDispatch.bind(this));
    if (this._config.formSubmit) {
      form.addEventListener('submit', this._config.formSubmit);
    }
    this._domNode= form;
    this._nodes = gatherNodes.call(this, form, this._values);
    this._runAllConditionals();
    node.appendChild(form);
    this._target = target;
  };

  Forge.prototype.eventDispatch = function(e) {
    var target = e.target;
    var key = target.dataset.forgeKey;
    if (target.type === 'checkbox') {
      this._values[key] = e.target.checked;
    }
    else {
      this._values[key] = e.target.value;
    }
    this._checkValueForConditionals(key);
  };

  Forge.prototype._checkValueForConditionals = function(key) {
    if (this._hasWatches && this._watches[key]) {
      var current = this._watches[key];
      for (var i = 0, l = current.length; i < l; i++) {
        var node = this._nodes[current[i].targets];
        var gatheredArgs = gatherArgs(current[i].dependencies, this._values, this._config);
        if (!current[i].callback.apply(this, gatheredArgs)) {
          if (node.className.indexOf('forge-hidden') < 0) {
            node.className += " forge-hidden";
          }
        }
        else if (node.className.indexOf('forge-hidden') >= 0)  {
          node.className = node.className.replace('forge-hidden','','i');
        }
      }
    }
  };

  Forge.prototype.set = function(key, value) {
    var node = this._domNode.querySelector("[data-forge-key='" + key +"']");
    this._values[key] =  value;
    if (node.type === 'checkbox') {
      node.checked = value;
    }
    else {
      node.value = value;
    }
    this._checkValueForConditionals(key);
  };

  Forge.prototype.getData = function() {
    return copyObject(this._values);
  };

  Forge.prototype.getConfig = function() {
    return copyObject(this._config);
  };

  Forge.prototype.validate = function() {
    var validateRecurse = function(form, acc) {
      for (var i = 0, l = form.length; i < l; i++) {
        if (form[i].type === 'div') {
          validateRecurse(form[i].contents, acc);
        }
        else if (form[i].type === 'button') {
          // do nothing
        }
        else {
          var fieldName = formBuilder.determineFieldName(form[i]);
          if (form[i].required && !this._values[fieldName]) {
            acc.push(fieldName);
          }
        }
      }
      return acc;
    }.bind(this);

    var errors = validateRecurse(this._form, []);
    if (this._config.validate) {
      var validateErrors = this._config.validate(this._values);
      errors = unionArrays(errors, validateErrors);
    }

    for (var key in this._values) {
      if (this._values.hasOwnProperty(key)) {
        var node = this._nodes[key];
        if (errors.indexOf(key) >= 0 && node.className.indexOf('forge-error') < 0) {
          node.className += " forge-error";
        }
        else if (errors.indexOf(key) < 0 && node.className.indexOf('forge-error') >= 0) {
          node.className = node.className.replace('forge-error','','i');
        }
      }
    }
    return errors;
  };

  module.exports = function(form, config) {
    return new Forge(form, config);
  };
})(window, module);
