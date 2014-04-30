var array = require('./modules/array-internal')
  , window = require('window')
;

module.exports = {
    alert: function() {
        window.alert.apply(null, arguments);
    }
};
