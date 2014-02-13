var SimpleModel = function(p) {
    var properties = {
        'url': undefined,
        'actions': {
            'insert': undefined,
            'update': undefined,
            'delete': undefined
        },
        'methods': {
            'before': undefined,
            'done': undefined,
            'error': undefined
        },
        'fields': undefined
    };
    this.validator = function(i) {
        if( jQuery(i).hasClass("border-error") )
            jQuery(i).removeClass("border-error");
        if( jQuery(i).hasClass("border-warning") )
            jQuery(i).removeClass("border-warning");
        if( properties.fields[jQuery(i).attr("name")].required !== undefined ) {
            /*Validar contenido*/
            if( i.value === '' || i.value === undefined) {
                jQuery(i).addClass("border-error");
                return 1;
            }
        }
        if( properties.fields[jQuery(i).attr("name")].type !== undefined ) {
            /*Validar tipo*/
            if( typeOf(i.value) !== properties.fields[jQuery(i).attr("name")].type ) {
                jQUery(i).addClass("border-warning");
                return 1;
            }
        }
        return 0;
    };
    this.instances = {};
    this.create = function(data, autopublish) {
        var fields = properties.fields;
        var methods = properties.methods;
        var actions = properties.actions;
        var url = properties.url;
        var d = new Date();
        var rand = 0;
        var parent = this;
        while(rand === 0) {
            rand = parseInt(Math.random()*10);
        }
        d = d.getTime()/100000;
        d = ((d - parseInt(d))*100000)*rand;
        /*Instance, this will be returned to manage the new object that belongs to the model*/
        var oData = {
            'id': parseInt(d),
            'fields': {},
            'isnew': false,
            'before': undefined,
            'inputs': [],
            'publish': function(validate) {
                var e = 0;
                if(validate) {
                    for(i in this.inputs) {
                        e = e+parent.validator(this.inputs[i])
                    }
                }
                if(e>0) { return; };
                if(methods.before !== undefined && jQuery.isFunction(methods.before))
                    if( !methods.before(this.fields) )
                        return;
                var currentMethod = actions.update;
                if( parseInt(this.fields.id) === -1 || this.fields.id === undefined){
                    currentMethod = actions.insert;
                    this.isnew = true;
                }
                SimpleLog.log(this.data);
                var self = this;
                jQuery.post(
                    url+'/'+currentMethod,
                    this.fields,
                    function() { },
                    "json"
                )
                .done(function(data) {
                    SimpleLog.log(data);
                    if(self.isnew && data.id !== undefined) {
                        self.isnew = false;
                        self.fields.id = data.id;
                    }
                    if( methods.done !== undefined && jQuery.isFunction(methods.done))
                        methods.done(data);
                })
                .fail(function(data) {
                    if( methods.error !== undefined && jQuery.isFunction(methods.error))
                        methods.error(data);
                });
            }
        };
        data.each(function () {
            var input = jQuery(this);
            input.addClass(d+'-'+input.attr('name'));
            if( input.hasClass('ommit') ) return true;
            if( input.attr('type') === "checkbox" || input.attr('type') === "radio" ) {
                var group = jQuery("input[name='"+input.attr('name')+"']");
                var i = 0;
                input = jQuery('<input type="hidden" name="'+input.attr('name')+'" value="" />');
                input.insertBefore(group);
                group.each(function() {
                    var special = jQuery(this);
                    special.addClass('ommit').attr('name', special.attr('name')+i).change(function() {
                        if( this.checked ) {
                            input.data( special.attr('name'), this.value );
                        } else {
                            input.removeData( special.attr('name') );
                        }
                        input.val('');
                        var j = 0;
                        for( v in input.data() ) {
                            var s = ',';
                            if(j === 0)
                                s = '';
                            input.val(input.val()+s+input.data()[v]);
                        }
                        input.trigger('change');
                    });
                    if( special.attr('type') === 'checkbox' ) {
                        i++;
                    }
                });
            }
            if( fields[input.attr("name")] !== undefined ) { /*Validar que el campo si pertenezca al modelo*/
                oData.fields[input.attr("name")] = input.attr("value");
                if( input.attr("value") === '' || input.attr("value") === undefined ) {
                    if( fields[input.attr("name")].default !== undefined ) {
                        oData.fields[input.attr("name")] = fields[input.attr("name")].default;
                    }
                }
                input.attr('model-id', oData.id);
                input.change( function() {
                    if( autopublish ) {
                        parent.validator(this);
                    }
                    oData.inputs.push(this);
                    oData.fields[jQuery(this).attr('name')] = this.value;
                    /*Publish*/
                    if( autopublish ) {
                        oData.publish(false);
                    }
                });
            }
        });
        this.instances[oData.id] = oData;
        return oData;
    }; 
    for(k in p) {
        if( typeof(p[k]) === typeof(properties[k]) ) {
            for( sk in p[k]) {
                properties[k][sk] = p[k][sk];
            }
        } else {
            properties[k] = p[k];
        }
    };
};