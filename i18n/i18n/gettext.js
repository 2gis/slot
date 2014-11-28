var _ = require('lodash');

/* verify that an object exists and is valid */
function isValidObject(thisObject) {
    return null != thisObject;
}

function Gettext(args) {
    args = args || {};
    var locale_data = args.locale_data;

    if (isValidObject(locale_data)) {
        if (isValidObject(locale_data.head) && isValidObject(locale_data.msgs)) {
            this.locale_data = locale_data;
        } else {
            this.parse_locale_data(locale_data);
        }
    }

    return this;
}

Gettext.prototype.isInited = function() {
    return isValidObject(this.locale_data) && this.locale_data.msgs && _.keys(this.locale_data.msgs).length;
};

Gettext.context_glue = "\004";

// npgettext
Gettext.prototype.npgettext = function(msgctxt, msgid, msgid_plural, n) {
    if (!msgid) return '';

    var plural = isValidObject(msgid_plural);
    var msg_ctxt_id = isValidObject(msgctxt) ? msgctxt + Gettext.context_glue + msgid : msgid;

    var trans = this.locale_data.msgs[msg_ctxt_id];

    if (trans) {
        trans = trans.slice(1);
    }

    // default to english if we lack a match, or match has zero length
    if ( !trans || trans.length == 0 ) {
        trans = [ msgid, msgid_plural ];
    }

    var translation = trans[0];
    var head = this.locale_data.head;
    if (plural) {
        var p;
        if (head.plural_func) {
            var rv = head.plural_func(n);
            if (!rv.plural) rv.plural = 0;
            if (!rv.nplural) rv.nplural = 0;
            // if plurals returned is out of bound for total plural forms
            if (rv.nplural <= rv.plural) rv.plural = 0;
            p = rv.plural;
        } else {
            p = (n != 1) ? 1 : 0;
        }
        if (isValidObject(trans[p]))
            translation = trans[p];
    }

    return translation;
};

// This takes the po2json'd data, and moves it into an internal form
// for use in our lib, and puts it in our object as:
//  this.locale_data = {
//      head : { headfield : headvalue },
//      msgs : {
//          msgid : [ msgid_plural, msgstr, msgstr_plural ],
//      },
Gettext.prototype.parse_locale_data = function(locale_data) {
    var parsed_locale_data = {
        head: {},
        msgs: {}
    };

    for (var key in locale_data) {
        if (key == "") {
            var header = locale_data[key];
            for (var headerName in header) {
                var h = headerName.toLowerCase();
                parsed_locale_data.head[h] = header[headerName];
            }
        } else {
            parsed_locale_data.msgs[key] = locale_data[key];
        }
    }

    var head = parsed_locale_data.head;

    // build the plural forms function
    if (isValidObject(head['plural-forms']) && typeof(head.plural_func) == 'undefined') {
        // untaint data
        var plural_forms = head['plural-forms'];
        var pf_re = new RegExp('^(\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;a-zA-Z0-9_()])+)', 'm');
        if (pf_re.test(plural_forms)) {
            // ex english: "Plural-Forms: nplurals=2; plural=(n != 1);\n"
            // pf = "nplurals=2; plural=(n != 1);";
            // ex russian: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10< =4 && (n%100<10 or n%100>=20) ? 1 : 2)
            // pf = "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)";

            var pf = head['plural-forms'];
            if (!/;\s*$/.test(pf)) pf = pf.concat(';');
            /* We used to use eval, but it seems IE has issues with it.
             * We now use "new Function", though it carries a slightly
             * bigger performance hit.
            var code = 'function(n) { var plural; var nplurals; '+pf+' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) }; };';
            this.locale_data.head.plural_func = eval("("+code+")");
            */
            var code = 'var plural; var nplurals; ' + pf + ' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) };';
            /* jshint evil:true */
            head.plural_func = new Function("n", code);
            /* jshint evil:false */
        } else {
            throw new Error("Syntax error in language file. Plural-Forms header is invalid [" + plural_forms + "]");
        }

    // default to english plural form
    } else if (typeof(head.plural_func) == 'undefined') {
        head.plural_func = function(n) {
            var p = (n != 1) ? 1 : 0;
            return {'nplural': 2, 'plural': p};
        };
    } // else, plural_func already created

    this.locale_data = parsed_locale_data;
};

module.exports = Gettext;
