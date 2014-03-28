var SimpleModel = function(p) {
    this.properties = {
        'url': undefined,
        'actions': {
            'insert': undefined,
            'update': undefined,
            'delete': undefined
        },
        'methods': {
            'before': undefined,
            'done': undefined,
            'error': undefined,
            'beforeDelete': undefined,
            'afterDelete': undefined
        },
        'fields': undefined
    };
    for(k in p) {
        if( typeof(p[k]) === typeof(this.properties[k]) ) {
            for( sk in p[k]) {
                this.properties[k][sk] = p[k][sk];
            }
        } else {
            this.properties[k] = p[k];
        }
    };
    this.instances = {};
    this.insN = 0;
    this.validator = function(i) {
        if( jQuery(i).hasClass("border-error") ) { jQuery(i).removeClass("border-error"); }
        if( jQuery(i).hasClass("border-warning") ) { jQuery(i).removeClass("border-warning"); }
        if( this.properties.fields[jQuery(i).attr("name")] === undefined)
            return 0;
        if( this.properties.fields[jQuery(i).attr("name")].required !== undefined ) {
            if( i.value === '' || i.value === undefined) {
                jQuery(i).addClass("border-error");
                SimpleLog.error("Validator class SimpleModel: "+jQuery(i).attr("name"));
                return 1;
            }
        }
        if( this.properties.fields[jQuery(i).attr("name")].type !== undefined ) {
            if( typeOf(i.value) !== this.properties.fields[jQuery(i).attr("name")].type ) {
                jQuery(i).addClass("border-warning");
                SimpleLog.warn("Validator class SimpleModel: "+jQuery(i).attr("name"));
                return 1;
            }
        }
        return 0;
    };
    this.create = function(data, autopublish) {
        var parent = this;
        var methods = parent.properties.methods;
        var actions = parent.properties.actions;
        var d = new Date();
        var id = 0;
        do {
            id = parseInt((((d.getTime()/100000) - parseInt((d.getTime()/100000)))*100000)*(parseInt(Math.random()*10)));
        } while(id === 0);
        /*Instance, this will be returned to manage the new object that belongs to the model*/
        var Instance = {
            'id': id,
            'autopublish': autopublish,
            'fields': {},
            'isnew': false,
            'before': undefined,
            'inputs': [],
            'publish': function(validate, autopublish, callback) {
                var e = 0;
                this.autopublish = autopublish;
                if(validate) {
                    SimpleLog.warn("Entrando", "Publishing instance");
                    for(i in this.inputs) {
                        e = e+parent.validator(this.inputs[i]);
                    }
                }
                if(e>0) { SimpleLog.error("No guarda", "Publishing instance"); return e; };
                if(methods.before !== undefined && jQuery.isFunction(methods.before)) {
                    if( !methods.before(this.fields) ) {
                        return 'before_fail';
                    }
                }
                var currentMethod = actions.update;
                
                if( parseInt(this.fields.id) === -1 || this.fields.id === undefined){
                    currentMethod = actions.insert;
                    this.isnew = true;
                }
                SimpleLog.warn(currentMethod, "Current method");
                SimpleLog.log(this.fields, "This.Data");
                var self = this;
                jQuery.post(
                    parent.properties.url+'/'+currentMethod,
                    self.fields,
                    function() { },
                    "json"
                )
                .done(function(data) {
                    SimpleLog.log(data, "Publish instance class SimpleModel");
                    if(self.isnew && data.id !== undefined) {
                        self.isnew = false;
                        self.fields.id = data.id;
                    }
                    if( methods.done !== undefined && jQuery.isFunction(methods.done)){
                        methods.done(data, self.fields);
                        if(jQuery.isFunction(callback)) {
                            callback();
                        }
                    }
                })
                .fail(function(data) {
                    if( methods.error !== undefined && jQuery.isFunction(methods.error)) {
                        methods.error(data);
                    }
                });
                return true;
            }, 
            'delete': function() {
                jQuery.post(
                    parent.properties.url+'/'+actions.delete,
                    this.fields.id,
                    function() { },
                    "json"
                )
                .done(function(data) {
                    SimpleLog.log("Delete instance class SimpleModel: "+data);
                    if(self.isnew && data.id !== undefined) {
                        self.isnew = false;
                        self.fields.id = data.id;
                    }
                    if( methods.done !== undefined && jQuery.isFunction(methods.done))
                        methods.done(data, self.fields);
                })
                .fail(function(data) {
                    if( methods.error !== undefined && jQuery.isFunction(methods.error))
                        methods.error(data);
                });
            }
        };
        /*This part process all the data attached to the new instance and assign the events nedded*/
        data.each(function () {
            var input = jQuery(this);
            input.addClass(id+'-'+input.attr('name'));
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
            if( parent.properties.fields[input.attr("name")] !== undefined ) { /*Validar que el campo si pertenezca al modelo*/
                Instance.fields[input.attr("name")] = input.attr("value");
                if( input.attr("value") === '' || input.attr("value") === undefined ) {
                    if( parent.properties.fields[input.attr("name")].default !== undefined ) {
                        Instance.fields[input.attr("name")] = parent.properties.fields[input.attr("name")].default;
                    }
                }
                input.attr('model-id', Instance.id);
                input.change( function() {
                    Instance.fields[jQuery(this).attr('name')] = this.value;
                    /*Publish*/
                    if( Instance.autopublish ) {
                        Instance.publish(true, true);/*Validar y seguir autopublish*/
                    }
                });
                Instance.inputs.push(this);
            }
        });
        SimpleLog.log(this.instances, "SimpleModel Instances");
        this.instances[Instance.id] = Instance;
        this.insN = this.insN + 1;
        return Instance;
    }; 
    
};