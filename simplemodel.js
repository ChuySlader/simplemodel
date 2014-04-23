var SimpleModel = function(p) {
    this.properties = {
        'url': undefined,
        'actions': {
            'insert': undefined,
            'update': undefined,
            'delete': undefined
        },
        'methods': {
        	'beforePublish': undefined,
        	'afterPublish': undefined,
        	'beforeDelete': undefined,
        	'afterDelete': undefined
        },
        'handlers': {
        	'errorHandler': undefined,
        	'warningHandler': undefined,
        	'dataHandler': undefined,
        	'domHandler': undefined,
        	'validationHandler': undefined
        }
        'fields': undefined,
        'autopublish': true,
        'autovalidate': true,
        'validator': 'defaul'
    };
    this.instances = {
    	'length': 0,
        'onjects': undefined
    };
    this.validator = function(fields, domObjects) {
    	var r = {
    		'errors': 0,
    		'warnings': 0
    	}
    	var validators = this.properties.validator.split("|");
    	if(validators.indexOf("default") !== -1) {
    		//Validation base
    		for(i in domObjects) {
    			var o = jQuery(domObjects[i])
    			var v = domObjects[i].value;
    			if( o.hasClass("border-error") ) { o.removeClass("border-error"); }
        		if( o.hasClass("border-warning") ) { o.removeClass("border-warning"); }
        		if( this.properties.fields[o.attr("name")] === undefined)
            		continue;
            	if( this.properties.fields[o.attr("name")].required !== undefined ) {
		            if( v === '' || v === undefined) {
		                o.addClass("border-error"); 
		                r.errors++;
		                continue
		            }
		        }
		        if( this.properties.fields[o.attr("name")].type !== undefined ) {
		            if( typeOf(v) !== this.properties.fields[o.attr("name")].type ) {
		                o.addClass("border-warning");
		                r.warnings++;
		                continue;
		            }
		        }
    		}
    	}
    	if( (validators.indexOf("handler") !== -1) && (jQuery.isFunction(this.properties.handlers.validationHandler)) ) {
    		var hr = this.properties.handlers.validationHandler(fields, domObjects);
    	}
    	if(hr !== undefined) {
    		if(hr.errors > 0) {
    			r.errors += hr.errors;
    		}
    		if(hr.warnings > 0) {
    			r.warnings += hr.warnings;
    		}
    	}
    	return r;
    };
    for(var k in p) {
        if( typeof(p[k]) === typeof(this.properties[k]) ) {
            for(var sk in p[k]) {
                this.properties[k][sk] = p[k][sk];
            }
        } else {
            this.properties[k] = p[k];
        }
    }
    
    this.create = function(data) {
        var parent = this;
        var methods = parent.properties.methods;
        var handlers = parent.properties.handlers;
        var actions = parent.properties.actions;
        var d = new Date();
        var id = 0;
        do {
            id = parseInt((((d.getTime()/100000) - parseInt((d.getTime()/100000)))*100000)*(parseInt(Math.random()*10)));
        } while(id === 0);
        /*Instance, this will be returned to manage the new object that belongs to the model*/
        var Instance = {
            'id': id,
            'data': {},
            'fields': [],
            'publish': function() {
            	var isnew = false;
            	if( jQuery.isFunction(methods.beforePublish) ) {
            		var bp = methods.before(this.fields);
                    if( !bp ) {
                    	if( jQuery.isFunction(handlers.errorHandler) ) {
							handlers.errorHandler("ERROR_BEFORE_PUBLISH");
						}
                    }
                }
                if(parent.properties.autovalidate) {
                	var r = parent.validator();
					if(r.errors > 0) {
						if( jQuery.isFunction(handlers.errorHandler) ) {
							handlers.errorHandler("ERROR_ON_VALIDATION");
						}
					} 
					if(r.warnings > 0) {
						if( jQuery.isFunction(handlers.warningHandler) ) {
							handlers.warningHandler("WARNING_ON_VALIDATION");
						}
					}
                }
                var mainMethod = actions.update;
                if( this.data.id === undefined ) {
                    currentMethod = actions.insert;
                    isnew = true;
                }
                var self = this;
                jQuery.post(
                    parent.properties.url+'/'+mainMethod,
                    self.data,
                    "json"
                )
                .done(function(data) {
                    if( isnew || data.id !== undefined || data.id === '' ) {
                        isnew = false;
                        self.data.id = data.id;
                    }
                    if( jQuery.isFunction(methods.afterPublish)){
                    	var ap = methods.afterPublish(data, self.data, self.fields);
                    	if( !ap ) {
                        	if( jQuery.isFunction(handlers.errorHandler ) {
								handlers.warningHandler("ERROR_AFTER_PUBLISH");
							}
                        }
                    }
                })
                .fail(function(data) {
                	if( jQuery.isFunction(handlers.errorHandler ) {
						handlers.errorHandler("PUBLISH_FAIL", data);
					}
                });
            }, 
            'delete': function() {
                
            }
        };
        data.each(function () {
            var input = jQuery(this);
            input.attr("model-id", id);
            if( input.hasClass('ommit') ) return;
            if( parent.properties.fields[input.attr("name")] !== undefined ) {
            	
            	if( input.attr('type') === "checkbox" || input.attr('type') === "radio" ) {
	                var group = jQuery("input[name='"+input.attr('name')+"']");
	                var i = 0;
	                input = jQuery('<input type="hidden" name="'+input.attr('name')+'" value="" />');
	                input.insertBefore(group);
	                var dataProccessor = function(i) {
	                	i.val('');
	                	var j = 0;
                        for( var v in i.data() ) {
                            var s = ',';
                            if(j === 0)
                                s = '';
                            i.val(i.val()+s+i.data()[v]);
                        }
                        i.trigger('change');
	                }
	                group.each(function() {
	                    var special = jQuery(this);
	                    if(this.checked) {
	                    	input.data( special.attr('name'), this.value );
	                    }
	                    special.addClass('ommit').attr('name', special.attr('name')+i).change(function() {
	                        if( this.checked ) {
	                            input.data( special.attr('name'), this.value );
	                        } else {
	                            input.removeData( special.attr('name') );
	                        }
	                        dataProccessor(input);
	                    });
	                    if( special.attr('type') === 'checkbox' ) {
	                        i++;
	                    }
	                });
	            } else {
	            	Instance.data[input.attr("name")] = input.attr("value");
	                if( input.attr("value") === '' || input.attr("value") === undefined ) {
	                    if( parent.properties.fields[input.attr("name")].default !== undefined ) {
	                        Instance.data[input.attr("name")] = parent.properties.fields[input.attr("name")].default;
	                    }
	                }
	            }   
	            input.change( function() {
	                Instance.fields[jQuery(this).attr('name')] = this.value;
	                if( parent.autopublish ) {
	                    Instance.publish();
	                }
	            });
	            dataProccessor(input);
                Instance.inputs.push(input);
            }
        });
		this.instances.length++;
        this.instances.objects[Instance.id] = Instance;
        return Instance;
    }; 
    
};