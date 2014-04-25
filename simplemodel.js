var SimpleModel = function(p) {
	this.properties = {
		'url': undefined,
		'type': undefined,
		'actions': {
			'publish': 'publish',
			'delete': undefined,
			'masivePublish': 'masivePublish'
		},
		'callbacks': {
			'beforePublish': undefined,
			'afterPublish': undefined,
			'beforeDelete': undefined,
			'afterDelete': undefined,
			'afterMasivePublish': undefined,
			'beforeMasivePublish': undefined
		},
		'handlers': {
			'errorHandler': undefined,
			'warningHandler': undefined,
			'dataHandler': undefined,
			'domHandler': undefined,
			'validationHandler': undefined
		},
		'fields': undefined,
		'autopublish': true,
		'autovalidate': true,
		'validator': 'default'
	};
	this.instances = {
		'length': 0,
		'objects': {}
	};
	this.masivePublish = function(ommit) {
		var instances = this.instances.objects;
		var methods = this.properties.callbacks;
		var data = {};
		var self = this;
		if( jQuery.isFunction(methods.beforeMasivePublish) ) {
			var bmp = methods.before(this.instances);
			if( !bmp ) {
				if( jQuery.isFunction(handlers.errorHandler) ) {
					handlers.errorHandler("ERROR_BEFORE_PUBLISH");
					return;
				}
			}
		}
		for(i in instances) {
                        if(ommit.indexOf(i) !== -1) continue;
			if(!instances[i].validate().errors) { 
				data[instances[i].id] = (instances[i].data);
			} else {
                                if(this.properties.handlers.errorHandler !== undefined) {
                                        this.properties.handlers.errorHandler("ERROR_ON_MASIVEPUBLISH", instances[i]);
                                }
				return;
			}
		}
		jQuery.post(
			this.properties.url+'/'+this.actions.masivePublish,
			data,
			"json"
		)
		.done(function(data) {
			for(d in data) {
				if(data[d].id !== undefined || data[d].id !== '') {
					self.instances[d].data.id = data[d].id;
				}
				if(data[d].error !== undefined) {
					if( jQuery.isFunction(handlers.errorHandler) ) {
						handlers.errorHandler("ERROR_INSTANCE_MASIVEPUBLISH", data[d].error);
					}
				}
			}
			if( jQuery.isFunction(methods.afterMasivePublish)){
				var amp = methods.afterMasivePublish(data, self.instances);
				if( !amp ) {
					if( jQuery.isFunction(handlers.errorHandler) ) {
						handlers.errorHandler("ERROR_AFTER_MASIVEPUBLISH");
						return;
					}
				}
			}
		})
		.fail(function(data) {
			if( jQuery.isFunction(handlers.errorHandler) ) {
				handlers.errorHandler("MASIVEPUBLISH_FAIL", data);
			}
		});
	};
	this.validator = function(fields, domObjects) {
		var r = {
			'errors': 0,
			'warnings': 0
		};
		var validators = this.properties.validator.split("|");
		if(validators.indexOf("default") !== -1) {
			//Validation base
			for(i in domObjects) {
				var o = jQuery(domObjects[i]);
				var ref = o;
				if(this.properties.fields[o.attr("name")].reference !== undefined) {
					ref = o.parent().find(this.properties.fields[o.attr("name")].reference);
				}
				var v = fields[o.attr("name")];
				if( ref.hasClass("border-error") ) { ref.removeClass("border-error"); }
				if( ref.hasClass("border-warning") ) { ref.removeClass("border-warning"); }
				if( this.properties.fields[o.attr("name")] === undefined)
					continue;
				if( this.properties.fields[o.attr("name")].required !== undefined ) {
					if( v === '' || v === undefined) {
						ref.addClass("border-error"); 
						r.errors++;
						continue
					}
				}
				if( this.properties.fields[o.attr("name")].type !== undefined ) {
					if( typeOf(v) !== this.properties.fields[o.attr("name")].type ) {
						ref.addClass("border-warning");
						r.warnings++;
						continue;
					}
				}
			}
		}
		if( (validators.indexOf("handler") !== -1) && (jQuery.isFunction(this.properties.handlers.validationHandler)) ) {
			var hr = this.properties.handlers.validationHandler(fields, domObjects, this.properties.fields);
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
		if( jQuery.isPlainObject(this.properties[k])) {
			for(var sk in p[k]) {
				this.properties[k][sk] = p[k][sk];
			}
		} else {
			this.properties[k] = p[k];
		}
	}
	
	this.create = function(data) {
		var parent = this;
		var methods = parent.properties.callbacks;
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
			'type': (parent.properties.type !== undefined) ? parent.properties.type:'generic',
			'data': {},
			'fields': [],
			'validate': function() {
				return parent.validator(this.data, this.fields);
			},
			'publish': function() {
				if( jQuery.isFunction(methods.beforePublish) ) {
					var bp = methods.before(this.data, this.fields, parent.properties.fields);
					if( !bp ) {
						if( jQuery.isFunction(handlers.errorHandler) ) {
							handlers.errorHandler("ERROR_BEFORE_PUBLISH");
							return;
						}
					}
				}
				if(parent.properties.autovalidate) {
					var r = this.validate();
					if(r.errors > 0) {
						if( jQuery.isFunction(handlers.errorHandler) ) {
							handlers.errorHandler("ERROR_ON_VALIDATION");
							return;
						}
					} 
					if(r.warnings > 0) {
						if( jQuery.isFunction(handlers.warningHandler) ) {
							handlers.warningHandler("WARNING_ON_VALIDATION");
							return;
						}
					}
				}
				var self = this;
				jQuery.post(
					parent.properties.url+'/'+actions.publish,
					self.data,
					"json"
				)
				.done(function(data) {
					if( data.id !== undefined && data.id !== '' ) {
						self.data.id = data.id;
					}
                                        if(data.error !== undefined) {
                                            if( jQuery.isFunction(handlers.errorHandler) ) {
                                                handlers.errorHandler("ERROR_ON_PUBLISH_RESPONSE", data.error);
                                            }
                                        }
					if( jQuery.isFunction(methods.afterPublish)){
						var ap = methods.afterPublish(data, self.data, self.fields);
						if( !ap ) {
							if( jQuery.isFunction(handlers.errorHandler) ) {
								handlers.errorHandler("ERROR_AFTER_PUBLISH");
							}
						}
					}
				})
				.fail(function(data) {
					if( jQuery.isFunction(handlers.errorHandler) ) {
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
				var onchange = function() {
					Instance.data[jQuery(this).attr('name')] = this.value;
					if( parent.properties.autopublish ) {
						Instance.publish();
					}
				};
				if( input.attr('type') === "checkbox" || input.attr('type') === "radio" ) {
					var group = jQuery("input[name='"+input.attr('name')+"']");
					var i = 0;
					input = jQuery('<input type="hidden" name="'+input.attr('name')+'" value="" />');
					input.insertBefore(group);
					input.change( onchange );
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
					};
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
					dataProccessor(input);
				} else {
					Instance.data[input.attr("name")] = input.attr("value");
					if( input.attr("value") === '' || input.attr("value") === undefined ) {
						if( parent.properties.fields[input.attr("name")].default !== undefined ) {
							Instance.data[input.attr("name")] = parent.properties.fields[input.attr("name")].default;
						}
					}
					input.change( onchange );
				}   
				Instance.fields.push(input);
			}
		});
		this.instances.length++;
		this.instances.objects[Instance.id] = Instance;
		return Instance;
	}; 
	
};